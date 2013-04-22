---
layout: post
title: "Iteratee: can I have that in a sentence?"
date: 2013-04-22 13:08
comments: true
categories: 
---
A couple of weeks back I was trying to wrap my head around **[Iteratees](http://www.playframework.com/documentation/2.0.4/Iteratees)** so I read what I could find on Google. Afterwards, I had a very high level idea about Enumerators producing or emitting a stream of information and Iteratees consuming that information, potentially with aggregate state. At the same time, the Iteratee was supposed to be immutable. Okay, so I have this immutable thing aggregating state. That did not seem right. 

<!-- more -->

I had to see it in action in order to understand how this Iteratee thing works. So I was looking for a stream of information that I could use. I found it in the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)**. A stream of Tweets can be interesting, even outright entertaining, having chosen the right topic(s), and Tweets being tweeted right now when watching the visualization is something that seems easy to relate to. I also wanted to try out a supervised actor hierarchy in this project, so I decided to download the original profile images from Twitter for every single Tweet, down convert them using a couple of actors doing image manipulation and storing an 80x80px PNG thumbnail in **[MongoDB](http://www.mongodb.org)**. This supervised image manipulation will be the topic of another post though.

On the client side I wanted something flashy that makes it obvious that live information from the real world is flowing through the system and reasoned about. I had recently taken an interest in **[D3.js](http://d3js.org)** and I had seen the **[d3-cloud](https://github.com/jasondavies/d3-cloud)** wordcloud implementation by Jason Davies, which is nice to look at, so I wondered if it was difficult to drive it from data streaming to the client over a **[WebSocket](http://tools.ietf.org/html/rfc6455)** connection. The UI at this point was not supposed to be particularly useful, it was really only designed for the effect, as a visualization of something happening right now. I am fully aware that a wordcloud is not the best way for showing the frequency of words, and having it regenerate every 5 seconds makes it even less useful perceptually since whatever you look at will be gone before you can even fully focus on the smaller items. That being said, I was interested in how Iteratees work. The **[D3.js](http://d3js.org)** I use for this project is very basic on my end, I will focus on doing more useful things with D3 later on.

So I started working on this reactive web application called **[BirdWatch](https://github.com/matthiasn/BirdWatch)**. In this article I will go through the parts of the application that are relevant for trying to understand Iteratees. I will do this iteratively in the same order in which my own understanding evolved.  

Let's look at my initial high-level architectural drawing (warning, it is inaccurate, read on to find out why):

{% img left /images/BirdWatch.svg 800 300 'image' 'images' %}

At first, this seems to make sense. The WS object acts as our Enumerator, taking chunks of Array[Byte] it receives through the open HTTP connection to Twitter and passing them along into an Iteratee:

{% codeblock WS-Client lang:scala https://github.com/matthiasn/BirdWatch/blob/e33ce62bb36b4a1228c2f1519de60ef3d65482bd/app/actors/TwitterClient.scala TwitterClient.scala %}
val url = "https://stream.twitter.com/1.1/statuses/filter.json?track="
val conn = WS.url(url + TwitterClient.topics.mkString("%2C").replace(" ", "%20"))
    .withTimeout(-1)
    .sign(OAuthCalculator(consumerKey, accessToken))
    .get(_ => TwitterClient.tweetIteratee)
{% endcodeblock %}

The Iteratee then performs some action (JSON parsing, Tweet reading, sending the Tweet to the ImageConversion actor) for each chunk, without accumulating intermediate state.

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

This at first seduced me into believing that the Iteratee for sending the tweets was one particular object that performed these repeated actions as specified in the foreach part. But that is actually not the case. The Iteratee is immutable and every time we pass information to an Iteratee in a step, a new one is created in return. This does not seem terribly useful as long as we only want to perform a foreach without accumulated state. But bear with me.

Let's have a look at the next Enumerator / Iteratee couple in the application first. Afterwards this will make much more sense.

For the wordcount, which feeds both the wordcloud and the bar chart, we analyze a rolling window of tweets. For this, we need to keep state over say the last 1000 tweets, as is the case here.

Let's have a look at the implementation of the tweetListIteratee first:

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

So here we have constructed an Iteratee which takes as parameters a function f which takes a List[Tweet] and returns Unit, a TweetList which will be our accumulator and n, which is the maximum size of the list in the accumulator or in other words the maximum size of our rolling window that we will reason about. Function f is by definition side-effecting as it returns Unit, so the only effect it can have is outside the tweetListIteratee. Normally we should probably shy away from side-effects, but here I would argue that this is a good thing. Any function passed in here could be defined to have side-effects, but the Unit return type guarantees that f will not be able to mess with the accumulator, it cannot have any effects on it, unlike functions transforming the accumulator. The side-effect f is used for is pushing immutable information into the WebSocket connection. In fact, there is no mutable state in scope for this function anyways that it could mess with. 

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

Let us now hook the Iteratee up with an Enumerator that will drive it before dealing with the issue that the Iteratee is immutable and cannot be changed. **[PushEnumerator](http://www.playframework.com/documentation/api/2.1.0/scala/index.html#play.api.libs.iteratee.PushEnumerator)** is deprecated as of Play 2.10, we are supposed to use **[Concurrent.broadcast](http://www.playframework.com/documentation/api/2.1.0/scala/index.html#play.api.libs.iteratee.Concurrent$)** instead.

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

We call Concurrent.broadcast[Tweet], which returns a tuple of an Enumerator (named accordingly) that we will attach our Iteratee to (using the |>>> operator) and a channel that we can use to push Tweets into. These Tweets will then be consumed by the tweetListIteratee attached to the enumerator. We will get those Tweets from the **[Akka EventBus](http://doc.akka.io/docs/akka/2.1.2/scala/event-bus.html)** by creating an actor which listens events of type Tweet on the EventBus and pushes them. We will look at the EventBus in more detail in the article dealing with the ImageProcessing actor hierarchy. For now it should be sufficient to know that we have a source of Tweets and push each individual occurence of a Tweet event into the tweetChannel, thus creating our own open-ended stream.

At a high level, what we are trying to do is this:

Something does not seem right here. How can we repeatedly pass information to an immutable object, which aggregates state? Turns out we can't. There is no one Iteratee receiving and processing information, instead every step of the Iteratee returns a new Iteratee, with the new state. 



Okay, that makes  
