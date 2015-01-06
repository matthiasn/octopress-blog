---
layout: post
title: "Weekly Update: Staging server for this blog"
date: 2014-10-04 19:06
comments: true
categories: 
---
This weekly update is mostly about organizational issues with regard to publishing articles and getting feedback for unfinished articles.

<!-- more -->

The other day, I published the unfinished second article in the **Writing a System in Clojure** series to get some preliminary feedback but without announcing the article just yet. What I did not think about, though, was that RSS aggregators notice and pick up new content nonetheless, so that was a little less than perfect on my part.

Ideally, I should have a different way of publishing unfinished stuff in order to get feedback and then only have finalized articles on this blog.

So I came up with something different: a **staging server**. Just like I would want a test environment when developing an application, I also want a test environment for new articles. So I've removed the unfinished article from master for now and put the unfinished article here:

**[http://staging.matthiasnehlsen.com/](http://staging.matthiasnehlsen.com/)**

The implementation of the staging server took some 5 minutes. All I had to do was clone the directory on the server, check out a different branch in the cloned directory, create a new DNS entry for **staging.matthiasnehlsen.com**, and modify the **nginx** configuration so that the staging URL points to that new directory.

I have already got very helpful feedback, so at least publishing the unfinished article was still it. Right now I am working on adding some animations to the new article. I expect to have everything completed by Monday. I will probably split the article in two as the current article is a little too long for my taste.

## Conclusion
While this little modification is probably not terribly useful for you, I believe it will be much more convenient for my workflow. You can also check out the staging server to see new articles in the works. Just note that sharing links may or may not lead to **404's** later on as there is no guarantee whatsoever that those links will last. They should end up in master, but they may well not.

That's all for now. Have a great week,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>