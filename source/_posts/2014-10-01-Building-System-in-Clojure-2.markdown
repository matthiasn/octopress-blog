---
layout: post
title: "Building a System in #Clojure - Part 2"
date: 2014-10-01 19:06
comments: true
categories: 
---
**TL;DR: transducers in Clojure, component lifecycle, more core.async. If any of that is of interest to you at all, you may want to read the following article.**

Hello and welcome back to this series of articles about building a system in **[Clojure](http://clojure.org/)**. Last week, we had a first look at dependency injection using the **[component library](https://github.com/stuartsierra/component)** combined with a hint of channel decoupling power. You may want to read **[that article first](http://matthiasnehlsen.com/blog/2014/09/24/Building-Systems-in-Clojure-1/)** if you haven’t done so already.

In this installment, we will look into the first component, the twitter client[^1]. It seems like the natural component to start with as it is our application’s point of entry for twitter’s streaming data. Since we haven’t done so already, we will also look at the lifecycle of a component. Then, because this component happens to use them, we will look at transducers, a **[recent addition](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming)** to Clojure. But first, we will look at the problem on hand, without any language- or library-specific implementation details.

## Twitter Client
Let’s start in **[hammock mode](https://www.youtube.com/watch?v=f84n5oFoZBc)**, without code. What is the problem we are trying to solve? It all starts with the tweet stream from the twitter API. Very briefly, the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** allows us to subscribe to a (near) real time stream of tweets that contain one or more terms out of a set of terms. In the live instance under **[http://birdwatch2.matthiasnehlsen.com](http://birdwatch2.matthiasnehlsen.com/#*)** these terms at the moment happen to be "Ferguson", "ISIS", and "Ebola" just because I am interested in all these topics. As long as that subscription does not hit a hard ceiling of 1% of all the tweets flowing through twitter’s system, we can be sure that we will retrieve all of them. Otherwise the stream will be throttled to a maximum of 1% of what is tweeted at any moment in time. [^2]

From a technical standpoint, here is how that stream looks like:

[insert animated GIF of the stream here]

For reasons unbeknownst to me, tweets have stopped respecting the chunk borders for the last half year. Instead, tweets occasionally span two or three chunks. This makes processing the tweets a little more complicated than we might wish for. One tweet per chunk is straightforward: 

    Receive chunk -> parse JSON into map -> put on conveyor belt (channel)

That looks like functional programming, right? No state to be kept anywhere, just functions producing results that are passed into other functions. But as desirable as that sounds, it does not align with reality. Instead, we need logical reasoning and state. What is the instruction we would give a sentient being? Imagine that intelligent agent standing between two conveyor belts. Imagine that agent being you. Here we go:

“On your left side, there’s a conveyor belt that keeps delivering hundred dollar bills. Put all of them on the other conveyor belt. Some of them come out cut into multiple pieces. These fragments are in correct order. Scotch tape is over there.”

Please let me know if that leaves out anything substantial. I think we would all know what to do. There is a space where you park fragments of not-yet-complete bills / tweets. Then, with every new fragment, you inspect if the bill is complete and if so, put it back together and pass it on. Let’s try that in code. First, we will need to introduce transducers though.

## Transducers
{% blockquote Rich Hickey http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming Cognitect Blog, August 6, 2014 %}
Transducers are a powerful and composable way to build algorithmic transformations that you can reuse in many contexts, and they're coming to Clojure core and core.async.{% endblockquote %}

In a way, a transducer is the **essence** of a computation over data, without being bound to any kind of collection or data structure. Above, before had to concern ourselves with the incomplete fragment, there was one step of the computation that we could model as a transducer and that was the part where we wanted to parse JSON into a map data structure. 

Imagine we wanted to transform a vector of JSON strings into a vector of such parsed maps. We could simply do this:

{% codeblock lang:clojure %}
(map json/read-json ["{\"foo\":1}" "{\"bar\":42}"])
{% endcodeblock %}

However, the above is bound to the data structure. That does not have to be the case though. Rich Hickey provides a good example in his transducers talk likening the above to having to tell the guys processing luggage at the airport the same instructions twice, once for trolleys and once more for conveyor belts, where in reality that should not matter. 

We could, for example, want to not only run the mapping function over every item in in a vector but also re-use the same on every item in a channel, stream or whatever.

With Clojure 1.7, we can now create such a transducing function by simply leaving out the data structure in order to create the transducing function:

{% codeblock lang:clojure %}
(def xform (map json/read-json))
{% endcodeblock %}

Now, we can apply this transducing function to different kinds of data structures. For example, we could transform all entries from a vector into another vector, like so:

{% codeblock lang:clojure %}
(into [] xform ["{\"foo\":1}" "{\"bar\":42}"])
{% endcodeblock %}

Or into a sequence, like this:

{% codeblock lang:clojure %}
(sequence xform ["{\"foo\":1}" "{\"bar\":42}"])
{% endcodeblock %}

This may not look terribly useful so far. But this can also be applied to a channel. Say we want to create a channel that accepts JSON strings and transforms each message into a Clojure map. Simple:

{% codeblock lang:clojure %}
(chan 1 xform)
{% endcodeblock %}

The above creates a channel with a buffer size of one that applies the transducer to every element.

But this does not help for our initial case here, where we know that some of the chunks are not complete but instead have to be glued together with the next one or two pieces. For that, we will need some kind of state. But what if we want to see this aggregation process as a black box? Then, the aggregation cannot really have outside state. What if one such transducer could have local state that is contained and not accessible from the outside? It turns out this is where stateful transducers can help.

Here’s how that looks like in code:

{% codeblock stateful streaming-buffer transducer lang:clojure processing.clj%}
(defn- streaming-buffer []
  (fn [step]
    (let [buff (atom "")]
      (fn [r x]
        (let [json-lines (-> (str @buff x) (insert-newline) (str/split-lines))
              to-process (butlast json-lines)]
          (reset! buff (last json-lines))
          (if to-process (reduce step r to-process) r))))))
{% endcodeblock %}

Let's go through this line by line. We have a private function named **streaming-buffer** that does not take any arguments. It returns a function that accepts the step function. This is the function that will be applied to every step onwards. This function then first creates the local state as an atom[^3] which we will use as a buffer to store incomplete tweet fragment. Next, this function returns another function which accepts two parameters, r for result and x for the current data item (in this case the - potentially incomplete - chunk). 

In the first line of the let binding, we use the **[-> (thread-first)](http://clojuredocs.org/clojure.core/-%3E)** macro. This macro makes the code more legible by simple passing the result of each function call as the first argument of the next function. Here, specifically, we are 1) concatenating the buffer with the new chunk 2) adding newlines where missing[^4], and 3) split the string into a sequence on the line breaks.

Now, we cannot process all those items in the sequence immediately. We know that all except for the last are complete, otherwise there would not have been another tweet to the right of them. But the last one is potentially not complete. Accordingly, we derive

{% codeblock lang:clojure %}
(butlast json-lines)
{% endcodeblock %}
 
under the name **to-process**. Then, we reset the buffer to whatever is in that last string: 

{% codeblock lang:clojure %}
(reset! buff (last json-lines))
{% endcodeblock %}

Finally, we let **reduce** call the **step** function for every item in 

{% codeblock lang:clojure %}
(if to-process (reduce step r to-process) r)
{% endcodeblock %}

That way, only complete JSON strings are pushed down to the operation, whereas intermediate JSON string fragments are kept locally and not passed on until appropriate. That's all that was needed to make the tweets whole again. Next, we compose this with the JSON parsing transducer we already met above so that this **streaming-buffer** transducer runs first and passes its result to the JSON parser.

There's more to do before we can compose all transducers and attach that to the appropriate channel. Specifically, we can receive valid JSON from Twitter which is not a tweet. This for example happens when we get a notification that we lag behind in consuming the stream. In that case, I wanted to only pass the parsed map on if it likely was a tweet and otherwise log it as an error. This is quite simple if we agree on the existence of a **:tweet** key as the predicate for recognizing a tweet:

{% codeblock tweet? predicate function lang:clojure processing.clj%}
(defn- tweet? [data]
  "Checks if data is a tweet. If so, pass on, otherwise log error."
  (let [text (:text data)]
    (when-not text (log/error "error-msg" data))
    text))
{% endcodeblock %}

What you can see above is that we are managing the function state in an atom. Read the footnotes to find out more if you like.  The atom is passed in initially when the returned function of arity 2 is created. That atom ref will not change over the lifecycle of the application. Only the value that we can dereference actually changes.[^5]

This is where a stateful transducer helps. But first things first, what is a transducer? A transducer is the essence of a computation over data. 




## Channels 
We will only gradually cover channels as this series unfolds. For now, let us just reiterate what channel does. A core.async channel can be compared to a conveyor belt. You place something on that belt and whatever happens on the other side is not your problem. That way, we can build systems that consist of parts that do not depend on each other (except for having expectations about the data they receive). In this component, we are dealing with two such channels. The more straightforward one is the channel in the channels component. This component is the wiring harness between the the switchboard component and the twitterclient component[^6].


## Transducers


## The component lifecycle
So last week, we have established that a component is some kind of an object. Hmm, are we not in this to get away from object-oriented programming? But not so fast, not all is bad with OO. In particular, most applications will need some state somewhere, and be it only for storing a database or long-lived HTTP connection.

## Conclusion
Okay, this is it for today. In the next installment, will probably cover the switchboard component. Considering where the information flows next, that seems like a natural next step. I hope you found this useful. If you did, why don’t you subscribe to the newsletter so you don’t miss the next installment? 

Cheers,
Matthias


[^1]: I have only recently started with Clojure. It is not only entirely possible but also quite likely there are better ways of doing things. If so, please let me know, I want to learn stuff.

[^2]: I know not much about the exact mechanism at play, actual numbers or delivery guarantees. It doesn’t matter much either for the purpose of this application. The interesting views focus on the most retweeted tweets. Now every retweet contains the original tweet under “retweeted_status”, with the current numbers such as retweet and favorite count for the moment in time it was retweeted. For popular one, we thus receive the original tweet many, many times over. So even if we missed as much half of all the tweets - which I find unlikely - the popular tweets would only be updated less often. Worst case: retweet count is off by one or two. I can live with that. In reality, for the current selection of terms, reaching the limit also hardly ever happens.

[^3]: After initial experimentation with a local volatile reference http://dev.clojure.org/jira/browse/CLJ-1512 I decided for a good old atom. The volatile! local reference trades off potential race conditions with speed. But there’s no performance issue when we at most process tweet chunks at most a few hundred times a second, so why bother? Worth to keep in mind though for when performance is an issue.

[^4]: For whatever reason, the changed behavior of the streaming API also entails that not all tweets are followed by a line break, only most of them. A tiny helper function inserts those missing linebreaks where they are missing between two tweets: ````(str/replace s #"\}\{" "}\r\n{"))````.

[^5]: Atoms are essential to Clojure’s state model. Essentially, you have this managed reference that is thread-safe because any current value of the state of the world this very second. Then, when you pass it to other parts of the application, it still represents the immutable state of the world at that point in time. It cannot change. Next time I dereference that atom, I get the new state of the world. Updates to atom can only happen in transactions, meaning that no two can run at the same time. Thusly, we will not have to chase crazy concurrency issues.

[^6]: This wiring harness is kind of the interface of the component. All it provides though is a channel. What is put onto that channel is not checked though. Maybe a channel type that checks if a message validates against a schema - maybe provided by prismatic/schema – and if so, forwards the message and otherwise puts it on an error channel or calls an error function. That way, validation errors could be logged while valid messages would be processed as expected. That could actually happen in a filtering transducer. Such a transducer function would be free to not only check but also put mismatches on another channel or log an error.

