---
layout: post
title: "Optimizing my Workspace - Hardware, Software, Ergonomics"
date: 2015-02-06 20:56
comments: true
categories: 
---
So within the last week or two, I spent a fair amount of time with something that should seem fairly obvious to someone who uses computers a lot, yet that had gotten far too little attention in the last couple of years of my life. Now you may wonder what I'm getting at, but no worries, I'll get there. Let me ask you something first. **How many hours per week do you spend in front of your computer?** Let me guess, probably most of your waking hours, considering that you read a software-related blog. But is your workplace ideal or even anywhere close?

<!-- more -->

Your friends probably think that you as a software engineer always work on the fastest hardware available. But do you, really? Let me tell you a secret, a Retina MacBook is not the fastest computer out there. So when you freshly compile something, is waiting for 45 seconds okay or would you rather wait less than 20 seconds? I definetely fall in the latter camp.

Also, is your posture okay when you sit in front of a laptop? Mine hardly is. When I was 25, that didn't matter all that much. But I'm not 25. I had a conversation with my orthopedic recently. I was initially there because I apparently hurt myself when doing sprints on the stairs in an old tunnel that goes under the river Elbe, which hosts the second biggest port in Europe right where the tunnel allows you to cross over (or should I say under?). Here's an old picture[^1] of the building where you enter the tunnel, with an embedded illustration of where the tunnel and the stairs are located:

{% img left /images/elbtunnel.jpg 'Alter Elbtunnel' %}

Anyway, I still believe that sprinting up those stairs is an excellent exercise for your legs as part of a longer run, but my right knee begs to differ. Whatever. Once the knee issue was discussed, the orthopedic asked me about my workspace, upon which I responded that I had purchased a standing desk about a year back but that I wasn't really using the option of standing instead of sitting all that much. This is the desk:[^2]

{% img left /images/imove-c-b-02.jpg 'Leuwico iMOVE-C' %}

He smirked, ignored what I mentioned about not using the desk as intended, and said, 'Oh that's excellent that you have the right equipment already. You know, you should **be standing about 70 percent** of your waking hours. That appears to be the **most healthy thing to do** for your back and all.'.

