---
layout: post
title: "Weekly Update"
date: 2014-08-17 22:06
comments: true
categories: 
---
## git vs brain fart
The other day I experienced a curious malfunction of my brain. I had some uncommitted changes in a repository. Many hours of work in fact, way more that I normally would leave uncommitted anywhere. So to alleviate this grievance, I typed ````git add .```` on the command line.

So far so good. But then I got distracted by a rather annoying phone call. During that call, something happened that I can best label a **[brain fart](http://en.wikipedia.org/wiki/Brain_fart)**. I typed ````git reset --hard HEAD```` and pressed ENTER. Now you will probably ask why anyone would want to do that, particularly before actually committing the changes. To be honest, I am clueless. Maybe it was the geek's version of a **[Freudian slip](http://en.wikipedia.org/wiki/Freudian_slip)**? Something in my brain probably wanted to reset its own state to the happier state pre-call, but somehow that idea landed on the command line instead?

In case you don't know this (destructive) **[git](http://git-scm.com/)** command, this is what it does:

{% blockquote git-reset documentation http://git-scm.com/docs/git-reset %}
--hard
Resets the index and working tree. Any changes to tracked files in the working tree since <commit> are discarded.
{% endblockquote %}

Okay, think about that one. The documentation says it loud and clear. Changes to tracked files since HEAD, which is the current commit to which I have added above, are **discarded**. Oops.

I have no idea what I was thinking, but the changes that I had added but not committed appeared to be lost. Not a surprise really when you think about the description above. But for me in that second it was like getting hide by a truck that came out of nowhere.

So I really wanted the fruits of my previous and tedious labor back.

I tried ````git reflog```` according to **[these instructions](http://stackoverflow.com/questions/5788037/recover-from-git-reset-hard)** but that did not help, I did not find anything useful in the output. Luckily though, **[fsck](http://git-scm.com/docs/git-fsck)** helped:

    git fsck --lost-found --verbose
    cd .git/lost-found/other/
    find . -print | xargs grep someUniqueTextHere

So basically, git only runs a garbage collection every once in a while. In found this **[here](http://gitready.com/advanced/2009/01/17/restoring-lost-commits.html)**. Using the commands above, I tell git to run a fschk and store write out the lost and found items. Then I can find the one I was looking for by piping the result of find in that directory to grep, looking for some specific text I remembered from the work I had lost. 

## Octopress, one year later
I am using Octopress for generating my blog. It has served me alright, but I don't like it a lot and I wouldn't use it again.  I am just not enough of a Ruby guy to tinker around with it. I cannot even fix issues when I try to update it. The other night I wasted two precious hours on trying to get my installation current so that I would benefit from newer features, without success. And quite frankly I have no intentions of becoming a Ruby expert any time soon or ever. 

Along those lines, I was thinking about rolling my own blogging engine. Yeah I know what you're thinking. At some point every (technical) blogger will reach that stage where you want to create your own blogging engine. But hear me out, this one might be a little different. I am thinking about making use of Polymer and Web Components. Now that Google robots run JavaScript, the blog would get indexed just fine. Why not load the markdown directly from a web component handling the current post and then let that render itself? Polymer handles browser compatibility, but I do not care much about IE6 users and the like anyway. At the same time that would give me a chance to dive deeper into web components. The idea of a shadow DOM is just brilliant, and I hope web components will have the success they deserve. Finally a vendor-agnotic way of building web application.

## Feeling good
I have a lot of fun writing stuff at the moment. I also do so for myself. The first 25-30 minutes in the morning belong to me and me alone. Before even reading email, I fully focus on everything that comes to mind and write it down. It is a great way for gaining some clarity on what I want to do and where I want to go. The only thing that's missing in the process is a decent and searchable way to organize the notes. That part needs work. But nonetheless, I am a happier person when I do this regurlarly. Highly recommended.

## Mailing list: one and only one
At first I thought about creating a separate mailing list because I didn't want to spam anyone who subscribed for infrequent tutorials with weekly updates. But that's too much work on my end. So instead I will unify the mailing lists. If the updates are too frequent for any of the existing subscribers, there are two options: **a)** let me know or **b)** unsubscribe. But why don't you give it a try? I'll try to make the weekly update an entertaining read.


## Book and gadget reviews
Last week I mentioned that I wanted an outlet for my opinions on books and gadgets. So I created a **[page for reviews](/reviews)**. I also started writing about some electronic stuff that I own:.

### My audio setup
I recently kicked out a highend surround sound system in favor of a mixer and two (great) active speakers. **[Find out why](/reviews/xenyx-x1222usb)**.

### My camera, Sony A7
I can finally use my classic Zeiss and Leica prime lenses again thanks to this camera. Overall I am quite happy with it. This review is work in progress, but you can already read some of it **[here](/reviews/sony-a7)**.

Have a great week,
Matthias