---
layout: post
title: "Optimizing my Workspace - Hardware, Software, Ergonomics"
date: 2015-02-18 21:56
comments: true
categories: 
---
So within the two weeks, I spent a fair amount of time with something that should seem fairly obvious to someone who uses computers a lot, yet that I paid far too little attention in the last couple of years of my life. Now you may wonder what I'm getting at, but no worries, I'll get there. Let me ask you something first. **How many hours per week do you spend in front of your computer?** Let me guess, probably most of your waking hours, considering that you read a software-related blog. But is your workplace ideal or even anywhere close to it?

<!-- more -->

Your friends probably think that you, being a software engineer, always work on the fastest hardware available. But do you really? Let me tell you a secret: a Retina MacBook is not the fastest computer out there. So when you freshly compile something, is waiting for 45 seconds okay or would you rather wait less than 20 seconds? I definitely fall into the latter camp.

Also, is your posture okay when you sit in front of a laptop? Mine hardly is. When I was 25, that didn't matter all that much. But I'm no longer 25. I had a conversation with my orthopedist recently. I was initially there because I apparently hurt myself when doing sprints on the stairs in an old tunnel that goes under the River Elbe which is home to the second biggest port in Europe right where the tunnel allows you to cross over (or should I say under?). Here's an old picture[^1] of the building where you enter the tunnel, with an embedded illustration of where the tunnel and the stairs are located:

{% img left /images/elbtunnel.jpg 'Alter Elbtunnel' %}

Anyway, I still believe that sprinting up stairs is an excellent exercise for your legs as part of a longer run, but my right knee begs to differ. Whatever. Once we had finished discussing the knee issue, the orthopedist asked me about my workspace, upon which I responded that I had purchased a standing desk about a year back, but that I wasn't really using the option of standing instead of sitting all that much. This is the desk:[^2]

{% img left /images/imove-c-b-02.jpg 'Leuwico iMOVE-C' %}

He smirked, ignored what I mentioned about not using the desk as intended, and said, 'Oh that's excellent that you have the right equipment already. You know, you should **be standing about 70 percent** of your waking hours. That appears to be the **most healthy thing to do** for your back and all.'.

Hmm. **70 percent of the time.** The thing is that working with a laptop in front of me atop the desk in standing position isn't really feasible for extended periods of time. My neck just won't have it. Then I thought that I wanted to **[throw my Retina MacBook out](http://matthiasnehlsen.com/blog/2015/01/21/apple-get-your-act-together/)** anyway and I also wasn't kidding, so why not replace it with a _fine_ Linux workstation plus a lightweight laptop running Linux as well[^3]. The thing is, I can only bring the MacBook in for service after making it redundant for a week or a week and a half. But once it is redundant for so long, it will remain redundant. So once it's repaired, it will go on eBay. Bye Apple.

I'm still in the process of assembling and configuring my new workstation and also of moving my furniture around until I finally settle for the setup I want to start a project with fairly soon. I will keep you posted on how the final setup will look like. 

Okay, that's it for my new workspace for today. For now only this much: I'm very happy with all aspects of my new workspace. Only the energy consumption is higher than what I would find acceptable. However, a solution is already in the works: renewable energy, with solar panels and some substantial batteries. More about that another time.

Now on to some other stuff that I've been up to.

# Progress with 'Building a System in Clojure'
On the new machine I described above, I started setting up **Docker** containers for running load tests. I also started thinking conceptually about how to load-test different aspects of the system I'm working on for my work-in-progress **Building a System in ClojureScript**. I will be working on that chapter next. Together with the older workstation, I should have a decent environment for observing what kind of load can be handled per machine.


Also, I've been re-reading a book about **Systems Thinking** and I find that the approach applies to software artifacts as well. Another topic I will cover in much more detail later on.

# Inspect
I fixed an issue with the **inspect** library where you would get some cryptic NullPointerException when pulling version **0.1.4** in from **Clojars** that did not occur when publishing locally. Not sure exactly what I did wrong when publishing it, but I have now created version **0.1.5** with a newer version of ClojureScript and this one appears to be working as advertised when pulled in from Clojars.

That's it for today. 

Happy coding,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>

[^1]: Postcard from the collection of Björn Larsson, please visit **[http://www.timetableimages.com/maritime/images/ha.htm](maritime timetable images website)** for context and more historic images like this one.

[^2]: Leuwico iMOVE-C, more info on the **[company website](http://www.leuwico.com/office_furniture/products/office_furniture/imove/imove-c.html?goto=02)**

[^3]: I still need to buy said Linux laptop. Let's see how the 2015 Dell XPS 15 will look like. Or should I get the 13-inch version? It's delightfully lightweight, and considering that it will not be my primary workhorse, it will probably be enough. Whenever I get a decent Internet connection, I can just dial into my new workstation and tap into it's sheer power.