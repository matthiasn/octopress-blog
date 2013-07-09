---
layout: post
title: "Follow-Up: AngularJS and Play Framework"
date: 2013-07-03 14:45
comments: true
categories: 
---
This is the follow-up on last week's article about **[AngularJS and Play Framework](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)**. I want to share with you the problems that I encountered on the server side while running the demo and my ideas how to deal with comparable problems more efficiently in the future. I have not encountered AngularJS-related problems with the chat application so we won't deal with it today. I'll have more on **[AngularJS](http://angularjs.org)** next week.

<!-- more -->

###So, what was the problem?
The article was online and the demo was running. Load on the server was not very high, I have seen up to 60 users connected at the same time, so really no substantial load that should be able to cause problems. Yet sometimes when I connected, the chat room would load, but messages from the Shakespeare-reciting actors would not be delivered. I first suspected that the actors might have crashed and no proper supervision strategy was in place. But there was nothing in the logs. Most of the time, everything would work, and when things didn‘t, I just restarted the server, scratching my head as to what the problem could be. I couldn‘t reproduce the problem in my dev environment, so there was really only one option: debug the system running on the server. Thanks to **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**, restarting a server is not a big deal, the SSE connection will reconnect automatically. Sure, messages that occur between dropped connection and reconnect would be lost, but that‘s not a problem for my demo, and nothing that couldn‘t be solved if needed.

Still, it doesn‘t feel right to keep inserting logging code, recompiling and restarting an application in a "production" environment that has users connected to it. After experimenting with log levels and putting **println** statements into the code and then observing the shell, I eventually noticed a **connection timeout** error and afterwards a flood of message deliveries to all connected clients. What was going on here?

There was really only one explanation that made any sense to me: occasionally one of the connected clients would not properly disconnect, maybe on a mobile connection, and then that connection would time out after a while. So far so good. But why would that hold up other clients? Could that **[Concurrent.broadcast](https://github.com/playframework/Play20/tree/2.1.0/framework/src/iteratees/src/main/scala/play/api/libs/iteratee/Concurrent.scala)** really come to a complete halt when any one of the attached **[Enumeratee](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Enumeratee)** / **[Iteratee](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Iteratee)** chains took longer than usual? Turns out the answer is yes, unless extra steps are taken. Let‘s look at a simple example. I recommend you fire up the Play / Scala REPL using **play console** and copy & paste the code below:

{% codeblock No Buffer lang:scala %}
import play.api.libs.iteratee.{Concurrent, Enumeratee, Iteratee}

val (out, channel) = Concurrent.broadcast[Int]
val iteratee1 = Iteratee.foreach[Int] { 
  i => if (i % 10 == 0) { Thread.sleep(5000) }; println("iteratee1: " + i) }
out |>> iteratee1

val iteratee2 = Iteratee.foreach[Int] { i => println("iteratee2: " + i) }
out |>> iteratee2

for (x <- 1 to 50) { channel.push(x) }
{% endcodeblock %}

Above we create Enumerator and Channel through Concurrent.broadcast and attach two Iteratees, one of which occasionally puts its thread to sleep for 5 seconds. It holds up the other attached Iteratee as well. That's not what I need here. How can we overcome this? By inserting a buffering Enumeratee: 

{% codeblock With Buffer lang:scala %}
import play.api.libs.iteratee.{Concurrent, Enumeratee, Iteratee}

val (out, channel) = Concurrent.broadcast[Int]

val iteratee1 = Iteratee.foreach[Int] { 
  i => if (i % 10 == 0) { Thread.sleep(5000) }; println("iteratee1: " + i) }
out &> Concurrent.buffer(100) |>> iteratee1

val iteratee2 = Iteratee.foreach[Int] { i => println("iteratee2: " + i) }
out &> Concurrent.buffer(100) |>> iteratee2

for (x <- 1 to 50) { channel.push(x) }
{% endcodeblock %}

Now the application behaves more like I would expect; individual Iteratees do not hold up everything any longer. Instead the buffering Enumeratee receives the messages, buffers them and frees up Concurrent.broadcast to call the next Iteratee with the current message. The buffer also drops messages when it is full. 

Now after adding the buffering Enumeratee to the chat application, everything works just fine, as long as the individual buffers are large enough. 

{% codeblock Chat Controller lang:scala https://github.com/matthiasn/sse-chat/blob/678a02671a63fc50dc0da34ffe452b4f472e972e/app/controllers/ChatApplication.scala ChatApplication.scala %}
/** Controller action serving activity based on room */
def chatFeed(room: String) = Action { 
  Ok.stream(chatOut &> filter(room) 
    &> Concurrent.buffer(20) 
    &> EventSource()).as("text/event-stream") 
}
{% endcodeblock %}

###How can I handle a problem like this better next time?
Unit testing would hardly have helped here, unless we tested for the scenario of an incorrectly closed the WS connection. Better knowledge about the timing of events through better logging would have helped immensely though. Logging to files is not extremely useful when trying to find anomalies like the aforementioned timeouts and spikes directly thereafter; at least my eyes are not good at detecting this in plain text. 

**EDIT 07/06/2013:** what I would like to have instead is a fully searchable log in a webclient. I am thinking about something like **[Kibana 3](http://three.kibana.org/about.html)**. With graphs as shown in the demo, the problem would have been immediately obvious. Long streaks of smooth delivery and then all of a sudden no messages dispatched to clients for two minutes and then the system catching up with a big spike.

I am looking into combining **[Kibana 3](http://three.kibana.org/about.html)** with a logging object in Play that receives all loggable events and depending on the environment (dev or production) by default either processes them further or not, with further configuration of the defaults for each logging type when specified. The logging object could then also expose an endpoint that allows switching individual loggers on or off during execution, without restarting the application. That way we could easily peek into a running instance in a production environment and watch what is going on, right now. I have started working on this and I will present something on here soon. Having such a logging system available will be a great help for all projects going forward. I would like to shift my focus back to the **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** project rather sooner than later, but first I want to have the right tools in place. 

-Matthias

