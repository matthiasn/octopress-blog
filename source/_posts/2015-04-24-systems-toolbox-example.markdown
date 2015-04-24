---
layout: post
title: "Systems Toolbox Example"
date: 2015-04-24 16:05
comments: true
categories: 
---
Today, I have another sample application for the **[systems-toolbox](https://github.com/matthiasn/systems-toolbox)** library for you. This application measures roundtrip times of a WebSockets connection. Before I delve into the reasoning behind this library, here's a little teaser of how that'll look like:

<a href="http://systems-toolbox.matthiasnehlsen.com" target="_blank"><img src="/images/sys-tb-tmp_local.gif" /></a>

I wrote all of this from scratch in Clojure and ClojureScript, including the histogram - no charting libraries required. There's a live version, try it out by clicking on the animated GIF.

<!-- more -->

## Systems Toolbox - Rationale

I started writing this library for two equally important reasons. First, I was beyond tired of writing boilerplate for every system I was building, so I wanted a simpler way of composing systems with as little coupling as possible (including UI). Second of all, I want and need better ways of **observing systems**.

Have you ever been in the situation where you came into a new team, asked what the system does and got the response that **it's all in the code**? I call **[bullpucky](http://www.urbandictionary.com/define.php?term=bullpucky)**. The behavior of a system lies in the running system, and I can ONLY figure it out by observing this very system in the wild. Everything else is speculation.

Imagine a somewhat similar situation. Let's say you're interested in a **[Porsche 911](http://en.wikipedia.org/wiki/Porsche_911)**. You are particularly curious how that thing behaves at high speed on the Autobahn. Also, you want to know what the rear of the car does when you push the gas pedal while coming out of a tight curve. So you go to the nearest Porsche dealership and ask the sales representative. And then that guy responds, "here are the blueprints from the engineering department, it's all in there". Good sales pitch? Not so much. But worse, it would not even remotely answer your questions. 

I'd much rather have the sales representative say, "Here are the keys, why don't you find out?". Taking that vehicle for a spin is observing a beautifully crafted system instead of studying a boring blueprint. Let's not **mistake the map for the territory**[^3]. 

I found that all the systems I had been working on previously lacked in this department. Observability was usually an ugly afterthought; something tugged on, and that often even had to be removed eventually. Think about all these log statements that are removed from the code later on. If there ever was value in observing data flowing through the system in a particular line of code, there will potentially be value in doing so again later on, in a system running in production. 

My initial approach was observing data structures as they flow through a system, for which I built the **[inspect](https://github.com/matthiasn/inspect)** library. But that didn't go far enough as it still required log-like statements. Why would I need those? 

Let's say a system consisted of subsystems that communicate with each other in defined ways. Then, a library for composing message flows could intercept each of those messages as desired without any additional line of code required. Also, timing of everything going on in the system could and should be a first-class citizen, without having to add some annoying log statements (and then remove those later on).

The question for me here was if it is possible to come up with a model for subsystems of an application that together form a larger system, which communicate with each other, and which are fully observable.

Here's a drawing of what I have in mind:

{% img left /images/system.png 'Subsystem' %}

There are two inputs and two outputs to each such subsystem. These are **[core.async channels](https://github.com/clojure/core.async)**. One input and one output work as expected whereas the other is for publishing snapshots of the state of the subsystem. This channel uses a sliding buffer, so only the latest version of the snapshot is ever kept for further processing, should the system still be busy with processing a previous version of such snapshot. Then there's another input for processing such state snapshots, e.g. when another component renders such state snapshot into a user interface.

These subsystems can then be composed into larger systems, as we shall see below. There's also more to be written about this library soon, but for now let's go back to the sample application.

## Back to the Example Application

The first application I completely rewrote so that it's using the systems-toolbox library both on client and server (in Clojure and ClojureScript) is my **[BirdWatch](https://github.com/matthiasn/BirdWatch)**  application. However, that one is slightly more complex than what I would want to handle inside a blog post. [^1]

So what does this new and simple sample do? I wanted to know how fast a WebSockets connection is. How long does it take to send a very short message to a server and return the message right away while only adding a key and not doing complicated processing? Sort of like a ping, only with a graphical representation. Then I thought, why not use two circles for that, where one is drawn immediately in the UI from local mouse move events and the other one from the returned message. The longer it takes to send a message to the server and back, the further the second circle will trail behind in the UI. An **animated GIF** shows this better than words:

<a href="http://systems-toolbox.matthiasnehlsen.com" target="_blank"><img src="/images/sys-tb-tmp_local_half.gif" /></a>

Above, we have a fast (local) connection where the majority of the network roundtrips take less than 40ms. Now, usually, I have difficulties imagining what 40ms mean in practice, but I think the two circles demonstrate that the second circle hardly trails behind at all. However, there is likely still room for improvement, considering that the fastest roundtrip in the sample of 455 roundtrips only took 3ms.

Now how can we make the data more useful for finding where the holdups happen? In this sample, we have **26ms mean**, **89ms maximum** and **3ms minimum**. What shall we compute next? Maybe a standard deviation? Think again. The standard deviation only makes sense when we have a Gaussian, bell-shaped normal distribution, and we don't know that from the sample, do we?

Let's have a look at the distribution of the sample. A **[histogram](http://en.wikipedia.org/wiki/Histogram)** seems like an appropriate visual representation of the distribution of values, so let's draw one [^2]:

<a href="http://systems-toolbox.matthiasnehlsen.com" target="_blank"><img src="/images/sys-tb-tmp_local.gif" /></a>

Today, I won't discuss how I built the histogram, other than it's an embedded SVG drawn from the current data, all written in ClojureScript. The animation of the chart is an emergent property, it results the underlying sample including additonal measurements. The number of bins in this histogram is determined by applying the **[Freedman–Diaconis rule](http://en.wikipedia.org/wiki/Freedman–Diaconis_rule)**:

Bin size = 2 IQR(x) n^-1/3 where IQR(x) is the interquartile range of the data, and n is the number of observations in the sample x. This calculation is easy to do in Clojure.

I'll probably write another article on the implementation of this application soon. For today, I'm more interested in the actual behavior that we can observe using the histogram. In the screen capture above, I was connecting locally. Now that's an idealized condition that's hardly relevant for actual visitors, so I did the same with a connection to my server in southern Germany from Lisbon, where I am right now:

<a href="http://systems-toolbox.matthiasnehlsen.com" target="_blank"><img src="/images/sys-tb-tmp_lisbon.gif" /></a>

Still pretty good. Here's another attempt from Funchal, Madeira (island somewhere in the Atlantic) earlier today. To create adverse conditions, I used my mobile phone as a hotspot and then used a VPN to Amsterdam to connect to the same server in Germany:

<a href="http://systems-toolbox.matthiasnehlsen.com" target="_blank"><img src="/images/sys-tb-tmp_vpn.gif" /></a>

Okay, admittedly, this is substantially slower than the previous connections, but I'd say that's still good enough for most applications. It's not that other ways of communicating with the server would be faster here.

In the next article, I will explain the code behind this sample application and also try to make more sense of the data we saw in the histograms. Apparently, our samples don't follow a normal distribution but are rather bimodal or double-peaked. I want to explore further why that is the case. If there are two peaks that are roughly 20ms apart, then it seems like there's something taking an extra 20ms in some of the roundtrips and not in others. If you have any ideas what that could be, please let me know.

Also, I'd like to see additional data from other places in the world. Can you do me a favor? Please take a screenshot once you've generated at least 500 or better over a thousand round trips and email it to me. Make sure to add your location and optionally your name on twitter if you'd like to be mentioned by name. The first ten will get the **[book I'm working on](https://leanpub.com/building-a-system-in-clojure/)** for free.

Cheers,
Matthias


[^1]: If you're interested in this real-time application for tweet stream analysis with multiple server-side processes and a ClojureScript frontend, you can either read the source code or buy my book about it. Beware that there's no substantial write-up about the library yet as the library is still changing quite a bit. But there will be soon.

[^2]: The histogram is written entirely in ClojureScript and only making use of the systems-toolbox library and **[Reagent](http://reagent-project.github.io)**. So far, it is only part of the example application, but I'm planning on making a library component out of this chart and a few others. There certainly are a couple of ways that visual representations of system behavior can help in understanding systems.  

[^3]: I have heard this multiple times over the years, and I have no idea where it originates. 

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>