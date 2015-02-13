---
layout: post
title: "Optimizing my Workspace - Hardware, Software, Ergonomics #2"
date: 2015-02-17 22:56
comments: true
categories: 
---
For a moment I thought about using an older workstation of mine, which was pretty decent like four and a half years back and that I haven't used much recently. While it was still equally performant as the 2012 Retina MacBook and partially better, with recently upgraded 24GB of fast RAM and a brand-new and fast SSD, it wasn't anywhere near the best I could get in early 2015. 

So I thought I'd rather keep that workstation in use for running load tests against a new machine. But what should I buy to get the best option available, for a decent but not crazy budget?

**Intel Core i7 4790K**. That part's for sure. It seems to me that for the stuff I typically do on a development machine, the per-core performance is MUCH more important than the number of cores. Whatever I do, there will ALWAYS be parts of anything involved that don't evenly scale to more cores. Adding any more cores than the four (plus hyperthreading) you find on the 4790K comes with a substantial penalty in GHz, though, so it's not only not worth it but more than likely makes some compilers slower than on a CPU with less kernels running at a higher clock rate. [^4]

The CPU part was settled. Next, I needed a mainboard. A gaming board seemed like the way to go. When gaming, you want your computer at the highest clockrate possible even if only occasionally. I actually want the same when running ````lein cljsbuild once````. I don't want the CPU to adapt to that after there's demand for more CPU resources. No, I want the CPU to be at full blast by the time the task begins, and I wouldn't mind pressing an actual button for that. That's like playing an instrument. [^5]

So I bought an **ASUS Maximus VII Hero** for my 4790K. Good choice, I'm happy with it. Supposedly, besides overclocking, this board even allows you to press a button to go into turbo mode on a specialized panel, but I haven't gotten that to work just yet. Next, there was the RAM. I still had 24 GB in my older workstation, of pretty good quality. But only 16 GB would fit into this new workstation as there were only 4 slots. Why would I want to limit myself to that? I want to run quite a few docker containers simultaneously on that machine, all of which should not starve on memory. So I needed 32 GB, the maximum amount the board could fit. The fastest available memory appeared to be the 2400 GHz Kingston. So I got 32 GB of that. 

Next, there was the SSD. So far, my experiences with Samsung have been good, so I got a **250 GB 850 EVO** from them for starters. I'll probably get more of those drives later. 250 GB seems to hit a sweet spot when you want to run multiple SSDs on different SATA channels in order to get more OPs per second than if you were running a single and larger SSD.

Then, there was the monitor. At first, I got the **LG curved 34" display** but quite frankly, as awesome as the experience is for watching movies or gaming (it really is), it sucks for development. That's simply because I've gotten so used to the Retina display on my MacBook that I won't go back to a substantially lower ppi of the display. Not an option. Also, you definitely want a height-adjustable screen when building an ergonomic, hybrid standing/sitting workspace. So I sent the screen back to Amazon for refund. Instead, I now got a **DELL 27" 4K screen** for only €600 which is like half of the curved LG I had just returned. It works nicely, but of course it requires a rather high-end GPU to drive more than 8 million pixels on a 4K screen. Even if the mainboard had a DisplayPort out, I wouldn't want to use it. I also wanted the whole workstation to be extremely silent when not under load, so the **ASUS GTX980 Strix** was a good option as the fans don't spin at all unless the GPU is under fire. 4 GB of VRAM should be plenty to drive one or two 4K displays. [^6]

All this combined with the installation of **Linux Mint 17.1** and the proprietary Nvidia driver give me a very powerful workstation on which I can run my development environment really fast and also simulate a fairly complex environment with **Docker containers** for **nginx**, **redis**, multiple and clustered instance of **ElasticSearch**, plus multiple instances of the application I want to load-test, such as for example my **BirdWatch** application.

Oh, did I mention that the machine is also COMPLETELY inaudible when not under substantial load but still BLAZINGLY fast compared to the Retina MacBook?

Compiling ClojureScript code on that machine is literally more than **twice** as fast compared to my Retina MacBook, all while staying completely quiet. What took 42 seconds before (fresh compile of the BirdWatch ClojureScript application) takes a little under 19 seconds on the new Linux machine. Much more fun. Everything feels a lot snappier, like IntelliJ IDEA for example. Plus I get to work with Docker natively, which is a HUGE plus over a Mac. 

While I mentioned last time that I would really miss Photoshop and OmniGraffle on a Linux machine, I can report that Photoshop runs perfectly well inside a virtual box running Windows 7 64 bit, with 4 GB of RAM and 4 CPUs assigned. It's not that I'm lacking memory on this machine. I could double or even triple that if I ever feel like it.

Here's how my new workplace looks like:




By the way, the second screen is a workaround; I will probably replace it with another 4K screen soon. If you feel any kind of envy now, you should probably talk to your boss about an upgrade. You're likely in this profession for a long time. Staying healthy is just as important as knowing the latest (probably fad) framework, if not more so.

By the way, if I were you, I'd start with the ergonomics of a standing desk. Most reasonable employers tend to understand that the price for a decent desk is negligible in comparison to the costs in lost productivity and sick days caused by back pain. Back pain sucks, and it's almost as bad hearing others whine about it than experiencing it yourself. Then, when there's a standing desk in front of you, you are obviously going to need a height-adjustable screen. Do yourself a favor and get a high-res screen if you're used to high pixel density on your laptop screen.

Okay, that's it for my workspace for today. Good luck with improving your work environment. Now on to some other stuff that I've been up to.



Happy coding,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>

[^1]: Postcard from the collection of Björn Larsson, please visit **[http://www.timetableimages.com/maritime/images/ha.htm](maritime timetable images website)** for context and more historic images like this one.

[^2]: Leuwico iMOVE-C, more info on the **[company website](http://www.leuwico.com/office_furniture/products/office_furniture/imove/imove-c.html?goto=02)**

[^3]: I still need to buy said Linux laptop. Let's see how the 2015 Dell XPS 15 will look like. Or should I get the 13-inch version? It's delightfully lightweight, and considering that it will not be my primary workhorse, it will probably be enough. Whenever I get a decent Internet connection, I can just dial into my new workstation and tap into it's sheer power. 

[^4]: This seems particularly true for anything compilation-related. For running more Docker containers simultaneously, 6 or 8 or even more cores would certainly help. Also, the new socket 2011-3 CPUs have more PCI Express lanes, which comes in handy when driving SSDs over PCI-E instead of the now-way-too-slow SATA or connecting to a 10GB network. I'm already in the mood for building such a machine myself, but I'll try to wait until the next generation of CPUs comes out in the second half of 2015.

[^5]: Yes, I am aware that this is also a little silly. So what. It's also fun.

[^6]: The GTX980 being the fastest GPUs ever made for ordinary mortals should make this card also very suitable for gaming in 4K. There goes the productivity gain... Initially, I bought the GTX 970, but it only has a single DisplayPort out, and while its HDMI port supports version **2.0** and a refresh rate of **60 Hz**, the DELL doesn't support this latest HDMI standard. Hardly any screens do at the moment, but 30 Hz is simply not an option. Then I read that NVIDIA is somewhat in trouble about falsely advertising the specs of the GTX 970, making it look closer to the GTX 980 than it actually is and that's how I was able to swap the card.
