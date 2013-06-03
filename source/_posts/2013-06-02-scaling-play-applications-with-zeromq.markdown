---
layout: post
title: "Scaling Play applications with ZeroMQ"
date: 2013-06-02 07:48
comments: true
categories: 
---
Let us assume for a second that my **[BirdWatch](http://bit.ly/BirdWatch)** application needed to handle more load than a single server could handle. The current version could not just be run as multiple instances because then each one would establish a connection to Twitter, of which there is supposed to be only one per application. It owuld work to split the application into a TwitterClient part and a user-facing controller part, of which multiple instances could run as needed.

<!-- more -->

How do we connect these separate parts of the application though? One approach could be using an HTTP stream between the parts as well, basically using the TwitterClient application as a hub for delivering the Twitter stream to multiple instances as needed. While this works, it is not an elegant solution: how do we handle reconnects? Yeah, we'll have to handle them ourselves.

We could use an Akka cluster for this. This approach seems more promising, as all the messaging elements we would need should already be there. But this does not offer the best possible flexibility, as it requires all participants to use Akka. Why would we want to limit ourselves to one technology stack if not absolutely necessary?

I would prefer a solution that is completely agnostic of the technology each building block of the whole application uses. I might want to run statistics using **[numpy](http://www.numpy.org)** in the future or whatever. This should be possible without much glue code. HTTP is obviously technology independent but it falls short due to the reconnect issues.

Turns out there is a great solution: **[ZeroMQ](http://www.zeromq.org/)**, a socket toolbox offering bindings for **[30+ languages](http://zguide.zeromq.org/page:all)**. Unlike broker-centered JMS or RabbitMQ, ZeroMQ is a messaging library, not a full messaging solution. There are no brokers, instead we get access to TCP sockets (fast) that we can use to build complex communication patterns. I cannot say it any better than Zed Shaw:

{% blockquote Zed Shaw on ZeroMQ http://www.zeromq.org/intro:read-the-manual %}
What ZeroMQ does is create an API that looks a lot like sockets, and feels the same, but gives you the messaging styles you actually want. By simply specifying the type of socket when you call zmq_socket you can have multicast, request/reply, and many other styles.
{% endblockquote %}

Let us put this to practical use. For demonstration purposes I will publish and consume all messages from within the same application, that is easier than creating multiple projects for this. In a real setup there would be different projects for this. I'm actually working on a more sophisticated version of the BirdWatch application that uses ZeroMQ between different components, but more about that later. I will split the TwitterClient class into separate TweetsPublisher and TweetsConsumer and let them communicate using a ZeroMQ publish/subscribe channel:

{% codeblock TweetsPublisher lang:scala https://github.com/matthiasn/BirdWatch/blob/74fbdfa568bbcc3f4c6c14de45b70a8bd6e828dc/app/actors/TwitterClient.scala TweetsPublisher.scala %}

{% endcodeblock %}

{% codeblock TweetsConsumer lang:scala https://github.com/matthiasn/BirdWatch/blob/74fbdfa568bbcc3f4c6c14de45b70a8bd6e828dc/app/actors/TwitterClient.scala TweetsConsumer.scala %}

{% endcodeblock %}

Nice, now I can finally kick out the current TwitterPublisher and replace it with a Java application using Twitter4J and publishing the Tweets on a socket. If folks at Twitter have developed this for usage in their projects, I have no doubt they can do this much better than my simple reconnect strategy possibly could. Last time I checked it was not compatible with the Scala version 2.10  used in Play 2.1, but I am fairly confident that it should be easy to give this its own Java VM and have it publish on a ZeroMQ socket. Anyone experienced with using ZeroMQ in a Java application interested in writing this client? 