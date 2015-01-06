---
layout: post
title: "Weekly Update: Clojure, Clojure, Clojure and a nasty cold"
date: 2014-09-16 19:06
comments: true
categories: 
---
In this weekly update, I will just give you a very brief update on what I've been doing. Most notably, I have refactored the **[Clojure](http://clojure.org)** version of my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application to use Stuart Sierra's **[component library](https://github.com/stuartsierra/component)**. Other than that, I am calling in sick for the week. 

<!-- more -->

<a href="http://birdwatch2.matthiasnehlsen.com" target="_blank"><img class="left" src="/images/bw-clj.gif" title="BirdWatch in action" alt="BirdWatch in action"></a>

<br />

Above you can see what the latest **all-Clojure** version looks like. I have added two features: *a)* aggregation and sorting by **reach** and *b)* a counter for the total number of tweets indexed, which is updated every ten seconds. You can see a live version by clicking on the animated GIF.

## Componentizing BirdWatch
Over the weekend, I have componentized the server side of **[BirdWatch](https://github.com/matthiasn/birdwatch/)**. In terms of functionality I had been content with the earlier version, but in terms of the structure, I started to recognize something that I have **learned to dread**: an application where everything depends on everything. Okay, in this case at least there, were no circular dependencies (any more), but there were still way too many dependencies between namespaces, in a way that I had seen way too often in past projects to lull myself into being satisfied. I don't even like real **[spaghetti](http://en.wikipedia.org/wiki/Spaghetti)** all that much.

The **[component library](https://github.com/stuartsierra/component)** offers help by allowing us to structure an application into components (and boundaries between them) and then wire them together by means of **[dependency injection](http://en.wikipedia.org/wiki/Dependency_injection)**. It took a moment or two to wrap my head around it, but once I had, I was convinced that I wanted to reap the benefits of **DI** and rewrite my application. The library's description contains a fair warning that it is somewhat difficult to refactor an existing application to use it throughout, but I can now say for sure that it can be done and that it's worth it.

As a result I have an application where ONLY the main namespace depends on the different components it wires together via dependency injection. Other than that, the different namespaces know nothing about each other. Communication between the different components takes places via **[core.async channels](https://github.com/clojure/core.async)**, which all live in a single component. The component holding the channels is then injected into the other components as a dependency.

I find this new architecture beautiful and I will surely write more about it soon. Until then, I could use **your help**. I am really just getting started with Clojure, and this is my first real application written in it. I would love to have more knowledgeable Clojurians review the code and point out to me possible improvements. Right now, I would especially appreciate your feedback regarding the **[server-side code](https://github.com/matthiasn/BirdWatch/tree/master/Clojure-Websockets/src/clj/birdwatch)**.

## Are Clojure developers happier?
I recently read an article that **[Clojure developers are the happiest](http://www.itworld.com/big-data/433057/clojure-developers-are-happiest-developers)** developers. While I cannot honestly say that the article provides hard evidence, I can say for sure that I, for one, enjoy programming in **[Clojure](http://clojure.org)** more than I enjoyed programming in other languages in a while. I have also found the community rto be eally helpful. Yesterday, I had a problem I couldn't figure out myself. After scratching my head for way too long, it only took a few minutes after joining the **[Clojure room](http://clojure-log.n01se.net/date/2014-09-16.html)** on **IRC** for me to be happily coding again.

## Clojure Resources
I recently liberated my accumulated list of bookmarks on Clojure-related stuff and have since added every new link and useful link I came across. I am now working on making it a habit of writing a sentence or two about all the new resources I discover. In the past couple of days, I was really happy to see that people seem to find this compilation useful. Please go check it out if you haven't already: **[Clojure-Resources on GitHub](https://github.com/matthiasn/Clojure-Resources)**.

## Closing remarks
Okay, back to bed - I need to get rid of this nasty cold ASAP. I have stuff to do; stuff other than coughing. The bugs came without invitation last week and now they don't seem inclined to leave. But on the upside, I went to the doctor today and he gave me a prescription for three different medications and assured me that I'd survive.

Have a great remaining week,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>