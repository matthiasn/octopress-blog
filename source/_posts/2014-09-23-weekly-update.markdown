---
layout: post
title: "Weekly Update: Clojure and Dependency Injection, Animations reloaded & freeing my SSD"
date: 2014-09-23 19:06
comments: true
categories: 
---
This weekly update is mostly about my new article series, about animations for explaining complex topics and about how I just extended the useful lifespan of my **2012 Retina Macbook**.

<!-- more -->

## New article series: building systems in Clojure
Finally, here is the beginning of my new series of articles about the rewrite of my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application in **[Clojure](http://clojure.org)**. There are really two aims. First of all, I want short articles that are a quick and informative read, with easy to understand code. In addition, I want to illustrate what is going on by using **animations** (more about that in the next section). In this first installment, I introduce you to my approach towards **[dependency injection](http://en.wikipedia.org/wiki/Dependency_injection)**. I personally believe that dependency injection is crucial for building larger applications as it allows proper decoupling between components. More about that in **[article one of the series](/blog/2014/09/24/Building-Systems-in-Clojure-1/)**.

## Animations reloaded
Last year, I first used an animation in an article in order to illustrate information flow within an application. Here is how that looked like:

{% img left /images/bw_expl_anim.gif 'birdwatch animated information flow' 'birdwatch animated information flow'%}

I still think that this animated illustration is a great way of showing what is going in the application. Here's a link to the **[full article](/blog/2013/09/10/birdwatch-explained/)** if you like to convince yourself. However, there is one catch with that animation and that was the amount of time it took to produce it. The tool chain for this animation was as follows:

* Drawing in **[OmniGraffle](https://www.omnigroup.com/omnigraffle)**
* Exporting **[PNG](http://en.wikipedia.org/wiki/Portable_Network_Graphics)**s
* Animating the PNGs in **[Adobe After Effects](http://www.adobe.com/products/aftereffects.html)**
* Exporting the finished animation as uncompressed **[Quicktime](http://en.wikipedia.org/wiki/QuickTime)** file
* Importing the Quicktime file into **[Adobe Photoshop](http://www.adobe.com/products/photoshop.html)**
* Exporting an animated **[GIF](http://en.wikipedia.org/wiki/Graphics_Interchange_Format)** from Photoshop

All these tools are insanely powerful, however the feedback loop was not quick as I desired because by the time I had the animated GIF and noticed I wanted to tweak something, I had to go all the way back back to **After Effects**. That was **tedious**.

Now I have a different approach and that is animating an **[SVG](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics)**s drawing directly using the **[Greensock library](https://greensock.com/)**. With this, the feedback loop is as tight as adjusting a value in JavaScript and reload. Inspect, reiterate and so on until done. Much more agreeable. If there is enough interest, I can write about this approach later. For now, this is just a **very welcome addition** to my toolbox, one which I intend to explore further over the next couple of articles before I would want to write about it. Here's how an animation using this new approach looks like. Notice that unlike with an animated GIF, we can make this truly **interactive**:

<script language="javascript" type="text/javascript">
  function resizeIframe(obj) {
    obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
    obj.style.width = obj.contentWindow.document.body.scrollWidth + 'px';
  }
</script>

<iframe width="100%;" src="/iframes/bw-anim/index.html" scrolling="no" onload="javascript:resizeIframe(this);" ></iframe>

## Freeing my SSD
The one computer I am doing all my work on is a **2012 Retina Macbook with 16GB RAM and 512GB SSD**. In terms of performance, I have no reason to upgrade this machine a single day before the extended warranty is up, considering the single digit percentages that the 2014 machines are faster. Only the drive space is not large enough, in part because of all the virtual machines that I like to have with me. Of course, that would have been a good excuse to buy a new Retina Macbook, but I try to use gadgets longer these days because that is just more **sustainable**. Think about all the **[rare earth minerals](http://en.wikipedia.org/wiki/Rare_earth_mineral)** that are needed to build a laptop or smart phone, for example.

The other day, in order to alleviate this pending shortage of disk space, I moved my 90GB iTunes library onto a **128GB Transcend JetDrive Lite 350** which fits exactly into the SD slot without protruding. Then, I just pointed to that new location by creating a symbolic link. You can **[read more in the reviews section](/reviews/transcend-jetdrive-lite-350)**. Now, I can go a while longer without constantly being close to a full disk so that I don't have to buy a new laptop.

## Closing remarks
Most importantly, please do check out the new **[article series](/blog/2014/09/24/Building-Systems-in-Clojure-1/)** that I just started. I hope you will find it useful and I am looking forward to your feedback. In addition, there have been plenty of new entries to my **[Clojure-Resources](https://github.com/matthiasn/Clojure-Resources)** repository on GitHub. You may want to check that out if you're interested in Clojure at all. Finally, I bought a useful gadget that makes my digital life a little better.

Until next week,
Matthias