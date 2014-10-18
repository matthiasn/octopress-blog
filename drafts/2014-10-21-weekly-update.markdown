---
layout: post
title: "Weekly Update: Talk Transcripts, Clojure Architecture, OS X Yosemite"
date: 2014-10-21 19:06
comments: true
categories: 
---
As I have no other article to publish this week, I thought a weekly update would be in order. Last week I wrote about making relevant and interesting talks more accessible. In the course of that project, I had 9 talks transcribed so far. This project has been a winner so far. Not only have I received great feedback from subscribers about how appreciated this is, I have also learned a lot myself by proofreading the transcripts.

<!-- more -->

With all the stuff that I have learned and that I am still learning (with a few more talks in the pipeline), there are a couple of things that I might want to rethink about the architecture of my BirdWatch application before describing the architecture further. Let me do that first before the next article. No worries, I expect to have the next one next week nontheless, or the week after that the lastest.

## Thoughts from Guy Steele's talk on Parallel Programming

The talk that got me thinking the most about BirdWatch application's architecture is Guy Steele's talk about **[Parallel Programming](https://github.com/matthiasn/talk-transcripts/blob/master/Steele_Guy/ParallelProg.md)**. Not only does he give a great explanation of the differences between paralellism and concurrency, he also gives great insight on the use of accumulators. So what, according to him, is concurrency? Concurrency is when multiple entitites, such as users or processes, compete over scarce resources. In that case, we want efficient ways of utilizing the scarce resources (CPU, memory bandwidth, network, I/O in general) so that more of the entities can be served at the same time on the same box or number of boxes. 

Paralellism, on the other hand, is when there are vast resources and we want want to allocate as many as possible to the one (or same number of) entities. One example of this could be that you have a CPU-bound operation, a single user and 8, 12 or however many cores. If the operation is single-threaded, we won't be able to utilize the resources well at all.

We could, of course, split the computation up so that it runs on all the cores (maybe even on hundreds of boxes and thousands of cores), but that's easier said than done. Which brings us to accumulators. The accumulator, as the name may suggest, is where intermediate results are persisted. As Guy rightfully points out, this has served as extremely well for as long as we didn't have to think about parallelism.

It's funny, I've been thinking along these lines for a little while when considering to move parts of the computation (wordcount, retweet count, reach,...) to the server side but I was somewhat lacking the terminology for that. I was mostly thinking about it in terms of mergability between partial results, which implies that the merge operation between two partial results is both associative and commutative. Being associative means that let's say we have partial results A, B, C, D and we can merge them in any way we want, for example (A + B) + C + D or A + (B+ (C + D)) or whatever. As another example, let's say you have a script with 100 pages in 10 stacks. It doesn't matter in which way we build intermediate piles as long as we only merge neighboring piles so that the pile with the higher page counts goes under the one one with the lower page counts. 





Until next week,
Matthias