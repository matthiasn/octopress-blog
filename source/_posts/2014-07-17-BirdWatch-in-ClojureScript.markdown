---
layout: post
title: "BirdWatch client using ClojureScript and Om"
date: 2014-07-17 08:30
comments: true
categories: 
---
Back in January I wanted to try out **[Om](https://github.com/swannodette/om)**. Now I finally got around to doing so.

<!-- more -->

<blockquote class="twitter-tweet" lang="en"><p><a href="https://twitter.com/swannodette">@swannodette</a> Om looks really powerful, I think I&#39;m going to give it a try in one of the next articles.</p>&mdash; Matthias Nehlsen (@matthiasnehlsen) <a href="https://twitter.com/matthiasnehlsen/statuses/427945296971042816">January 27, 2014</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

For those of you who do not know, **[Om](https://github.com/swannodette/om)** is a **[ClojureScript](https://github.com/clojure/clojurescript)** wrapper around Facebook's **[ReactJS](http://facebook.github.io/react/)** library. I have covered **ReactJS** on this blog a few times, for example in the post mentioned in the twitter conversation above. **ClojureScript** is very similar to **[Clojure](http://clojure.org)**, except that it targets the browser and not the **[JVM](http://en.wikipedia.org/wiki/Java_virtual_machine)**. Like **[Scala.js](http://www.scala-js.org)**, ClojureScript is compiled into **JavaScript**.

Finally I got around to giving **Om** a spin and wrote my first application in **ClojureScript**. You can try it out <a href="http://birdwatch.matthiasnehlsen.com/cljs/#" target="_blank"><strong>here</strong></a>. Before, I had only read a little bit about Clojure and ClojureScript and I had also gone through **[clojurekoans](http://clojurekoans.com)**. Then, just for the fun of it (and to see for myself if I could make it work), I wanted to write a new client for my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application, this time in ClojureScript. BirdWatch is kind of a live search engine for tweets for an area of interest, with a **[Single Page Application](http://en.wikipedia.org/wiki/Single-page_application)** retrieving search results from a server component, including updates to that search over a streaming connection using **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**. In the browser, some basic stats about specific tweets (like recent RTs) and about usage of words (wordcloud and trending barchart) plus a time series chart displaying the time distribution of recent tweets matching a query. The server side is written in **[Scala](http://www.scala-lang.org)** using **[Play Framework](http://www.playframework.com)**, however that does not need to concern us for this article as the wire format is plain **[JSON](http://tools.ietf.org/html/rfc4627)**.

The UI of the new client is done in **[Om](https://github.com/swannodette/om)** and the internal communication between application parts is realized with **[Core.async](https://github.com/clojure/core.async)**. All the data mangling is done in ClojureScript instead of using **[crossfilter.js](http://square.github.io/crossfilter/)** as was is case with the ReactJS and the AngularJS versions. For more information about the server side and a JavaScript version of the client side application, I can recommend [this article](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/). The description of the server side is still accurate, it has not changed in the process of writing this ClojureScript version. On the client side there are version using AngularJS, ReactJS and now ClojureScript and Om.

This is how the UI of the application looks like now. I have also improved the application while writing this recent addition by 

* offering additional sort orders (by favorite and by retweet within analyzed tweets)
* enabling retweets, replies and favorites directly from within the application using web intents
* showing photos embedded in tweets

Some of these changes have made it back into the ReactJS version so far, with the AngularJS version planned to follow.

<a href="http://birdwatch.matthiasnehlsen.com/cljs/#" target="_blank"><img src="/images/cljs-screenshot.png" /></a>

Click the image above to give this new client that was written in **ClojureScript** a try. Writing it worked surprisingly well and I have learned a lot in the process. 

EDIT July 24th, 2014: The **[next article](http://matthiasnehlsen.com/blog/2014/07/24/birdwatch-cljs-om/)** goes into detail on how this application is implemented.

Cheers,
Matthias

Check out my **[reviews page](/reviews)** where I share my thoughts on books and gadgets.
