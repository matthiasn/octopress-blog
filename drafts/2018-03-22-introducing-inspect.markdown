---
layout: post
title: "Introducing inspect"
date: 2018-03-22 15:30
comments: true
categories: 
---


I have a mixed relationship with being a software engineer. When I was a kid, I would watch my father hide in a dark chamber, listen to Leonard Cohen, and be generally angry about something not compiling, or otherwise not working as expected. It looked frustrating, which made me think that I should probably avoid this profession - at all costs. Then I lost this thought and became a software engineer myself. And here I am, often upset or unhappy about some mindfuck or another.

Recently, I read somewhere that software development is feeling like an idiot 80% and like a genius 20% of the time. I wish the ratio was better, but those numbers feel accurate on most of my days. Typically, that has to do with complexity. As in, systems larger than my small brain can reason about correctly. But small enough that my large ego will think it can handle easily.

[read more]

And then I chase false assumptions, usually involving some annoying changes to log levels, only to find out that I was likely wrong. And then rinse, repeat. Again every day, it takes time to have loaded enough context into my tiny brain to have somewhat of an informed opinion about what might be going on in the system.

This is an onboarding problem, really. The amount of complexity that any larger system contains does not seem to completely fit into anyone's brain, and definitely not into mine. Contiguous blocks of time seem to come with slight improvements, but then there's the weekend, and the better it was, the less knowledge about the system will still be there, and generally, that's a good thing. The thing I will be working on next week is probably going to be in a part of the codebase that nobody has touched in a year, anyway, and the documentation is probably not there at all or vastly outdated. 

Then, I will look at the tests, and this is especially a problem in a language like Clojure, there will be some data structures that are used in the tests. The tests then verify that the functions under test do whatever is expected of them with those data structures, and succeed if that is the case. But how do I know that the data structures, in reality, look the same way? You assume so because it appears to be the case that the application was working as expected. Oh wait, you came here because something fishy was going on in this area, right. So you start logging the data structures you take off a Kafka topic or read from Redis or request from a web service, because hey, what could possibly go wrong. Of course, some of them are large and you end up wading through thousands of lines of logged rubbish, and it will take hours to get that into a somewhat useful state, but not so much if you are looking at the output of multiple nodes involved. Eventually, somehow, you manage to get this right after discovering that one of the data sources was to blame, as say another team had changed their data format slightly [blame]. So you make the change in some mapping function, and go home, exhausted, and thinking about listening to Leonard Cohen in some dark chamber.

How can we prevent this? I don't believe type systems help all that much here. Sure, it will be easier to find the culprit in the case described above, but the outside world, and with it, one of its data formats, has still changed, and now you have to reshape a much more rigid code base, and I personally find that even more frustrating than the debugging procedure I described above. What I had really wanted for a long time was a better visibility into what is going on in a running system, and see the data structures being passed around, and what is called when, and so on, and all that without logging, ideally, and gathering data from multiple nodes, if possible.


The systems-toolbox

