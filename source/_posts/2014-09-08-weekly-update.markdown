---
layout: post
title: "Weekly Update: Making this blog load fast"
date: 2014-09-08 19:06
comments: true
categories: 
---
In this weekly update, I will discuss how I turned the load times for the blog you are reading right now **from terrible to pretty good**. In **[PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=matthiasnehlsen.com)** numbers: before **58/100** for mobile, **77/100** for desktop, after **94/100** for mobile, **96/100** for desktop. In colors: from **red and orange** to **green**. Okay, that doesn't mean anything so far. More concretely: on a bad mobile connection, the load time improved from **32 seconds** to a mere **5 seconds**. Now we're talking. You would not have waited 32 seconds, and neither would I have. Also, I have a status update on the **[Clojure](http://clojure.org/)** version of **[BirdWatch](https://github.com/matthiasn/Birdwatch)**.

<!-- more -->

## Making this page load fast, even on a pre-3G mobile connection
Some time ago I tried opening my blog on my smart phone and it took forever to load. I noticed that I did not even have a **3G** connection, but come on, I should be able to open the page even when only having an **[Edge](http://en.wikipedia.org/wiki/Enhanced_Data_Rates_for_GSM_Evolution)** connection with decent signal strength at your disposal. I ran Google's **[PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=matthiasnehlsen.com)** and that confirmed that things weren't ideal:

{% img left /images/pagespeed_before.png 'pagespeed results before optimization' 'pagespeed results before optimization'%}

**Red** for mobile. That's exactly how I would describe the previous experience. Now, after a couple of simple changes, here is how things look now:

{% img left /images/pagespeed_after.png 'pagespeed results after optimization' 'pagespeed results after optimization'%}

Not only does that look better, it also makes all the difference in terms of the user experience. I have done a test with a friend on his friend's smart phone. On there, there page had never been loaded before, so nothing was cached. We switched off the Wifi connection and disabled 3G so all that was left was four bars of an **Edge** connection. Initially, we loaded the new version and that took a mere **5 seconds** until the page was visible and properly styled except for the right web font. His reaction was, wow, that was fast, considering we we on a slow network. Next, we opened the old version prior to all optimizations, and that took **32 seconds** now. 

### Inlining the CSS
One of the complaints that PageSpeed Insights had was that the **above-the-fold CSS** was in a separate file. Above-the-fold is the portion of the page that needs to be fully loaded before any rendering can happen. You want this above-the-fold portion to load as fast as possible because any delay here will the visitor see a blank page for too long, which of course means that most people are leaving rather than staring at a blank page for ten seconds or longer. Funny enough, I think I read somewhere that people are even more impatient on mobile devices, despite the slower network connection. And it makes sense. On the desktop, I typically have twenty or more tabs open anyway. If something doesn't load immediately, my attention will move to another application like mail or another tab. Good for a page if I move over to mail, then at least I will see the page when I came back to the browser. Another tab is worse as I probably won't come back in a timely manner. But at least there's a chance. On mobile, though, once I'm gone, I'm typically gone and likely won't come back.

### Nginx instead of hosted page

Expiration

For the configuration of nginx's expiration settings, I used **[html5-boilerplate](https://github.com/h5bp/html5-boilerplate)**'s **[server-configs-nginx](https://github.com/h5bp/server-configs-nginx/blob/master/h5bp/location/expires.conf)** project as a template. The suggested settings in there worked well and I get no further complaints from **PageSpeed Insight** about caching of any resources that are under control of my **nginx** server. Obviously, there is little I can do about resources served from elsewhere. 

### Move webfonts out of above-the-fold content



## 

## Useful links
Here are some articles that I have found useful while making changes to this blog. Google has a few great resources available, for example on **[Optimizing CSS Delivery](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery)**, **[HTTP Caching](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching#invalidating-and-updating-cached-responses)**

## BirdWatch in Clojure, ClojureScript and Om
I have done a lot of refactoring of the new version of **[BirdWatch](https://github.com/matthiasn/Birdwatch)** this past week. The application starts getting into the shape I want. The made the interesting discovery that there really **aren't any performance issues** introduced by rewriting. The problem was really sitting in front of the screen. I was only accidentally calling the re-render of the WordCloud a few orders of magnitude more often than I should have. Considering that that is probably the most expensive operation in the entire client-side application, it is no wonder that the application was not responding in the way that I would have hoped. It is kind of amazing that it worked at all... I also did some preparations for moving the aggregation for previous tweets to the server. Specifically, the client side can now request missing tweets via WebSockets, and then render the full tweet once it is back. This isn't useful yet, but it will be later. Once server-side aggregation is in place, there will be no need any more to transmit the entirety of the analyzed tweets to the client, which will either reduce the memory fingerprint by a lot when analyzing the same number of tweets, or enabling a **much** higher number of tweets for the same memory utilization.

## My Clojure Resources list
During my work on the **Clojure** application I described above, I am constantly adding new 
links to this **[list on GitHub](https://github.com/matthiasn/Clojure-Resources)**. This week, I have again added articles I discovered and found useful. Maybe you find interesting stuff in there as well. Or you have a link, just let me know or, better yet, submit a **pull request** with the link and a short description.

## Conclusion


Have a great remaining week,
Matthias