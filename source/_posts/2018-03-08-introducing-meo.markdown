---
layout: post
title: "Introducing meo"
date: 2018-03-08 19:21
comments: true
categories: 
---

I would like to dedicate this blog post to my grandma. It's her 94th birthday today. Happy birthday, grandma, I love you. 

This is the perfect day for introducing **[meo](https://github.com/matthiasn/meo)**, a project that my grandma inspired. About two years ago, she showed me a photo from an Iceland vacation, and I asked her what year that was. She did not remember but retrieved a folder, scanned a few pages, and less than a minute later gave me a report of the details of the trip that she was a part of in May 1987. I was stunned, as it dawned on me that I did not have anything like that for the past 20 years of my life, in which I visited 39 countries. Emails with itineraries, photos with geolocation for a few years back, sure, but all very fragmented, and far from being able to give a concise summary of any of those trips in 60 seconds or less. I told her I wished I had recordings like that, and she said, 'Really? I wish I had recorded more.'

<!-- more -->

That made a think hard about the problem of getting older and forgetting more and more. I had always wanted a journal, but using paper wasn't an option. I cannot even read my own handwriting, or at least find it very unpleasant. Also, paper-based notes have physical weight, plus indexing them sucks. I wanted a digital journal instead, one that runs on both desktop and mobile, and that does not require me to hand my recordings over to interested third parties. 

Nope, journals must be (and stay) private. Also, it would have to be an open-source tool so that anyone can check what it does with your data. I have zero reason to take anyone by their word on how they will respect my privacy. Maybe they mean it for today, but through either neglect or change of mind, they will probably still sell or lose my data at some point, especially if it's a free service that struggles to find a business model while dealing with increasing infrastructure costs. What if there was an application that does not share your information with anyone? **[meo](https://github.com/matthiasn/meo)** wants to be this project, but first, I would like people smarter than me to review it, and point out where it can be improved and made more secure. That is one of the many areas where I am looking for collaborators. 

Meo is an intelligent, data-driven journal. Initially, I just used it for recording text and photos together with the exact whereabouts. But I pretty soon realized that I would not necessarily spend much time on keeping a journal just so that I could benefit in some rather distant future. I knew I would enjoy having more information about my current life in that distant future, but the process of collecting data would also have to be helpful in the now. I always found it to be a waste of data to throw away tasks and their completion, and I also read 'The Effective Executive' by Peter Drucker at the time. The chapter 'Know Thy Time' where he suggests recording how you spend your time inspired me in particular. I wanted that, only built into my journal and recording how I spend my time all through the year(s), instead of recording stuff on paper for weeks at a time. 

For that, I can now define tasks in **[meo](https://github.com/matthiasn/meo)** and then have a timer running whenever I work on a given task. Each task then belongs to a story, and those, in turn, belong to a few broad sagas, so that I always have a view into how I spend my time, which is quite often different from what I thought. So far I have completed 3305 tasks this way, recording 6779 hours total, which does include sleep, and by just recording the process of being me, I already have a pretty detailed journal. After all, to a large degree, I am what I do. I have heard the counterargument a few times that what someone did in their life was so mundane and boring that it would not be worth recording. Well, in that case, they probably have a much bigger problem. I am trying to spend my time as well as I can, as opposed to trying to get more done. There is not the slightest chance that I will ever get my backlog down to zero, but if I cannot complete all tasks, I will probably fare best by working on the most relevant ones. I have a few ideas on how to come up with a better sort order than by time or some priority, but more about that later when I have a proof of concept for that.

Here is how **[meo](https://github.com/matthiasn/meo)** currently looks like:

{% img left /images/2018-03-08-meo-desktop.png %}

On the left side, there is a calendar that shows how I really spent my time, not what was planned. Of course there normally are labels, but I can also switch them off. I feel there should also be some kind of a time assignment when planning a day, but that part does not exist yet. In the next column to the right, there is a list of work in progress, filtered for a particular saga or overall. In the screenshot above, I am only showing the work in progress for meo. Then to the right, there is the selected task, with its comments and the time recorded. Then all the way over to the right, there are linked entries. In this case, there is a linked screenshot. Oh yeah, you can take screenshots in **[meo](https://github.com/matthiasn/meo)** using **⌘-P** and they will be recorded with time, your whereabouts, and whatever comment you might have. All the way to the right, there is such a screenshot, that then also contains time and geolocation of where it was taken. I find screenshots for documenting the progress of programming super useful without taking much extra time, and I've taken a few thousand of those so far. Then later when I come back to a task or project, those screenshots often make it easier to get my mind back into the problem. In a way, that's a kind of onboarding, only on a smaller scale.

Then I thought I would like to record additional information about myself, for example, steps per day, flights of stairs climbed, amount of certain vitamins and minerals taken, blood pressure, weight, amounts of coffee, beer, whatever, just to see if it's useful. And yeah, some of that really is useful, and why not collect data long as the information stays with me. No, I would not share this kind of information with any cloud-based service. But for my eyes only, why not.

Here's how that looks like, with the labels omitted again, because hey, most of that is none of your business:

{% img left /images/2018-03-08-meo-charts.png %}

I think it works to have information about my day and the context over the past weeks and months in sight, especially when it's for things I can influence, such as steps per day, where I can always decide to go for a walk until I say reach my 10K steps per day goal. In other context, companies pay money for banner ads, so I assume they are proven to work. Only that here, the banner ad, being about myself, is way more relevant

This application is based on Electron and thus platform-independent. I use it on a MacBook all the time and have used it on Linux and Windows in the past, albeit briefly. Those may have broken in the meantime, though. Please check if you can run it yourself by following the steps in the README, and file an issue for whatever comes up. [-> Please help with the multi-platform aspect of this application. Especially also around packaging with electron-builder for those platforms]

A part of my motivation for writing **[meo](https://github.com/matthiasn/meo)** was that it could be an example application for a book I started a few years back about building systems in Clojure. But I soon realized that I could not write a book that could be authoritative about any of this. I was learning so much new stuff all the time. And then it never felt like a good time to take a snapshot and write about it, knowing that it would likely change. And then that was not the only thing I felt bad about, so I thought why not also track my mood, as it seemed to me something was not going well there.

I researched a few psychological instruments for assessing current mood. I'm by no means an expert on any of that, but what seemed to make sense to me to is the PANAS, an instrument for assessing the momentary affective situation (or so). There are 20 words, for each of which the subject selects a value on a 7-item Likert scale. In the end, it gives you a positive and a negative score. The score probably also means something in comparison to the general population, but for me, it was most interesting to observe changes over time, and I found some patterns in my recorded data that make me unusually well-informed when talking to mental health professionals, including friends in that field.

Here's how filling out the PANAS looks like: 

{% img left /images/2018-03-08-meo-panas.png %}

I found that most questionnaires work in a similar way, with a Likert-type scale, some of the items reversed, and any number of scores derived from filling out the data. Those can now be defined in **[meo](https://github.com/matthiasn/meo)** via configuration as an edn-file, but ideally, there should be a graphical user interface for defining and editing surveys. Pull requests most undoubtedly welcome :)

The data for filled out questionnaires is then plotted against other collected data, as in the screenshot above. I am frequently using other such instruments as well, like the CFQ11 for signs of fatigue, and I will write more about data gathering, questionnaires and charts another time - for today I'm just giving a quick overview of different parts of the project. 

Next, there is a mobile application. Initially, I started with a Swift-based app but that was never complete, and only did very few things, like collecting geo information whenever there was a significant location change, capturing text notes, or uploading photos. It uploaded it's data to the **[meo](https://github.com/matthiasn/meo)** desktop application by scanning a QR code, and then sent the data over the local network, but that was never really a good idea. The novelty of scanning that code wore off quickly, and it just got tedious. Also, it would lead to problems in the review process why the app would require either unencrypted traffic or using a self-signed certificate, the latter also being a nuisance in and of itself. And then that app would be iOS only, and my vision is to be multi-platform on both desktop and mobile, not least because I do not want to lock myself in but have the option to move to any platform at any point, without certain applications holding me back with a particular platform.

So I built a mobile app in ClojureScript on top of React Native. At this point, one can record text entries, data from Apple Health, and photos, all of which are then synced one direction to the desktop application, using a user-provided WebDAV folder, and then passes journal entries inside AES-256 encrypted files. Entries on mobile can also be edited, and updates are then synced. Conflicts are detected using a vector clock, which is mostly thanks to Tyler Neely, who provided the theory and guided the implementation. Right now, conflicts are only shown, and there still needs to be a UI for resolving conflicts. Also, syncing should work both ways. And the structure of the code is quite convoluted. This is certainly the most active area of development, and the one where I need the most help.

This is how the app currently looks like:




If you think all this makes sense and believe in the idea that people should be able to record stuff about our lives without any other party eavesdropping in on that, and that a tool for doing so should be open source, then please subscribe to the mailing list so I can keep you updated on the progress.

[mailing list input]

If the above applies, and you also want to learn Clojure and ClojureScript - or know these excellent languages already - I would like to ask you for help in making the existing code base better. Help can happen by reviewing existing code, pointing out weaknesses and repetitiveness, improved test coverage, UI integration tests, and overall code quality improvements, or by solving or helping in solving upcoming problems. Or, if you are a designer and think something like this should exist, only in pretty, I would love to hear your thoughts, or even better, see your SASS magic in a pull request. But also guidance in, 'Hey, this looks terrible, here's an idea to make it better' would be very welcome.

I have built a tool that hopefully helps in onboarding anyone who is interested in collaborating, and it is called inspect. It's a tool for looking inside a running application built on top of the systems-toolbox. This is a library I built quite some time ago, with the vision of building something like inspect, but lacking the skills to do so back at the time. Working on **[meo](https://github.com/matthiasn/meo)** and the electron application around it and eventually enabled me to build a first standalone desktop version of inspect. Systems on top of the systems-toolbox have a so called firehose where, when enabled, all message flows are copied to, and persisted, for example on a Kafka topic. Inspect then consumes this Kafka topic and groups message flows together for visualization, and also infers the structure of the system from successful message flows it observed. Here's how that looks like for the overall structure of meo:

{% img left /images/2018-03-08-inspect-overview.png %}

Here with the communication for a selected message type:

{% img left /images/2018-03-08-inspect-selection.png %}

Here's a particular flow for taking a screenshot, which involves the main electron process, the renderer process, and the JVM "backend" application they talk to. 

{% img left /images/2018-03-08-inspect-flow.png %}

It looks convoluted because it is, and I have not had the time yet to simplify it yet. But at least there's a tool for visualizing the madness, which is something I wish more projects had. I will talk more about this tool in subsequent blog posts. While many areas in the **[meo](https://github.com/matthiasn/meo)** codebase still suck, at least there is visibility like this, and that's kinda fun. But there is also plenty room for improvement in inspect, so if that interests you, please help in making this more useful and/or prettier. For example, it would be cool if my coworkers wouldn't always make fun of me that my laptop was about to take off when I use inspect. The system that upon inspection makes my laptop fans max out processes a lot more data and runs on more than ten nodes, but I think that nonetheless there are better solutions that won't max out the render process in Electron. Another area where fresh sets of eyes would be helpful.

I'm delighted that my grandma is still around to see this article about what she inspired finally published. It also helped me finally coming to terms with the idea of talking about this project. It's probably true what Reid Hoffmann said, 'If you are not embarrassed by the first version of your product, you've launched too late.' And I'm still fairly embarrassed, and without grandma's birthday, I probably would have tried to keep polishing doorknobs until the end of time, so thanks for that, too, dear grandma.

I can let you know when the public beta starts by signing up to the mailing list. Anyone interested can build the application themselves. I can also provide a select few with a packaged version already. For that, you can send me an email, and please let me know what area you are particularly interested in, so I can launch to different interest groups at different times, depending on progress in that area.

Thanks for reading this far. Let me know if you have any questions or comments. And subscribe if you want to read more like this in the future.

<!-- Begin MailChimp Signup Form -->
<link href="//cdn-images.mailchimp.com/embedcode/slim-10_7.css" rel="stylesheet" type="text/css">
<style type="text/css">
	#mc_embed_signup{background:#fff; clear:left; font:14px Helvetica,Arial,sans-serif;  width:500px;}
	/* Add your own MailChimp form style overrides in your site stylesheet or in this style block.
	   We recommend moving this block and the preceding CSS link to the HEAD of your HTML file. */
</style>
<div id="mc_embed_signup">
<form action="https://matthiasnehlsen.us7.list-manage.com/subscribe/post?u=798fd7b50a1d9cc58be41c2af&amp;id=eb7a7193c5" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
    <div id="mc_embed_signup_scroll">
	
	<input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="email address" required>
    <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
    <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_798fd7b50a1d9cc58be41c2af_eb7a7193c5" tabindex="-1" value=""></div>
    <div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
    </div>
</form>
</div>

<!--End mc_embed_signup-->
