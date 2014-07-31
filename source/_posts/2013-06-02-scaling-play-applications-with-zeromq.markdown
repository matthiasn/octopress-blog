---
layout: post
title: "Scaling Play applications with ZeroMQ"
date: 2013-06-02 07:48
comments: true
categories: 
---
Let us assume for a second that the **[BirdWatch](http://bit.ly/BirdWatch)** application needed to handle more load than a single server could handle. The current version could not just be run as multiple instances because then each one would establish a connection to Twitter, of which there is supposed to be only one per application. It would work to split the application into a TwitterClient part and a user-facing controller part, of which multiple instances could run as needed. How do we connect these separate parts of the application though?

<!-- more -->

One possible approach is using an HTTP stream between the parts as well, basically using the TwitterClient application as a hub for delivering the Twitter stream to multiple instances as needed. While this works, it is not an elegant solution: how do I handle reconnects? How do I even detect them? I'd rather not deal with this. 

An Akka cluster should work. This approach seems more promising, as all the messaging elements are already there. But this does not offer the best possible flexibility, as it requires all participants to use Akka / the JVM / the same version of Scala. I'd rather not limit myself to one technology stack if not absolutely necessary.

I would prefer a solution that is completely agnostic of the technology each building block of the whole application uses. I might want to run statistics using **[numpy](http://www.numpy.org)** in the future or whatever. This should be possible without much glue code. HTTP is obviously technology independent but it falls short due to the reconnect issues.

Turns out there is a great solution for polyglot applications: **[ZeroMQ](http://www.zeromq.org/)**, a socket toolbox offering bindings for **[30+ languages](http://zguide.zeromq.org/page:all)**. Unlike broker-centered JMS or RabbitMQ, ZeroMQ is a messaging library, not a full messaging solution. There are no brokers; instead we get access to TCP sockets (fast) that we can use to build complex communication patterns. I cannot say it any better than this:

{% blockquote Zed Shaw on ZeroMQ http://www.zeromq.org/intro:read-the-manual %}
What ZeroMQ does is create an API that looks a lot like sockets, and feels the same, but gives you the messaging styles you actually want. By simply specifying the type of socket when you call zmq_socket you can have multicast, request/reply, and many other styles.
{% endblockquote %}

Please check out these articles for more in-depth information about ZeroMQ:

+ **[ZeroMQ an introduction, by Nicholas Piël](http://nichol.as/zeromq-an-introduction)**
+ **[ZeroMQ: Modern & Fast Networking Stack, by Ilya Grigorik](http://www.igvita.com/2010/09/03/zeromq-modern-fast-networking-stack/)**
+ **[The Appeal and Controversy of ZeroMQ, by Pieter Hintjens](http://www.josetteorama.com/zeromq/)**

Let us put ZeroMQ to practical use. First thing to do is to install ZeroMQ. One thing to note is that the current Scala bindings require ZeroMQ version 2. On a Mac with homebrew installed you can do this (or refer to the **[ZeroMQ instructions](http://www.zeromq.org/area:download)**):

{% codeblock Installing ZeroMQ (Mac) lang:bash %}
brew install zeromq
brew switch zeromq 2.2.0
{% endcodeblock %}

For demonstration purposes I will publish and consume all messages from within the same application. I'm actually working on a more sophisticated version of the BirdWatch application that uses ZeroMQ between different applications running in separate JVMs, but more about that another time. For now I will split the TwitterClient class into separate TweetsPublisher and TweetsConsumer classes within the same application and let them communicate using ZeroMQ publish/subscribe topics. Check out this **[branch](https://github.com/matthiasn/BirdWatch/tree/130602-ZeroMQ)** on GitHub. 

{% codeblock TweetsPublisher lang:scala https://github.com/matthiasn/BirdWatch/blob/980916bcecb7c65e34a1a1c983eb02ccede00674/app/actors/TweetsPublisher.scala TweetsPublisher.scala %}
/** ZeroMQ Publishing Socket (clients attach to this). Specify IP 
 *  address or use *:PORT if you want this open to outside world.
 */
val tweetPubSocket = ZeroMQExtension(system).newSocket(SocketType.Pub, 
  Bind("tcp://127.0.0.1:21231"))  

/** Send message to socket (yes, it is that simple)*/
tweetPubSocket ! ZMQMessage(Seq(Frame("birdwatch.tweets"), Frame(json.toString)))
{% endcodeblock %}

{% codeblock TweetsConsumer lang:scala https://github.com/matthiasn/BirdWatch/blob/980916bcecb7c65e34a1a1c983eb02ccede00674/app/actors/TweetsConsumer.scala TweetsConsumer.scala %}
/** Actor listening to Tweets socket */
class TweetsListener extends Actor {
  def receive: Receive = {
    case m: ZMQMessage => {
      /** payload is Array[Byte], make String and parse into JSON*/
      val chunkString = new String(m.payload(1), "UTF-8")
      val json = Json.parse(chunkString)                    

      /** read into Tweet case class representation, push onto channel */
      TweetReads.reads(json) match {                               
        case JsSuccess(t: Tweet, _) => tweetChannel.push(t) 
        case e: JsError => println(chunkString)              
      }
    }
    case _ => 
  }
}

/** Socket with attached listener */
val tweetsListener = system.actorOf(Props(new TweetsListener()), "TweetsListener")
val tweetsSocket = ZeroMQExtension(system).newSocket(SocketType.Sub,
  Listener(tweetsListener), Connect("tcp://127.0.0.1:21231"), 
  Subscribe("birdwatch.tweets"))
{% endcodeblock %}

This additional layer of indirection opens up a wide range of possibilities. Scaling becomes straightforward, we can attach pretty much as many of the client-facing controller applications (once split up) to the Tweet publishing application, without even having to individually configure them. Have them all point to the same publishing socket, spread the load using for example **[nginx](http://wiki.nginx.org/Main)** and you're done.

{% img left /images/zeromq.png 'image' 'images' %}

We can also swap individual parts of the application for better ones. I personally do not like the current approach to consuming the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** as used in **[TweetsPublisher.scala](https://github.com/matthiasn/BirdWatch/blob/980916bcecb7c65e34a1a1c983eb02ccede00674/app/actors/TweetsPublisher.scala)** and I would like to replace it with the **[Twitter Hosebird Client (hbc)](https://dev.twitter.com/blog/the-hosebird-client-streaming-library)**. If folks at Twitter have developed this for usage in their own projects, I have no doubt they can do this much better than my simple reconnect strategy possibly could. Last time I checked, hbc was not compatible with Scala version 2.10 used in Play 2.1 though, but thanks to ZeroMQ, the library can be run in its native habitat (Java application without having to worry about which version of Scala is used in some embedded library) and publish Tweets onto a ZeroMQ socket. The TweetsConsumer then would only have to point to another socket address. Anyone experienced with using ZeroMQ in a Java application interested in writing this client? 

-Matthias

Below are some books that I have found useful and I hope will be helpful for you as well. You can support this blog by clicking on the slideshow and buying anything on Amazon, no matter if it is a listed item or not. **Thank you!** Your support will allow me to write more articles like this one.

<SCRIPT charset="utf-8" type="text/javascript" src="http://r.matthiasnehlsen.com/slideshow1/wide"> </SCRIPT>