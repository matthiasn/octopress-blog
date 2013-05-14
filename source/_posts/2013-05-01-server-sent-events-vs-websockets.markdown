---
layout: post
title: "Server Sent Events vs. WebSockets"
date: 2013-05-01 14:59
comments: true
categories: 
---
So far I have been using a **[WebSocket](http://tools.ietf.org/html/rfc6455)** connection to push data to the client in the **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application, with mixed feelings. **[WebSocket](http://tools.ietf.org/html/rfc6455)** communication is a separate communication protocol from **[HTTP](http://tools.ietf.org/html/rfc2616)**, introducing new problems in the network layer, as I should soon find out. But there is an alternative: **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**. 
<!-- more -->

For **[BirdWatch](https://github.com/matthiasn/BirdWatch)**, I wanted to experiment with having a proxy between the outside world and the Play application:

* **Security**: the application is not directly exposed to outside world, authentication and encryption could be done at proxy layer
* **Caching**: Play is designed for dynamic content, I'd rather let a proxy handle and cache static files 
* **Load-Balancing**: the proxy can distribute load among many instances of Play, also providing failover automatically

My choice for the proxy was **[Nginx](http://nginx.org/en/)**, which as I should soon learn does not support WebSocket proxying in the current stable release. Supposedly newer **[development versions](http://nginx.org/en/docs/http/websocket.html)** would support it, so I compiled the latest version from source and installed Nginx on my Ubuntu server. It did work when accessing the remote server from my devices, but for some reason whenever I asked other people to try the link I sent them, their WebSocket connection did not establish. I tried to find the problem for a short while but soon realized that I was more interested in developing my own application than in debugging my attempt at a WebSocket proxy configuration in a beta version of **[Nginx](http://nginx.org/en/)**.

Why did I want to use WebSockets in the first place? The protocol promises fast, bi-directional communication between client and server. Looking at my application, that is not exactly the requirement though. I need the fastest possible way of delivering lots of **[JSON](https://tools.ietf.org/html/rfc4627)** data from the server to the client. The opposite is not true though. In the other direction, there will only be occasional control messages, nothing that could not be handled by **[REST](http://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)** style web service calls. REST web service calls are actually much nicer semantically for interacting with the application, as there is a rich set of **[HTTP verbs / methods](http://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol)** with meaning (**GET**, **PUT**, **POST**, **DELETE**) and also a rich set of **[status codes](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)** (e.g. **200**, **401**, **404**, hopefully not **500**). With WebSockets, I would have to start from scratch with control messages from client to server and parse every single thing from **[JSON](https://tools.ietf.org/html/rfc4627)**. 

This realization, together with the frustration from my **[Nginx](http://nginx.org/en/)** experience with the **[WebSocket](http://tools.ietf.org/html/rfc6455)** protocol, made me reconsider **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**. These are transmitted over a plain **[HTTP](http://tools.ietf.org/html/rfc2616)** connection, which should just work with Nginx or any other proxy out there. Let's find out.

The changes I needed to make are surprisingly simple:

{% codeblock Enumerating new Tweets into WebSocket connection lang:scala https://github.com/matthiasn/BirdWatch/blob/466cce67a38265e311970466b3bf5529fda54f12/app/controllers/Twitter.scalaTwitter.scala %}
/** Serves WebSocket connection updating the UI */
def tweetFeed = WebSocket.using[String] {
  implicit request =>
    /** Creates enumerator and channel for Strings through Concurrent factory object
     * for pushing data through the WebSocket */
    val (out, wsOutChannel) = Concurrent.broadcast[String]

    [...]

    (in, out) // in and out channels for WebSocket connection
  }
{% endcodeblock %}

becomes:

{% codeblock Enumerating new Tweets into HTTP connection lang:scala https://github.com/matthiasn/BirdWatch/blob/b193b18749b8c3bc2c7c6f78acfdb6e7adb24cc9/app/controllers/Twitter.scala Twitter.scala %}
/** Serves Server Sent Events over HTTP connection */
def tweetFeed() = Action {
  implicit req => {
    /** Creates enumerator and channel for Strings through Concurrent factory object
     * for pushing data through the WebSocket */
    val (out, wsOutChannel) = Concurrent.broadcast[JsValue]

    [...]

    Ok.feed(out &> EventSource()).as("text/event-stream")
    }
  }
{% endcodeblock %}

Before, any Tweet coming through the wsOutChannel would be enumerated into the WebSocket by returning the (in: Iteratee, out: Enumerator) whereas now we need to attach the **out** Enumerator to the Ok result feed. That is all on the server side.

The changes on the client side are just as simple:

{% codeblock WebSocket Event Handling lang:javascript https://github.com/matthiasn/BirdWatch/blob/466cce67a38265e311970466b3bf5529fda54f12/app/views/twitter/tweets.scala.html %}
  var ws = new WebSocket("@routes.Twitter.tweetFeed().webSocketURL()");
  ws.onMessage = handler
{% endcodeblock %}

becomes:

{% codeblock EventSource Event Handling lang:javascript https://github.com/matthiasn/BirdWatch/blob/ac4d9488c46aeb96e6f01e09c13fcb4598e11039/app/views/twitter/tweets.scala.html Twitter.scala %}
  var feed = new EventSource('/tweetFeed');
  feed.addEventListener('message', handler, false);
{% endcodeblock %}

I expected the SSE solution to on par with the previous WebSocket solution in terms of performance. Interestingly though, with nothing else changed, SSE is a little or a lot faster, depending on the browser. For pre-loading of 500 Tweets on loading the **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** page in the browser, it took on average:

* Safari: **7 seconds** using SSE and **16 seconds** using WebSockets
* Chrome: **5 seconds** using SSE and **8 seconds** using WebSockets
* Firefox: **6 seconds** using SSE and **8 seconds** using WebSockets

Server Sent Events win 3:0. The better performance is noticable in all browsers, especially in Safari though, which seems to have a less-than-ideal WebSocket implementation.

This was actually super simple to implement, it took much longer to write this blog post than to implement a working solution using Server Sent Events. **[Play Framework](http://www.playframework.com)** really does make me much more productive. 

With these changes implemented, a simple **[Nginx](http://nginx.org/en/)** configuration inspired by the **[Play documentation](http://www.playframework.com/documentation/2.1.1/HTTPServer)** works like a charm:

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

The messaging between client and server should get really interesting, I am looking forward to exploring this more as the project develops. Check back for an article on that (and other things).

-Matthias