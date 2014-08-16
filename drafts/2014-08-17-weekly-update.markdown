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

In case you don't know this (destructive) git command, this is what it does:

{% blockquote git-reset documentation http://git-scm.com/docs/git-reset %}
--hard
Resets the index and working tree. Any changes to tracked files in the working tree since <commit> are discarded.
{% endblockquote %}

Okay, think about that one. The documentation says it loud and clear. Changes to tracked files since HEAD, which is the current commit to which I have added above, are **discarded**. Oops.

I have no idea what I was thinking, but the changes that I had added but not committed appeared to be lost. Not a surprise really when you think about the description above. But for me in that second it was like getting hide by a truck that came out of nowhere.

So I really wanted the fruits of my previous and tedious labor back.

I tried ````git reflog```` but that would not help at all, I did not find anything useful in there. Luckily though, this helped:

git fsck --lost-found --verbose
cd .git/lost-found/other/
find . -print | xargs grep someUniqueTextHere

So basically, git only runs a garbage collection every once in a while. Using the commands above, I tell git to run a fschk and store write out the lost and found items. Then I can find the one I was looking for by piping the result of find in that directory to grep, looking for some specific text I remembered from the work I had lost. 

Here are some helpful links:
http://stackoverflow.com/questions/5788037/recover-from-git-reset-hard
http://gitready.com/advanced/2009/01/17/restoring-lost-commits.html
http://git-scm.com/docs/git-fsck

## Octopress, one year later
I am using Octopress for generating my blog. It has served me alright, but I don't like it a lot and I wouldn't use it again.  I am just not enough of a Ruby guy to tinker around with it. I cannot even fix issues when I try to update it. The other night I wasted two precious hours on trying to get my installation current so that I would benefit from newer features, without success. And quite frankly I have no intentions of becoming a Ruby expert any time soon or ever. 

Along those lines, I was thinking about rolling my own blogging engine. Yeah I know what you're thinking. At some point every (technical) blogger will reach that stage where you want to create your own blogging engine. But hear me out, this one might be a little different. I am thinking about making use of Polymer and Web Components. Now that Google robots run JavaScript, the blog would get indexed just fine. Why not load the markdown directly from a web component handling the current post and then let that render itself? Polymer handles browser compatibility, but I do not care much about IE6 users and the like anyway. At the same time that would give me a chance to dive deeper into web components. The idea of a shadow DOM is just brilliant, and I hope web components will have the success they deserve. Finally a vendor-agnotic way of building web application.

## Clean coder
Last week I mentioned that I was starting to take notes about books that I am reading, the book being Clean Coder by uncle bob. I did more reading this week and created a separate page for that. I will add to that page as I read more. The short version: every serious developer needs to read this book. Full stop.


## Persisting Iptables 




Have a great week,
Matthias