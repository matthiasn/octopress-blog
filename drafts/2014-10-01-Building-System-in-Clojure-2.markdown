---
layout: post
title: "Building a System in Clojure - Part 2"
date: 2014-10-01 19:06
comments: true
categories: 
---
**TL;DR: transducers in Clojure, component lifecycle, more core.async. If any of that at all concerns you, you may want to read the following article.**

Hello and welcome back to this series of articles about building a system in Clojure. Last week, we have had an initial look at dependency injection using the component library, together with a hint of channel decoupling power. You may want to read that article first if you haven’t done so already.

In this installment, we will look into the first component, the twitter client[^1]. It seems like the natural component to start with as it is our application’s point of entry for twitter’s streaming data. Since we haven’t done so already, we will also look at the lifecycle of a component. Then, because this component happens to use transducer, we will look at transducers, a recent addition to Clojure. But first, we will look at the problem at hand, without any language- or library-specific implementation details.

## Twitter client
Let’s start in hammock mode, without code. What is the problem we are looking at? It all starts with the tweet stream from the twitter API. Very briefly, the twitter streaming API allows you to subscribe to a (near) real time stream of tweets that contain one or more of a set of terms. In the live instance these terms at the moment happen to be "Ferguson", "ISIS" and "Ebola", just because I am interested in all those topics. As long as that subscription does not hit a hard ceiling of 1% of all the tweets flowing through twitter’s system, we are assured that we will retrieve all of them, otherwise the stream is throttled to a maximum of 1% of what is tweeted any moment in time. [^2]

From a technical standpoint, here is how that stream looks like:



For reasons unbeknownst to me, for the last half year, tweets don’t respect the chunk borders any longer. Instead, occasionally, tweets span two or three chunks. This makes processing the tweets a little more complicated than we might wish for. One tweet per chunk is straightforward: 

    Receive chunk -> parse JSON into map -> put on conveyor belt (channel)

That looks like functional programming, right? No state to be kept anywhere, just functions having results that get passed into other functions. But as desirable as that sounds, it does not align with reality. Instead, we need logical reasoning and state. What is the instruction we would give a sentient being? Imagine that intelligent agent is standing between two conveyor belts. Imagine that agent being you. Here we go:

“On your left side, there’s a conveyor belt that keeps delivering hundred dollar bills. Put all of them on the other conveyor belt. Some of them come cut into multiple pieces. Those fragments are in correct order. Scotch tape is over there.”

Please let me know if that leaves anything substantial out. There is a space where you park fragments of not-yet-complete bills / tweets. Then, with every new fragment, you inspect if the bill is complete and if so, put it back together and pass it on. Let’s try that in code.

We will need some kind of state. But what if we want to see this aggregation process as a black box? Then, that aggregation cannot have outside state. What if one such a transducer could have local state that is contained and not accessible from the outside? 

Here’s how that looks like in code:


[^3]

What you can see above is that we are managing the function state in an atom. Read the footnotes to find out more if you like.  That atom is passed in initially when the returned function of arity 2 is created. That atom ref will not change over the lifecycle of the application. Only the value that we can dereference actually changes.[^4]

This is where a stateful transducer helps. But first things first, what is a transducer? A transducer is the essence of a computation over data. 




## Channels 
We will only gradually cover channels as this series unfolds. For now, let us just reiterate what channel does. A core.async channel can be compared to a conveyor belt. You place something on that belt and whatever happens on the other side is not your problem. That way, we can build systems that consist of parts that do not depend on each other (except for having expectations about the data they receive). In this component, we are dealing with two such channels. The more straightforward one is the channel in the channels component. This component is the wiring harness between the the switchboard component and the twitterclient component[^5].


## Transducers


## The component lifecycle
So last week, we have established that a component is some kind of an object. Hmm, are we not in this to get away from object-oriented programming? But not so fast, not all is bad with OO. In particular, most applications will need some state somewhere, and be it only for storing a database or long-lived HTTP connection.

## Conclusion
Okay, this is it for today. In the next installment, will probably cover the switchboard component. Considering where the information flows next, that seems like a natural next step. I hope you found this useful. If you did, why don’t you subscribe to the newsletter so you don’t miss the next installment? 

Cheers,
Matthias


[^1]: I have only recently started with Clojure. It is not only entirely possible but also quite likely there are better ways of doing things. If so, please let me know, I want to learn stuff.

[^2]: I know not much about the exact mechanism at play, actual numbers or delivery guarantees. It doesn’t matter much either for the purpose of this application. The interesting views focus on the most retweeted tweets. Now every retweet contains the original tweet under “retweeted_status”, with the current numbers such as retweet and favorite count for the moment in time it was retweeted. For popular one, we thus receive the original tweet many, many times over. So even if we missed as much half of all the tweets - which I find unlikely - the popular tweets would only be updated less often. Worst case: retweet count is off by one or two. I can live with that.

[^3]: After initial experimentation with a local volatile reference http://dev.clojure.org/jira/browse/CLJ-1512 I decided for a good old atom. The volatile! local reference trades off potential race conditions with speed. But there’s no performance issue when we at most process tweet chunks at most a few hundred times a second, so why bother? Worth to keep in mind though for when performance is an issue.

[^4]: Atoms are essential to Clojure’s state model. Essentially, you have this managed reference that is thread-safe because any current value of the state of the world this very second. Then, when you pass it to other parts of the application, it still represents the immutable state of the world at that point in time. It cannot change. Next time I dereference that atom, I get the new state of the world. Updates to atom can only happen in transactions, meaning that no two can run at the same time. Thusly, we will not have to chase crazy concurrency issues.

[^5]: This wiring harness is kind of the interface of the component. All it provides though is a channel. What is put onto that channel is not checked though. Maybe a channel type that checks if a message validates against a schema - maybe provided by prismatic/schema – and if so, forwards the message and otherwise puts it on an error channel or calls an error function. That way, validation errors could be logged while valid messages would be processed as expected. That could actually happen in a filtering transducer. Such a transducer function would be free to not only check but also put mismatches on another channel or log an error.

