---
layout: post
title: "Building a System in #Clojure Part 3 - Redesign"
date: 2014-10-30 19:06
comments: true
categories:
---
I did a lot of transcript proofreading of enlightening talk for my **[new project](https://github.com/matthiasn/talk-transcripts)** recently. The most recent one was Design, Composition and Performance by Rich Hickey. That one in particular got me thinking that there are quite a few ideas I want to adopt in **[BirdWatch](https://github.com/matthiasn/BirdWatch)**, the application I started writing this series of articles about. That calls for some **redesign**, so it’s probably time to make up my mind what exactly it is that I am trying to solve with this application.

<!-- more -->

So here’s the idea:
* We have a stream of information, of which we are interested in a subset that we can match on via full-text search and ranges. The searches are really anything that ElasticSearch / Lucene can match on.
* Further, we are interested in live results plus a certain duration of time into the recent past. For now, we are using tweets from the Twitter Streaming API, but the source could be anything, like other social media data. Sensor data could also be interesting, whatever. Live means matches new matches are added to the displayed results within about a second.
* The results are supposed to be shown in a browser, including mobile. The number of items reasoned about shall not be limited by the available memory of the browser.
* My immediately goal is to be able to reason about the last million tweets for a certain topic. Also, it should be possible to serve many concurrent ad-hoc queries, like hundreds of different ones or more.

I am not sure yet exactly how all these requirements can be brought together, put I am going to find out. I found it to be limiting to only write about stuff after the fact. Instead, I’d enjoy discussing choices as they come up.

The immediate thing that comes to my mind when regurgitating the requirements above is Storm and the Lambda Architecture. Please correct me if I’m wrong, but in my understanding it wouldn’t be perfect match though as topologies are fixed once they are running. If that is so, it limits the flexibility to add and tear down additional live searches. I am afraid keeping a few stand-by bolts to assign to queries dynamically would not be flexible enough.

So instead I propose to do the aggregation (the reduce phase) on the browser side in a ClojureScript application. On the server side, partial results are aggregated for shorter time periods. These partial results can be generated in a cluster of nodes while the client is fed with live data immediately. Let's have a look at a drawing before I walk you through the individual steps:

{% img left /images/redesign.png 'Redesigned Architecture' 'Redesigned Architecture'%}

The redesign also involves breaking the application up into two or three different applications. Let's go through the interactions step by step:

1. Tweets are received from the Twitter Streaming API in chunks of (oftentimes incomplete) JSON. A stateful transducer is used for reassembling the JSON and parsing chunks into Clojure maps. This aspect of the application is already described in **[this recent article](http://matthiasnehlsen.com/blog/2014/10/06/Building-Systems-in-Clojure-2/)** and does not need to change a bit for the redesign.

2. Tweets are stored in ElasticSearch in their respective index. If the received tweet contains a retweet, the retweet status is used to update an existing item (e.g. the RT count).

3. The newly received tweet is presented to ElasticSearch's percolation index in order to find clients interested in this tweet. It is kind of a reverse matching where the new item is matched against existing queries.

4. The tweet together with information on matched queries are published using **[Redis's Pub/Sub](http://redis.io/topics/pubsub)** feature. Potentially, the search ID of the matches could be used to publish to different topics. This constitutes the border of the first Clojure application.

5. The second Clojure application, which serves the client side ClojureScript application as well, receives a new search over the web socket connection.

6. It then registers the query in ElasticSearch's percolation index.

7. Next, the socket connection subscribes to the search ID's topic in Redis's Pub/Sub feature.

8. Matches to the client's search are from now on delivered to the client-side ClojureScript application.

9. This next step may or may not live in the same JVM, I haven't decided yet. So the idea is to aggregate data on the server side and only deliver the aggregated data structures back to the client side. For example, these could be a few hundred aggregates over increments of five minutes each. These increments can easily be made addressable (and cacheable): let's say it is 1:17pm. Then, we have a last and incomplete increment from 1:15pm that will be added upon in the browser whereas all previous once are complete and fixed. By treating the complete ones as immutable, we can cache them and forego unnecessary and expensive request to ElasticSearch. Now since these immutable previous chunks can be individually addressable, so it may make sense to deliver them through REST endpoints instead of via the WebSocket connection (hence the dashed line).

10. We've already established that previous chunks can be cached. Redis seems like a great way to achieve this as it is really simple to having expiring entries in Redis. So Redis would be queried for the chunk address first. If it exists, it is delivered right away. If not, ElasticSearch is queried and the result both delivered and stored in Redis for the next couple of hours or so in order to avoid unnecessary load on Elastic Search.

11. Finally, the aggregate is delivered to the client. This could either be through the WebSockets connection or through **[REST](http://en.wikipedia.org/wiki/Representational_state_transfer)** (the dashed line).

## Conclusion
So far, this is just an idea of where the application might go. I am looking forward to implementing it, this should be fun. Completely decoupling the processes between a Twitter client and the clinet-serving part allows both restarting the client-serving part with disconnecting from the Streaming API and also much better allows for scaling. There's only one connection to the Streaming API at any one time, but there's no reason why not more clients should be served than any one JVM/box could handle.

I feel confident that this will work but I'd also love to hear from you when you think any of this is a bad idea (or any kind of comment you might have). In particular, I'd also like to hear about ideas how to separate the application. Should this be separate Leiningen projects or separate profiles in one project? Or should this be some kind of a polymorphic monolith which will only know its particular functionality via runtime configuration. I kind of see the polymorphic monolith as an antipattern but I am open to learn better. But probably not.

Cheers,
Matthias


[^1]

[^1]: 