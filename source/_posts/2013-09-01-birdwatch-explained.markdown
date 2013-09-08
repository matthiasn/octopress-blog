---
layout: post
title: "BirdWatch explained"
date: 2013-09-01 16:54
comments: true
categories: 
---
This article is supposed to explain all aspects of the BirdWatch application. Now that will be a longer undertaking and I don't want to have to wait weeks until I can publish the next article. At the same time I prefer reading stuff in one place as opposed to a series of articles coming out every so many weeks, if ever.

So what I'll do is publish this article as I write it. I have found it quite enjoyable over the last couple of years to read books as they were written in some kind of early access programs. So why not try that for a blog article. Just know that whatever you read may or may not be there the next time you stop by. And feel free to give feedback as the article gets written. You can sign up to the mailing list for updates on the article.

UNDER CONSTRUCTION 

BirdWatch is a reactive web application for consuming the Twitter Streaming API for a selection of terms. It processes tweets in a server side application making use of Play Framework. The tweets are then stored inside ElasticSearch, making them available for complex full-text searches. 
On the client side, a Single Page Application using AngularJS allows the user to search within the body of Tweets and visualizes some basic statistics, besides showing a paginated list of the query matches. 
Searches work in realtime thanks to Percolation queries inside ElasticSearch. Every search, besides being used for retrieving previous matches, is also registered with ElasticSearch and new tweets are then matched against existing queries and delivered to the client using Server Sent Events. The client side visualizations are then updated with new query results as they are tweeted.

Here is an attempt to draw this:

{% img left /images/ 'image' 'images' %}
  
   
Architecture and Message Flow

---
  
##TwitterClient Actor

This component of the server side application establishes the communication with Twitter and then monitors the connection using a supervisor. It can happen that the connection gets interrupted, in which case the connection actor gets restarted by the supervisor.

So what is an Actor?

{% blockquote Akka Actors http://akka.io http://akka.io %}
Actors are very lightweight concurrent entities. They process messages asynchronously using an event-driven receive loop. Pattern matching against messages is a convenient way to express an actor's behavior. They raise the abstraction level and make it much easier to write, test, understand and maintain concurrent and/or distributed systems. You focus on workflow—how the messages flow in the system—instead of low level primitives like threads, locks and socket IO.
{% endblockquote %}

Let's walk through the source code. The TwitterClient establishes a connection to Twitter using the WS library provided by Play Framework.

A tweet is received by the TwitterClient actor and inserted into the ElasticSearch index using a WS client, which is an asynchronous HTTP client provided by Play Framework. 

It is then also POSTed to the percolation query endpoint of ElasticSearch, which matches it against existing queries and returns a list of the matched query IDs. The query IDs are hashes of the query string itself. This has the advantage that every query will only be inserted once instead of again and again for every client. A TweetMatches object is then posted to the internal message bus, containing the original tweet and also a List of all the matches that were found.


{% codeblock Tweet Iteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient %}
  /** Iteratee for processing each chunk from Twitter stream of Tweets. Parses Json chunks 
    * as Tweet instances and publishes them to eventStream. */
  val tweetIteratee = Iteratee.foreach[Array[Byte]] {
    chunk => {
      val chunkString = new String(chunk, "UTF-8")
      supervisor ! TweetReceived
      
      if (chunkString.contains("Easy there, Turbo. Too many requests recently. Enhance your calm.")) {
        supervisor ! BackOff
      }
          
      val json = Json.parse(chunkString)
      (json \ "id_str").asOpt[String].map { id => WS.url(elasticTweetURL + id).put(json) }
      matchAndPush(json)
    }
  }
{% endcodeblock %}


{% codeblock WS Connection lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient %}
  /** Starts new WS connection to Twitter Streaming API. Twitter disconnects the previous one automatically.
    * Can this be ended explicitly from here though, without resetting the whole underlying client? */
  def start() {
    println("Starting client for topics " + topics)
    val url = twitterURL + topics.mkString("%2C").replace(" ", "%20")
    WS.url(url).withTimeout(-1).sign(OAuthCalculator(Conf.consumerKey, Conf.accessToken)).get(_ => tweetIteratee)
  }
{% endcodeblock %}


{% codeblock Connection Supervisor lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient %}
  /** Actor taking care of monitoring the WS connection */
  class Supervisor(eventStream: akka.event.EventStream) extends Actor {
    var lastTweetReceived = 0L 
    var lastBackOff = 0L

    /** Receives control messages for starting / restarting supervised client and adding or removing topics */
    def receive = {
      case AddTopic(topic)  => topics.add(topic)
      case RemoveTopic(topic) => topics.remove(topic)
      case Start => start()
      case CheckStatus => if (now - lastTweetReceived > retryInterval && now - lastBackOff > backOffInterval) start()
      case BackOff => lastBackOff = now  
      case TweetReceived => lastTweetReceived = now   
    }
  }
{% endcodeblock %}

{% codeblock Matching Tweets with Queries lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient %}
  /** Takes JSON and matches it with percolation queries in ElasticSearch
    * @param json JsValue to match against 
    */
  def matchAndPush(json: JsValue): Unit = {
    WS.url(elasticPercolatorURL).post(Json.obj("doc" -> json)).map {
      res => (Json.parse(res.body) \ "matches").asOpt[Seq[String]].map {
        m => jsonTweetsChannel.push(Matches(json, HashSet.empty[String] ++ m))
      }
    }
  }
}
{% endcodeblock %}

