---
layout: post
title: "Iteratee: can I have that in a sentence?"
date: 2013-04-23 22:08
comments: true
categories: 
---
A couple of weeks back I was trying to wrap my head around **[Iteratees](http://www.playframework.com/documentation/2.0.4/Iteratees)** so I read what I could find on Google. Afterwards, I had a very high level idea about Enumerators producing or emitting a stream of information and Iteratees consuming that information, potentially with aggregate state. At the same time, the Iteratee was supposed to be immutable. Okay, so I have this immutable thing aggregating state over time. That did not seem right. 

<!-- more -->

I had to see this in action in order to understand how this Iteratee thing works. So I was looking for a stream of information that I could use. I found it in the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)**. A stream of Tweets can be interesting, even outright entertaining, having chosen the right topic(s), and Tweets being tweeted right now when watching the visualization is something that seems easy to relate to. I also wanted to try out a supervised actor hierarchy in this project, so I decided to download the original profile images from Twitter for every single Tweet, down convert them using a couple of actors doing image manipulation and storing an 80x80px PNG thumbnail in **[MongoDB](http://www.mongodb.org)**. This supervised image manipulation will be the topic of another post though.

On the client side I wanted something flashy that makes it obvious that live information from the real world is flowing through the system and reasoned about. I had recently taken an interest in **[D3.js](http://d3js.org)** and I had seen the **[d3-cloud](https://github.com/jasondavies/d3-cloud)** wordcloud implementation by Jason Davies, which is nice to look at, so I wondered if it was difficult to drive it from data streaming to the client over a **[WebSocket](http://tools.ietf.org/html/rfc6455)** connection. The UI at this point was not supposed to be particularly useful, it was really only designed for the effect, as a visualization of something happening **right now**. I am fully aware that a wordcloud is not the best way for showing the frequency of words, and having it regenerate every 5 seconds makes it even less useful perceptually since whatever you look at will be gone before you can even fully focus on the smaller items. That being said, the focus of this project was learning how Iteratees work. The **[D3.js](http://d3js.org)** I use for this project is very basic on my end, I will focus on doing more useful things with D3 later on.

So I started working on this reactive web application called **[BirdWatch](https://github.com/matthiasn/BirdWatch)**. In this article I will go through the parts of the application that are relevant for trying to understand Iteratees. I will do this iteratively in the  order in which my own understanding evolved.  

Let's look at my initial high-level architectural drawing (warning, it is inaccurate, read on to find out why):

{% img left /images/BirdWatch.svg 800 300 'image' 'images' %}

At first, this seems to make sense. The WS object (upper left box named Twitter) acts as our Enumerator, taking the chunks of Array[Byte] it is receiving from the open HTTP connection with the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** endpoint and passing them along into an Iteratee:

{% codeblock WS-Client lang:scala https://github.com/matthiasn/BirdWatch/blob/e33ce62bb36b4a1228c2f1519de60ef3d65482bd/app/actors/TwitterClient.scala TwitterClient.scala %}
val url = "https://stream.twitter.com/1.1/statuses/filter.json?track="
val conn = WS.url(url + TwitterClient.topics.mkString("%2C").replace(" ", "%20"))
    .withTimeout(-1)
    .sign(OAuthCalculator(consumerKey, accessToken))
    .get(_ => TwitterClient.tweetIteratee)
{% endcodeblock %}

The Iteratee then performs some action (JSON parsing from String, Tweet parsing from JSON, sending the Tweet to the ImageConversion actor) for each chunk, without accumulating intermediate state.

{% codeblock tweetIteratee (shortened) lang:scala https://github.com/matthiasn/BirdWatch/blob/e33ce62bb36b4a1228c2f1519de60ef3d65482bd/app/actors/TwitterClient.scala TwitterClient.scala %}
/** Iteratee for processing each chunk from Twitter stream of Tweets. Parses Json chunks 
* as Tweet instances and publishes them to eventStream. */
val tweetIteratee = Iteratee.foreach[Array[Byte]] { chunk =>
  val chunkString = new String(chunk, "UTF-8")
  val json = Json.parse(chunkString)

  TweetReads.reads(json) match {
    case JsSuccess(t: Tweet, _) => {
      ActorStage.imgSupervisor ! WordCount.wordsChars(stripImageUrl(t))
    }
    case JsError(msg) => println(chunkString)
  }
}
{% endcodeblock %}

This at first seduced me into believing that the Iteratee for sending the tweets was one particular instance that performed these repeated actions as specified in the foreach part. But that is not the case. The Iteratee is immutable and every time we pass information to an Iteratee in a step, a new Iteratee is created in return. This does not seem terribly useful as long as we only want to perform a foreach without accumulated state. But bear with me.

Let's have a look at the second Enumerator / Iteratee couple in the application next. Afterwards this will make much more sense.

For the wordcount, which feeds both the wordcloud and the bar chart in the UI, we analyze a rolling window of tweets. For this, we need to keep state over say the last 1000 tweets, as is the case here.

Let's have a look at the implementation of the tweetListIteratee:

{% codeblock tweetListIteratee (shortened) lang:scala https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/utils/WordCount.scala WordCount.scala %}
/** Creates Iteratee which holds a List[Tweet] of length up to n as its state in each step,  
 *  based on the provided tweetList. The newest element is found in the head of the list.
 *  Allows passing in a "side-effecting" function f, e.g. for testing or pushing data to 
 *  WebSocket or EventStream. Having f return unit instead of modifying the accumulator 
 *  guarantees that f cannot alter the accumulator newAcc in unintended ways.
 *  Attach to Channel[Tweet] for better decoupling within application.
 *  @param    f "side-effecting" function (List[Tweet] => Unit)
 *  @param    tweetList List[Tweet] to use as the accumulator
 *  @param    n max length of list to keep as iteratee state
 *  @return   Iteratee[Tweet, List[Tweet]], accumulating tweetList from tweetChannel
 */
def tweetListIteratee(f: List[Tweet] => Unit, tweetList: List[Tweet], 
  n: Int): Iteratee[Tweet, List[Tweet]] = Iteratee.fold[Tweet, List[Tweet]] (tweetList) {
    case (xs, x) => {
      val newTweetList = (x :: xs) take n
      f(newTweetList)
      newTweetList
    }
  }
{% endcodeblock %}

So here we have constructed an Iteratee which takes as parameters a function f that takes a List[Tweet] and returns Unit, a TweetList which will be our accumulator in the fold and n, which is the maximum size of the list in the accumulator or in other words the maximum size of our rolling window that we will reason about. What happens here is that the Iteratee will receive the previous accumulator / state (a List[Tweet]) and a single Tweet, prepend the single Tweet as the new head of the accumulator, limited to a list of maximum size n and then return that new list as the state inside the partial function. 

The tweetListIteratee also runs function f, which is by definition purely side-effecting as it returns Unit, so the only effects it can have are outside the tweetListIteratee. Normally we should probably shy away from side-effects, but here I would argue that this is a good thing. Any function passed in here could be defined to have side-effects, but the Unit return type guarantees that f will not be able to mess with the accumulator, it cannot have any effects on it, unlike functions transforming the accumulator or passing it along PLUS having side-effects. The side-effect f is used for is pushing immutable information into the WebSocket connection. In fact, there is no mutable state in scope for this function anyways that it could mess with. 

Let's look at that function we substitute for f before we wire the Iteratee into an Enumerator:

{% codeblock interceptTweetList lang:scala https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/controllers/Twitter.scala Twitter.scala %}
/** "side-effecting" function to do something with the accumulator without possibly mutating it
 * e.g. push some computation to a WebSocket enumerator or to log file
 * @param    tweetList accumulator inside the Iteratee
 * @return   Unit, cannot interfere with the accumulator inside the Iteratee 
 */
def interceptTweetList(tweetList: List[Tweet]) {
  val (charCountMean, charCountStdDev) = Calc.stdDev(tweetList.map(t => t.charCount))
  val (wordCountMean, wordCountStdDev) = Calc.stdDev(tweetList.map(t => t.wordCount))

  val tweetState = TweetState(tweetList.take(1), WordCount.topN(tweetList, 250), charCountMean, 
    charCountStdDev, wordCountMean, wordCountStdDev, tweetList.size)

  wsOutChannel.push(Json.stringify(Json.toJson(tweetState)))
}
{% endcodeblock %}

This function above calculates mean and standard deviation for character count and word count within the tweets inside the rolling window, which by now is the old state from the previous Iteratee plus the latest Tweet pushed into the Iteratee appended at the head of the list (limited to size n if larger): 

{% codeblock stdDev lang:scala https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/utils/Calc.scala Calc.scala %}
/** Calculate standard deviation from TraversableOnce[Int]
 *  @param    xs collection of Int
 *  @return   (mean: Double, stdDev: Double)
 */
def stdDev(xs: TraversableOnce[Int]): (Double, Double) = {
  val n = xs.size
  val total = xs.foldLeft(0.0) { case (sum, x: Int) => sum + x }
  val mean = total / n
  val stdDev = Math.sqrt( xs.foldLeft(0.0) { case (acc, x) => acc + (x-mean) * (x-mean) } / n )
  (mean, stdDev)
}
{% endcodeblock %}

and also the word frequency map:

{% codeblock countTweetWords & topN lang:scala https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/utils/WordCount.scala WordCount.scala %}
/** Counts words in List[Tweet], returning Map[String, Int] with wordMap filtered by 
 *  regular expression and not containing any word from the stopWords set
 *  @param    tweetList List[Tweet] to count words in
 *  @return   Map[String, Int] with word counts
 */
def countTweetWords(tweetList: Seq[Tweet]): Map[String, Int] =
  tweetList.foldLeft(Map[String, Int]()) {
  case (wordMap, tweet) => splitTweet(tweet.text).filter{ w => !stopWords.contains(w) }
    .foldLeft(wordMap) {
      case (wordMap, word) => wordMap + ((word, wordMap.getOrElse(word, 0) + 1))
    }
  }

/** Generates ListMap with Top n most popular words in a tweetList
 *  @param    tweetList List[Tweet]
 *  @param    n number highest ranking words to return
 *  @return   sorted ListMap with top n words in descending order of count 
 */
def topN(tweetList: Seq[Tweet], n: Int): ListMap[String, Int] = {
  val wordMap = countTweetWords(tweetList)
  ListMap[String, Int](removeShortWords(wordMap).toList.sortBy(_._2).reverse.take(n): _*)
}
{% endcodeblock %}

These calculations probably warrant a separate (and much shorter) article. For now let's just assume they do what the description states. The results of these computations are then pushed into the WebSocket channel towards the browser as JSON (embedded in an immutable instance of Case Class **[TweetState](https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/models/Tweet.scala)**). That step actually involves another Enumerator / Iteratee couple, but more about that later.

Let us now hook the Iteratee up with an Enumerator that will push data into it before dealing with the issue that the Iteratee is immutable and cannot be changed. In previous versions we probably would have used a **[PushEnumerator](http://www.playframework.com/documentation/api/2.1.0/scala/index.html#play.api.libs.iteratee.PushEnumerator)** to achieve this, but PushEnumerator is deprecated as of Play 2.10, we are supposed to use **[Concurrent.broadcast](http://www.playframework.com/documentation/api/2.1.0/scala/index.html#play.api.libs.iteratee.Concurrent$)** instead.

{% codeblock Enumerator for tweetIteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/controllers/Twitter.scala Twitter.scala %}
/** Creates enumerator and channel for Tweets through Concurrent factory object */
val (enumerator, tweetChannel) = Concurrent.broadcast[Tweet]

/** Iteratee processing Tweets from tweetChannel, accumulating a rolling window of tweets */
val tweetListIteratee = WordCount.tweetListIteratee(interceptTweetList, List[Tweet](), 1000)
enumerator |>>> tweetListIteratee // attach tweetListIteratee to enumerator

/** Actor for subscribing to eventStream. Pushes received tweets into TweetChannel for
 * consumption through iteratee (and potentially other consumers, decoupled)  */
val subscriber = ActorStage.system.actorOf(Props(new Actor {       
  def receive = { case t: Tweet => tweetChannel.push(t) }                         
}))
ActorStage.system.eventStream.subscribe(subscriber, classOf[Tweet]) // subscribe to incoming tweets
{% endcodeblock %}

We call Concurrent.broadcast[Tweet], which returns a tuple2 of an Enumerator (named accordingly) and a channel (tweetChannel) that we can use to push Tweets into. We then attach our tweetListIteratee to the enumerator using the |>>> operator. The Tweets pushed into tweetChannel will then be consumed by the tweetListIteratee attached to the enumerator. We will get those Tweets from the **[Akka EventBus](http://doc.akka.io/docs/akka/2.1.2/scala/event-bus.html)** by creating an actor, which listens to events of type Tweet on the EventBus and pushes them into tweetChannel. We will look at the EventBus in more detail in the article dealing with the ImageProcessing actor hierarchy. For now it should be sufficient to know that we have a source of Tweets and push each individual occurence of a Tweet event into the tweetChannel, thus creating our own open-ended stream.

Now that we have wired our building blocks together, let's see if we can visualize this in its initial state:

{% img left /images/Iteratee1.svg 800 300 'image' 'images' %}

We have a systemwide EventBus to which we attach for every user connection an actor listening to Tweets and pushing them into the tweetChannel. Somehow, and we will get there, this Tweet will reach the tweetlistIteratee, which acts as the consumer or sink of this information. Once it has reached the tweetlistIteratee, we would expect to have the Tweet within the rolling window of Tweets and also to have the interceptor function run.

So far so good. But remember that the Iteratee is an immutable data type:
 
{% blockquote Iteratee http://www.playframework.com/documentation/api/2.1.0/scala/index.html#play.api.libs.iteratee.Iteratee Play 2.10 API %}
An Iteratee consumes a stream of elements of type E, producing a result of type A. The stream itself is represented by the Input trait. An Iteratee is an immutable data type, so each step in consuming the stream generates a new Iteratee with a new state.
{% endblockquote %}

Let's see what happens when we push a Tweet into the system:

{% img left /images/Iteratee2.svg 800 300 'image' 'images' %}

The Tweet appears on the EventBus, is received by the subscribing actor, pushed into the tweetChannel and from there into the tweetlistIteratee by being applied to the **Cont** function inside that Iteratee, resulting in a new Iteratee with the Tweet prepended to the accumulator (and the tweetlistInterceptor function executed in the process, doing the statistic computations and pushing the result into the WebSocket connection to the client). This results in a brand new Iteratee.

This is what confused me initially. How does the Enumerator keep track of the current Iteratee it will have to feed with the next element in the stream? The Enumerator cannot call the initial Iteratee again and again, at least not of there is supposed to be aggregate state. Does this mean the enumerator has mutable internal state, holding the latest Iteratee? I wanted to know and did not find any answers, so I resorted to reading the source code.

It turns out it depends on the definition of mutable state and also on the kind of Enumerator. The **[WS](https://github.com/playframework/Play20/blob/2.1.0/framework/src/play/src/main/scala/play/api/libs/ws/WS.scala)** object or the now-deprecated [PushEnumerator](https://github.com/playframework/Play20/blob/2.1.0/framework/src/iteratees/src/main/scala/play/api/libs/iteratee/Enumerator.scala) use plain old vars to achieve this. Let's look at WS first because the construct is simpler than the one in **[Concurrent.scala](https://github.com/playframework/Play20/blob/2.1.0/framework/src/iteratees/src/main/scala/play/api/libs/iteratee/Concurrent.scala)**.

{% codeblock WS Enumerator excerpts lang:scala https://github.com/playframework/Play20/blob/2.1.0/framework/src/play/src/main/scala/play/api/libs/ws/WS.scala WS.scala%}
    // line 236
    var iteratee: Iteratee[Array[Byte], A] = null
     
    // line 252 
    override def onBodyPartReceived(bodyPart: HttpResponseBodyPart) = {
      if (!doneOrError) {
        iteratee = iteratee.pureFlatFold {
          case Step.Done(a, e) => {
            doneOrError = true
            val it = Done(a, e)
            iterateeP.success(it)
            it
          }
          case Step.Cont(k) => {
            k(El(bodyPart.getBodyPartBytes()))
          }      
{% endcodeblock %}

Above we see that the WS object stores the Iteratee as a plain old var, which is replaced in the pureFlatFold step by the subsequent Iteratee returned by k in the case that the Iteratee is in the Cont state. Okay, now this makes sense, the Enumerator does keep track of the next Iteratee to push information into. But mutable state, a var? This is actually fine and safe because this mutable var is contained locally and the WS connection will only run in a single thread anyways.

Here we are not using this kind of Enumerator though, we are using Concurrent.broadcast. This one uses a much more interesting approach: STM (Software Transactional Memory) is used to store Refs to the next Iteratee. The [Akka documentation](http://doc.akka.io/docs/akka/2.1.0/scala/stm.html) names Clojure's approach as the motivation for the usage of STM within Akka, and it is a great and concise read, I recommend reading the whole thing. 

{% blockquote Clojure's approach to Identity and State http://clojure.org/state clojure.org/state %}
There is another way, and that is to separate identity and state (once again, indirection saves the day in programming). We need to move away from a notion of state as "the content of this memory block" to one of "the value currently associated with this identity". Thus an identity can be in different states at different times, but the state itself doesn't change. That is, an identity is not a state, an identity has a state. Exactly one state at any point in time. And that state is a true value, i.e. it never changes. If an identity appears to change, it is because it becomes associated with different state values over time. This is the Clojure model.
{% endblockquote %}

Without wanting to go into too much detail, the difference when using STM is that references to immutable vals are stored, which are not manipulated in place but instead swapped against a new immutable val. Whatever is retrieved from the STM represents the state at the time of retrieval as an immutable fact. A later retrieval might return a different result, whatever is then the current state, but once the state is retrieved it stays the same throughout the lifecycle of that val, it cannot be changed elsewhere the way it could happen with a var (leading to odd behavior). This is one way to make shared state inside STM thread-safe, the other one is that every change to the shared state is transacted, with the ability to roll back when the state has been updated from elsewhere (e.g. another thread). Let's have a quick look how this changes the previous drawing in my understanding:

{% img left /images/Iteratee3.svg 800 300 'image' 'images' %}

The enumerator adds the Iteratee to a list of Iteratees. Then the enumerator is not directly involved in calling the Iteratee any longer, instead the push function looks up the Iterator, calls Cont on it like in the previous example and eventually swaps it against the next Iteratee:

{% img left /images/Iteratee4.svg 800 300 'image' 'images' %}

I will have to study **[Concurrent.scala](https://github.com/playframework/Play20/blob/2.1.0/framework/src/iteratees/src/main/scala/play/api/libs/iteratee/Concurrent.scala)** some more in order to understand how exactly this happens.

Finally, we push the result of the computation in the previous step into the WebSocket connection towards the browser. Here once again we use Concurrent.broadcast to create the aforementioned enumerator / channel tuple, this time of type String. The channel is used to push String serialized JSON towards the client. We do not actually create the Iteratee here, instead we use the enumerator as part of the returned tuple in line 77 together with an Iteratee that we can use to process incoming information from the WebSocket connection. In this case, we use a very simple Iteratee which completely ignores all input:

{% codeblock Enumerator for tweetIteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/f51dac075a6d287b58e55771497b4fd6aa00f32a/app/controllers/Twitter.scala Twitter.scala %}
 /** Line 35: Iteratee for incoming messages on WebSocket connection, currently ignored */
  val in = Iteratee.ignore[String]

 /** Creates enumerator and channel for Strings through Concurrent 
  *  factory objectfor pushing data through the WebSocket */
  val (out, wsOutChannel) = Concurrent.broadcast[String]
      
  // line 55: used inside interceptTweetList function                
  wsOutChannel.push(Json.stringify(Json.toJson(tweetState)))
  
  // line 77: return value in tweetFeed function 
  (in, out) // in and out channels for WebSocket connection
{% endcodeblock %}

Instead of the Iteratee.ignore[String] we could define an Iteratee that processes information coming from the browser here, if so desired. This will be useful when allowing the client to send control commands towards the server through the WebSocket connection.

One comment regarding possible Iteratee states: An Iteratee can  be in one of three states, Cont, Done and Error. The Done state does not seem particularly useful when dealing with truly open-ended streams. When is a Twitter stream done? When Twitter ceases to exist? For this reason I also do not care about any result that could be computed on a Done state in this application. Results over a stream of Tweets as presented here are only meaningful incrementally. But a Done state could certainly be useful in other applications, such as when reading from a large file in smaller chunks or when streaming data from [ReactiveMongo](http://reactivemongo.org) until the iterator runs out of data. Then a final computation makes sense.

Okay, this has been a lot. But I promised to share what I learned about Iteratees with this project so far. Let me know if this helped you in your understanding as well.

Cheers,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>