Hmm. **70 percent of the time.** The thing is that working with a laptop in front of me atop the desk in standing position isn't really feasible for extended periods of time. My neck just wouldn't have it. Then I thought that I wanted to **[throw my Retina MacBook out](http://matthiasnehlsen.com/blog/2015/01/21/apple-get-your-act-together/)** anyway and I also wasn't kidding, so why not replace it with a _fine_ Linux workstation plus a lightweight laptop running Linux as well[^3]. The thing is, I can only bring the MacBook in for service after making it redundant for a week or a week and a half. But once it is redundant for so long, it will remain redundant. So once it's repaired, it will go on eBay. Bye Apple.

For a moment I thought about using an older workstation of mine, which was pretty decent like four and a half years back and that hadn't seen so much usage recently. While it was still equally performant as the 2012 Retina MacBook and partially better, with recently upgraded 24GB of fast RAM and a brand-new and fast SSD, it wasn't anywhere near the best I could get in early 2015. 

So I thought I'd rather keep that workstation in use for running load tests against a new machine. But what would I need to buy when I wanted the best option available, for a decent but not crazy budget?

**Intel Core i7 4790K**. That part's for sure. It seems to me that for the stuff I typically do on a development machine, the per-core performance is MUCH more important than the number of cores. Whatever I do, there will ALWAYS be parts of anything involved that don't evenly scale to more cores. Adding any more cores than the four (plus Hyperthreading) you find on the 4790K comes with a substantial penalty in GHz though so it's not only not worth it but more than likely makes some compilers slower than with less kernels a but higher clock rate. [^4]

The CPU part was settled. Next, I needed a mainboard. A gaming board seems like the way to go. There, you want your computer at the highest clockrate possible, even when only occasionally. I actually want the same when running ````lein cljsbuild once````. I don't want the CPU to adapt to that after there's demand for more CPU resources. No, I want the CPU to be at full blast by the time the task begins, and I wouldn't mind pressing an actual button for that. That's like playing an instrument.

So I bought an ASUS Maximus VII Hero for my 4790K. Good choice, I'm happy with it. It even allows you to press a button for going in turbo mode on a specialized panel, but I'm still waiting for the delivery of that one. Next, there was the RAM. I still had 24 GB in my older workstation, of pretty good quality. But only 16 GB would fit into this new workstation as there are only 4 slots. Why would I want to limit myself to that? I want to run quite a few docker containers simultaneously on that machine, all of which shall not starve on memory. So I needed 32 GB, the maximum amount the board could fit. The fastest available appeared to be the 2400 GHz Kingston memory. So I got 32 GB of that. 

Next, there was the SSD. I have good experiences with Samsung so far, so I got a **250 GB 850 EVO** from them, for starters. I'll probably get more of those drives later. 250 GB seems to hit a sweet spot when you want to run multiple SSDs on different SATA channels in order to get more OPs per second than if you were running a single and larger SSD.

Then, there was the monitor. At first, I got the **LG curved 34" display**, but quite frankly, as awesome as the experience is for watching movies or gaming (it really is), it sucks for development. That's simply because I've gotten so used to the Retina display on my MacBook that I'm not going back to a substantially lower ppi of the display. Not an option. Also, you definetely want a height-adjustable screen when building an ergonomic, hybrid standing/sitting workspace. So I sent the screen back to Amazon for refund. Instead, I now got a **DELL 27" 4K screen** for only like €600 which is like half of the curved LG I just returned. It works nicely, but of course it requires a rather high-end GPU to drive more than 8 million pixels on a 4K screen. Even if the mainboard had a DisplayPort out, I wouldn't want to use it. I also wanted the whole workstation to be extremely silent when not under load, so the **ASUS GTX970 Strix** was a good option as the fans don't spin at all unless the GPU is under fire. 4 GB of VRAM should be plenty to drive one or two 4K displays.

All this combined with the installation of **Linux Mint 17.1** and the proprietary Nvidia driver and I have a very powerful workstation on which I can run my development environment really fast and also simulate a fairly complex environment with **Docker containers** for **nginx**, **redis**, multiple and clustered instance of **ElasticSearch**, plus multiple instances of the application I want to load-test, such as for example my **BirdWatch** application.

Oh, did I mention that the machine is also COMPLETELY inaudible when not under sustantial load but still BLAZINGLY fast compared to the Retina MacBook?

Compiling ClojureScript code on that machine is literally more than **twice** as fast compared to the my Retina MacBook, all while staying completely quiet. What took 42 seconds before (fresh compile of BirdWatch ClojureScript) application takes a little under 19 seconds on the Linux machine. Much more fun. Everything feels a lot snappier, like IntelliJ IDEA, for example. Plus I get to work with Docker natively, which is a HUGE plus over a Mac. 

While I mentioned last time that I would really miss Photoshop and OmniGraffle on a Linux machine, I can report that Photoshop runs perfectly well inside a virtual box running Windows 7 64 bit, with 4 GB of RAM and 4 CPUs assigned. It's not that I'm lacking memory on this machine. I could even double that or more if I ever feel like it.

Here's how my new workplace looks like:




By the way, the second screen is a workaround until I can replace it by another 4K screen. Unfortunately, the GTX 970 only has a single DisplayPort out, and while it's HDMI port supports version **2.0** and a refresh rate of **60 Hz**, the DELL doesn't support this latest HDMI standard. Hardly any screens do at the moment, but 30 Hz is simply not an option. I should have bought the **GTX 980** right away, it has three DisplayPort plugs, turning this into a non-issue. I should talk to the vendor about swapping the cards, maybe they can do something, considering that the one I want to trade the GTX 970 in for is way more expensive with over €500. Otherwise, I will need to buy another screen from a different vendor that supports 60 Hz over HDMI.[^5]

If you feel any kind of envy now, you should probably talk to your boss about an upgrade. You're likely in this profession for a long time. Staying healthy is just as important as knowing the latest (probably fad) framework, if not more so.

By the way, if I were you, I'd start with the ergomics of a standing desk. Most reasonable employers tend to understand that the price for a decent desk is negligible in comparison to the costs in lost productivity and sick days caused by back pain. Back pain sucks, and it's almost as bad hearing others whine about it than experiencing it yourself. Then, when there's a standing desk in front of you, you are obviously going to need a height-adjustable screen. Do yourself a favor and get a high-res screen if you're used to high pixel density on your laptop screen.

Okay, that's it for my workspace for today. Good luck with improving your work environment as well. Now for some other stuff that I've been up to.

# Progress with 'Building a System in Clojure'
On this new machine I described above, I have started setting up **Docker** containers for running load test and conceptually thinking about how to load test different aspects of the system I'm working on for my work-in-progress **Building a System in ClojureScript**. I will be working on that chapter next. In conjunction with the older workstation, I should have a decent environment for observing what kind of load can be handled per machine.

The description of the status quo of the **BirdWatch** application is pretty much done, except for cleaning up the namespace that takes care of ingesting tweets and properly describing it. That will come in the next couple of days.

# Inspect
I fixed an issue with the **inspect** library where you would get some cryptic NullPointerException when pulling version **0.1.4** in from **Clojars** that did not occur when publishing locally. Not sure exactly what I did wrong when publishing it, but I created version **0.1.5** now with a newer version of ClojureScript and this one appears to be working as advertised when pulled in from Clojars.

Happy coding,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>

[^1]: Postcard from the collection of Björn Larsson, please visit the  **[http://www.timetableimages.com/maritime/images/ha.htm](maritime timetable images website)** for context and more historic images like this one.

[^2]: Leuwico iMOVE-C, more info on the **[company website](http://www.leuwico.com/office_furniture/products/office_furniture/imove/imove-c.html?goto=02)**

[^3]: I still need to buy said Linux laptop. Let's see how the 2015 Dell XPS 15 will look like. Or should I get the 13 inch version? It's delightfully lightweight, and considering that it will not be my primary workhorse, it is probably going to be enough. Whenever I get a decent Internet connection, I can just dial into my new workstation and tap into it's sheer power. 

[^4]: This seems particularly true for anything compilation-related. For running more Docker containers simultaneously, more 6 or 8 or even more cores would certainly help. Also, the new Socket 2011-3 CPUs have more PCI Express lanes, which comes in handy when driving SSDs over PCI-E instead of the now-way-too-slow SATA or connecting to a 10GB network. I'm already in the mood for building such a machine myself, but I'll try to wait until the next generation of CPUs comes out in the second half of 2015.

[^5]: Funny enough, I just read that NVIDIA is somewhat in trouble about falsely advertising the specs of the GTX 970, making it look closer to the GTX 980 than it actually is. Maybe that's how I can swap the card. I should have bought it on Amazon, then I could just send it back instead of negotiating with the local vendor where I bought.
