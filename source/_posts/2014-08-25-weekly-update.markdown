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

We will have **content** available for **preview** soon. On my end, I will **publish** an article about **setting up the environment for AngularJS** with a **build system consisting of Grunt, Bower, Karma and Protractor**. Last week I have also given a talk on the subject at the **[Hamburg AngularJS meetup](http://www.meetup.com/Hamburg-AngularJS-Meetup/events/196972082/)**. Or rather a live coding session in which we coded up an application that is **tested in Chrome, Firefox, PhantomJS and also in Mobile Safari**. **Android** is still **missing** due to some difficulties but should be added soon. Two interesting questions came up during the meetup: **a)** how do you test swipe gestures? **b)** when selecting elements to click by **id**, would **[protractor](https://github.com/angular/protractor)** catch errors when an element is visible but below something else and thus not clickable? Tests should also be added for these cases. The project that this article will be based upon is already available on **[GitHub](https://github.com/matthiasn/angular-grunt-protractor-starter)**. You may find it to be a good starting point for an **AngularJS** application that includes a **test** and **build** system. Besides the planned article I also want to do a **screencast** on the subject. Stay tuned. By the way, **you** could help with testing the application on Android or adding the additional test cases.

## Tweet stream analysis with Clojure and ClojureScript/Om
I recently **[rewrote](http://matthiasnehlsen.com/blog/2014/07/24/birdwatch-cljs-om/)** the client side of my **[BirdWatch](https://github.com/matthiasn/birdwatch)** application using **[ClojureScript](https://github.com/clojure/clojurescript)** and **[Om](https://github.com/swannodette/om)**. While I enjoyed the process, I also noticed some issues with performance when trying to keep the application responsive while **ingesting and transforming** thousands of previous tweets as quickly as possible. While optimizations certainly could have been done on the client side alone, this was a good reminder that the architecture of the information flow was **far from ideal**. The previous version was also a bit of a **Frankenstein's patchwork** of programming languages. I acknowledge that it might be a little bit of a **tough sell** to have to understand both **[Scala](http://www.scala-lang.org)** and **[Clojure](http://clojure.org)** in order to wrap your head around a single application. Totally unnecessary, too.

So I rewrote the server side using **Clojure**. That already works nicely, this time making use of **[WebSockets](http://en.wikipedia.org/wiki/WebSocket)** instead of **[Server-Sent Events](http://en.wikipedia.org/wiki/Server-sent_events)**. Turns out **WebSockets** are a nice fit conceptually for **[CSP-style channels](http://en.wikipedia.org/wiki/Communicating_sequential_processes)**.

A couple of things still need to be solved. In order to fully achieve the previous functionality, there needs to be an **auto-reconnect** when the connection to the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** is lost. That should be really simple, given what is there already. Also, **matching** new tweets with the clients' queries using **ElasticSearch**'s **[Percolator](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-percolate.html)** and only delivering a **filtered stream** needs to be implemented. This one is slightly more involved, but also totally seems doable.

Above and beyond, it seems useful to **partially perform** the computation (ranking by retweets, word counts) **on the server** in order to **reduce load** on the client. With **Clojure** and **ClojureScript** being so similar, my idea is to use a part of the code base on both sides and split the computation. Then, the amount of data having to traverse the potentially slow network connection would be reduced drastically, leading to faster loading and a more **mobile-friendly** memory footprint of the client.

A new article on this application rewrite will follow soon. The work in progress code is on **[Github](https://github.com/matthiasn/BirdWatch/tree/2014-08-25-Clojure-Server)** already, currently in a separate branch.

## Web Components / Polymer / X-Tag resources
I already mentioned last week that I find some of the ideas behind **[Web Components](http://webcomponents.org)** **brilliant**, in particular **Shadow DOM** and **Custom Elements**. Now that I am learning these concepts anyway, I thought I might as well **share useful resources** I find, so I created a **[list over on GitHub](https://github.com/matthiasn/WebComponents-Polymer-Resources)**. Check it out and **please add your links** as well. I expect this list to grow substantially in the next couple of weeks.

## Upstart scripts for Play 
I am running **live instances** of my **[Play](http://playframework)** applications (BirdWatch, sse-chat, amzn-geo-lookup) on an **[Ubuntu](http://www.ubuntu.com)** server. There are **hardly any disruptions**, like once every few months, but when there were, so far I had to restart the applications **manually**. Not terrible when all is running smoothly but not great either. So how could that be done better? **[Upstart](http://upstart.ubuntu.com)** provides the answer. After some googling I found **[this blog post](http://www.agileand.me/blog/posts/play-2-2-x-upstart-init-script)** by **[Adam Evans](https://twitter.com/ajevans85)**. I have only slightly modified it and now I have all of my applications running as services that I can **start** and **stop** the way one would expect, e.g.:

    # status birdwatch
    birdwatch start/running, process 947
    # stop birdwatch
    birdwatch stop/waiting
    # start birdwatch
    birdwatch start/running, process 30453

Also, the services **start automatically** after a system reboot.

So what needed to be done? First of all, we need a standalone instance of the applications using the **[dist](https://www.playframework.com/documentation/2.2.x/ProductionDist)** command, e.g.;

    # play dist
    [info] Loading project definition from /home/bw/BirdWatch/project
    [info] Set current project to BirdWatch (in build file:/home/bw/BirdWatch/)
    [info] Wrote /home/bw/BirdWatch/target/scala-2.10/birdwatch_2.10-0.3.0.pom
    [info] 
    [info] Your package is ready in /home/bw/BirdWatch/target/universal/birdwatch-0.3.0.zip

We can unpack the zip file where we choose and then simply adapt the script from the blog post mentioned above, in this case:

    description "Upstart script for https://github.com/matthiasn/Birdwatch, modified from http://www.agileand.me/blog/posts/play-2-2-x-upstart-init-script"

    env USER=bw
    env GROUP=www
    env APP_HOME=/home/bw/apps/birdwatch-0.3.0
    env APP_NAME=birdwatch
    env PORT=9000
    env BIND_ADDRESS=0.0.0.0
    env EXTRA=""

    start on (filesystem and net-device-up IFACE=lo)
    stop on runlevel [!2345]

    respawn
    respawn limit 30 10
    umask 022
    expect daemon

    pre-start script
        #If improper shutdown and the PID file is left on disk delete it so we can start again

        if [ -f $APP_HOME/RUNNING_PID ] && ! ps -p `cat $APP_HOME/RUNNING_PID` > /dev/null ; then
            rm $HOME/RUNNING_PID ;
        fi
    end script

    exec start-stop-daemon --pidfile ${APP_HOME}/RUNNING_PID --chdir ${APP_HOME} --chuid $USER:$GROUP --exec ${APP_HOME}/bin/$APP_NAME --background --start -- -Dhttp.port=$PORT -Dhttp.address=$BIND_ADDRESS $EXTRA

Et voilà, after a restart of the server, all services come up as expected. Much nicer. The script is also on **[GitHub](https://github.com/matthiasn/BirdWatch/blob/797c9b27eeb018138e90f95ad3df8774b4fbd6e5/conf/upstart/birdwatch.conf)**. For more information, also check out the **[upstart cookbok](http://upstart.ubuntu.com/cookbook/)** and the **[getting started guide](http://upstart.ubuntu.com/getting-started.html)**.

## Conclusion
Last week was fairly **productive**, I got some really cool stuff done that had been on my mind for a while. I hope to continue this flow in the week that just started. I'll let you know next week. **[Cliffhanger](http://en.wikipedia.org/wiki/Cliffhanger)**: I recently increased the **[Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=http%3A%2F%2Fmatthiasnehlsen.com&tab=desktop)** score of this blog by a lot, from **58/100 to 83/100 for mobile** and from **77/100 to 90/100 for desktop**.

{% img left /images/pagespeed.png 'pagespeed results'%}

It also feels like the pages are loading a lot faster. **Next week** I'll let you know what I did. Would you like to get notified when the next article is out? How about you <a href="http://eepurl.com/y0HWv" target="_blank"><strong>sign up for the mailing list</strong></a>.

Have a great week,
Matthias