{% codeblock Twitter Streaming API Client lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient TwitterClient %}
object TwitterClient {
  val twitterURL = Conf.get("twitter.URL")
  val elasticTweetURL = Conf.get("elastic.TweetURL")
  val elasticPercolatorURL = Conf.get("elastic.PercolatorURL")
  val backOffInterval = 60 * 15 * 1000
  val retryInterval = 60 * 1000

  def now = DateTime.now.getMillis

  /** Protocol for Twitter Client actors */
  case class AddTopic(topic: String)
  case class RemoveTopic(topic: String)
  case object CheckStatus
  case object TweetReceived
  case object Start
  case object BackOff

  /** BirdWatch actor system, supervisor, timer*/
  val system = ActorSystem("BirdWatch")
  val supervisor = system.actorOf(Props(new Supervisor(system.eventStream)), "TweetSupervisor")
  system.scheduler.schedule(60 seconds, 60 seconds, supervisor, CheckStatus )

  /** system-wide channels / enumerators for attaching SSE streams to clients*/
  val (jsonTweetsOut, jsonTweetsChannel) = Concurrent.broadcast[Matches]
  
  /** Subscription topics stored in this MUTABLE collection */
  val topics: scala.collection.mutable.HashSet[String] = new scala.collection.mutable.HashSet[String]()

  /** Iteratee for processing each chunk from Twitter stream of Tweets. Parses Json chunks 
    * as Tweet instances and publishes them to eventStream. */
  val tweetIteratee = Iteratee.foreach[Array[Byte]] {
    chunk => {
      val chunkString = new String(chunk, "UTF-8")
      supervisor ! TweetReceived
      
      if (chunkString.contains("Easy there, Turbo. Too many requests recently. Enhance your calm.")) {
        supervisor ! BackOff
        println("\n" + chunkString + "\n")
      }
          
      val json = Json.parse(chunkString)
      (json \ "id_str").asOpt[String].map { id => WS.url(elasticTweetURL + id).put(json) }
      matchAndPush(json)
    }
  }
  
  /** Starts new WS connection to Twitter Streaming API. */
  def start() {
    println("Starting client for topics " + topics)
    val url = twitterURL + topics.mkString("%2C").replace(" ", "%20")
    WS.url(url).withTimeout(-1).sign(OAuthCalculator(Conf.consumerKey, Conf.accessToken)).get(_ => tweetIteratee)
  }

  /** Actor taking care of monitoring the WS connection */
  class Supervisor(eventStream: akka.event.EventStream) extends Actor {
    var lastTweetReceived = 0L 
    var lastBackOff = 0L

    /** Receives control messages for starting / restarting supervised client and adding or removing topics */
    def receive = {
      case AddTopic(topic)  => topics.add(topic)
      case RemoveTopic(topic) => topics.remove(topic)
      case Start => start()
      case CheckStatus => if (now - lastTweetReceived > retryInterval && now - lastBackOff > backOffInterval) start()
      case BackOff => lastBackOff = now  
      case TweetReceived => lastTweetReceived = now   
    }
  }

  /** Takes JSON and matches it with percolation queries in ElasticSearch
    * @param json JsValue to match against 
    */
  def matchAndPush(json: JsValue): Unit = {
    WS.url(elasticPercolatorURL).post(Json.obj("doc" -> json)).map {
      res => (Json.parse(res.body) \ "matches").asOpt[Seq[String]].map {
        m => jsonTweetsChannel.push(Matches(json, HashSet.empty[String] ++ m))
      }
    }
  }
}

{% endcodeblock %}

So the client actor establishes a WS connection to the Twitter URL, which is an HTTP connection to the Twitter streaming endpoint that stays open indefinitely. The remote side then delivers new Tweets in chunks whenever any match for the set of topics is found. This set of topics is passed in via a query string (see start() function). The URL for starting a streaming API client has this format:

https://stream.twitter.com/1.1/statuses/filter.json?track=angularjs,playframework,elasticsearch


Looking at the code above now, I find it to be on the long side, considering what it is doing. I'd be interested in suggestions on making it more concise. No time to do it myself at the moment.

##Controller



##AngularJS client


##ElasticSearch


##nginx proxy



Please come back, this articles evolves over time. For updates please sign up to the mailing list.

Cheers,
Matthias