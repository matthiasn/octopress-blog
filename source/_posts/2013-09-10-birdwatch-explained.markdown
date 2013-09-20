---
layout: post
title: "BirdWatch explained"
date: 2013-09-10 22:54
comments: true
categories: 
---
This article attempts to explain all aspects of the **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** application. This will be quite a lengthy undertaking, but I don't want to wait for weeks until I can publish the next article. Also, I prefer reading stuff at one go rather than facing a series of articles that come out every few weeks, if ever.

So what I'll do is publish this article while I am writing it. In the last couple of years I found it quite enjoyable to read books while they were being written. So I thought “Why not try that for a blog article.” Just bear in mind that whatever you read may have changed the next time you stop by. There is a **[changelog](https://github.com/matthiasn/octopress-blog)** though. Please feel free to give your feedback throughout the process.

<!-- more -->

**UNDER CONSTRUCTION**

**[BirdWatch](http://birdwatch.matthiasnehlsen.com)** is a reactive web application that consumes the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** for a selection of terms. It processes tweets in a server side application that is based on **[Play Framework](http://www.playframework.com)**. The tweets are then stored inside **[ElasticSearch](http://www.elasticsearch.org)**, where they are available for complex full-text searches. 
On the client side, a **[Single Page Application](http://en.wikipedia.org/wiki/Single-page_application)** based on **[AngularJS](http://angularjs.org)** allows the user to search within the entire body of stored tweets and visualize some basic statistics as well as display a paginated list of the search results. 
Searches are conducted in real time thanks to so called **[Percolation queries](http://www.elasticsearch.org/guide/reference/api/percolate/)** within ElasticSearch. Besides being used to retrieve previous matches, each search is also registered with ElasticSearch. New tweets are then matched against existing queries and delivered to the client via **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**. The client side visualizations based on **[D3.js](http://d3js.org)** are then updated with new query results while they are being tweeted.

Here is my attempt at illustrating the above in a drawing with a focus on the **[Twitter client](https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala)**. More details on the controller interactions and other parts of the application will follow.

{% img left /images/birdwatch2.png 'image' 'images'%}
   
   
###TwitterClient Actor
This server side application component establishes the communication with Twitter and then monitors the connection with a supervisor actor. The connection may be disrupted, but the supervisor will then notice inactivity and start a new connection.

So what is an Actor?

{% blockquote Akka Actors http://akka.io http://akka.io %}
Actors are very lightweight concurrent entities. They process messages asynchronously using an event-driven receive loop. Pattern matching against messages is a convenient way to express an actor's behavior. They raise the abstraction level and make it much easier to write, test, understand and maintain concurrent and/or distributed systems. You focus on workflow—how the messages flow in the system—instead of low level primitives like threads, locks and socket IO.
{% endblockquote %}

Let's have a look at the source code. The Twitter client establishes a connection to the Twitter streaming endpoint using the **[Play WS API](http://www.playframework.com/documentation/2.1.3/ScalaWS)**. This connection stays open indefinitely. The remote side then delivers new tweets in byte array chunks whenever a match for the specified set of topics has been tweeted. This set of topics is passed in via a query string parameter (see **start()** function). The URL for starting a streaming API client has the following format:

<small>**https://stream.twitter.com/1.1/statuses/filter.json?track=angularjs,playframework,elasticsearch**</small>


{% codeblock WS Connection lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala TwitterClient %}
  /** Starts new WS connection to Twitter Streaming API. Twitter disconnects the previous one automatically. */
  def start() {
    println("Starting client for topics " + topics)
    val url = twitterURL + topics.mkString("%2C").replace(" ", "%20")
    WS.url(url).withTimeout(-1).sign(OAuthCalculator(Conf.consumerKey, Conf.accessToken)).get(_ => tweetIteratee)
  }
{% endcodeblock %}

The supervisor monitors the connection through TweetReceived messages it receives for each tweet and that indicate when the last tweet was received. CheckStatus messages are sent to the supervisor at regular intervals and prompt it to check when the last tweet was received. If the time span is too long, the supervisor will treat the connection as dead and establish a new one. 

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

The WS client receives tweets as byte array chunk and passes them to the TweetIteratee function.

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

The TweetIteratee function once again uses an asynchronous **[WS client](http://www.playframework.com/documentation/2.1.3/ScalaWS)** to insert the **[JSON](http://tools.ietf.org/html/rfc4627)** representation of the tweet into the ElasticSearch index. It then calls the matchAndPush function with the tweet as a JsValue. It also checks if Twitter finds that you have been calling the Streaming API too often, which has happened to me during the development process, most likely due to some mistakes on my part. In that case the chunk coming in through the open connection to Twitter contained the "Easy there, Turbo…" string you will find in the code above. I found that the best way to deal with that was to implement a backoff strategy, which is initiated by sending a BackOff message to the Supervisor actor. The receive method of the actor then performs pattern matching on incoming messages. In the case of receiving a BackOff case object, it will set the lastBackOff timestamp, keeping it from reconnecting until the backOffInterval has passed (see CheckStatus in the earlier code block).

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

MatchAndPush then matches the tweet with pre-registered queries by POSTing it to the percolation query endpoint of ElasticSearch, which returns a list of the matched query IDs. The query IDs are hashes of the query string itself. That way each query will only be inserted once instead of individually for every client. The tweet is then combined with the query IDs for matching searches and pushed into the tweets channel of Concurrent.broadcast. The controller action responsible for streaming tweets to web clients will then attach an Emuratee / Iteratee chain which determines if the tweet is to be relayed to a particular client or not, depending on the hash of the search string.

###Controller
Now let's have a look at the controller of the application which serves: 

* the main page
* previous tweets that match a search 
* a **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)** stream with future matches for the query.

The endpoints for these actions are defined in the routes file:

{% codeblock Application Routes lang:text https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/conf/routes routes %}
GET        /                     controllers.BirdWatch.index
GET        /tweetFeed            controllers.BirdWatch.tweetFeed(q: String ?= "*")
POST       /tweets/search        controllers.BirdWatch.search
{% endcodeblock %}

Let's start with code for the **index** action which serves the main page. The HTML comes from a rendered view, which in this case is almost entirely plain HTML, except that the title of the page is inserted through a parameter. But more sophisticated data structures could be inserted here as necessary. For example, imagine localized strings that depend on the language of the client browser. That kind of information is available to the action through the request (which we can make available to the action as seen in the controller actions below).

{% codeblock Index Action lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/controllers/BirdWatch.scala BirdWatch.scala %}
 /** Controller action serving single page application */
  def index = Action { Ok(views.html.index("Birdwatch")) }
{% endcodeblock %}

The **search** action serves search results from **[ElasticSearch](http://www.elasticsearch.org)**. The search itself is POSTed in **[JSON](http://tools.ietf.org/html/rfc4627)** format and passed straight through to ElasticSearch. The WS client is used to make a request to a local instance of **[ElasticSearch](http://www.elasticsearch.org)**. The future response to this request is then mapped into the response of the search action. The **search** controller action is really only a proxy for development purposes. My **[deployed instance](http://birdwatch.matthiasnehlsen.com)** of the application has **[nginx](http://wiki.nginx.org/Main)** running in front of it, which for this route directly talks to ElasticSearch instead of keeping the **[garbage collection](http://en.wikipedia.org/wiki/Garbage_collection)** mechanism of the **[JVM](http://en.wikipedia.org/wiki/Java_virtual_machine)** busy with unprocessed data. We will have a look at **[nginx](http://wiki.nginx.org/Main)** configuration further down in this article.

{% codeblock Search Action lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/controllers/BirdWatch.scala BirdWatch.scala %}
/** Controller for serving main BirdWatch page including the SSE connection */
object BirdWatch extends Controller {
  /** Controller Action serving Tweets as JSON going backwards in time. Query passed in as JSON */
  def search =  Action(parse.json) {
    implicit req => Async {
      val url =  elasticTweetURL + "_search"      
      WS.url(url).post(req.body).map { res => Ok(res.body) }
    }
  }
{% endcodeblock %}

Now we'll get to the most complicated part: serving the live stream for a search in the **tweetFeed** action. This controller makes use of **[Iteratee](http://www.playframework.com/documentation/2.1.3/Iteratees)** library from Play Framework. I wrote an **[article about Iteratees](http://matthiasnehlsen.com/blog/2013/04/23/iteratee-can-i-have-that-in-a-sentence/)** a while back. I haven't read it in a while, it may need some revision but you might still find it useful. It’s rather long, but then this article isn’t exactly what you would call short either.

The client establishes a connection to the streaming endpoint served by the **tweetFeed** action, which then delivers the results - not all at once, but in chunks whenever new data is available for this request. This data originates from the Enumerator from the **Concurrent.broadcast** object which we have seen above. Iteratees can attach to this Enumerator. In essence they are functions that define what do do with each new piece of information. Enumeratees are transformer functions that can be placed in between the Enumerator as the source and the Iteratee as the final sink of this information. As to the streaming action, the **Ok.feed** itself represents the Iteratee, doing nothing more than delivering each chunk to the connected client. Iteratees can also hold an accumulator for the current state of an ongoing computation, but that feature of Iteratees is not used in this use case.

Enumeratees are then placed between the source and the sink, forming a processing chain. This is the most interesting part of the code:

{% codeblock Streaming Action and Iteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/controllers/BirdWatch.scala BirdWatch.scala %}
      WS.url(elasticPercolatorURL + queryID).post(query).map {
        res => Ok.feed(TwitterClient.jsonTweetsOut     
          &> matchesFilter(queryID)  
          &> Concurrent.buffer(100)
          &> matchesToJson
          &> connDeathWatch(req, new DateTime(DateTimeZone.UTC)  )
          &> EventSource()).as("text/event-stream")       
      }
{% endcodeblock %}

Inside the action we establish a connection to ElasticSearch by posting the query as a percolation query. The ID of the query is determined by hashing the entire query using SHA-256. That way repeated queries always have the same ID within ElasticSearch. Once that request is complete, we respond to the client with a feed that contains the follwing processing chain:

* Tweets with matched query IDs originate from the TwitterClient.jsonTweetsOut Enumerator.
* The matchesFilter Enumeratee checks if the matches set contains the query hash. If not, no further actions will take place.
* A buffer ensures that the application is not held up if the sink is too slow, for example, when a client connection suffers from network congestion. Tweets will be dropped when the buffer is full, which won't be much of an issue because if your connection is so slow, you probably don't want to use this application in the first place.
* Matches are converted to JSON
* The connection uptime is monitored. In this Enumeratee the duration of the connection will be logged.
* The data is converted to comply with the **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)** specifications.

Below, you'll find the entire code for the action. The Enumeratees should be fairly self-explanatory.

{% codeblock Streaming Action and Iteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/controllers/BirdWatch.scala BirdWatch.scala %}
/** Controller for serving main BirdWatch page including the SSE connection */
object BirdWatch extends Controller {
  /** calculates milliseconds between passed in DateTime and time of function call */
  def duration(since: DateTime) = DateTime.now.getMillis - since.getMillis
  
  /** Enumeratee for detecting disconnect of SSE stream */
  def connDeathWatch(req: Request[AnyContent], since: DateTime): Enumeratee[JsValue, JsValue] =
    Enumeratee.onIterateeDone { () => Logger.logRequest(req, "SSE disconnected", 200, duration(since))}
  
  /** Filtering Enumeratee applying containsAll function */
  def matchesFilter(qID: String) = Enumeratee.filter[Matches] { pm => pm.matches.contains(qID) }

  /** Enumeratee: TweetMatches to Tweet adapter */
  val matchesToJson: Enumeratee[Matches, JsValue] = Enumeratee.map[Matches] { pm => pm.json }

  /** Serves Tweets as Server Sent Events over HTTP connection TODO: change to POST */
  def tweetFeed(q: String) = Action {
    implicit req => Async {
      Logger.logRequest(req, "/tweetFeed?q=" + q, 200, 0)

      val query = Json.obj(
        "query" -> Json.obj("query_string" -> Json.obj("default_field" -> "text", 
          "default_operator" -> "AND", "query" -> ("(" + q + ") AND lang:en"))), 
        "timestamp" -> dtFormat.print(new DateTime(DateTimeZone.UTC))
      )

      /** identify queries by hash, only store unique queries once */
      val md = MessageDigest.getInstance("SHA-256")
      val queryID = md.digest(q.getBytes).map("%02x".format(_)).mkString

      WS.url(elasticPercolatorURL + queryID).post(query).map {
        res => Ok.feed(TwitterClient.jsonTweetsOut     
          &> matchesFilter(queryID)  
          &> Concurrent.buffer(100)
          &> matchesToJson
          &> connDeathWatch(req, new DateTime(DateTimeZone.UTC)  )
          &> EventSource()).as("text/event-stream")       
      }
    }
  }   
}
{% endcodeblock %} 

To be continued. Drawing will follow.
 
###AngularJS Client
Responsible for handling interaction and receiving tweets…

###Visualizations using D3.js
This is one of the areas I am going to focus on next, once this article is done...

###ElasticSearch
**[ElasticSearch](http://www.elasticsearch.org)** stores tweets and offers full-text search. It also allows the registration of real-time queries...

###nginx Proxy
**[nginx](http://wiki.nginx.org/Main)** faces the outside world, all traffic goes through it in the deployed version...


This articles will evolve over time. Hope you will find it useful so far. For updates please sign up to the mailing list.

Cheers,
Matthias
