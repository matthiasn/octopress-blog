---
layout: post
title: "Weekly Update: Clojure and Dependency Injection, Animations reloaded & freeing my SSD"
date: 2014-09-23 19:06
comments: true
categories: 
---
This weekly update is mostly about my new article series, about using animations to explain complex topics and about how I just extended the useful lifespan of my **2012 Retina MacBook**.

<!-- more -->

## New article series: building systems in Clojure
I am finally all set to start my new series of articles about the rewrite of my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application in **[Clojure](http://clojure.org)**. I actually have two aims. First of all, I want short articles that are a quick and informative read, with easy-to-understand code. In addition, I want to illustrate what is going on by using **animations** (more about that in the next section). In this first installment, I will introduce you to my approach towards **[dependency injection](http://en.wikipedia.org/wiki/Dependency_injection)**. I personally believe that dependency injection is crucial for building larger applications as it allows proper decoupling between components. More about that in **[article one of the series](/blog/2014/09/24/Building-Systems-in-Clojure-1/)**.

## Animations reloaded
Last year, I used an animation for the first time to illustrate the flow of information within an application. Here is how that looked like:

{% img left /images/bw_expl_anim.gif 'birdwatch animated information flow' 'birdwatch animated information flow'%}

I still think that animated illustration is a great way of showing what is going in the application. Here's a link to the **[full article](/blog/2013/09/10/birdwatch-explained/)** if you want to see for yourself. However, there is one catch to that animation and that's the amount of time it took to produce it. The tool chain for this animation was as follows:

* Drawing in **[OmniGraffle](https://www.omnigroup.com/omnigraffle)**
* Exporting **[PNG](http://en.wikipedia.org/wiki/Portable_Network_Graphics)**s
* Animating the PNGs in **[Adobe After Effects](http://www.adobe.com/products/aftereffects.html)**
* Exporting the finished animation as uncompressed **[Quicktime](http://en.wikipedia.org/wiki/QuickTime)** file
* Importing the Quicktime file into **[Adobe Photoshop](http://www.adobe.com/products/photoshop.html)**
* Exporting an animated **[GIF](http://en.wikipedia.org/wiki/Graphics_Interchange_Format)** from Photoshop

All these tools are insanely powerful, however the feedback loop was not as quick as I desired because by the time I had the animated GIF and noticed that I wanted to tweak something, I had to go all the way back to **After Effects**. That was **tedious**.

Now I have a different approach: I animate an **[SVG](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics)** drawing by using the **[Greensock library](https://greensock.com/)**. The feedback loop is much shorter now as you can adjust a value in the JavaScript code and reload. Then inspect, reiterate and so on until you are done. Much more agreeable. If there is enough interest, I will write about this approach later. For now, it is just a **very welcome addition** to my toolbox; one which I intend to explore further in the next couple of articles before I may decide to write about it. Here's how an animation using this new approach looks like. Note that unlike when working with an animated GIF, we can make drawings truly **interactive**:

<script language="javascript" type="text/javascript">
  function resizeIframe(obj) {
    obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
    obj.style.width = obj.contentWindow.document.body.scrollWidth + 'px';
  }
</script>

<iframe width="100%;" src="/iframes/bw-anim/index.html" scrolling="no" onload="javascript:resizeIframe(this);" ></iframe>

## Freeing my SSD
The computer I do all my work on is a **2012 Retina MacBook with 16GB RAM and 512GB SSD**. In terms of performance, I have no reason at all to upgrade this machine before the extended warranty is up. after all, the currently available MacBooks are only a few percent faster than the one I already own. The only real complaint I have is that the drive space is not large enough, in part because of all the virtual machines that I like to have with me. Of course, that would have been a good excuse to buy a new Retina MacBook, but I try to use gadgets longer these days because that is just more **sustainable**. Think about all the **[rare earth minerals](http://en.wikipedia.org/wiki/Rare_earth_mineral)** that are needed to build a laptop or smart phone, for example.

The other day, in order to alleviate the imminent shortage of disk space, I moved my 90GB iTunes library onto a **128GB Transcend JetDrive Lite 350** which fits exactly into the SD slot without protruding. Then, I just pointed to that new location by creating a symbolic link. You can **[read more in the reviews section](/reviews/transcend-jetdrive-lite-350)**. Now, I can go a while longer without constantly facing the threat of a full disk and I won't have to buy a new laptop before Apple comes up with some truly remarkable update for the MacBook line.

## Closing remarks
Most importantly, check out the new **[article series](/blog/2014/09/24/Building-Systems-in-Clojure-1/)** that I just started. I hope you will find it useful and I am looking forward to your feedback. In addition, there have been plenty of new entries to my **[Clojure-Resources](https://github.com/matthiasn/Clojure-Resources)** repository on GitHub. You may want to check that out if you're interested in Clojure at all. Finally, I bought a useful gadget that makes my digital life a little better.

Until next week,
Matthias