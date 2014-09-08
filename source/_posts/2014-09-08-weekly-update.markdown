---
layout: post
title: "Weekly Update: a turbo for this blog & more Clojure"
date: 2014-09-08 19:06
comments: true
categories: 
---
In this weekly update, I will discuss how I turned the load times for this blog **from terrible to pretty good**. In **[PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=matthiasnehlsen.com)** numbers: before the optimization <strong style="color:#DD0000;">58/100</strong> for mobile, <strong style="color:#EE8800;">77/100</strong> for desktop, afterwards <strong style="color:#00AA66;">94/100</strong> for mobile, <strong style="color:#00AA66;">96/100</strong> for desktop. More concretely: on a bad mobile connection, the load time improved from **32 seconds** to a mere **5 seconds**. Now we're talking. You would likely **not have waited** for 32 seconds, and neither would I have. Also, I have a status update on the **[Clojure](http://clojure.org/)** version of **[BirdWatch](https://github.com/matthiasn/Birdwatch)**.

<!-- more -->

## Making this page load fast, even on a pre-3G mobile connection
Some time ago I attempted opening my blog on my smart phone and, to my dismay, it took like forever to load. I noticed that I did not have a **[3G](http://en.wikipedia.org/wiki/3G)** connection, but come on, you should be able to open the page even when only having an **[Edge](http://en.wikipedia.org/wiki/Enhanced_Data_Rates_for_GSM_Evolution)** connection with decent signal strength at your disposal. I was **sad**. Then I ran Google's **[PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=matthiasnehlsen.com)** and that tool confirmed that things weren't ideal:

{% img left /images/pagespeed_before.png 'pagespeed results before optimization' 'pagespeed results before optimization'%}

<strong style="color:#DD0000;">Red</strong> for mobile. That's exactly how I would describe the previous experience. Now, after a couple of simple changes, here is how things look **now**:

{% img left /images/pagespeed_after.png 'pagespeed results after optimization' 'pagespeed results after optimization'%}

Not only does that decisively look better, it also makes <strong style="color:#00AA66;">all the difference</strong> in terms of the user experience. I have done a tiny experiment with a friend on his smart phone. On there, the blog had never been loaded before, so certainly nothing was cached. We switched off the Wifi connection and disabled 3G so all that remained was four bars of an **Edge** connection. Initially, we loaded the new and optimized version and that took a mere **5 seconds** until the page was visible and properly styled except for the right web font. His reaction was, **wow, that was fast**, considering that we were on a really sluggish network connection. Next, we opened the old version prior to all optimizations, and that took a prohibitive **32 seconds**. Let's now have a look at what was necessary for this <strong style="color:#00AA66;">triumph</strong>.

### Inlining the CSS / above-the-fold content
One of the complaints that PageSpeed Insights uttered was that the **above-the-fold CSS** was in a separate file. **Above-the-fold** is the portion of the page that needs to be fully loaded before any rendering can happen. You want this above-the-fold portion to load as fast as possible because any delay here will keep the browser from rendering the page altogether, which of course means that most people are **leaving** rather than staring at a blank page for ten seconds or longer. 

Funny enough, I think I read somewhere that people tend to be even more impatient on mobile devices, despite the slower network connection. And it makes sense. On desktop, I typically have twenty or more tabs open anyway. If something doesn't load immediately, my attention will either move to another application like mail or another tab. Good for a page if I move over to checking email, then at least I will see the page when I came back to the browser. Another tab is worse as I probably won't come back in a timely manner or ever. But at least there's a chance. On mobile, though, once I'm gone, I'm typically gone for good. 

In order to not hold up page loading by fetching the ````screen.css```` and being penalized with an additional **[round trip](http://en.wikipedia.org/wiki/Round-trip_delay_time)**, I embedded the entire CSS in the header of each HTML file. While that incurred an extra **39KB**, in compressed files the difference was a mere **7KB**, which certainly loads faster than the extra round trip would take. This is particularly true on **pre-LTE** mobile which is notorious for long ping times. However, embedding CSS only works up to a certain size. While I don't know the threshold, there comes a certain size where PageSpeed Insights starts complaining. But I suppose I can consider myself lucky that this fell within the range that is deemed acceptable.

### Nginx instead of hosted page
Before, I was using a hosted web page where I had no real influence over how the files were served. Specifically, I had no control over **[HTTP compression](http://en.wikipedia.org/wiki/HTTP_compression)** settings, **[ETags](http://en.wikipedia.org/wiki/HTTP_ETag)** or **[HTTP caching](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching)**. In addition to that, it was also increasingly annoying to update the content because the only available method was an actual upload over good old **[FTP](http://en.wikipedia.org/wiki/File_Transfer_Protocol)**. When I got started with the blog, that was bearable, but with an increasing number of files, specifically images, that started to take a few minutes. What I really wanted instead was to use either **[rsync](http://en.wikipedia.org/wiki/Rsync)** or **[git](http://git-scm.com/)**. I had a server already (the one used for example for serving **BirdWatch**) with **[nginx](http://nginx.org)** running, so the first thing I did was move my blog over there and reconfigure the domain's **[DNS](http://en.wikipedia.org/wiki/Domain_Name_System)** settings. Here is the section of the **nginx.conf** that is responsible for serving the blog:

{% codeblock nginx config lang:text nginx.conf %}
user www-data;
worker_processes 4;
pid /var/run/nginx.pid;

events {
  worker_connections 15000;
}

http {
  include       mime.types;
  default_type  application/octet-stream;
  charset UTF-8;

  gzip_static on;
  gzip on;
  gzip_proxied any;
  gzip_types text/plain text/html text/css application/json application/javascri
pt application/xml application/xml+rss text/javascript;
  gzip_vary on;

  server {
    listen       80;
    server_name  www.matthiasnehlsen.com;
    return       301 http://matthiasnehlsen.com$request_uri;
  }

  server {
    listen       80;
    server_name  matthiasnehlsen.com;
    root /home/bw/octopress-blog/public;

    location / {
      autoindex on;
    }

    # Media: images, icons, video, audio, HTC
    location ~* \.(?:jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc)$
 {
      expires 1M;
      access_log off;
      add_header Cache-Control "public";
    }

    # CSS and Javascript
    location ~* \.(?:css|js)$ {
      expires 1y;
      access_log off;
      add_header Cache-Control "public";
    }
  }
}
{% endcodeblock %} 

I'm no expert in the subject of **nginx configuration**, but the above seems to be working well for what I am trying to do. If you are more knowledgeable and spot any nonsense in there, please let me know.

#### Expiration settings
For the configuration of nginx's expiration settings, I used **[html5-boilerplate](https://github.com/h5bp/html5-boilerplate)**'s **[server-configs-nginx](https://github.com/h5bp/server-configs-nginx/blob/master/h5bp/location/expires.conf)** project as a template. The suggested settings in there worked well and I get no further complaints from **PageSpeed Insight** about caching of any resources that are under control of my **nginx** server. Obviously, there is little I can do about resources served from elsewhere.

#### Gzipping the content
The configuration above enables both static content compression and on-the-fly compression. Under heavy load, static compression is preferable where nginx serves the gzip version of a file, should it exist with the same name but with an appended ````.gz````. If this file is not available, nginx instead compresses the content on-the-fly, resulting in a somewhat higher CPU utilization. I have gzipped some resources while others aren't. I have never really seen high CPU utilization from nginx, therefore for me at this point, high nginx load due to compression is a luxury problem for which I would probably need to increase the number of visitors by an order of magnitude or two. But when that happens, I will probably look into pre-compression of more of the files again.

### Move webfonts out of above-the-fold content



### 

### Useful links
Here are a handful articles that I have found useful while making changes to this blog. Google has a few great resources available, for example on **[Optimizing CSS Delivery](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery)**, **[HTTP Caching](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching#invalidating-and-updating-cached-responses)**

## BirdWatch in Clojure, ClojureScript and Om
I have done a lot of refactoring of the new version of **[BirdWatch](https://github.com/matthiasn/Birdwatch)** this past week. The application architecture still feels like clay in my hands, but the sculpture is getting into a decent shape. I made the interesting discovery that there really **weren't any performance issues** introduced by the **Clojure** rewrite. The problem was rather sitting in front of the screen. My initial version triggered a re-render of the word cloud **a few orders of magnitude more often** than what a reasonable and sane person would have done. 

Considering that the word cloud layout is probably the most expensive operation in the entire client-side application, it is no wonder that the application was not responding in the way that I would have hoped. It is kind of spectacular that it worked at all... 

I also did some preparations for moving the aggregation of previous tweets to the server. Specifically, the client side can now request missing tweets via **[WebSocket](http://en.wikipedia.org/wiki/WebSocket)** command messages, and then render the full tweet once it is back. This isn't terribly useful yet, but it will be at a later stage. Once **server-side aggregation** is in place, there will be no need any longer to transmit all thousands of the analyzed tweets to the client. This should either reduce the memory fingerprint by a lot when analyzing the same number of tweets, or enable a **much** higher number of tweets for the same memory utilization. It shall also reduce page load times, potentiatally by a lot. 

## My Clojure Resources list
During my work on the **Clojure** application I described above, I am constantly adding fresh 
links to this list of **[Clojure Resources on GitHub](https://github.com/matthiasn/Clojure-Resources)**. This week, I have once more added articles I discovered and found useful. Maybe you find interesting stuff in there as well. Or you have a link that you believe belongs in there. Just let me know or, better yet, submit a **pull request** with the link and a short comment.

## Conclusion
I still have the desire to redesign the blog. But at least the load times aren't terrible any longer so a redesign isn't quite as urgent. Then, coding in **Clojure** was exciting and productive last week, with like **35 commits** so far this month. Things are finally settling down, which means that I will soon be able to start with a series of articles about this application. In that regard, please let me know if you have any ideas for features that would make the application more useful for you. It is already great that this little toy application of mine has received so much love (if love can be counted in GitHub stars) and I appreciate that a lot but it would even be more awesome if the application solved an actual problem. I would **love to start a conversation** (or two or three) here.

Thanks and until next week,
Matthias