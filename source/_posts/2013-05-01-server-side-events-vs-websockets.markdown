---
layout: post
title: "Server Side Events vs. WebSockets"
date: 2013-05-01 14:59
comments: true
categories: 
---
So far I have been using a WebSocket connection to push data to the client in the BirdWatch application, with mixed feelings about this architectural choice. WebSocket communication is a separate communication protocol from HTTP, introducing new problems in the network layer, as I should soon find out. But there is an alternative: Server Side Events.

<!-- more -->

For BirdWatch, I wanted to have a proxy in between the outside world and the Play application, mostly because I think it is a cleaner design that would scale better, just in case, but also just because I simply wanted to try it out. 

My somewhat arbitrary choice for this was Nginx, which as I should soon learn does not support WebSocket proxying in the current stable release. Supposedly the latest development version would support it, so I downloaded the source, compiled it and set it up on my Ubuntu server. It did work for me, but whenever I asked other people to try a link, their WebSocket connection did not establish. I tried to find the problem for a short while but soon realized that I was more interested in developing my own application than in debugging my attempt at a WebSocket proxying configuration in Nginx.

Why did I want to use WebSockets in the first place? The protocol promises a fast, bi-directional communication between client and server. Looking at my application, that is not exactly the requirement though. I need the fastest possible way of delivering lots of JSON data from the server to the client. The opposite is not true though. In the other direction, there will at most be only occasional control messages, nothing that could not be handled by REST style web service calls.

This realization, together with the frustration from my Nginx experience with the WebSocket protocol, made me reconsider Server Side Events. 


Unlike WebSockets, SSEs are plain HTTP connections for the infr
