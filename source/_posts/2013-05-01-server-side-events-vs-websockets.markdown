---
layout: post
title: "Server Sent Events vs. WebSockets"
date: 2013-05-01 14:59
comments: true
categories: 
---
So far I have been using a **[WebSocket](http://tools.ietf.org/html/rfc6455)** connection to push data to the client in the **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application, with mixed feelings. WebSocket communication is a separate communication protocol from **[HTTP](http://tools.ietf.org/html/rfc2616)**, introducing new problems in the network layer, as I should soon find out. But there is an alternative: **[Server Sent Events](http://dev.w3.org/html5/eventsource/)**.

<!-- more -->

For BirdWatch, I wanted to have a proxy in between the outside world and the Play application, mostly because I think it is a cleaner design that would scale better, just in case, but also just because I simply wanted to try it out. 

My somewhat arbitrary choice for this was **[Nginx](http://nginx.org/en/)**, which as I should soon learn does not support WebSocket proxying in the current stable release. Supposedly newer **[development versions](http://nginx.org/en/docs/http/websocket.html)** would support it, so I downloaded the source, compiled Nginx and set it up on my Ubuntu server. It did work for me, but whenever I asked other people to try the link I sent them, their WebSocket connection did not establish. I tried to find the problem for a short while but soon realized that I was more interested in developing my own application than in debugging my attempt at a WebSocket proxying configuration in Nginx.

Why did I want to use WebSockets in the first place? The protocol promises a fast, bi-directional communication between client and server. Looking at my application, that is not exactly the requirement though. I need the fastest possible way of delivering lots of **[JSON](https://tools.ietf.org/html/rfc4627)** data from the server to the client. The opposite is not true though. In the other direction, there will at most be only occasional control messages, nothing that could not be handled by **[REST](http://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)** style web service calls.

This realization, together with the frustration from my Nginx experience with the WebSocket protocol, made me reconsider Server Sent Events.  

Unlike WebSockets, Server Sent Events are transmitted over plain HTTP connections, which works immediately with the Nginx proxy:

{% codeblock lang:text nginx.conf %}
user www-data;
worker_processes 4;
pid /var/run/nginx.pid;

events {
  worker_connections 768;
}

http {
  proxy_buffering    off;
  proxy_set_header   X-Real-IP $remote_addr;
  proxy_set_header   X-Scheme $scheme;
  proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header   Host $http_host;

  upstream my-backend {
    server 127.0.0.1:9000;
  }

  server {
    listen               80;
    keepalive_timeout    70;
    server_name birdwatch.matthiasnehlsen.com;
    location / {
      proxy_pass  http://my-backend;
    }
  }
}
{% endcodeblock %}

Th
