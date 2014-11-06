---
layout: post
title: "Building a System in #Clojure Part 4 - Process separation with Redis"
date: 2014-11-06 19:06
comments: true
categories:
---
Last week, I drew a picture about how I wanted to break a monolithic application apart and instead run different parts of the application in separate processes / separate JVMs. The idea was to have a single Twitter client for the connection to the streaming API and the persistence of the received Tweets, plus multiple machines for serving WebSocket connections to the client. For the communication between those processes, I picked Redis Pub/Sub because its model of communication appears to suit the requirements really well. As cute as the drawing is, I prefer code (plus drawing), so I took the previous monolith apart over the weekend and put Redis in between for communication. It worked really well.

<!-- more -->

It wasn't a total surprise how well this worked. I started using the Component library together with core.async for exactly this reason a few weeks ago. I wanted the freedom to only ever put stuff on a conveyor belt and not have to think about how a thing got where it needs to go, or even where it needs to go at all.


## Redis Pub/Sub with Carmine
I chose Pub/Sub over a queue because I wanted to **[fan-out](http://en.wikipedia.org/wiki/Fan-out)** messages to multiple clients. Any connected processes is only supposed to be fed with data during its uptime, with no need to store anything for when it is not connected. For interfacing with Redis from Clojure, I then chose **[Peter Taoussanis](https://twitter.com/ptaoussanis)**'s **[carmine](https://github.com/ptaoussanis/carmine)** client and it turned out to be a great choice.

Let's look at some code:




## Performance of Redis
Redis does an incredibly lot with very little CPU utilization. As an unscientific test, I fired up 50 JVMs (on four machines) subscribing to the topic that the TwitterClient is publishing tweets with matched percolation queries on. Then I changed the tracked term from the Streaming API to **"love"**, which reliably maxes out the allowed rate tweets. Typically, with this term I see around 60 to 70 tweets per second. With 50 connected processes, 3000 to 3500 tweets were delivered per second, yet the CPU utilization of Redis idled somewhere between 1.7% and 2.3%.

## Conclusion
I'm glad I got around to the process separation last weekend. It was fun to do and gives me confidence to proceed with the design I have in my head. In one of the next articles, 