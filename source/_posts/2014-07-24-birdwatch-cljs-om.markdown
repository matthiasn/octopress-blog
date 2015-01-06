---
layout: post
title: "BirdWatch with ClojureScript and Om explained"
date: 2014-07-24 08:30
comments: true
categories: 
---
**ABANDONED** because of writing an all-Clojure version instead, not just ClojureScript on the client side. Last update on August 18th, 2014. There is a **[new series of articles](http://matthiasnehlsen.com/blog/2014/09/24/Building-Systems-in-Clojure-1/)** about the all-Clojure version starting in 09/2014. You might still find useful information in this article though.

I **[wrote](http://matthiasnehlsen.com/blog/2014/07/17/BirdWatch-in-ClojureScript/)** about having written my first actual application using **[ClojureScript](https://github.com/clojure/clojurescript)** and **[Om](https://github.com/swannodette/om)**, a web client for my **[BirdWatch](http://birdwatch.matthiasnehlsen.com/cljs/#*)** application. You may want to start with that article to understand the background better. This week I first want to talk about my experience with ClojureScript and Om. Then I want to start describing the implementation details. I am fully aware that what has come out of it up until now is far from elegant in terms of pretty much everything. But in my defense, it does appear to work :) 

<!-- more -->

Click the screenshot below to see a live version of the application:

<a href="http://birdwatch.matthiasnehlsen.com/cljs/#" target="_blank"><img src="/images/cljs-screenshot.png" /></a>

So, about my experience. I have been reading articles and books about **[Clojure](http://clojure.org)** for a while and it really does seem to resonate with me. I like this whole **[homoiconicity](http://en.wikipedia.org/wiki/Homoiconicity)** thing. Code and data are basically the same thing and thus share the same data structures. Code is really data, representing the **[abstract syntax tree (AST)](http://en.wikipedia.org/wiki/Abstract_syntax_tree)** directly. Now my initial reaction to this concept was that it had to be rather low level to do so, but to my surprise the opposite turned out to be true with a **[Lisp](http://en.wikipedia.org/wiki/Lisp_(programming_language\))**; you gain a tremendous amount of expressiveness. I also really like that **a)** Clojure introduces **[additional data structures](http://clojure.org/data_structures)** besides the obvious **list**, i.e. Maps, Sets and Vectors and **b)** it is idiomatic to simply use those.

Sure, there is something to be said about types and how **[type safety](http://en.wikipedia.org/wiki/Type_safety)** makes working on large-scale applications less error-prone. But at the same time I have a hunch that the presence of hundreds of (case) classes complects an application in a way that idiomatic usage of a map does not. Have you seen this before, where you had cascades of only slightly differing data structures and the next step of a computation added only a little bit of data and called that a new thing, modeled as a different something? That can become difficult to reason about, particularly when there are no useful design documents outlining how one morphs into the other.

But then again, I am somewhat afraid of the lack of compile time errors when I call a function with something of a wrong type. So as of now, that is an unresolved question for me. May my endeavor into Clojure and thus Lisp afford me with a more educated opinion on this matter. What I don't like about strongly typed systems is that I have seen way too many runtime failures that **a)** the type system and the compiler did not catch and **b)** really came from the application being so incidentally complex that the consequences of changes were by all means (too) hard to grasp even for the most senior team members.

I guess I really need some production experience with Clojure to be able to come up with a fair and substantial comparison of the different approaches. But the application I am talking about today is a start at least. And learning a new language has never hurt anyone, I guess.

So, what’s the experience been like so far?

Here are my perceived pros:

* When crafting functions in Clojure, I just feel more like playing an instrument. It feels more **playful**, in a good way.
* Code tends to be **short** and **concise**.
* The core of the language is **easily understood**, at least as far as my limited understanding goes.
* **Immutability** is great, I have been a fan of immutable data structures for a while and Clojure makes it relatively hard to work with mutable state, which is good.
* **Om** uses Facebook's **ReactJS**, a UI rendering library that I have tried out previously and that I am somewhat familiar with.
* **Refactoring is fun**, I have discovered that spotting repetitive parts among functions and then factoring these parts out into new and shared functions is not only easier compared to many other languages, but also pleasant.
* **Data structures**: maps and sets and, by importing an external library in the case of this application, priority maps are a great thing to have, much nicer than only having JavaScript arrays and objects at your disposal.
* **Replacing external dependencies** with newer versions generally seems to work in Clojure. This is the complete opposite of my experience in Scala, where a new version of pretty much anything oftentimes results in days of work. Over the last year things with Scala improved for sure, but they are nowhere near as smooth as they appear to be with Clojure.
* As to general data manipulation, I already feel I am becoming more **productive** with Clojure compared to JavaScript and **[underscore](http://underscorejs.org)** [^1].

Here are some (somewhat minor) cons, as well:

* I don't feel I have fully grasped Om yet, despite having worked with ReactJS before.
* Testing output. I have tried out **[Chas Emerick](http://cemerick.com)**'s **[clojurescript.test](https://github.com/cemerick/clojurescript.test)** and while it seems to do its job alright, the output is plain black and white. How am I supposed to do **[red-green refactoring](http://www.jamesshore.com/Blog/Red-Green-Refactor.html)** with this? But seriously, this may be mostly cosmetic but still, I like to see green in my tests as that soothes my mind. When I see red in tests, my alertness level goes up. Black and white output elicits none of these emotions. Is there just anything wrong with my installation or vision that I don't see colors in my test output?
* Performance. So far the application has been slower than the JavaScript counterpart in some areas. When processing preloaded tweets, the plain JavaScript version (used in the **[AngularJS](http://birdwatch.matthiasnehlsen.com/angular/#/)** and **[ReactJS](http://birdwatch.matthiasnehlsen.com/#/)** clients) is probably ten times as fast. **EDIT: that's not actually true, it was due to a silly mistake of mine that ate a lot of CPU cycles. With that issues removed, I don't notice substantial differences in speed.** Click those previous links and see what I mean. The previous tweets are loaded by an Ajax call in chunks of 500 items and loading and processing each chunk takes maybe a second. Now when you open the **[ClojureScript version](http://birdwatch.matthiasnehlsen.com/cljs/#*)**, you will see that it takes much longer to process the previous items. I might try out **[Transit](https://github.com/cognitect/transit-cljs)** here, which seems very promising, not only for this application but as a wire format in general. I need to spend some time with it as it doesn't allow automatic keywordization (yet?) and my application relies on a keywordized map. On the other hand, with some first-hand experience now, I think I'd rather go for a complete redesign that allows more flexibility. I'll keep you posted. Thoughts about that will probably appear in a weekly review first.
* Application state in a single large map stored in an **[atom](http://clojure.org/atoms)** can be cumbersome; I would not mind having something like objects or separate services here and there. I have looked at **[Stuart Sierra](http://stuartsierra.com)**'s **[component library](https://github.com/stuartsierra/component)** and it does seem to offer a good approach to componentizing the application, but I have yet to find the time to try it out.
* Interacting with the state from inside Om is different than interacting with the state atom from other parts of the application. **[Om-tools](https://github.com/Prismatic/om-tools)** seem to be an interesting way around this - will need to give that a try and see how it works.


By the way, regarding performance, I have seen the same problems with my naïve Scala.js approach before. **EDIT: I don't know what the problem was there. The problems with performance in the ClojureScript version are solved.** I have not played around with that one again since my first attempt back in January. That is mostly due to the lack of a ReactJS binding which is anywhere near as complete as Om. I'll be happy to give it a try again once ReactJS support is comparable to Om. **EDIT: probably not.**

#Introduction to Clojure
First of all, you will need to understand a few very basic things about Clojure being a **[Lisp](http://en.wikipedia.org/wiki/Lisp_(programming_language\))**. Feel free to skip this section if you know Clojure already. My aim is for you to be able to follow along even if you've never tried Clojure or a Lisp before. So the basic idea in a Lisp is the List (no wonder, as Lisp stands for List Programming), a **[singly linked list](http://en.wikipedia.org/wiki/Singly_linked_list#Singly_linked_lists)**, to be precise. This list can hold both code and data. Let's see how that looks like. You can try these examples out using the **[REPL](http://en.wikipedia.org/wiki/Read–eval–print_loop)** in **[Leiningen](http://leiningen.org)** by running ````lein repl```` from your command line. 

This is an empty list: ````()```` It evaluates to itself.

When the list is not empty, the first item in the list will be evaluated as a function: ````(some-function "a" "b")```` 
Here, *some-function* will be called with the two arguments "a" and "b". Example ````(print "Hello World!")```` Sweet, that is all there is to **[Hello World](http://en.wikipedia.org/wiki/Hello_world_program)**.

The first item in a list has to implement the *IFn* interface meaning it must be possible to call the item as a function. Try this: ````("a" "b")````. Not surprisingly, the string "a" is not a function, causing this to fail. You can however **quote** the list to prevent evaluation, like this: ````'("a" "b")````. Now we can use the list to store items without the first one being evaluated.

Conveniently, Clojure also has a **vector** which is comparable to an array. You can use it in place of a quoted list, and in fact it is idiomatic to do so when we do not want the first item to be evaluated. Example ````[1 2 3]```` 

When you want to name something, you have different options available. The first one is **def**; you can use this to name stuff in the top level of a namespace, for example ````(def foo [1 2 3])```` This will create a vector named *foo* which you can then refer to from elsewhere. After typing in the previous example, you will see that now you can just type ````foo```` in the REPL and get the vector we have defined previously.

Or you can use the **let-binding** to name things locally, for example inside a function body, like this: ````(let [bar [1 2 3]])```` Here, you can only refer to *bar* inside the let form, meaning inside the pair of braces that enclose the let form. Let's use *bar*: ````(let [bar [1 2 3]] (print bar))```` You should see the vector being printed in your REPL.

Functions can be defined as follows: ````(fn [a] (+ a 1))```` with this, we have defined a function that adds 1 to the argument provided .
You can use the above as an anonymous function like this: ````((fn [a] (+ a 1)) 2)````. Remember that the first item in a list will be evaluated. This is what happens to be the anonymous function we have just defined. However, this can be a little clumsy. We can also store the function in a def: ````(def add-one (fn [a] (+ a 1)))````; now we can call the function like this: ````(add-one 2)````. 

However, this can even be simpler if we use the **defn macro**: ````(defn add-one [a] (+ a 1))```` 

Sometimes, you may want to create a function in place using the anonymous function literal: ````(#(+ % 1) 2)````. This does the same as the anonymous function in the first position of the list above, except that it is shorter. During compilation the ````#(+ % 1)```` expands into ````(fn [a] (+ a 1))````, where the percent sign denotes the first argument. If there are multiple arguments, you use *%1*, *%2* and so on (1-based).

No language would be complete if there wasn't a way to make decisions and branch off accordingly. Of course, Clojure has constructs for flow control as well, most notably the **[if special form](http://clojure.org/special_forms#Special%20Forms--(if%20test%20then%20else?\))**. It is really quite simple: ````(if test then else?)````. The test will be evaluated first. Then based on the result, either **then** or **else** are yielded. Other constructs derive from it, such as the **[when macro](http://clojure.github.io/clojure/clojure.core-api.html#clojure.core/when)**. 

With these basic constructs you may already find yourself in the position to follow the subsequent source code. Clojure is not hard. Please let me know if you have problems following along. If so, it's most likely not you but rather the fact that my intro wasn't good enough.

Of course, there's a lot more to the language and plenty of stuff to learn when you are ready to delve deeper. As a next step, I suggest **[Learn Clojure in Y Minutes](http://learnxinyminutes.com/docs/clojure/)**. There, you simply have more examples to follow along and play around with in your REPL.

As another online resource, I have also found **[Clojure for the Brave and True](http://www.braveclojure.com)** to be fun and helpful. Check it out. And if you like it, why not support the author and buy his ebook? You can then enjoy the book on your favorite ebook reader as well, and even if you read it on the web, you will ensure that the author can keep up the good work. Great feeling, I did the same.

Another great resource is **[Joy of Clojure, 2nd edition](http://r.matthiasnehlsen.com/joyclojure/link)**. Fun read and I learned a lot. I will revisit it and share some thoughts about it in the **[reviews section](/reviews)** soon.

#Application architecture
Let us now have a look at the implementation of the BirdWatch client.

The most important part to understand is that the application state lives in one large **[atom](http://clojure.org/atoms)**. When the application is started, this atom is populated with the return of a function that returns a map representing a clean slate version of the application state. Here is how that function looks like:

{% codeblock Function returning initial application state lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/util.cljs util.cljs (Lines 72 to 83)%}
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

All the keys in this map are **[keywords](http://clojure.org/data_structures#Data%20Structures-Keywords)**. Keywords have the great property that we can use them as functions that take a map as an argument and that then return the value for this key. We will see that in action further below.

Upon startup of the application, the function above is called for populating the state atom:

{% codeblock Function returning initial application state lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/core.cljs core.cljs (lines 13 to 16)%}
;;; Application state in a single atom
;;; Will be initialized with the map returned by util/initial-state.
;;; Reset to a new clean slate when a new search is started.
(def app-state (atom (util/initial-state)))
{% endcodeblock %}

As we have learned above, **def** creates a thing with a name. This thing is conceptually **[immutable](http://en.wikipedia.org/wiki/Immutable_object)**, at least we treat it that way, so I won't call it a variable. The atom is always the same object, but it holds different versions over time. Then a reference to this **[atom](http://clojure.org/atoms)** is passed around. When an update is desired, the map is dereferenced, an updated version is created using some function call and the result is then written back into the atom using a transaction. It is important to note that Clojure data structures are immutable. Immutability guarantees that you can pass data structures around without having to worry that whoever you pass it to might change the data. Data also does not become invalid. Instead, whatever version in time you get a hold on represents the definite state at the time that version was created. State changes only happen inside a transaction, in which a new and altered version of the state is passed back. The transaction part would also mean that no other process could alter state at the same time; in that case the later transaction would be retried until the first one has succeeded. This would be particularly useful when running in a multithreaded environment. However, the JavaScript code resulting from the ClojureScript compilation process runs in a single threaded event loop so only one thing at a same time can happen anyway. On the server side this property becomes more valuable, still.

Having a function that provides an initial, clean state makes it trivial to reset the application state at a later point, we can simply swap the current state with the clean slate map.

##Ingesting tweets
Tweets get into the system for further analysis in two ways. First, there is a Server Sent Event stream continuously delivering new matches to a query, with low latency (typically around a second between tweeting and having the tweet show up in the application). In addition, previous tweets are loaded. Both are triggered in the **start-search** function:

{% codeblock start-search function lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 49 to 59)%}
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

Let's go through this line by line. The **defn** macro denotes a function named *start-search* which takes two arguments, *app* for a reference to the application state and *tweets-chan*, a channel to put tweets onto. Channels are building blocks in **[core.async](https://github.com/clojure/core.async)**. We will get to that in a little bit. For now, just think about a channel as a conveyor belt onto which one part of the application puts data. On the other end, another part of the application picks up the data, but the sender does not need to know about it. Broadly speaking, it is a sweet way to decouple parts of an application.

The next line contains the description of the function, followed by a **[let binding](http://clojure.org/special_forms#binding-forms)** where we first declare two local immutable values, both of which are available for the remainder of the function. The first one, *search*, retrieves the value for the key *:search-text* in the application state. *@app* dereferences the application state, giving us an immutable copy of the current app state. ````(:search-text @app)```` will run the keyword as a function with the state map as an argument, returning the value in the map. Next we declare *s* whose value can take two paths as decided by the **[if special form](http://clojure.org/special_forms#Special%20Forms--(if%20test%20then%20else?\))**. The if form consists of three parts. There is a test: ````(= search "")````. Not surprisingly at this point, **=** is a function that evaluates if the arguments passed to it are equal, returning either true or false. The **if** form then either returns the expression right after the test if the test evaluated to *true* or the subsequent one if it evaluated to *false*. What we are doing here is simply replace an empty string with an asterisk or otherwise just take the search string.

Next, we close a previous Server Sent Event stream, should one exist. This is only required when we reset the application state as on initial startup, the value for the *:stream* key will be nil. Then we reset the application state by replacing it with a clean state. Then we swap the value for the *:search* key with the content of the local value *s*. Then we set the location hash to represent a URI encoded version of the search string.

In the next line, we create a new EventSource object for the live stream of tweets and store it under the *:stream* key, to which we then attach a function as an event listener. We are using an anonymous function literal here because the *receive-sse* function takes two arguments (a channel and an event from the EventSource object) whereas the event listener requires a function that only takes a single argument. Then, finally, we call *ajax/prev-search* with 5 chunks of 500 results each, but we will look at that later. For now let's focus on the *receive-sse* function:

{% codeblock receive-sse function lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 44 to 47)%}
(defn receive-sse [tweets-chan e]
  "callback, called for each item (tweet) received by SSE stream"
  (let [tweet (js->clj (JSON/parse (.-data e)) :keywordize-keys true)]
    (put! tweets-chan tweet)))
{% endcodeblock %}

This is a function with two arguments, a channel and an event. In the **let-binding**, the event is parsed into a tweet. This reads inside out: **1)** get event data **2)** parse JSON into a JavaScript object **3)** convert the JavaScript object into a Clojure(Script) Map. Note that for the conversion into a Clojure Map, we can automatically have the keys converted into keywords using *:keywordize-keys true*. This is convenient as we can later use the keywords as functions to retrieve values for the respective key. Then the *tweet* from the let binding is *put!* onto the *tweets-chan*, which represents the aforementioned conveyor belt, where we do not need to worry about who picks up the items on the other end.

Now is a good time to talk a little more about those channels. Channels are brought to Clojure by importing the **[core.async](https://github.com/clojure/core.async)** library. **Core async** is modeled after channels in the **[Go programming language](http://golang.org)**, which implement **[Communicating Sequential Processes](http://en.wikipedia.org/wiki/Communicating_sequential_processes)** or **CSP** for short. You really should watch **[Rick Hickey's talk about core.async](http://www.infoq.com/presentations/clojure-core-async)** now if you haven't done so already. The same goes for the following talk from 2012 by Rob Pike, who played a key role in the development of Go: **[Go Concurrency Patterns](https://www.youtube.com/watch?v=f6kdp27TYZs)**.

I am really only scratching the surface of what can be achieved with CSP, but it does seem like a useful abstraction to decouple parts of an application. Besides the aforementioned *tweets-chan* there also is a channel for previous tweets retrieved using Ajax calls (we will cover that part next):

{% codeblock Channels lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/core.cljs core.cljs (lines 37 to 44)%}
;;; Channels for handling information flow in the application.
(def tweets-chan (chan 10000))
(def prev-tweets-chan (chan 10000))

(go-loop []
 (let [[t chan] (alts! [tweets-chan prev-tweets-chan] :priority)]
   (tweets/add-tweet t app-state word-cloud)
   (recur)))
{% endcodeblock %}

Above, two channels have been defined. Then, inside the *go-block*, *alts!* with *:priority* takes one of the items from the two channels, with priority on the first one. That is because live tweets should always be processed immediately whereas previous results can wait. With this item *t* taken from one of the channels, the *add-tweet* function in the *tweets* namespace is called. Finally, the go-loop runs continuously using *recur*. 

Before looking at the *tweets* namespace, let's have a quick look at the Ajax call performed in the *start-search* function above:

{% codeblock prev-search lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/ajax.cljs ajax.cljs (lines 35 to 40)%}
(defn prev-search [query-string size from]
  (json-xhr
    {:method :post
     :url "/tweets/search"
     :data (query query-string size from)
     :on-complete #(put! ajax-results-chan %)}))
{% endcodeblock %}

Above, we see a function that takes a query string, the expected number of items in the result and an offset. It then calls *json-xhr* from the imported **[goog.net.XhrIo](http://docs.closure-library.googlecode.com/git/class_goog_net_XhrIo.html)** with a map specifying method, url, data and an event handler. **XhrIo** comes with **[Google's Closure Compiler](https://developers.google.com/closure/compiler/)** that is used in the ClojureScript to JavaScript compilation process. 

The query itself is generated by the *query* function in the same namespace:

{% codeblock Ajax lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/ajax.cljs ajax.cljs (lines 19 to 23)%}
(defn query [query-string size from]
  {:size size :from from
   :sort {:id "desc"}
   :query {:query_string {:default_field "text" :default_operator "AND"
                          :query (str "(" query-string ") AND lang:en")}}})
{% endcodeblock %}

This function generates the map with the properties required for the ElasticSearch query on the server side. This query will eventually go on the wire as JSON. 

Then finally, as an event handler, there is an anonymous function literal that puts the result onto another channel for the Ajax results:

{% codeblock Ajax results channel and Go Loop lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/ajax.cljs ajax.cljs (lines 11 to 17)%}
(def ajax-results-chan (chan))
(go-loop []
         (let [parsed (js->clj (JSON/parse (<! ajax-results-chan)) :keywordize-keys true)]
           (doseq [t (:hits (:hits parsed))]
             (when (= 0 (mod (:_id t) 200)) (<! (timeout 10)))
             (put! cljs-om.core/prev-tweets-chan (:_source t)))
           (recur)))
{% endcodeblock %}

Above, the JSON for each item on the channel is parsed into a Clojure(Script) data structure, where *parsed* is a vector. Then, each item in that vector is *put!* onto the *prev-tweets-chan*. Here, the value for the *:_source* key is used here as that is where ElasticSearch stores the original item. One thing to note here is the usage of a **[timeout](https://clojure.github.io/core.async/#clojure.core.async/timeout)** roughly every 200 tweets. I have introduced this in order to occasionally return control to the **[JavaScript Event Loop](http://blog.carbonfive.com/2013/10/27/the-javascript-event-loop-explained/)** so that **a)** the UI gets rendered and **b)** the event listener for tweets from the Server Sent Event stream can do its thing. Otherwise, the application just appears to halt until all previous tweets have been processed, which is really annoying. But this seems rather hacky, I would be really curious about solving this problem more elegantly.

With the preloading of tweets using Ajax calls covered, we can now proceed to the processing of tweets inside the *tweets* namespace. As we have seen before with the go loop alternating between channels, *add-tweet* is called for each tweet coming into the application:

{% codeblock add-tweet function lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 33 to 42)%}
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

First of all, for each new tweet, the counter inside the application state is swapped with the number incremented by one. Then, *add-to-tweets-map* is called (described below), which as the name suggests adds the current tweet to the map that is found under the *:tweets-map* key in the application state. Before being added, each tweet is also processed; in that step, for example, user mentions and links are replaced with the correct HTML representation. 

For a better understanding: the application allows displaying the tweets in different sort orders. Priority maps are used for maintaining the sort order. These priority maps contain nothing more than the ID of the tweet and whatever that specific map is sorted on, i.e. the number of followers. The full tweets are stored in one map with the ID of a tweet as the key and the tweet itself as the value. For displaying a sorted list of tweets in the UI, a sorted vector from the priority map is mapped by looking up each item in *:tweets-map* and using that item instead of the sorted value. 

Here is how a tweet is added to the application state:

{% codeblock add-to-tweets-map function lang:clojure https://github.com/matthiasn/BirdWatch/blob/2d1fbc587506a954b0d9f7e302a978fd93c04ecd/clients/cljs-om/src/cljs_om/tweets.cljs tweets.cljs (lines 11 to 15)%}
(defn add-to-tweets-map [app tweets-map tweet]
  "adds tweet to tweets-map"
  (swap! app
         assoc-in [tweets-map (keyword (:id_str tweet))]
         (util/format-tweet tweet)))
{% endcodeblock %}

The function above takes the application state, the keyword under which the tweets-map can be found in the application state and a tweet to be added. It then swaps the application state with a new version into which the tweet is added after undergoing the *format-tweet* treatment. Note that *assoc-in* takes a vector that describes the path to the item being added or changed. The string representation of the tweet ID is converted to a keyword so that it can be used as a lookup function later (as previously described). Let's assume we have a tweet with ID string "12345". The path passed to *assoc-in* will then look like this: [:tweets-map :12345]. Afterwards, the map stored under the *:tweets-map* key will have a new key *:12345* with the formatted tweet as the associated value. A call to this function will also replace an already existing item.

**TO BE CONTINUED**

#Summary
Overall I find working with Clojure(Script) and Om pleasant. Working and thinking in Clojure is a lot of fun. I have heard people complain about all the parentheses in Lisp but I do not share that sentiment. Quite the opposite, I find that **[s-expressions](http://en.wikipedia.org/wiki/S-expression)** and the associated **[prefix notation](http://en.wikipedia.org/wiki/Polish_notation)** add a lot of clarity without having to learn any additional, language-specific rules.

However I still need to understand how to improve the structure of an application in Clojure(Script). I am still not completely happy with the current architecture of the application described in this post. But that will hopefully improve.

Please comment and suggest any improvement you can think of, including typos and difficult to understand sentences. This is a work in progress and an early draft at that. Any help is certainly much appreciated.

Cheers,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>

[^1]: Actually I should mention **[Lo-Dash](http://lodash.com)** instead of **underscore**. I use it as a drop-in replacement for underscore for one reason in particular: **[_.cloneDeep](http://lodash.com/docs#cloneDeep)**. The ability to deep clone a data structure makes developing an undo functionality much, much, much easier. Not as trivial as with **[ClojureScript](http://swannodette.github.io/2013/12/31/time-travel/)** or with **[Scala.js](http://matthiasnehlsen.com/blog/2014/01/24/scala-dot-js-and-reactjs/)**, but not difficult either.

