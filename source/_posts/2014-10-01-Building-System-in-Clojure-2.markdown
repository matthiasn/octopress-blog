---
layout: post
title: "Building a System in #Clojure - Part 2"
date: 2014-10-01 19:06
comments: true
categories: 
---
**TL;DR: transducers in Clojure, component lifecycle, more core.async. If any of that is of interest to you at all, you may want to read the following article.**

<!-- more -->

**Attention, Attention:** This article is somewhat **work in progress** still. Right now I am working on animations for illustrating stuff. Come back in a day or two for those. Please **provide feedback** already wherever you see potential improvements.


Hello and welcome back to this series of articles about building a system in **[Clojure](http://clojure.org/)**. Last week, we had a first look at dependency injection using the **[component library](https://github.com/stuartsierra/component)** combined with a hint of channel decoupling power. You may want to read **[that article first](http://matthiasnehlsen.com/blog/2014/09/24/Building-Systems-in-Clojure-1/)** if you haven’t done so already.

In this installment, we will look into the first component, the **twitter client**[^1]. It seems like the natural component to start with as it is our application’s point of entry for twitter’s **streaming data**. Since we haven’t done so already, we will also look at the lifecycle of a component. Before that, because this component happens to use them, we will look at transducers, a **[recent addition](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming)** to Clojure. First, though, we will look at the problem at hand, without any language- or library-specific implementation details.

## Twitter Client
Let’s start in **[hammock mode](https://www.youtube.com/watch?v=f84n5oFoZBc)**, without code. What is the problem we are trying to solve? It all starts with the tweet stream from the twitter API. Very briefly, the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** allows us to subscribe to a (near) real time stream of tweets that contain one or more terms out of a set of terms. In the live instance under **[http://birdwatch2.matthiasnehlsen.com](http://birdwatch2.matthiasnehlsen.com/#*)** these terms at the moment happen to be "Ferguson", "ISIS", and "Ebola" - I am interested in all these topics. As long as that subscription does not hit a hard ceiling of **1%** of all the tweets flowing through twitter’s system, we can be sure that we will retrieve all of them. Otherwise the stream will be throttled to a maximum of 1% of what is tweeted at any moment in time. [^2]

Here is how that stream looks like when each chunk is simply printed to the console:

{% img left /images/streaming-api.gif 'animated gif of streaming API output' 'animated gif of streaming API output'%}

For reasons unbeknownst to me, tweets stopped respecting the chunk borders for the last half year. Instead, tweets occasionally span two or three chunks. This makes processing the tweets a little more complicated than we might wish for. One tweet per chunk is straightforward: 

    Receive chunk -> parse JSON into map -> put on conveyor belt (channel)

That looks like functional programming, right? No state to be kept anywhere, just functions producing results that are passed into other functions. But as desirable as that sounds, it does not align with reality. Instead, we need logical reasoning and state. What is the instruction we would give a sentient being? Imagine an intelligent agent standing between two conveyor belts. Imagine that agent being you. Here we go:

“On your left side, there’s a conveyor belt that keeps delivering hundred dollar bills. Put all of them on the other conveyor belt. Some of them come out cut into multiple pieces. These fragments are in correct order. Scotch tape is over there.”

I think we would all know what to do. There is a space where you park fragments of not-yet-complete bills / tweets. Then, with every new fragment, you inspect if the bill is complete and if so, put it back together and pass it on. Let’s try that in code. First, we will need to introduce **transducers** though.

## Transducers
{% blockquote Rich Hickey http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming Cognitect Blog, August 6, 2014 %}
Transducers are a powerful and composable way to build algorithmic transformations that you can reuse in many contexts, and they're coming to Clojure core and core.async.{% endblockquote %}

In a way, a transducer is the **essence** of a computation over data, without being bound to any kind of collection or data structure. Above, before we had to concern ourselves with the incomplete fragments, there was one step of the computation that we could **model as a transducer**: the part where we wanted to parse JSON into a map data structure. 

Imagine we wanted to transform a vector of JSON strings into a vector of such parsed maps. We could simply do this:

{% codeblock lang:clojure %}
(map json/read-json ["{\"foo\":1}" "{\"bar\":42}"])
{% endcodeblock %}

However, the above is bound to the data structure, in this case a vector. That does not have to be the case, though. Rich Hickey provides a good example in his **[transducers talk](https://www.youtube.com/watch?v=6mTbuzafcII)**, likening the above to having to tell the guys processing luggage at the airport the same instructions twice, once for trolleys and again for conveyor belts, where in reality that should not matter. 

We could, for example, not only run the mapping function over every item in a vector but also reuse the same function on every item in a channel, stream or whatever.

With Clojure 1.7, we can now create such a transducing function by simply leaving out the data structure:

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

It may not look terribly useful so far. But this can also be applied to a channel. Say, we want to create a channel that accepts JSON strings and transforms each message into a Clojure map. Simple:

{% codeblock lang:clojure %}
(chan 1 xform)
{% endcodeblock %}

The above creates a channel with a buffer size of one that applies the transducer to every element.

But this does not help in our initial case here, where we know that some of the chunks are not complete but instead have to be glued together with the next one or two pieces. For that, we will need some kind of state. But what if we want to see this aggregation process as a **black box**? Then, the aggregation cannot really have outside state. What if one such transducer could have local state that is contained and not accessible from the outside? It turns out this is where stateful transducers can help.

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

Let's go through this line by line. We have a (private) function named **streaming-buffer** that does not take any arguments. It returns a function that accepts the step function. This step function is the function that will be applied to every step from then on. This function then first creates the local state as an atom[^3] which we will use as a buffer to store incomplete tweet fragments[^4]. Next, this function returns another function which accepts two parameters, r for result and x for the current data item (in this case the - potentially incomplete - chunk). 

In the first line of the let binding, we use the **[-> (thread-first)](http://clojuredocs.org/clojure.core/-%3E)** macro. This macro makes the code more legible by simply passing the result of each function call as the first argument of the next function. Here, specifically, we **1)** concatenate the buffer with the new chunk, **2)** add newlines where missing[^5], and **3)** split the string into a sequence on the line breaks.

Now, we cannot immediately process all those items in the resulting sequence. We know that all are complete except for the last one as otherwise there would not have been another tweet to the right of them. But the last one may not be complete. Accordingly, we derive

{% codeblock lang:clojure %}
(butlast json-lines)
{% endcodeblock %}
 
under the name **to-process**. Then, we reset the buffer to whatever is in that last string: 

{% codeblock lang:clojure %}
(reset! buff (last json-lines))
{% endcodeblock %}

Finally, we have **reduce** call the **step** function for every item in **to-process**:

{% codeblock lang:clojure %}
(if to-process (reduce step r to-process) r)
{% endcodeblock %}

That way, only complete JSON strings are pushed down to the next operation, whereas intermediate JSON string fragments are kept locally and not passed on until certainly complete. That's all that was needed to make the tweets whole again. Next, we compose this with the JSON parsing transducer we have already met above so that this **streaming-buffer** transducer runs first and passes its result to the **JSON parser**.

There's more to do before we can **compose all transducers** and attach them to the appropriate channel. Specifically, we can receive valid JSON from Twitter, which is not a tweet. This happens, for example, when we get a notification that we lag behind in consuming the stream. In that case we only want to pass on the parsed map if it is likely that it was a tweet and otherwise log it as an error. There is one **key** that all tweets have in common which does not seem to appear in any status messages from twitter: **:text**. We can thus use that key as the **predicate** for recognizing a tweet:

{% codeblock tweet? predicate function lang:clojure processing.clj%}
(defn- tweet? [data]
  "Checks if data is a tweet. If so, pass on, otherwise log error."
  (let [text (:text data)]
    (when-not text (log/error "error-msg" data))
    text))
{% endcodeblock %}

Next, we also want to log the count of tweets received since the application started. Let's do this only for full thousands. We will need some kind of counter to keep track of the count. Let's create another **stateful transducer**:

{% codeblock stateful count transducer lang:clojure processing.clj%}
(defn- log-count [last-received]
  "Stateful transducer, counts processed items and updating last-received atom. Logs progress every 1000 items."
  (fn [step]
    (let [cnt (atom 0)]
      (fn [r x] 
        (swap! cnt inc)
        (when (zero? (mod @cnt 1000)) (log/info "processed" @cnt "since startup"))
        (reset! last-received (t/now))
        (step r x)))))
{% endcodeblock %}

This transducer is comparable to the one we saw earlier, except that the local atom now holds the count. Initially, the counter is incremented and then, when the counter is divisible by 1000, the count is logged. In addition, this function also resets the **last-received** timestamp. Of course, this could be factored out into a separate function, but I think this will do.

Now, we can compose all these steps:

{% codeblock composed transducer lang:clojure processing.clj%}
(defn process-chunk [last-received]
  "Creates composite transducer for processing tweet chunks. Last-received atom passed in for updates."
  (comp
   (streaming-buffer)
   (map json/read-json)
   (filter tweet?)
   (log-count last-received)))
{% endcodeblock %}

The above creates a composed function that takes the timestamp atom provided by the TwitterClient component as an argument. We can now use this **transducing function** and apply it to different data structures. Here, we use it to create a channel that takes tweet chunk fragments and delivers parsed tweets on the other side of the conveyor belt.

## Channels 
We will only gradually cover channels as this series unfolds. For now, let us just reiterate what a channel does. A **core.async channel** can be compared to a **conveyor belt**. You place something on that belt and whatever happens on the other side is not your problem. That way, we can build systems that consist of parts that do not depend on each other (except for having expectations about the data they receive). 

In this component, we are dealing with two such channels. The more straightforward one is the channel in the **channels component**.

## Component lifecycle: the TwitterClient-Channels component
This component is the **wiring harness** between the **switchboard** component and the **TwitterClient** component[^6]. Here's how the channels component looks like:

{% codeblock Twitterclient-Channels component lang:clojure component.clj%}
(defrecord Twitterclient-Channels []
  component/Lifecycle
  (start [component] (log/info "Starting Twitterclient Channels Component")
         (assoc component :tweets (chan))) ; channel for new tweets received from streaming API
  (stop [component] (log/info "Stop Twitterclient Channels Component")
        (assoc component :tweets nil)))

(defn new-twitterclient-channels [] (map->Twitterclient-Channels {}))
{% endcodeblock %}

This is a really simple component. On startup, it associates a new channel to its own map, which is passed in under the name **component** and logs its successful startup. When it shuts down, it replaces the **:tweets** component keys with **nil**.

## Component lifecycle: the TwitterClient component
The other component, where all the tweet stream action is happening, is the **TwitterClient** component:

{% codeblock Twitterclient component lang:clojure component.clj%}
(defrecord Twitterclient [conf channels conn chunk-chan watch-active]
  component/Lifecycle
  (start [component] (log/info "Starting Twitterclient Component")
         (let [last-received (atom (t/epoch))
               chunk-chan (chan 1 (processing/process-chunk last-received))
               conn (atom {})
               watch-active (atom false)]
           (http-client/start-twitter-conn! conf conn chunk-chan)
           (pipe chunk-chan (:tweets channels) false)
           (http-client/run-watch-loop conf conn chunk-chan last-received watch-active)
           (assoc component :conn conn :chunk-chan chunk-chan :watch-active watch-active)))
  (stop [component] (log/info "Stopping Twitterclient Component")
        (reset! watch-active false)
        (http-client/stop-twitter-conn! conn)
        (assoc component :conn nil :chunk-chan nil :watch-active nil)))
{% endcodeblock %}

This component encapsulates the behavior of the TwitterClient. Initially, the **last-received** atom is created, which holds a timestamp of the last-received full tweet. We will meet this atom again when we watch the twitter stream and restart it when inactivity periods have been too long. Next, **chunk-chan** is the channel that receives individual tweet string fragments from the chunked HTTP connection and passes tweets on as Clojure maps by virtue of applying the composed transducer we have discussed in detail above. **conn** is a reference to the current connection to Twitter. **watch-active** is a simple boolean that keeps track of whether the watch loop is supposed to keep running or not (more later). Next, we start the TwitterClient by calling a function from the **http** namespace:

{% codeblock lang:clojure %}
(http-client/start-twitter-conn! conf conn chunk-chan)
{% endcodeblock %}

Here's what that function does:

{% codeblock start-twitter-conn! lang:clojure http.clj%}
(defn start-twitter-conn! [conf conn chunk-chan]
  (log/info "Starting Twitter client.")
  (reset! conn (tas/statuses-filter
                :params {:track (:track conf)}
                :oauth-creds (creds conf)
                :callbacks (tweet-chunk-callback chunk-chan))))
{% endcodeblock %}

It basically resets the conn atom and replaces it with a new client (statuses-filter from the twitter.api.streaming namespace) with parameters from the application's configuration and assigns a callback handler:

{% codeblock tweet-chunk-callback lang:clojure http.clj%}
(defn- tweet-chunk-callback [chunk-chan]
  (tas/AsyncStreamingCallback. #(>!! chunk-chan (str %2))
                               (comp println tch/response-return-everything)
                               tch/exception-print))
{% endcodeblock %}

The only thing we need to concern ourselves with regarding the **AsyncStreamingCallback** is the first parameter which is a function disguised as a macro. This function simply places every chunk on **chunk-chan**, which happens to be the channel that processes chunks into tweets.

Back to the component. In the following line, **chunk-chan** is piped into the **tweets** channel from the channels component. That way, our processing chain for the TwitterClient is complete, and processed tweets are put on the conveyor belt that is the only connection between the TwitterClient component and the outside world.  From here, we do not need to concern ourselves with what happens with the tweet on the other side of that conveyor belt.

{% codeblock lang:clojure %}
(pipe chunk-chan (:tweets channels) false)
{% endcodeblock %}

With this in place, we now have a component that establishes a connection to the **streaming API** and puts the received tweets on a channel. But what if the pipes and tubes of the Internet are occasionally clogged? In that case we will want to restart the connection. Let's do it and make the client more resilient:

{% codeblock tweet-chunk-callback lang:clojure http.clj%}
(defn run-watch-loop [conf conn chunk-chan last-received watch-active]
  "run loop watching the twitter client and restarting it if necessary"
  (reset! watch-active true)
  (go-loop [] (<! (timeout (* (:tw-check-interval-sec conf) 1000)))
           (let [since-last-sec (t/in-seconds (t/interval @last-received (t/now)))
                 active @watch-active]
             (when active
               (when (> since-last-sec (:tw-check-interval-sec conf))
                 (log/error since-last-sec "seconds since last tweet received")
                 (stop-twitter-conn! conn)
                 (<! (timeout (* (:tw-restart-wait conf) 1000)))
                 (start-twitter-conn! conf conn chunk-chan))
               (recur)))))
{% endcodeblock %}

I won't go into much detail here as this watch loop is somewhat incidental to the problem of componentizing an application, but here's a brief run-through. When the function is called, it starts the **go-loop** with code that runs in intervals. If the check determines that the last tweet ismore than a defined number of seconds ago (from configuration) and that the client is active, the client is restarted. For that, a function to stop the connection is called before it is started again. Here's that function:

{% codeblock stop-twitter-conn! lang:clojure http.clj%}
(defn stop-twitter-conn! [conn]
  (let [m (meta @conn)]
    (when m (log/info "Stopping Twitter client.")
      ((:cancel m)))))
{% endcodeblock %}

Check out the **[adamwynne/twitter-api on GitHub](https://github.com/adamwynne/twitter-api)** for more details on the twitter-api.

Finally, in the **stop** part of the component lifecycle, **watch-active** is switched off, the client shut down, and all component keys replaced by **nil**.

Right below the component definitions, there are also functions for creating the respective components. This can take parameters like the application's configuration:

{% codeblock lang:clojure %}
(defn new-twitterclient [conf] (map->Twitterclient {:conf conf}))
{% endcodeblock %}

Remember from the last article, where the components were fired up in order (in the animation)? The channels component is created first and then provided to the TwitterClient component. The component library wires all components together and starts them up in the right order. Eventually, this means that **start** is called on each component but only after all dependencies are met.

## Conclusion
Okay, this is it for today. We saw how a component that starts and maintains a connection to the twitter streaming API and that delivers tweets on a channel is created and started. There is a lot more reading material available on these subjects. Instead of providing all the links now, I'd rather refer you to my list of **[Clojure Resources on GitHub](https://github.com/matthiasn/Clojure-Resources)**. There, you'll find a comprehensive list of all the articles I came across while working on this application.

In the next installment, we will probably cover the switchboard component. Considering where the information flows next, that seems like a natural next step. 

I hope you found this useful. If you did, why don’t you subscribe to the <a href="http://eepurl.com/y0HWv" target="_blank"><strong>newsletter</strong></a> so I can tell you when the next article is out? I will also let you know when this one is complete.

lalala

Cheers,
Matthias


[^1]: I only recently started with Clojure. It may be possible an also quite likely that there are better ways of doing things. If so, please let me know, I want to learn stuff.

[^2]: I don't know much about the exact mechanism at play, actual numbers or delivery guarantees. It anyhow doesn’t matter much for the purpose of this application. The interesting views focus on the most retweeted tweets. Now every retweet contains the original tweet under “retweeted_status”, with the current numbers such as retweet and favorite count for the moment in time it was retweeted. For popular ones, we thus receive the original tweet many, many times over. So even if we missed as much as half of all the tweets - which I consider unlikely - the popular tweets would only be updated less often. Worst case: retweet count is off by one or two. I can live with that. In reality, for the current selection of terms, reaching the limit also hardly ever happens. After all, 1% is still millions of tweets per day.

[^3]: **Atoms** are essential to Clojure’s **state model**. Essentially, you have this managed reference that is thread-safe. Whenever we dereference such an atom, we get the state of the world this very second. Then, when you pass the dereferenced value to other parts of the application, it still represents the immutable state of the world at that point in time. It cannot change. Next time I dereference that atom, I will get the new state of the world. Updates to atoms can only happen in transactions, meaning that no two can run at the same time. Thus, we won't have to chase crazy concurrency issues.

[^4]: After initial experimentation with a **[local volatile reference](http://dev.clojure.org/jira/browse/CLJ-1512)**, I decided in favor of a good old atom. The **volatile!** local reference trades off potential race conditions with speed. But there’s no performance issue when we process tweet chunks a few hundred times a second utmost, so why bother and introduce a new concept? Worth to keep in mind, though, when performance is an issue.

[^5]: For whatever reason, the changed behavior of the streaming API also entails that not all tweets are followed by a line break, only most of them. A tiny helper function inserts those missing linebreaks where they are missing between two tweets: ````(str/replace s #"\}\{" "}\r\n{"))````.

[^6]: This wiring harness is kind of the interface of the component. All it provides, though, is a channel. However, what is put on that channel is not checked. Maybe a channel type that checks if a message validates against a schema - maybe provided by prismatic/schema – and if so, forwards the message and otherwise puts it on an error channel or calls an error function. That way, validation errors could be logged while valid messages would be processed as expected. That could actually happen in a filtering transducer. Such a transducer function would be free not only to check but also put mismatches on another channel or log an error.

