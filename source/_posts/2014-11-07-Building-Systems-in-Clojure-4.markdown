---
layout: post
title: "Building a System in #Clojure Part 4 - Interprocess communication with Redis"
date: 2014-11-07 13:06
comments: true
categories:
---
**[Last week](http://matthiasnehlsen.com/blog/2014/10/30/Building-Systems-in-Clojure-3/)**, I drew a picture of how I wanted to break apart a monolithic application and instead run different parts of the application in separate processes / separate JVMs. The idea was to have a single Twitter client for the connection to the streaming API and the persistence of the received Tweets, plus multiple machines to serve WebSocket connections to the client. For the communication between the processes, I picked **Redis Pub/Sub** because its model of communication appears to suit the requirements really well. As cute as the drawing is, I prefer code (plus drawing), so I took the previous monolith apart over the weekend and put Redis in between for communication. It worked really well and here's how.

<!-- more -->

Okay, it wasn't a total surprise to see how well it worked. After all, I started using the **[Component library](https://github.com/stuartsierra/component)** together with **[core.async](https://github.com/clojure/core.async)** for exactly this reason a few weeks ago. I wanted the freedom to only ever having to put stuff on conveyor belts and not having to think about how a thing got where it needs to go, or even where it needs to go at all.

## Redis Pub/Sub with Carmine
I chose **Pub/Sub** over a queue because I wanted to **[fan-out](http://en.wikipedia.org/wiki/Fan-out)** messages to multiple clients. Any connected processes are only supposed to be fed with data during their uptime, with no need to store anything for when they aren't connected. For interfacing with **Redis** from Clojure, I then chose **[Peter Taoussanis](https://twitter.com/ptaoussanis)**'s **[carmine](https://github.com/ptaoussanis/carmine)** client and it turned out to be a great choice.

Let's look at some code. First of all, I am using a **component** that provides a **send channel** and a **receive channel**. It can be reused on either side of the Pub/Sub connection (or for bidirectional communication, of course):

{% codeblock Interop Channels Component lang:clojure https://github.com/matthiasn/BirdWatch/blob/4ce6d8ff70359df9f98421c12984d24d0f311f6f/Clojure-Websockets/TwitterClient/src/clj/birdwatch_tc/interop/component.clj component.clj%}
(defrecord Interop-Channels []
  component/Lifecycle
  (start [component] (log/info "Starting Interop Channels Component")
         (assoc component :send (chan) :receive (chan)))
  (stop  [component] (log/info "Stop Interop Channels Component")
         (assoc component :send nil :receive nil)))
{% endcodeblock %}

This channels component can now be wired into other components. Here's the component on the publisher side:

{% codeblock Publishing Interop Component lang:clojure https://github.com/matthiasn/BirdWatch/blob/4ce6d8ff70359df9f98421c12984d24d0f311f6f/Clojure-Websockets/TwitterClient/src/clj/birdwatch_tc/interop/component.clj component.clj%}
(defrecord Interop [conf channels]
  component/Lifecycle
  (start [component] (log/info "Starting Interop Component")
         (let [conn {:pool {} :spec {:host (:redis-host conf) :port (:redis-port conf)}}]
           (red/run-send-loop (:send channels) conn "matches")
           (assoc component :conn conn)))
  (stop  [component] (log/info "Stopping Interop Component")
         (assoc component :conn nil)))
{% endcodeblock %}

Here, we are creating a configuration map and start a send loop with this configuration for the **"matches"** topic. Here's that loop:

{% codeblock Send Loop lang:clojure https://github.com/matthiasn/BirdWatch/blob/4ce6d8ff70359df9f98421c12984d24d0f311f6f/Clojure-Websockets/TwitterClient/src/clj/birdwatch_tc/interop/redis.clj redis.clj%}
(defn run-send-loop
  "loop for sending items by publishing them on a Redis pub topic"
  [send-chan conn topic]
  (go-loop [] (let [msg (<! send-chan)]
                (car/wcar conn (car/publish topic msg))
                (recur))))
{% endcodeblock %}

This **go-loop** consumes all messages that come in on **send-chan** channel and publishes them on **topic** for the specified configuration **conn**.

Here's the other side of the communication with the component subscribing to the same topic. The channels component stays the same. The component itself looks a little different:

{% codeblock Subscribing Interop Component lang:clojure https://github.com/matthiasn/BirdWatch/blob/4ce6d8ff70359df9f98421c12984d24d0f311f6f/Clojure-Websockets/MainApp/src/clj/birdwatch/interop/component.clj component.clj%}
(defrecord Interop [conf channels listener]
  component/Lifecycle
  (start [component] (log/info "Starting Interop Component")
         (let [conn {:pool {} :spec {:host (:redis-host conf) :port (:redis-port conf)}}
               listener (red/subscribe-topic (:receive channels) conn "matches")]
           (assoc component :conn conn :listener listener)))
  (stop  [component] (log/info "Stopping Interop Component")
         (red/unsubscribe listener)
         (red/close listener)
         (assoc component :conn nil :listener nil)))
{% endcodeblock %}

Just like for the publisher side, there's the configuration map. Next, we subscribe to a topic and hold on to the returned listener so that we can unsubscribe from the topic and shut it down later when the component is shut down[^1].

{% codeblock Subscription-related Functions lang:clojure https://github.com/matthiasn/BirdWatch/blob/4ce6d8ff70359df9f98421c12984d24d0f311f6f/Clojure-Websockets/TwitterClient/src/clj/birdwatch_tc/interop/redis.clj redis.clj%}
(defn- msg-handler-fn
  "create handler function for messages from Redis Pub/Sub"
  [receive-chan]
  (fn [[msg-type topic payload]]
    (when (= msg-type "message")
      (put! receive-chan payload))))

(defn subscribe-topic
  "subscribe to topic, put items on specified channel"
  [receive-chan conn topic]
  (car/with-new-pubsub-listener
    (:spec conn)
    {"matches" (msg-handler-fn receive-chan)}
    (car/subscribe topic)))

(defn unsubscribe
  "unsubscribe listener from all topics"
  [listener]
  (car/with-open-listener listener (car/unsubscribe)))

(defn close
  "close listener"
  [listener]
  (car/close-listener listener))
{% endcodeblock %}

## Performance of Redis
Redis does a lot with very little CPU utilization. In a non-scientific test, I fired up 50 JVMs (on four machines) subscribing to the topic on which the TwitterClient publishes tweets with matched percolation queries. Then I changed the tracked term from the **[Twitter Streaming API]()** to **"love"**, which reliably maxes out the rate tweets permitted. Typically, with this term I see around 60 to 70 tweets per second. With 50 connected processes, 3000 to 3500 tweets were delivered per second, yet the CPU utilization of Redis idled somewhere between 1.7% and 2.3%.

## Conclusion
I'm glad I got around to the process separation last weekend. It was fun to do and gives me confidence to proceed with the design I have in mind. In one of my next articles, I will describe the **Docker** configuration for running a **TwitterClient** container, a couple of containers with the client-serving JVMs connecting over **Redis**, a container with **Redis** itself and another container with **nginx** for load-balancing, plus a few containers for running an **ElasticSearch** cluster. Subscribe to the <a href="http://eepurl.com/y0HWv" target="_blank"><strong>newsletter</strong></a> or **[follow me on Twitter](https://twitter.com/matthiasnehlsen)** if you want to be informed once the next article is out.

Cheers and have a great weekend,
Matthias

[^1]: The beauty of the component library is that during development, we can stop a component and restart it after reloading the code. This takes much less time than completely reloading the application. See Stuart Sierra's talk for more information on the component library.