Then, I was lucky to be able to work on the [systems-toolbox](https://github.com/matthiasn/systems-toolbox). The idea behind this library is building message driven systems that are observable where message flows across nodes can be traced and observed, so we can see how systems really look like, instead of relying on documentation, which is often outdated and incomplete, or configuration, which doesn't tell you what is actually going on, but rather our expectation, which in my case is often incorrect.

The [systems-toolbox](https://github.com/matthiasn/systems-toolbox) has observability built in, by exposing a firehose which is a channel that contains all messages sent or received in a given system. These can be offloaded, for example onto a Kafka topic, and be consumed elsewhere to see what is going on, and how parts of the system communicate with each other, and in which order, which is something that I find particularly difficult to understand from the reading of code alone.

For that, I have created an application called [inspect](https://github.com/matthiasn/inspect) to consume these message flows. The initial versions weren't all that useful but the latest version, a desktop written in ClojureScript on top of Electron, is becoming helpful in everyday work when dealing with applications built on top of the [systems-toolbox](https://github.com/matthiasn/systems-toolbox). I will show you, but first let me explain the basics.

Applications using the [systems-toolbox](https://github.com/matthiasn/systems-toolbox) consist of components that communicate with each other. Each such component then has an incoming channel and an outgoing channel, plus some state that is managed by the library. They then send messages in the form of a vector with two elements, where the first element is a namespaced keyword denoting the message type, and the second element being the message payload, like this: :some/message {:foo 1 :bar 2}. Messages then will have some metadata on the entire message, mostly assigned by the systems toolbox library itself to record timing and order in message flows. The recording of this metadata then allows drawing entire systems from just listening to the firehose, and show individual message flows in detail, as an emerging property of the entire system, including [inspect](https://github.com/matthiasn/inspect).

Each component will then have a handler map, with the message types that it will handle as keys, and the handler functions as values. These handler functions will then be called which each received message, potentially returning a new component state, and potentially also emitting one or more messages, which then may or may not be handled down the line, depending on a) other components having the output of this component wired to their input, and b) also having a handler function for the message type of the emitted message. Message types are spec'd and will throw an error if messages do not validate. With the message validation, sometimes it's enough to require a message payload to be a map, but oftentimes, it pays off to go into more detail. I will get to that at a later point.

A system then has a switchboard component that wires individual components together. Those "wires" are core.async channels, and the components themselves are core.async go-loops. Don't worry if you aren't already familiar with core.async, you can get by without taking a deep dive into core.async anytime soon. The most important thing to know at this point is that components do not need to know where to send messages. If no other component is wired to consume their messages, nothing will crash. It's really a non-event, except for the message landing on the firehose. Messages can also be consumed by multiple components, and they will get to know nothing about that, unless some return message is sent their way, with a message type that they have a handler function for. 

I find this property of just sending messages without knowing anything about the destination quite useful when trying to restructure an application, especially when the goal is taking it apart to run on different nodes. It's probably what Rich Hickey meant with the conveyor belt in the core.async talk, at least that's my understanding of it.

Systems can then make larger systems that communicate over WebSockets, Node IPC channels, Kafka topics, Redis/carmine queues (all the aforementioned implemented already) and potentially other transport mechanisms. 

Building systems with this library by itself is not particularly hard, but it's also fairly easy to create very complex message flows that will be difficult to reason about. Here's how wiring code can look like:

code for wiring

or

code for wiring2

It looks deceptively simple, right? When starting to send messages around systems though, I quickly run out of mental memory and start scratching my head when trying to understand what is going on.

Here's how it looks like with [inspect](https://github.com/matthiasn/inspect) instead:

screenshot inspect

Here, I can then select a particular message type and then see the most recent message flows. Any message flow in the system has a tag uuid. When the system encounters a message for the first time, it gets tagged, and then every subsequent message in the flow will have the same tag so they can be correlated later.

Let me show you what I mean:

screenshot message flow

Then, in order to see what is really going on, we can look inside each message, and see what is in the data, as opposed to guessing.

[Inspect](https://github.com/matthiasn/inspect) is my naive interpretation of the problem of how to look inside a running system. There are many areas where I am sure the implementation could be much better, and this is where I would like to ask you for help. A fresh set of eyes or two always help, and plenty of the things I don't see any longer or don't have the time for, or probably would not have seen regardless of time. Pull requests very welcome. I will buy you a beer if you can fix the crashes that I'm seeing after processing more than 25K messages or so.

Hope this will be useful for you, either by trying out the [systems-toolbox](https://github.com/matthiasn/systems-toolbox) in your own projects or by using this as an inspiration more observability for your system. While only scratching the surface, the improved visibility is already paying dividends for me. And with improved visibility, maybe we can shift the ratio a little bit towards feeling like an idiot a little less often.

Until next time,
Matthias


[blame] the blame clearly lies with me, in this situation. If the data was critical, the should have been a dialog set up with that team, so if that change happened without my knowledge, I clearly hadn't done my job right. Also, the goal should not be finding someone to blame, but rather fix the problem as soon as possible.