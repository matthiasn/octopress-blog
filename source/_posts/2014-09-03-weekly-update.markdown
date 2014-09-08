---
layout: post
title: "Weekly Update: Pomodoro, all-Clojure BirdWatch, Income"
date: 2014-09-03 19:06
comments: true
categories: 
---
In this weekly update, I will be talking about **why I started this blog** in the first place, **Pomodoro time management**, and the new **Clojure** and **ClojureScript** version of my **[BirdWatch](https://github.com/matthiasn/Birdwatch)** application. Again there is a live version, this time subscribing to all tweets containing the term **Ferguson**. Also, the results are out for the first month of **blog monetization** through **affiliate links**.

<!-- more -->

## Why I started this blog in the first place
Initially, when I started this blog, I wanted to explore real-time information processing. My initial project was the **[BirdWatch](https://github.com/matthiasn/Birdwatch)** application which has evolved quite a bit since the first version came out. But then, for a while, I focused more on frameworks and libraries than on the underlying architectural principles. That was probably also due to the fact that I was not convinced I really had the right tools in my toolbox. Well, that has changed. It is a luxury to use (roughly) the same language on both the server and the client, in particular if as a single developer you want to quickly explore an idea end-to-end.

## Pomodoro time management
For a while now I have been using the **[Pomodoro](http://pomodorotechnique.com)** time management technique and it has served me **extremely well**. The main idea is to set a timer (such as the tomato-shaped kitchen timers) to a predefined time interval and then fully focus on a single task with no distractions allowed whatsoever. The default time interval is **25 minutes** and while it is possible to adapt this to suit your needs, I have found the 25 minutes to be perfect for mine. Then you take a 5-minute break after every interval or a 15-minute break after the successful completion of four of these Pomodoro intervals. I find that I am much **more productive** when I use this technique. 

It is also a great help if you tend to **procrastinate**. It is usually a good idea to start with just one of these 25-minute intervals per day for so-and-so many days. The reason why I mention it is that in the next section, I will talk about an experiment I made to find out if it was possible to implement an entire real-time feature (both on the client and the server side) of the BirdWatch application within one of these 25-minute intervals and the answer is yes. I finished 76 seconds earlier than the allotted time.

## BirdWatch in Clojure and ClojureScript, #Ferguson
In the last two weeks, I finally got around to rewriting the **[BirdWatch](https://github.com/matthiasn/Birdwatch/tree/master/Clojure-Websockets)** application so that it now uses **Clojure** on the server side and **ClojureScript** on the client side. During that process, I also changed the implementation of the bi-directional communication from using **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)** + **REST API calls** to using **[WebSockets](http://en.wikipedia.org/wiki/WebSocket)**. Since **[last week's update](http://matthiasnehlsen.com/blog/2014/08/25/weekly-update/)** I have been able to tackle the remaining issues and today I proudly present the fully functional **[all-Clojure version](https://github.com/matthiasn/Birdwatch/tree/master/Clojure-Websockets)**. 

Of course, there is also a live version running on my server. This time I did not use the selection of software related terms that I used previously, but instead let my application subscribe to the term **Ferguson**. This is because I was particularly interested in how the situation in **[Ferguson, Missouri](http://en.wikipedia.org/wiki/Ferguson,_Missouri)** was (and is) developing. So what you see when you click the image below is an application that retrieves all tweets mentioning the term. This has been a highly educational topic to follow during the process of writing this new version of the application. I am **deeply disturbed** by how much of a difference the color of your skin seems to make when it comes to how government authorities deal with you as a human being. More broadly, I am also very concerned about **militarization** of police forces in the USA and elsewhere in the world.

Click the image or alternatively **[click here](http://birdwatch2.matthiasnehlsen.com/)** to open a live version of this application.

<a href="http://birdwatch2.matthiasnehlsen.com/" target="blank"><img class="left" src="/images/bw-ferguson.png" title="BirdWatch Screenshot for term Ferguson" alt="BirdWatch Screenshot for term Ferguson"></a>

In the Pomodoro time management section above, I mentioned a little experiment I carried out to determine how much I would be able to achieve in a single 25-minute Pomodoro time interval. Yesterday I had the idea that I wanted to know how many clients were connected to the live version of this application at any given time. Right after I had the idea, I asked myself if this was doable in a single Pomodoro interval. So I set the timer and started right away. All of my thoughts concerning this feature, the implementation on both client and server, the testing (on Chrome, Firefox, Safari, and Opera), and the code documentation and prettification were done and there were still 76 seconds left before my digital kitchen timer started ringing. Almost time to take a little nap. Here's how that looks like, see the upper right corner:

{% img left /images/bw-ferguson2.png 'Connection count feature' 'Connection count feature'%}

Every other second, all clients are notified about the number of current number of simultaneous connections. It is really useful to have a message bus for different message types between client and server. More on that in a future article.

Considering that I have just started out with Clojure and that this is my first real application written in it, I have a hunch that I may have found the tools that I have been looking for all the while. Sure, this was not a very large feature, but the fact alone that it was possible to implement it in such a short time on both server and client without significant context switches in the brain bodes well for productivity.

**What's next?** I will work on a series of articles describing the application architecture in detail. Also, I will put much more focus on a mobile version of the application. Currently, it does not work well on mobile devices. In order to alleviate performance issues, I will move a good part of the computation for previous tweets to the server side. The layout needs some major rework for mobile as well. I'll keep you posted.

## Affiliate links results for the first month
A couple of weeks ago I **[wrote](http://matthiasnehlsen.com/blog/2014/08/04/building-a-geo-aware-link-shortener-with-play-framework/)** about a tool for country-specific deliveries of Amazon affiliate links. The results for the first month are out now. I made a whopping **$44.37**. Hmm, I will try not to spend it all at once, I promise. But to be honest, I don't think the result is all that bad. Particularly if you consider that I have not written many reviews just yet. Eventually, it should be possible for the blog to finance itself, maybe even retroactively. I will try to write more quality reviews in the weeks to come. Then, by the time Santa climbs down the chimneys, there will hopefully be more clicks on those links and better conversion rates. What I have read about affiliate marketing is that people who do it successfully talk about how much of a difference the holiday season makes. We'll see.

## Gadget reviews
I still have not found the perfect travel lens for my **[Sony A7](http://matthiasnehlsen.com/reviews/sony-a7/)** camera. One contender was the **Zeiss Vario-Tessar T* FE 24-70mm f/4 ZA OSS**, but in the end I decided to send it back for a refund. **[Read all about it here](/reviews/zeiss-24-70)**.

## Conclusion
The last week was a lot of fun. I mostly focused on the **Clojure** and found that be be very rewarding. There is plenty of stuff I still want to do with this application and I am really looking forward to getting around to those features.

Last week’s cliffhanger was a section on speed improvements on this blog. Sorry, but you will have to wait a little longer for that story. I was so busy writing Clojure that I didn’t find the time to write it down. But no worries, the speed improvements will be covered soon.

Have a great remaining week,
Matthias