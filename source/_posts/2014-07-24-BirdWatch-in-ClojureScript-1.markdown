---
layout: post
title: "BirdWatch with ClojureScript and Om explained, Part 1"
date: 2014-07-24 08:30
comments: true
categories: 
---
**This article is currently Work in Progress**

**[Last week](http://matthiasnehlsen.com/blog/2014/07/17/BirdWatch-in-ClojureScript/)** I wrote about having written my first actual application using **[ClojureScript](https://github.com/clojure/clojurescript)** and **[Om](https://github.com/swannodette/om)**, a web client for my **[BirdWatch](http://birdwatch.matthiasnehlsen.com/cljs/#*)** application. This week I first want to talk about my experience with ClojureScript and Om thus far. Then I want to go into part 1 of the implementation details. I am fully aware that what has come out of it thus far is far from elegant in terms of pretty much everything. But in my defense, it does appear to work :)

<!-- more -->

So my experience. I have been reading articles and books about **[Clojure](http://clojure.org)** for a while and it did seem to resonate with me. I like this whole **[homoiconicity](http://en.wikipedia.org/wiki/Homoiconicity)** thing. Code and data are basically the same thing and they thus share the same data structures. Code is really data, representing the **[abstract syntax tree (AST)](http://en.wikipedia.org/wiki/Abstract_syntax_tree)** directly. Now my initial reaction to this concept was that it must be rather low-level to do so, but to my surprise the opposite is true with a **[Lisp](http://en.wikipedia.org/wiki/Lisp_(programming_language\))**; you gain a tremendous amount of expressiveness. I also really like that **a)** Clojure introduces **[additional data structures](http://clojure.org/data_structures)** besides the obvious **list**, i.e. Maps, Sets and Vectors and **b)** that it is idiomatic to simply use those.

Sure, there is something to be said about types and how **[type safety](http://en.wikipedia.org/wiki/Type_safety)** makes working on large-scale applications less error-prone. But at the same time I have a hunch that having hundreds of (case) classes complects an application in a way that idiomatic usage of a map does not. Have you seen this before, where you have cascades of only slightly differing data structures, when the next step of a computation adds only a little bit of data and calls that a new thing, modeled as a different something? That can become difficult to reason about, particularly when there are no useful design documents outlining how one morphs into the other.

But then again I am somewhat afraid of the lack of compile time errors when I call a function with something of a wrong type. So as of now, that is an unsolved question for me. May my endeavor into Clojure and thus Lisp afford me with a more educated opinion on this matter. Against strongly typed systems I have to say that I have seen way too many runtime failures that **a)** the type system and the compiler did not catch and **b)** really came from the application being so incidentally complex that the consequences of changes were by all means hard to grasp even for the most senior team members.

I guess I really need some production experience with Clojure in order to get to a fair and substantial comparison of the different apporaches. But at least this application is a start. And learning a new language has never hurt anyone, I guess.

So how is this going as an experience so far, you might ask.

Here are my perceived pros:

* When crafting functions in Clojure, I just feel more like playing an instrument. It feels more playful.
* Code tends to be short and concise.
* The core of the language is easily understood, at least as far as my limited understanding goes.
* Immutability is great, no more thinking about concurrency issues and mutating state in different places.
* Om uses Facebook's ReactJS, a UI rendering library that I have tried out previously and that I am somewhat familiar with.
* Refactoring is fun, I have found spotting repetitive parts among functions and then factoring these parts out into new and shared functions not only easier compared to other languages but also pleasant.
* Maps and sets and, by importing an external library in the case of this application, priority maps are a great thing to have, much nicer than only having JavaScript arrays and objects at your disposal.
* Time and time again I am amazed that replacing an external dependency with a newer version generally seems to work in Clojure. This is the complete opposite of my experience in Scala. I has gotten better over the last year with Scala for sure, but it is nowhere near as smooth as it appears to be with Clojure. Why do you think that is?

Here are some cons, as well:

* As of now, I feel like I can be more productive with plain JavaScript and ReactJS in comparison to Om. This is specific to UI problems, with general data manipulation I feel I am in the process of becoming more productive with Clojure already when compared to JavaScript and **[underscore](http://underscorejs.org)** and definitely more productive than with plain JavaScript [^1]
* Testing. I have tried out **[Chas Emerick](http://cemerick.com)**'s **[clojurescript.test](https://github.com/cemerick/clojurescript.test)** and while it seems do do its job alright, I don't feel I have fully figured out how to use it. I am using it with the **[leiningen test runner](https://github.com/cemerick/clojurescript.test#using-with-lein-cljsbuild)** and there are two things I find less than pleasing. First, every time I call *lein test* a full compile is started, even if I have *lein cljsbuild auto* for the *test* task running in another terminal window. This seems unnecessary. Am I missing something, maybe watch and re-run the tests automatically when file system changes are detected? Second, the output is plain black and white. How am I supposed to do **[red-green refactoring](http://www.jamesshore.com/Blog/Red-Green-Refactor.html)** with this? But seriously, this might be mostly cosmetic but still I like to see green in my tests as that soothes my mind. When I see red in tests, my alertness level goes up. Black and white output excites none of these emotions. Is there just something wrong with my installation or vision that I don't see colors in my test output?
* Performance. The application so far is MUCH slower than the JavaScript counterpart. When processing preloaded tweets, the plain JavaScript version (used in the **[AngularJS](http://birdwatch.matthiasnehlsen.com/angular/#/)** and **[ReactJS](http://birdwatch.matthiasnehlsen.com/#/)** clients) is probably ten times as fast. Click those previous links and see what I mean. The previous tweets are loaded by an Ajax call in chunks of 500 items and loading and processing each chunk takes maybe a second. Now when you open the **[ClojureScript version](http://birdwatch.matthiasnehlsen.com/cljs/#*)**, you see that it takes much longer to process the previous items. I suspect keywordizing the JSON when converting a tweet to a Clojure Map could be the problem, but I don't know for sure. Please enlighten me and, better yet, suggest a more performant way of ingesting the JSON. 
* Application state in a single large map stored in an **[atom](http://clojure.org/atoms)** can be cumbersome, I would not mind having something like objects here and there. I am not terribly happy with this, I have to admit, but it did seem to be what is going on in the Om tutorials. I have looked at **[Stuart Sierra](http://stuartsierra.com)**'s **[component library](https://github.com/stuartsierra/component)** and it does seem to offer a good approach to compenentizing the application, but I have yet to find the time to try it out.
* Interacting with the state from inside Om is different than interacting with the state atom from other parts of the application. **[Om-tools](https://github.com/Prismatic/om-tools)** seem to be an interesting way around this, will need to give that a try and see if that feels good.

By the way, regarding performance, I have seen the same problems with my naïve Scala.js approach before. I have not played around with that one again yet ever since my first attempt back in January. That is mostly for the lack of a ReactJS binding that is anywhere near as complete as Om. I'll be happy to give it a try again once ReactJS support is better.

#Introduction to Clojure
First of all, you will need to understand a few very basic things about Clojure being a **[Lisp](http://en.wikipedia.org/wiki/Lisp_(programming_language\))** [^3]. Feel free to skip this section if you know the basics already. I hope you will be able to follow along even if you've never tried Clojure or a Lisp before. So the basic idea in a Lisp is the List (no wonder, as Lisp stands for List Programming), a **[singly linked list](http://en.wikipedia.org/wiki/Singly_linked_list#Singly_linked_lists)**, to be precise. This list can hold both code and data. Let's see how that looks like. You can try these examples out using the **[REPL](http://en.wikipedia.org/wiki/Read–eval–print_loop)** in **[Leiningen](http://leiningen.org)** by running ````lein repl```` from your command line. 

This is an empty list: ````()```` It evaluates to itself.

When the list is not empty, the first item in the list will be evaluated: ````(some-function "a" "b")```` 
Here, *some-function* will be called with the two arguments "a" and "b". Example ````(print "Hello World!")```` Sweet, that's all there is to **[Hello World](http://en.wikipedia.org/wiki/Hello_world_program)**.

The first item in a list has to implement the *IFn* interface meaning it must be possible to call the item as a function. Try this: ````("a" "b")````. Not surprisingly, the string "a" is not a function, causing this to fail. You can however **quote** the list to prevent evaluation, like this: ````'("a" "b")````. Now we can use the list to store items without the first one being implemented.

Luckily, Clojure also has a **vector** which is best compared to an array. You can use it in place of a quoted list, and in fact it is idomatic to do so when you do not want the first item evaluated. Example ````[1 2 3]```` 

When you want to name something, you have different ways of doing so. The first one is *def*, you can use this to name stuff in the top level of a namespace. Example ````(def foo [1 2 3])```` This creates a vector named *foo* which you can then refer to from elsewhere. After typing in the previous example, you will see that now you can just type ````foo```` in the REPL and get the vector we have defined previously.

Or you can use the **let-binding** to name things locally, for example inside a function body, like so ````(let [foo [1 2 3]])```` Here, you can only refer to *foo* inside form. Let's use *foo*: ````(let [foo [1 2 3]] (print foo))```` You should see the vector being printed in your REPL.

Functions can be defined as follows: ````(fn [a] (+ a 1))```` with this, we have defined a function that adds 1 to the specified argument. 
You can use it as an anonymous function like this: ````((fn [a] (+ a 1)) 2)```` Remember, the first item in a list will be evaluated, and this happens to be the function we just defined. However, this is a little clumsy. We can also store the function in a def: ````(def add-one (fn [a] (+ a 1)))```` now we can call the function, like so ````(add-one 2)````. 

However, this can even be simpler using the **defn macro**, like so: ````(defn add-one [a] (+ a 1))```` 

Sometimes, you may want to create a function in place using the anonymous function literal, like so: ````(#(+ % 1) 2)````. This does the same as the anymous function in the first position of the list as above, except for being shorter. During compilation, the ````#(+ % 1)```` expands into ````(fn [a] (+ a 1))````, where the percent sign denotes the first argument. If there are multiple arguments, you use *%1*, *%2* and so on instead (1-based).


**TO BE CONTINUED**


#Application architecture
Let us now have a look at the implementation details [^4]. 

The most important part to understand is that the application state lives in one large **[atom](http://clojure.org/atoms)**. When the application is started, this atom is populated with the return of a function that returns a map representing a clean slate. Here is how that looks like:

{% codeblock Function returning initial application state lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/util.cljs util.cljs%}
(defn initial-state [] 
  "function returning fresh application state"
  {:count 0
   :n 10
   :retweets {}
   :tweets-map {} 
   :search-text ""
   :page 1
   :search "*"
   :stream nil
   :sorted :by-rt-since-startup
   :by-followers (priority-map-by >)
   :by-retweets (priority-map-by >)
   :by-favorites (priority-map-by >)
   :by-rt-since-startup (priority-map-by >)
   :by-id (priority-map-by >)
   :words-sorted-by-count (priority-map-by >)})
{% endcodeblock %}

All the keys in this map are **[keywords](http://clojure.org/data_structures#Data%20Structures-Keywords)**. Keywords have the great property that we can use them as functions that take a map as an argument and that then return the value for this key. We will see that in action below.

Upon startup of the application, the function above is called for populating the state atom:

{% codeblock Function returning initial application state lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/core.cljs core.cljs (lines 13 to 16)%}
;;; Application state in a single atom
;;; Will be initialized with the map returned by util/initial-state.
;;; Reset to a new clean slate when a new search is started.
(def app-state (atom (util/initial-state)))
{% endcodeblock %}

Then the reference to this **[atom](http://clojure.org/atoms)** is passed around, which is dereferenced wherever a change occurs and then updated back into the atom. It is important to note that clojure data structures are immutable. Immutability guarantees that you can pass data structures around without having to worry that whoever you pass it to might change the data. State changes only can only happen inside a transaction, a new and altered version of the state is passed back. The transaction part would also mean that no other process could alter state at the same time, in that case the later transaction would be retried when the first one has succeeded. This would be particularly useful when running in a multithreaded environment. However, the JavaScript code resulting from the ClojureScript compilation process runs in a single threaded event loop. In that environment, there's only ever one thing happening at the same time anyway.

Using this map generated from a helper function makes it trivial to reset the application state at a later point [^2], we can simply swap the current state with the clean slate map.

##Ingesting tweets
Tweets get into the system for further analysis in two ways. First, there is a Server Sent Event stream continously delivering new matches to a query, with low latency (typically around a second between sending tweet and having it show up in the application). Then also previous tweets are loaded. Both are triggered in the **start-search** function:

{% codeblock start-search function lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 47 to 57)%}
(defn start-search [app tweets-chan]
  "initiate new search by starting SSE stream"
  (let [search (:search-text @app)
        s (if (= search "") "*" search)]
    (if (not (nil? (:stream @app))) (.close (:stream @app)))
    (reset! app (util/initial-state))
    (swap! app assoc :search s)
    (aset js/window "location" "hash" (js/encodeURIComponent s))
    (swap! app assoc :stream (js/EventSource. (str "/tweetFeed?q=" s)))
    (.addEventListener (:stream @app) "message" #(receive-sse tweets-chan %) false)
    (doall (for [x (range 5)] (ajax/prev-search s 500 (* 500 x))))))
{% endcodeblock %}

Let us go through this line by line. The **defn** macro denotes a function named start-search which takes two arguments, *app* for a reference to the application state and *tweets-chan*, a channel where to put tweets. Channels are building blocks in **[Core.async](https://github.com/clojure/core.async)**. We will get to that in a little bit, for now just think about a channel as a conveyor belt onto which one part of the application puts data. On the other end, another part of the application picks up the data, but the sender does not need to know about it. Broadly speaking, it is a sweet way to decouple an application.

In the next line there is the description of the function, followed by a **[let binding](http://clojure.org/special_forms#binding-forms)** where we declare first two local immutable values, both of which are available for the remainder of the function. The first one, *search*, retrieves the value for the key *:search-text* in the application state. *@app* dereferences the application state, giving us an immutable copy of the current app state. ````(:search-text @app)```` will run the keyword as a function with the state map as an argument, returning the value in the map. Next we declare *s* whose value can take two paths as decided by the **[if special form](http://clojure.org/special_forms#Special%20Forms--(if%20test%20then%20else?\))**. The if form consists of three parts. There is a test: ````(= search "")````. Not surprisingly at this point, **=** is a function that evaluates if the arguments passed to it are equal, returning either true or false. The **if** form then either returns the expression right after the test if the test evaluated to *true* or the subsequent one if it evaluated to *false*. What we are doing here is simply replacing an empty string with an asterisk or otherwise just taking the search string.

Next, we close a previous Server Sent Event stream, should one exist. This is only required when resetting the application state as on initial startup the value for the *:stream* key will be nil. Then we reset the application state by replacing it with a clean state. Then we swap the value for the *:search* key with out local value *s*. Then we set the location hash to represent a URI encoded version of the search string.

In the next line, we create a new EventSource object for the live stream of tweets and store it under the *:stream* key, to which we attach a function as an event listener. We are using an anonymous function literal here because the *receive-sse* function takes two arguments (a channel and an event from the EventSource object) whereas the event listener requires a function that only takes a single argument. Then finally we call *ajax/prev-search* with 5 chunks of 500 results each, but we will look at that later. Let us for now focus on the *receive-sse* function:

{% codeblock receive-sse function lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 42 to 45)%}
(defn receive-sse [tweets-chan e]
  "callback, called for each item (tweet) received by SSE stream"
  (let [tweet (js->clj (JSON/parse (.-data e)) :keywordize-keys true)]
    (put! tweets-chan tweet)))
{% endcodeblock %}

This is a function with two arguments, a channel and an event. In the **let-binding**, the event is parsed into a tweet. This reads inside out: 1) get event data 2) parse JSON into JavaScript object 3) convert JavaScript object into a Clojure(Script) Map. Note that for the conversion into a Clojure Map we can automatically have the keys converted into keywords using *:keywordize-keys true*. This is convenient as we can use the keywords as functions later for retrieving values for the respective key. Then the *tweet* from the let binding is *put!* onto the *tweets-chan*, this aforementioned conveyor belt.

Now is a good time to talk a little more about those channels. Channels are brought to Clojure by importing the **[Core.async](https://github.com/clojure/core.async)** library. **Core async** is modeled after channels in the **[Go programming language](http://golang.org)**, which implements **[Communicating Sequential Processes](http://en.wikipedia.org/wiki/Communicating_sequential_processes)** or **CSP** for short. You really should watch **[Rick Hickey's talk about core.async](http://www.infoq.com/presentations/clojure-core-async)** now if you haven't already. 

I am really only scratching the surface of what can be achieved with CSP, but it does seem like a useful abstraction to decouple parts of an application. Besides the aforementioned *tweets-chan* there is also a channel for previous tweets, those that are retrieved using Ajax calls (we will cover that part next):

{% codeblock Channels lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/core.cljs core.cljs (lines 37 to 44)%}
;;; Channels for handling information flow in the application.
(def tweets-chan (chan 10000))
(def prev-tweets-chan (chan 10000))

(go-loop []
 (let [[t chan] (alts! [tweets-chan prev-tweets-chan] :priority)]
   (tweets/add-tweet t app-state word-cloud)
   (recur)))
{% endcodeblock %}

Above, two channels are defined. Then, inside the *go-block*, *alts!* with *:priority* takes the one of the items from the two channels, with priority on the first one. That is because live tweets shall always be processed immediately whereas previous results can wait. With this item *t* taken from one of the channels, the *add-tweet* function in the *tweets* namespace is called. Finally, the go-loop runs continously using *recur*. 

Before looking at the *tweets* namespace, let us have a quick look at the ajax call performed in the *start-search* function above:

{% codeblock Ajax lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/ajax.cljs core.cljs (lines 35 to 40)%}
(defn prev-search [query-string size from]
  (json-xhr
    {:method :post
     :url "/tweets/search"
     :data (query query-string size from)
     :on-complete #(put! ajax-results-chan %)}))
{% endcodeblock %}

Above, we see a function that takes a query string, the expected number of items in the result and an offset. What it then does is call *json-xhr* from the imported **[goog.net.XhrIo](http://docs.closure-library.googlecode.com/git/class_goog_net_XhrIo.html)** with a map specifying method, url, data and an event handler. **XhrIo** comes with **[Google's Closure Compiler](https://developers.google.com/closure/compiler/)** that is used in the ClojureScript to JavaScript compilation process. 

The query itself is generated by the *query* function in the same namespace:

{% codeblock Ajax lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/ajax.cljs core.cljs (lines 19 to 23)%}
(defn query [query-string size from]
  {:size size :from from
   :sort {:id "desc"}
   :query {:query_string {:default_field "text" :default_operator "AND"
                          :query (str "(" query-string ") AND lang:en")}}})
{% endcodeblock %}

This function generates the map with the required properties for the ElasticSearch query on the server side. This query will eventually go on the wire as JSON. 

Then finally as an event handler there is an anonymous function literal putting the result onto another channel for the Ajax results:

{% codeblock Ajax results channel and Go Loop lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/ajax.cljs core.cljs (lines 11 to 17)%}
(def ajax-results-chan (chan))
(go-loop []
         (let [parsed (js->clj (JSON/parse (<! ajax-results-chan)) :keywordize-keys true)]
           (doseq [t (:hits (:hits parsed))]
             (when (= 0 (mod (:_id t) 200)) (<! (timeout 10)))
             (put! cljs-om.core/prev-tweets-chan (:_source t)))
           (recur)))
{% endcodeblock %}

Above, the JSON for each item on the channel is parsed into a Clojure(Script) data structure, where *parsed* is a vector. Then, each item in that vector is put! onto the prev-tweets-chan. Rather, the value for the *:_source* key is used here as that is where ElasticSearch stores the original item. One thing to note here is the usage of a **[timeout](https://clojure.github.io/core.async/#clojure.core.async/timeout)** roughly every 200 tweets. I have introduced this in order to occasionally return control to the **[JavaScript Event Loop](http://blog.carbonfive.com/2013/10/27/the-javascript-event-loop-explained/)** so that a) the UI gets rendered and b) the event listener for tweets from the Server Sent Event stream can do its thing. Otherwise, the application just appears to halt until all previous tweets are processed, which is really annoying. But this seems rather hacky, I would be really curious about solving this problem more elegantly.

With the preloading of tweets using Ajax calls covered, we can now proceed to the processing of tweets inside the *tweets* namespace. As we have seen before with the go loop alternating between channels, *add-tweet* is called for each tweet coming into the application:

{% codeblock add-tweet function lang:clojure https://github.com/matthiasn/BirdWatch/blob/4eb23097ef0e375a5e69c3164cb39167f82c12f3/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 31 to 40)%}
(defn add-tweet [tweet app word-cloud]
  "increment counter, add tweet to tweets map and to sorted sets by id and by followers"
  (let [state @app]
    (swap! app assoc :count (inc (:count state)))
    (add-to-tweets-map app :tweets-map (util/format-tweet tweet))
    (util/swap-pmap app :by-followers (keyword (:id_str tweet)) (:followers_count (:user tweet)))
    (util/swap-pmap app :by-id (keyword (:id_str tweet)) (:id tweet))
    (add-rt-status app tweet)
    (wc/process-tweet app (:text tweet))
    (. word-cloud (redraw (clj->js (wc/get-words app 250))))))
{% endcodeblock %}

First of all, for each new tweet, the counter inside the application state is swapped with the number incremented by one. Then, **add-to-tweets-map** is called (described below), which as the name suggests adds the current tweet to the map that is found under the *:tweets-map* key in the application state. Before being added, each tweet is also processed, in that step for example user mentions and links are replaced with the correct HTML representation. 

For a better understanding: the application allows displaying the tweets in different sort orders. Priority maps are used for maintaining the sort order. These priority maps contain nothing more than the ID of the tweet and whatever that specific map is sorted on, i.e. the number of followers. The full tweets are stored in one map with the ID of a tweet as the key and the tweet itself as the value. For displaying a sorted list of tweets in the UI, a sorted vector from the priority map is mapped by looking up each item in *:tweets-map* and using that item instead of the sorted value.

**TO BE CONTINUED**

#Summary
Overall I find working with Clojure(Script) quite pleasant. However I still need to understand how to better structure an application as I am not completely happy with the current architecture yet. But that will hopefully improve. 

Please comment and suggest any improvement you can think of, including typos and difficult to understand sentences. This is a work in progress, and a rather early draft at that. Any help is certainly welcome. 

Cheers,
Matthias


[^1]: Actually I should mention **[Lo-Dash](http://lodash.com)** instead of **underscore**. I use it as a drop-in replacement for underscore especially for one reason and that is **[_.cloneDeep](http://lodash.com/docs#cloneDeep)**. The ability to deep clone a data structure makes developing an undo functionality much, much, much easier. Not as trivial as with **[ClojureScript](http://swannodette.github.io/2013/12/31/time-travel/)** or with **[Scala.js](/01/24/scala-dot-js-and-reactjs/)** but it is not difficult, either.

[^2]: That is not completely true here. The application makes use of channels for processing both previous and current tweets. What if there is still stuff on channels when the reset takes place? This still needs to be solved.

[^3]: Please let me know if you do not understand everything in here or have suggestions on how to make it simpler.

[^4]: I might edit this article should a better architecture evolve.
