---
layout: post
title: "BirdWatch explained"
date: 2013-09-01 16:54
comments: true
categories: 
---
This article is supposed to explain all aspects of the **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** application. Now this will be a longer undertaking and I don't want to wait weeks until I can publish the next article. At the same time I prefer reading stuff in one place as opposed to a series of articles coming out every so many weeks, if ever.

So what I'll do is publish this article as I write it. I have found it quite enjoyable over the last couple of years to read books as they are written. So why not try that for a blog article. Just know that whatever you read may or may not be there the next time you stop by. And feel free to give feedback throughout the process. 

<!-- more -->

**UNDER CONSTRUCTION**

**[BirdWatch](http://birdwatch.matthiasnehlsen.com)** is a reactive web application for consuming the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** for a selection of terms. It processes tweets in a server side application making use of **[Play Framework](http://www.playframework.com)**. The tweets are then stored inside **[ElasticSearch](http://www.elasticsearch.org)**, making them available for complex full-text searches. 
On the client side, a Single Page Application using **[AngularJS](http://angularjs.org)** allows the user to search within the body of Tweets and visualizes some basic statistics, besides showing a paginated list of the query matches. 
Searches work in realtime thanks to **[Percolation queries](http://www.elasticsearch.org/guide/reference/api/percolate/)** inside ElasticSearch. Every search, besides being used for retrieving previous matches, is also registered with ElasticSearch and new tweets are then matched against existing queries and delivered to the client using **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**. The client side visualizations based on **[D3.js](http://d3js.org)** are then updated with new query results as they are tweeted.

Here is an attempt to draw this, with a focus on the **[Twitter client](https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala)**. More detail on the controller interactions and other parts of the application will follow.

{% img left /images/birdwatch2.png 'image' 'images'%}
   
   
###TwitterClient Actor
This component of the server side application establishes the communication with Twitter and then monitors the connection using a supervisor. It can happen that the connection gets interrupted, in which case a new connection gets started by the supervisor actor.

So what is an Actor?

{% blockquote Akka Actors http://akka.io http://akka.io %}
Actors are very lightweight concurrent entities. They process messages asynchronously using an event-driven receive loop. Pattern matching against messages is a convenient way to express an actor's behavior. They raise the abstraction level and make it much easier to write, test, understand and maintain concurrent and/or distributed systems. You focus on workflow—how the messages flow in the system—instead of low level primitives like threads, locks and socket IO.
{% endblockquote %}

Let's walk through the source code. The TwitterClient establishes a connection to the Twitter streaming endpoint using the **[Play WS API](http://www.playframework.com/documentation/2.1.3/ScalaWS)**. This connection stays open indefinitely. The remote side then delivers new Tweets in chunks whenever any match for the set of topics is found. This set of topics is passed in via a query string (see start() function). The URL for starting a streaming API client has this format:

<small>**https://stream.twitter.com/1.1/statuses/filter.json?track=angularjs,playframework,elasticsearch**</small>


{% codeblock WS Connection lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient %}
  /** Starts new WS connection to Twitter Streaming API. Twitter disconnects the previous one automatically. */
  def start() {
    println("Starting client for topics " + topics)
    val url = twitterURL + topics.mkString("%2C").replace(" ", "%20")
    WS.url(url).withTimeout(-1).sign(OAuthCalculator(Conf.consumerKey, Conf.accessToken)).get(_ => tweetIteratee)
  }
{% endcodeblock %}

The supervisor monitors the connection by receiving a message for each received tweet and accounting for when the last one was received. It then gets sent CheckStatus messages from time to time, upon which it will check the time of the last tweet it received. If that was too long ago it will consider the connection dead and start a new one.

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

Tweets are received as Byte array chunk by the WS client and passed into the TweetIteratee function.

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

The TweetIteratee function takes care of inserting the tweet into the ElasticSearch index, once again using an asynchronous WS client. Then it calls matchAndPush with the **[JSON](http://tools.ietf.org/html/rfc4627)** representation of a tweet.  

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

MatchAndPush then matches the tweet with pre-registered queries by POSTing it to the tweet to the percolation query endpoint of ElasticSearch, which returns a list of the matched query IDs. The query IDs are hashes of the query string itself. This has the advantage that every query will only be inserted once instead of again and again for every client in the case of popular queries. The tweet then gets combined with the query IDs and pushed into the tweets channel of Concurrent.broadcast. Connections to the controller will then receive these tweets and determine if they are supposed to be relayed to the web client depending on the hash of the search string.

###Controller
The other part of the Play application, delivering tweets matching user searches to web clients...

###AngularJS client
Responsible for handling interaction and receiving tweets…

###Visualizations using D3.js
The one area I am going to focus on next, once this article is done. Can't wait to put more effort into this part...

###ElasticSearch
**[ElasticSearch](http://www.elasticsearch.org)** stores tweets and offers full-text search. It also allows the registration of real-time queries...

###nginx proxy
**[nginx](http://wiki.nginx.org/Main)** faces the outside world, all traffic goes through it in the deployed version...


Please come back, this articles evolves over time. For updates please sign up to the mailing list.

Cheers,
Matthias