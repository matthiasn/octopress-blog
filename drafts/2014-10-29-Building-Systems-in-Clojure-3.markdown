---
layout: post
title: "Building a System in #Clojure Part 3 - Redesign"
date: 2014-10-06 19:06
comments: true
categories:
---
I did a lot of proofreading of talk transcripts for my **[new project](https://github.com/matthiasn/talk-transcripts)** recently. The content of these talks got me thinking that there are a lot of ideas I want to adopt in **[BirdWatch](https://github.com/matthiasn/BirdWatch)**, the application I started writing this series of articles about. That calls for some **redesign**, so it’s probably time to make up my mind what exactly it is that I am trying to solve with this application.

So here’s the idea:
* We have a stream of information, of which we are interested in a subset that we can match on via full-text search and ranges. The searches are really anything that ElasticSearch / Lucene can match on.
* Further, we are interested in live results plus a certain duration of time into the recent past. For now, we are using tweets from the Twitter Streaming API, but the source could be anything. Any kind of social media data, sensor data could also be interesting, whatever. Live means matches new matches are added to the displayed results within about a second.
* The results are supposed to be shown in a browser, including mobile. The number of items reasoned about shall not be limited by the available memory of the browser.
* My immediately goal is to be able to reason about the last million tweets for a certain topic. Also, it should be possible to serve many concurrent ad-hoc queries.

I am not sure yet exactly how all these requirements can be brought together, put I am going to find out. I found it to be limiting to only write about stuff after the fact. Instead, I’d enjoy discussing choices as they come up.

The immediate thing that comes to my mind when regurgitating the requirements above is Storm and the Lambda Architecture. Please correct me if I’m wrong, but in my understanding it wouldn’t be perfect match though as topologies are fixed once they are running. If that is so, it limits the flexibility to add and tear down additional live searches. I am afraid keeping a few stand-by bolts to assign to queries dynamically would not be flexible enough.

So instead I propose to do the aggregation (the reduce phase) on the browser side in a ClojureScript application. Then on the server side, the counterparts in Clojure could even share code. On the server side, partial results are aggregated for shorter time periods. These partial results can be generated in a cluster of nodes while the client is fed with live data immediately.

[^1]

[^1]: 