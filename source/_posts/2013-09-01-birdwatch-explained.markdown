---
layout: post
title: "BirdWatch explained"
date: 2013-09-01 16:54
comments: true
categories: 
---
In this article I would like to try a different approach. 
This explanatory article will be fairly long as I want to cover the entire application in one article, not spread out over multiple ones. But this process will take a little bit, and I don't want to let you wait until the process of writing the article is finished.
I enjoy reading books before they are finished. Manning publications and the pragmatic programmer series have some good examples of this. So I thought why not try the same for a blog article. 
The remainder of this article is under contruction. Every part of it will potentially change multiple times until it is finally done. I will announce updates to the article on the mailing list, which you can subscribe to here if you like.
With that being said, let's get started with the actual article.

BirdWatch is a reactive web application for consuming the Twitter Streaming API for a selection of terms. It processes tweets in a server side application making use of Play Framework. The tweets are then stored inside ElasticSearch, making them available for complex full-text searches. 
On the client side, a Single Page Application using AngularJS allows the user to search within the body of Tweets and visualizes some basic statistics, besides showing a paginated list of the query matches. 
Searches work in realtime thanks to Percolation queries inside ElasticSearch. Every search, besides being used for retrieving previous matches, is also registered with ElasticSearch and new tweets are then matched against existing queries and delivered to the client using Server Sent Events. The client side visualizations are then updated with new query results as they are tweeted.

Here is an attempt to draw this:

{% img left /images/ 'image' 'images' %}


A tweet is received by the TwitterClient actor and inserted into the ElasticSearch index using a WS client, which is an asynchronous HTTP client provided by Play Framework. It is then also POSTed to the precolation query endpoint of ElasticSearch, which matches it against existing queries and returns a list of the matched query IDs. The query IDs are hashes of the query string itself. This has the advantage that every query will only be inserted once instead of again and again for every client. A TweetMatches object is then posted to the internal message bus, containing the original tweet and also a List of all the matches that were found.

{% codeblock Twitter Streaming API Client lang:scala https://github.com/matthiasn/sse-chat-example/blob/6d39660cca26ce089c6c80238a155ce6610b3684/app/controllers/ChatApplication.scala ChatApplication.scala %}
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
  
  /** Starts new WS connection to Twitter Streaming API. Twitter disconnects the previous one automatically.
    * Can this be ended explicitly from here though, without resetting the whole underlying client? */
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
