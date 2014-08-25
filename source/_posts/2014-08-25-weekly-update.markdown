---
layout: post
title: "Weekly Update: AngularJS book, BirdWatch and Clojure, Web Components, Upstart and Play"
date: 2014-08-25 19:06
comments: true
categories: 
---
In this weekly update, I am talking about **Clojure and ClojureScript**, an upcoming article on **AngularJS, Grunt, Karma and Protractor** and how I am using **Upstart** to run my **Play** applications as services on **Ubuntu**.

<!-- more -->

## AngularJS book available for pre-order on Amazon, Meetup
I am very excited that the book that **[Amit Gharat](http://amitgharat.wordpress.com)** and I wrote about **[AngularJS UI Development](http://www.amazon.com/gp/product/1783288477/ref=as_li_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1783288477&linkCode=as2&tag=matthiasnehls-20&linkId=7WKFJKNQICCUSFES)** is now available for **[pre-order on Amazon](http://www.amazon.com/gp/product/1783288477/ref=as_li_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1783288477&linkCode=as2&tag=matthiasnehls-20&linkId=7WKFJKNQICCUSFES)**. Interesting experience to see it being listed already while still working on the final stages.

We will have content available for preview soon. On my end, I will **publish** an article about **setting up the environment for AngularJS** with a **build system consisting of Grunt, Bower, Karma and Protractor**. Last week I have also given a talk on the subject at the **[Hamburg AngularJS meetup](http://www.meetup.com/Hamburg-AngularJS-Meetup/events/196972082/)**. Or rather a live coding session in which we coded up an application that is **tested in Chrome, Firefox, PhantomJS and also in Mobile Safari**. Android is still missing due to some difficulties I had but should be added soon. The project that this article will be based upon is already available on **[GitHub](https://github.com/matthiasn/angular-grunt-protractor-starter)**. You may find it to be a good starting point for an AngularJS application that includes a test and build system. Besides the planned article I also want to do a screencast on the subject. Stay tuned. By the way, **you** could help me here with testing it on Android.

## Tweet stream analysis with Clojure and ClojureScript
I recently rewrote the client side of my BirdWatch application using ClojureScript. While I enjoyed the process, I also noticed some issues with performance when trying to keep the application response while transforming previous tweets as quickly as possible. While optimizations certainly could have done on the client side alone, this was a good reminder that the architecture of the information flow was far from ideal. The previous version was also a bit of a **Frankenstein's patchwork** of programming languages. I acknowledge that it might be a little bit of a tough sell to have to understand both Scala and Clojure in order to wrap your head around a single application. Totally unnecesary, too.

So I rewrote the server side using Clojure. That already works nice, this time making use of Websockets instead of Server-Sent events.

Chunks of previous tweeets were all loaded into the client and processed there. While that kept the server load fairly low, it also meant that the user experience would degrade substantially when the available network connection between client and server was any less than ideal. All along I had been wanting to process the historic tweets on the server side and then only do incremental updates on the client side, but that seemed very tedious when different languages on the client and on the server were involved. I decidedly did not want to test and write more or less the same code but in different languages.

Now with Clojure and ClojureScript being so similar, my idea was to use a part of the code base on both sides and split the computation. Then, the amount of data having to traverse the potentially slow network connection would be much, leading to a better user experience. 


A new article on that application will follow soon, the code is out on Github now already.

## Web Components / Polymer / X-Tag resources
I already mentioned last week that I find some of the ideas behind **[Web Components](http://webcomponents.org)** brilliant, in particular **Shadow DOM** and **Custom Elements**. Now that I am learning these concepts anyway, I thought I might as well share useful resources I have found so I created a **[list over on GitHub](https://github.com/matthiasn/WebComponents-Polymer-Resources)**. Check it out and please add your links as well. I expect this list to grow a lot in the next couple of weeks.

## Upstart scripts for Play 
I am running the live instances of my **[Play](http://playframework)** applications (BirdWatch, sse-chat, amzn-geo-lookup) on an Ubuntu server. There are hardly any disruptions, like once every few months, but when there are, so far I had to restart the applications manually. Not terrible but not great either. So how could that be done better? **[Upstart](http://upstart.ubuntu.com)** provides an answer. Let us create scripts so that we can start and stop applications as a service (and have them start automatically when the system reboots).

Then 

I particularly found **[this blog post](http://www.agileand.me/blog/posts/play-2-2-x-upstart-init-script)** by **[Adam Evans](https://twitter.com/ajevans85)** useful.


https://www.playframework.com/documentation/2.2.x/ProductionDist
http://upstart.ubuntu.com/cookbook/
http://upstart.ubuntu.com/getting-started.html



Et voilà, after a restart of the server, all services come up as expected. Much nicer.

## Conclusion
Last week was fairly productive, I got some really cool stuff done that had been on my mind for a while. I hope to continue this flow in the week that just started. I'll let you know next week. **[Cliffhanger](http://en.wikipedia.org/wiki/Cliffhanger): I recently increased the **[Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=http%3A%2F%2Fmatthiasnehlsen.com&tab=desktop)** score of this blog by a lot, from **58/100 to 83/100 for mobile** and from **77/100 to 84/100 for desktop**. It also feels like it is loading a lot faster. Next week I'll let you know what I did.

Have a great week,
Matthias