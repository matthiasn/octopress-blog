---
layout: post
title: "Weekly Update: Talk Transcripts, Clojure Architecture, OS X Yosemite"
date: 2014-10-21 19:06
comments: true
categories: 
---
As I have no other article to publish this week, I thought a weekly update would be in order. Last week I wrote about **[making relevant and interesting talks more accessible](http://matthiasnehlsen.com/blog/2014/10/15/talk-transcripts/)**. In the course of that project, I had eleven talks transcribed so far. Not only have I received great feedback from subscribers about how appreciated this is, I have also learned a lot myself by proofreading the transcripts.

<!-- more -->

With all the stuff that I have learned and that I am still learning (with a few more talks in the pipeline), there are a couple of things that I might want to rethink about the architecture of my **[BirdWatch application](https://github.com/matthiasn/BirdWatch)** before describing the architecture further. Let me do that first before the next article on the application's architecture. No worries, I expect to have the next one next week nonetheless, or the week after that the lastest.

## Thoughts from Guy Steele's talk on Parallel Programming

The talk that got me thinking the most about BirdWatch application's architecture is Guy Steele's talk about **[Parallel Programming](https://github.com/matthiasn/talk-transcripts/blob/master/Steele_Guy/ParallelProg.md)**. Not only does he give a great explanation of the differences between paralellism and concurrency, he also gives great insights on the use of accumulators. So what, according to him, is concurrency? Concurrency is when multiple entitites, such as users or processes, compete over scarce resources. In that case, we want efficient ways of utilizing the scarce resources (CPU, memory bandwidth, network, I/O in general) so that more of the entities can be served at the same time on the same box or number of boxes.

Paralellism, on the other hand, is when there are vast resources and we want want to allocate as many as possible to the one (or same number of) entities. One example of this could be that we have a CPU-bound operation, a single user and 8, 12 or however many cores. If the operation is single-threaded, we won't be able to utilize the resources well at all.

We could, of course, split the computation up so that it runs on all the cores (maybe even on hundreds of boxes and thousands of cores), but that's easier said than done. Which brings me to accumulators. The **[accumulator](http://en.wikipedia.org/wiki/Accumulator_(computing\))**, as the name suggests, is where intermediate results are stored while a computation is ongoing. As Guy points out, this has served us extremely well for as long as we didn't have to think about parallelism. If the computation happens serially in a single thread, the accumulator is great, but what do we do when we want to spawn 20 threads on a 32-core machine, or 1000 thread on 100 machines? If each of these had to work with the same accumulator, things would become messy and the accumulator would become the source of contention, with all kinds of ugly coordination and locking. That doesn't scale at all. Guy suggests to use divide-and-conquer instead so that each process in a parallelized approach only creates a partial result which will be combined with other partial results later. He argues for **MapReduce in the small** in addition to MapReduce in the large. I think this makes a lot of sense. That way, the partial results are created in the map phase on a number of threads (potentially on many machines) and the reduction is where the partial results are combined into a final result.

It's funny, I've been thinking along these lines for a little while when considering to move parts of the computation in BirdWatch for previous tweets (wordcount, retweet count, reach,...) to the server side as the current approach uses way more network bandwidth than strictly necessary.

I was mostly thinking about it in terms of **mergability between partial results**, which implies that the merge operation between two partial results is both **associative** and **commutative**. Being associative means that let's say we have partial results A, B, C, D and we can merge them in any way we want, for example (A + B) + C + D or A + (B+ (C + D)) or whatever. As another example, let's say you have a script with 100 pages in 10 stacks. It doesn't matter in which way we build intermediate piles as long as we only merge neighboring piles so that the pile with the higher page counts goes under the one one with the lower page counts. 

## Update to OS X Yosemite
Last weekend, I updated my production laptop to Yosemite. Of course, I did a full backup with **[Carbon Copy Cloner](http://bombich.com)** first and I also made sure that my old backup laptop was still working before I embarked on the update adventure, just in case. That turned out to be a good idea.

The system upgrade did not cause any actual trouble, all went smoothly and I also think that the new design looks great. **BUT IT TOOK FOREVER**. The time estimation was so off, it was worse than the worst Windows installation experiences ever. Overall it probably took **six or seven hours**. I have no idea why. Luckily I had read that in a forum somewhere, so I wasn't too worried and just let the installer do its thing. If you plan on doing the upgrade, I think it was worth it, but **only** do it when you won't need your machine for a while, like over night. Also, you can press **CMD-l** to get a console output, which I found much more reassuring than having the installer tell me it'll need another 2 minutes that turn out to be 2 hours.

## Conclusion
Okay, that's it for today. There are some additions to the **[Clojure Resources](https://github.com/matthiasn/Clojure-Resources)** project and I have also added links to the talk transcripts in there. Please check out the **[talk-transcripts](https://github.com/matthiasn/talk-transcripts)** if you haven't done so already. I would love to hear from you if any of these transcripts helped you at all and made the content more accessible than it would have been otherwise.

Thanks & until next week,
Matthias