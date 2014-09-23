---
layout: post
title: "Building a System in Clojure - Part 1"
date: 2014-09-24 19:06
comments: true
categories: 
---
This is the first of **n** articles about building **systems** in **[Clojure](http://clojure.org/)**. In this series we will be looking at the Clojure rewrite of an application I wrote last year: **[BirdWatch](https://github.com/matthiasn/BirdWatch)**. This application subscribes to the Twitter Streaming API for all tweets that contain any of a number of terms and makes them searchable through storing them in ElasticSearch

<!-- more -->

<script language="javascript" type="text/javascript">
  function resizeIframe(obj) {
    obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
    obj.style.width = obj.contentWindow.document.body.scrollWidth + 'px';
  }
</script>

<iframe width="100%;" src="/iframes/bw-anim/index.html" scrolling="no" onload="javascript:resizeIframe(this);" ></iframe>


Let's use a new demo, a term with a lot of traffic: **LOVE**. When tracking this term on the streaming API, I usually get around 75 tweets per second.

That's a lot, I wouldn't want to try opening that page on mobile, necessarily. But how about a live search in that stream? Let's filter out the tweets that contain the term birthday. With that, at the time of testing, I am down to two or three tweets per second: 

http://localhost:8888/#birthday

Now if you are daring (and won't complain about bandwidth usage), why not go to the search field and click the search button with an empty field. Now you'll get all, which still works nicely and utilizes the Chrome helper so that it uses around 40% CPU on a quadcore 2012 retina macbook (where the available total is 800%, so it really only utilizes one virtual core to less than half). It would be interesting to simulate a higher load and see at how many messages per second Chrome maxes out the single JavaScript thread. One thing to note is that at around 50,000 tweets loaded, the application seems to come to a halt on the client side, with the server side unaffected. I suspect at one point I am currently just holding on to too much state. Let's check at some point if that's necessary for the specified functionality. I think not and I have an idea on how to solve this.

**Remove disconnected UIDs from mapping atom!**

Thanks and until next week,
Matthias

ARTICLE on the channels component
Channels are sweet. Bounded mailboxes are poison


Once we will have discussed the architecture in detail, next we can start observing the system under load. Of course, it would be interesting to have actual user load. But with or without actual load, we will want a way of generating / simulating load and then observe the system, identify the bottlenecks and remove them. For example the clients could be simulated by connecting a load generator via ZeroMQ or the like and deliver matches back to that application and check if they are as expected (correct, complete, timely). Also the Twitter stream could be simulated, for example by connecting to a load generator that either replays recorded tweets, with full control over the rate, or with artifical test cases, for which we could exactly specify the expectations on the output side.


footnotes:
I first discovered **Clojure** last summer and read quite a few articles on the language itself since. It wasn't until this summer though that I tried building an application with it. At first I was lost as to how I could structure an application in it. I started rewriting my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** with Clojure on the server side and **ClojureScript** and **Om** on the client side. While that worked nicely, I ended up with something that I dreaded more than I dreaded the monsters under my bed when I was a kid and that was something where everything depended on everything. I have seen that too often to shrug it away and be okay with it. 

Then I found Stuart Sierra's Component library and things started to look brighter again. It offers dependency injection, which, as I strongly believe, is crucial for building systems 
