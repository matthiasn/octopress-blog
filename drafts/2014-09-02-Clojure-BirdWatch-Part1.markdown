---
layout: post
title: "BirdWatch in Clojure - Part 1"
date: 2014-09-02 15:00
comments: true
categories: 
---
This is the first in a series of articles about the rewrite of my BirdWatch application using Clojure and ClojureScript. In this first installment, I will outline the reasoning behind the rewrite and also introduce the general architecture.

Why am I doing this rewrite in Clojure and ClojureScript? First of all I am fascinated by CSP. In case you have never heard of it, CSP is referring to Communicating Sequential Processes, a concept first introduced by Tony Hoare in the 1980s. Then I am fascinated by Clojure and LISP, more generally. I think that Lambda Calculus and Homoiconicity are super powerful. So in a way this is a contribute to John McCarthy and Tony Hoare.

With this background, it was only natural for me to want to see core.async in action, which is a Clojure implementation of CSP. Last year I wrote this application on top of the Twitter Streaming API for live searching tweets subscribed to via the Streaming API, together with historic data. From a functionality standpoint, you would formulate a search over say the last 5000 tweets matching your search, and then have the results update live as new matches come in. In that application, all the heavy lifting was done on the client side, which worked decently well but but turned out to be quite memory hog when a substantial number of tweets was loaded. On a desktop browser, 5K loaded tweets wasn't an issue, but what if I wanted the last 500K tweets. Not a chance. On mobile, 5K was even ambitious. It had been clear to me that another mechanism was needed, one that performs a good part of the analysis directly on the server, thus moving the computation closer to the data. On the server side, it doesn't hurt much to load a large amount of tweets, with the connection between server process and the ElasticSearch cluster having a GBit link or even being on the localhost, which is substantially faster still.

https://github.com/esnet/iperf
$ iperf -c localhost -fM -d
------------------------------------------------------------
Server listening on TCP port 5001
TCP window size: 0.12 MByte (default)
------------------------------------------------------------
------------------------------------------------------------
Client connecting to localhost, TCP port 5001
TCP window size: 0.50 MByte (default)
------------------------------------------------------------
[  6] local 127.0.0.1 port 62018 connected with 127.0.0.1 port 5001
[  7] local 127.0.0.1 port 5001 connected with 127.0.0.1 port 62018
[ ID] Interval       Transfer     Bandwidth
[  6]  0.0-10.0 sec  26841 MBytes  2684 MBytes/sec
[  7]  0.0-10.0 sec  26841 MBytes  2682 MBytes/sec

Yeah, that's MBytes. With around 20Gigabit/s, that's roughly 20 times as fast as a GBit link and still twice as fast as pricy 10GBit interfaces and potentially has a lot less latency as well. So all this is to say when I can move data processing as close as possible to the data so that ideally they take place on the same machine, the connection between the server side process and ElasticSearch will very likely not be the bottleneck. This is quite unlike a bad mobile connection.

Can we agree now that of I wanted run my analysis over the say last million tweets for a search, I would be better advised to do so on the same machine or at least co-located? I thought so. How can we do that though? What has kept me from tackling this promising approach earlier was that I decidedly did not want to write the same analysis code in different languages. Clojure and ClojureScript, on the other hand, are similiar enough to do the same on both client and server, particularly when introducing cljx into the equation. Also, core.async seems to be a particularly nice fit when trying to reason about streaming data. This seemingly killer combination had to be taken for a spin. 

Let us walk through this application part by part. The data enters in the form of tweets through the Twitter Streaming API which is a chunked HTTP connection. Some magic needs to be done here because as of early this year, tweets do not respect chunk boundaries any longer. Previously, you could just parse each chunk and expect to find the entirety of a tweet in a JSON string representation. Not any longer. Now sometimes a tweet would span over multiple chunks, requiring to hold on to previous chunk. The way I have done this was to always keep a buffer including the latest tweet, which does not immediately have to be complete. Then I'd split the buffer string by \r\n and parse the first result(s) and always put the last one back into the buffer. That way the latest one can build up until it is followed by the \r\n. That also means that the last one is always left dangling even if complete, but being a tweet behind is not a problem when subscribing to a stream that constantly delivers tens per second. It should be taken into account when using a lower frequency stream. Maybe one could also use all splits when \r\n is present at the end and only otherwise carry over the last one. Why not, probably a good check and cheap way to not lag behind ever unless correctly the last received chunk is still incomplete.

Now every correctly parsed tweet is put on a channel. From the perspective of this part of the application, that's all it needs to know. Parse, move to next conveyor belt. No dependency whatsoever otherwise.

Next 

## Conclusion
This is it for today. In the next article, we will look at the persistence and percolation matching stage.

Cheers,
Matthias