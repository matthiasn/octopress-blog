---
layout: post
title: "Weekly Update: git vs brain fart, Octopress, Sony A7, my audio setup"
date: 2014-08-17 22:06
comments: true
categories: 
---
In this weekly update, I am talking about Clojure and ClojureScript, performance optimizations on this blog and an upcoming article on Angular, Grunt, Karma and Pratractor. among other stuff.

<!-- more -->

## AngularJS book available fro pre-order on Amazon, Meetup
I am excited that the book Amit Gharat and I wrote about AngularUI (and AngularJS more generally) is now available for pre-order on Amazon. Interesting to see it being listed while still working on the final stages. We will have content available for preview soon. On my end, I will publish an article about setting up the environment for AngularJS with a build system consisting of Grunt, Bower, Karma and Protractor. This week I have also given a talk on the subejct at the Hamburg AngularJS meetup.

## Tweet stream analysis with Clojure and ClojureScript
I recently rewrote the client side of my BirdWatch application using ClojureScript. While I enjoyed the process, I also noticed some issues with performance when trying to keep the application response while transforming previous tweets as quickly as possible. While optimizations certainly could have done on the client side alone, this was a good reminder that the architecture of the information flow was far from ideal. Chunks of previous tweeets were all loaded into the client and processed there. While that kept the server load fairly low, it also meant that the user experience would degrade substantially when the available network connection between client and server was any less than ideal. All along I had been wanting to process the historic tweets on the server side and then only do incremental updates on the client side, but that seemed very tedious when different languages on the client and on the server were involved. But with Clojure and ClojureScript being so similar, my idea use a part of the code base on both sides and split the computation. Then, the amount of data having to traverse the potentially slow network connection would be much, leading to a better user experience. Let's see how that turned out.

## Web Components / Polymer / X-Tag resources
I already mentioned last week that I find the ideas behind Web Components brilliant, in particular **Shadow DOM** and **Custom Elements**. Now that I am learning these concepts anyway, I thought I might as well share useful resources I have found in a list over on GitHub. Check it out and please add your links as well.

## Upstart scripts for Play 
I am running the live instances of my Play applications (BirdWatch, sse-chat, amzn-geo-lookup) on an Ubuntu server. There are hardly any disruptions, like once every few months, but when there are, so far I had to restart the applications manually. Not terrible but not great either. So how could that be done better? **[Upstart](http://upstart.ubuntu.com)** provides an answer. Let us create scripts so that we can start and stop applications as a service (and have them start automatically when the system boots).

http://www.agileand.me/blog/posts/play-2-2-x-upstart-init-script
https://www.playframework.com/documentation/2.2.x/ProductionDist
http://upstart.ubuntu.com/cookbook/
http://upstart.ubuntu.com/getting-started.html

Et voilà, after a restart of the server, all services come up as expected. Much nicer.


Have a great week,
Matthias