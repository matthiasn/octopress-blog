---
layout: post
title: "BirdWatch explained"
date: 2013-09-10 22:54
comments: true
categories: 
---
**[BirdWatch](http://birdwatch.matthiasnehlsen.com)** is an **[open-source](https://github.com/matthiasn/BirdWatch)** reactive web application that consumes the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** for a selection of terms. It processes those matching tweets in a server side application that is based on **[Play Framework](http://www.playframework.com)**. The tweets are then stored inside **[ElasticSearch](http://www.elasticsearch.org)**, where they are available for complex full-text searches. 
On the client side, a **[Single Page Application](http://en.wikipedia.org/wiki/Single-page_application)** based on **[AngularJS](http://angularjs.org)** allows the user to perform a live search for tweets with certain keywords and to do some analysis on them, such as word count statistics, activity over time and sorting results by followers and retweet counts.

<!-- more -->

Searches are conducted in real time thanks to so called **[Percolation queries](http://www.elasticsearch.org/guide/reference/api/percolate/)** within ElasticSearch. Besides being used to retrieve previous matches, each search is also registered with ElasticSearch. New tweets are then matched against existing queries and delivered to the client via **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)**. This will be explained in more detail in the ElasticSearch section towards the end of this article. The client side visualizations based on **[D3.js](http://d3js.org)** are then updated with those new search results.

{% img left /images/bw_expl_beer.png 'image' 'images'%}

Here is an architectural overview with a focus on the **[Twitter client](https://github.com/matthiasn/BirdWatch/blob/22f8e3f90a11690eda5e36a339a116821dc1b2ff/app/actors/TwitterClient.scala)**:

{% img left /images/bw_expl_anim.gif 'image' 'images'%}
  
###TwitterClient Actor
This server side application component establishes the communication with Twitter and then monitors the connection with a supervisor actor. The connection may be disrupted, but the supervisor will then notice inactivity and start a new connection.

So what is an Actor?

{% blockquote Akka Actors http://akka.io http://akka.io %}
Actors are very lightweight concurrent entities. They process messages asynchronously using an event-driven receive loop. Pattern matching against messages is a convenient way to express an actor's behavior. They raise the abstraction level and make it much easier to write, test, understand and maintain concurrent and/or distributed systems. You focus on workflow—how the messages flow in the system—instead of low level primitives like threads, locks and socket IO.
{% endblockquote %}

The underlying Actor Model as a model of concurrent computation was first described in a 1973 paper by Carl Hewitt, Peter Bishop and Richard Steiger. I can recommend this **[video](http://channel9.msdn.com/Shows/Going+Deep/Hewitt-Meijer-and-Szyperski-The-Actor-Model-everything-you-wanted-to-know-but-were-afraid-to-ask)** in which Carl Hewitt explains the Actor Model 39 years after its initial inception. Be warned of Erik Meijers vibrant shirt, you may want to dial down the color saturation of your screen ;-) Other than that, I found this video really helpful in getting a better understanding of the subject.

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

Here is an overview of the controller actions:

{% img left /images/controller.png 'image' 'images'%}

Let's start with code for the **index** action which serves the main page. The HTML comes from a rendered view, which in this case is almost entirely plain HTML, except that the some configuration parameters for Google Analytics are inserted here. This has the advantage that the instance specific configuration can be kept in the application.conf file.

{% codeblock Index Action lang:scala https://github.com/matthiasn/BirdWatch/blob/f23ff20638d180ed7aecf36a1071bf1d2bce2e69/app/controllers/BirdWatch.scala BirdWatch.scala %}
/** Controller action serving single page application */
def index = Action {
  Ok(views.html.index(Conf.getOrEmpty("ga.hostname"), Conf.getOrEmpty("ga.domain"), Conf.getOrEmpty("ga.id")))
}  
{% endcodeblock %}

The **search** action serves search results from **[ElasticSearch](http://www.elasticsearch.org)**. The search itself is POSTed in **[JSON](http://tools.ietf.org/html/rfc4627)** format and passed straight through to ElasticSearch. The WS client is used to make a request to a local instance of **[ElasticSearch](http://www.elasticsearch.org)**. The future response to this request is then mapped into the response of the search action. The **search** controller action is really only a proxy for development purposes. My **[deployed instance](http://birdwatch.matthiasnehlsen.com)** of the application has **[nginx](http://wiki.nginx.org/Main)** running in front of it, which for this route directly talks to ElasticSearch instead of keeping the **[garbage collection](http://en.wikipedia.org/wiki/Garbage_collection)** mechanism of the **[JVM](http://en.wikipedia.org/wiki/Java_virtual_machine)** busy with unprocessed data. We will have a look at **[nginx](http://wiki.nginx.org/Main)** configuration further down in this article.

{% codeblock Search Action lang:scala https://github.com/matthiasn/BirdWatch/blob/f23ff20638d180ed7aecf36a1071bf1d2bce2e69/app/controllers/BirdWatch.scala BirdWatch.scala %}
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

Now we'll get to the most complicated part: serving the live stream for a search in the **tweetFeed** action. This controller makes use of the **[Iteratee](http://www.playframework.com/documentation/2.1.3/Iteratees)** library from Play Framework. I wrote an **[article about Iteratees](http://matthiasnehlsen.com/blog/2013/04/23/iteratee-can-i-have-that-in-a-sentence/)** a while back. I haven't read it in a while, it may need some revision but you might still find it useful. It’s rather long, but then this article isn’t exactly what you would call short either.

The client establishes a connection to the streaming endpoint served by the **tweetFeed** action, which then delivers the results - not all at once, but in chunks whenever new data is available for this request. This data originates from the **[Enumerator](http://www.playframework.com/documentation/2.2.0/api/scala/index.html#play.api.libs.iteratee.Enumerator)** from the **[Concurrent.broadcast](http://www.playframework.com/documentation/2.2.0/api/scala/index.html#play.api.libs.iteratee.Concurrent$)** object (provided by Play Framework) which we have seen above. **[Iteratees](http://www.playframework.com/documentation/2.2.0/api/scala/index.html#play.api.libs.iteratee.Iteratee)** can attach to this Enumerator. In essence, Iteratees are functions that define what to do with each new piece of information. Enumeratees are transformer functions that can be placed in between the Enumerator as the source and the Iteratee as the final sink of this information. As to the streaming action, the **Ok.feed** itself represents the Iteratee, doing nothing more than delivering each chunk to the connected client. Iteratees can also hold an accumulator for the current state of an ongoing computation, in which case the individual Iteratee becomes the representation of a step of an ongoing computation, but that feature of Iteratees is not used in this use case. 

Enumeratees are then placed between the source and the sink, forming a processing chain. This is the most interesting part of the code:

{% codeblock Streaming Action and Iteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/f23ff20638d180ed7aecf36a1071bf1d2bce2e69/app/controllers/BirdWatch.scala BirdWatch.scala %}
      WS.url(elasticPercolatorURL + queryID).post(query).map {
        res => Ok.feed(TwitterClient.jsonTweetsOut     
          &> matchesFilter(queryID)  
          &> Concurrent.buffer(100)
          &> matchesToJson
          &> connDeathWatch(req, new DateTime(DateTimeZone.UTC)  )
          &> EventSource()).as("text/event-stream")       
      }
{% endcodeblock %}

Inside the action we establish a connection to ElasticSearch by posting the query as a percolation query (see **ElasticSearch section** below). The ID of the query is determined by hashing the entire query using SHA-256. That way repeated queries always have the same ID within ElasticSearch. Once that request is complete, we respond to the client with a feed that contains the following processing chain:

* Tweets with matched query IDs originate from the TwitterClient.jsonTweetsOut Enumerator.
* The matchesFilter Enumeratee checks if the matches set contains the query hash. If not, no further actions will take place.
* A buffer ensures that the application is not held up if the sink is too slow, for example, when a client connection suffers from network congestion. Tweets will be dropped when the buffer is full, which won't be much of an issue because if your connection is so slow, you probably don't want to use this application in the first place.
* Matches are converted to JSON
* The connection uptime is monitored. In this Enumeratee the duration of the connection will be logged.
* The data is converted to comply with the **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)** specifications.

Below, you'll find the entire code related to the streaming endpoint. The Enumeratees are adapters between the Enumerator from the TwitterClient where the Tweets originate and the chunked response we pass back to the client. They can either transform elements passing through the chain from one type to another, filter them based on a predicate function or buffer them.

{% codeblock Streaming Action and Iteratee lang:scala https://github.com/matthiasn/BirdWatch/blob/f23ff20638d180ed7aecf36a1071bf1d2bce2e69/app/controllers/BirdWatch.scala BirdWatch.scala %}
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

###AngularJS Client
**[AngularJS](http://angularjs.org)** is a modern approach to **[Single Page Applications](http://en.wikipedia.org/wiki/Single-page_application)**. It is said to teach the browser new tricks. It also brings the **fun** back to developing Single Page applications. **Seriously**. So what is so special about it? It's approach is a declarative one. This means that we declare how UI elements are supposed to look like depending on the application state, but we do not have to concern ourselves with how exactly this is achieved. This might not sound like much at first, but it really does make all the difference. No more direct DOM manipulation with jQuery or the like. Instead we create new elements as so called directives that know how to lay themselves out on the page. These elements are then used in the page markup, as if they existed all along in HTML. We will look at that in more detail for the TweetCard directive, which shows a simple custom directive.

Here's the overall architecture of the AngularJS application:

{% img left /images/bw_expl_angular1.png 'image' 'images'%}

There are singleton services in the application that only get instantiated once for the lifecycle of the application. First there is the tweets service which takes care of the communication with the server side. It pre-loads existing tweets and also establishes a **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)** connection for future search results. This service allows the registration of a callback function which is called with search results, no matter if from previous tweets or from the SSE connection.

{% codeblock Tweets Service in AngularJS lang:javascript https://github.com/matthiasn/BirdWatch/blob/c52a8e2a2f465fdeeb12b929e1732c962f3ec834/app/assets/javascripts/services/tweets.js tweets.js %}
/** tweets service, load previous tweets and receives subsequent live tweets for given query */
angular.module('birdwatch.services').factory('tweets', function ($http, utils, $location) {
    var tweetFeed;
    var tweetsCache = [];
    
    /** callback function to perform when new tweet(s) arrive */
    var onNewTweets = function (t) {};
    var registerCallback = function (callback) { onNewTweets = callback; };

    /** Load previous Tweets, paginated. Recursive function, calls itself with the next chunk to load until
     *  eventually n, the remaining tweets to load, is not larger than 0 any longer. guarantees at least n hits
     *  if available, potentially more if (n % chunkSize != 0) */
    var loadPrev = function (searchString, n, chunkSize, offset) {
        if (n > 0) {
            $http({method: "POST", data: utils.buildQuery(searchString, chunkSize, offset), url: "/tweets/search"})
                .success(function (data) {
                    onNewTweets(data.hits.hits.reverse().map(function (t) { return t._source; }).map(utils.formatTweet));
                    loadPrev(searchString, n - chunkSize, chunkSize, offset + chunkSize);
                }).error(function (data, status, headers, config) { });
        }
    };

    /** Start Listening for Tweets with given query */
    var search = function (queryString, prevSize) {
        if (typeof tweetFeed === 'object') { tweetFeed.close(); }

        var searchString = "*";
        if (queryString.length > 0) {
            searchString = queryString;
            $location.path(searchString);
        }
        else $location.path("");

        /** handle incoming tweets: add to tweetsCache array, run callback at most every second */
        var cachedCallback = function(msg) {
            tweetsCache = tweetsCache.concat(utils.formatTweet(JSON.parse(msg.data)));
            _.throttle(function() {        // throttle because insertion too expensive on high traffic searches
                onNewTweets(tweetsCache);  // run callback with all items in cache
                tweetsCache = [];          // then empty cache.
            }, 1000)();
        };

        tweetFeed = new EventSource("/tweetFeed?q=" + searchString);
        tweetFeed.addEventListener("message", cachedCallback, false);

        loadPrev(searchString, prevSize, 500, 0); // load previous tweets in chunks of size 500
    };

    return { search: search, registerCallback: registerCallback};
});
{% endcodeblock %} 

The only other components that knows anything about this service is controller which provides the callback function that specifies what needs to happen with each new tweet / array of tweets. This allows for a proper decoupling of the services.

{% codeblock AngularJS Controller lang:javascript https://github.com/matthiasn/BirdWatch/blob/c52a8e2a2f465fdeeb12b929e1732c962f3ec834/app/assets/javascripts/controllers.js controllers.js %}
/** Controllers */
angular.module('birdwatch.controllers', ['birdwatch.services', 'charts.barchart', 'charts.wordcloud', 'ui.bootstrap']).
    controller('BirdWatchCtrl',function ($scope, $location, utils, barchart, wordcloud, $timeout, wordCount, cf, tweets) {
        $scope.prevSizeOpts = ['100', '500', '1000', '2000', '5000', '10000', '20000'];
        $scope.prevSize = $scope.prevSizeOpts[4];
        $scope.pageSizeOpts = [5, 10, 25, 50, 100];
        $scope.pageSize = $scope.pageSizeOpts[1];
        $scope.live = true;
        $scope.toggleLive = function () {                             // freezes view when switched off by having the
            if ($scope.live) { cf.freeze(); } else { cf.unfreeze(); } // crossfilter limit results to tweets older
            $scope.live = !$scope.live;                               // than the latest at the time of calling freeze()
        };
        $scope.currentPage = 1;
        $scope.searchText = $location.path().substr(1);
        $scope.legalStuff = utils.legalStuff;
        $scope.cf = cf;
        $scope.sortModel = 'latest';
        $scope.words = [];

        /** Add a string to the search bar when for example clicking on a chart element */
        $scope.addSearchString = function (searchString) {
            if ($scope.searchText.length === 0) { $scope.searchText = searchString; }
            else if ($scope.searchText.indexOf(searchString) === -1) { $scope.searchText += " " + searchString; }
            $scope.$apply();  // Term should appear immediately, not only after search returns
            $scope.search();
        };

        /** update UI every ten seconds to keep time ago for tweets accurate */
        var onTimeout = function () { updateTimeout = $timeout(onTimeout, 10000); };
        var updateTimeout = onTimeout();

        /** actions to perform when new tweets are available through the streaming connection */
        tweets.registerCallback(function (t) {
            $scope.wordCount.insert(t);
            $scope.words = $scope.wordCount.getWords();
            cf.add(t);
        });

        /** Search for Tweets with given query, run on startup */
        $scope.search = function () {
            $scope.wordCount = wordCount.wordCount();
            tweets.search($scope.searchText, $scope.prevSize);
            cf.clear();
        };
        $scope.search();
    });
{% endcodeblock %} 

The controller provides the $scope for the associated view, which is written as HTML, with some custom AngularJS code. The $scope variables are fairly straighforward, AngularJS two-way binds items in the view to the $scope so that when the value in either changes, the other updates as well. An example of this two-way data binding is the search text field. The binding to $scope.searchText is defined in the view:

{% codeblock Main View lang:html https://github.com/matthiasn/BirdWatch/blob/c52a8e2a2f465fdeeb12b929e1732c962f3ec834/app/views/index.scala.html index.scala.html %}
    <!-- Search field in NavBar -->
        <div class="navbar-form pull-left col-lg-6 input-group">
            <form ng-submit="search()" class="input-group">
                <input type="text" class="form-control" ng-model="searchText"
                    placeholder="Example search: java (job OR jobs OR hiring)" />
                <span class="input-group-btn">
                    <button class="btn btn-primary" type="button" ng-click="search()">
                        <span class="glyphicon glyphicon-search"></span>
                    </button>
                </span>
            </form>
        </div>
{% endcodeblock %} 

Now with this binding in place, modifying the content of the search field mutates $scope.searchText and vice versa. Changing the $scope.searchText programmatically would update the content of the search field as well. There is no need to concern ourselves with complicated ways of manipulating the DOM directly. This is probably the main reason why code in AngularJS tends to be much shorter than in more traditional approaches.

We briefly talked about directives above. Let's have a look at one simple directive to get a better understanding, the TweetCard directive. A directive can either be an entirely new element or apply to a class. In this case we are using the class approach. Any element on the page that has class of **tweetCard** will be rendered by AngularJS according to the code in the directive. In this particular case the code is very simple:

{% codeblock TweetCard Directive lang:javascript https://github.com/matthiasn/BirdWatch/blob/c52a8e2a2f465fdeeb12b929e1732c962f3ec834/app/assets/javascripts/directives.js directives.js %}
angular.module('birdwatch.directives', ['charts.barchart', 'charts.wordcloud'])
    /** Tweet Card Layout (with external template)*/
    .directive('tweetCard', function () {
        return {
            restrict: 'C',
            scope: { tweet: "=tweet" },
            templateUrl: "/assets/templates/tweetCard.tpl.html"
        }
    });
{% endcodeblock %} 

All that happens here is a $scope variable named tweet is assigned, which becomes available for two-way data binding inside the template code:

{% codeblock TweetCard Template Markup lang:html http://github.com/matthiasn/BirdWatch/blob/f23ff20638d180ed7aecf36a1071bf1d2bce2e69/public/templates/tweetCard.tpl.html tweetCard.tpl.html %}    
<div class="tweet">
    <span> 
        <a href="http://www.twitter.com/{{ tweet.user.screen_name }}" target="_blank">
            <img class="thumbnail" src="{{ tweet.user.profile_image_url }}" />
        </a>
    </span>

    <a tooltip-placement="bottom" tooltip="click to visit Twitter profile"
       href="http://www.twitter.com/{{ tweet.user.screen_name }}" target="_blank">
        <span class="username" ng-bind="tweet.user.name"></span>
    </a>
    <span class="username_screen">&#64;{{tweet.user.screen_name}}</span>
    <div class="pull-right timeInterval">{{tweet.created_at | fromNow}}</div>
    <div class="tweettext">
        <div ng-bind-html-unsafe="tweet.htmlText"></div>
        <div class="pull-left timeInterval">{{tweet.user.followers_count | numberFormat}} followers</div>
        <div ng-show="tweet.retweeted_status.retweet_count" class="pull-right timeInterval">
            {{tweet.retweeted_status.retweet_count | numberFormat}} retweets</div>
        <div ng-show="tweet.retweet_count" class="pull-right timeInterval">
            {{tweet.retweet_count | numberFormat}} retweets</div>
    </div>
</div>
{% endcodeblock %}         
    
Now whenever the underlying data representation in the model changes, the rendering of the tweetCard changes as well thanks to two-way data binding. The more complicated markup of the tweetCard is encapsulated in the template, using the directive from the view becomes simple and concise:
    
{% codeblock Repeated Tweet Directive in View lang:html https://github.com/matthiasn/BirdWatch/blob/c52a8e2a2f465fdeeb12b929e1732c962f3ec834/app/views/index.scala.html index.scala.html %}    
<!-- Tweet Cards inside frame -->
<div class="col-lg-4" id="tweet-frame">
    <div class="tweetCard" data-ng-repeat="tweet in cf.tweetPage(currentPage, pageSize, sortModel)"
        data-tweet="tweet"></div>
</div>
{% endcodeblock %}     

Above a div of class tweetCard is declared with data-ng-repeat, which means that the element is repeated for each element in the result of the cf.tweetPage function. For each individual item (for **tweet** in cf.tweetPage), data-tweet is assigned with the item. It could also have been data-ng-repeat="item in …" data-tweet="item", the names correspond here.
    
Here's how the $scope of an individual tweetCard element looks like:

{% img left /images/bw_expl_tweetcard_scope.png 'image' 'images'%}
    
Above we can see that the $scope of the TweetCard contains the previously assigned tweet object which becomes available to the template code for two-way data binding. The two-way data binding can be seen in action here when sorting the tweets by retweet count. For popular tweets that get retweeted a lot we can grab some popcorn and watch the visual representation of the tweet change in the browser based on data model changes.
    
    
###Visualizations using D3.js
**[D3.js](http://d3js.org)** is a JavaScript library for data-driven visualizations that render SVG in the browser. There are excellent tutorials out there, the project homepage is a great place to start. I won't go into much detail here, but for a better understanding of what is happening, here is some D3.js code from this application together with the resulting SVG in the DOM:

{% img left /images/bw_expl_d3js1.png 'image' 'images'%}

What we see above on the left side is that **rect**s (rectangles) get rendered depending on the data that is provided to the D3 code on the right side. This is why the library is said to be data-driven, the data drives what gets rendered on the page.

###Data Analysis using crossfilter.js
**[Crossfilter](http://square.github.io/crossfilter/)** is a JavaScript library for exploring large datasets in the browser. This is achieved by defining dimensions on which to dissect the data. A dimension is a kind of sorted index where the indexing function is provided in the dimension constructor:

{% codeblock Crossfilter Service lang:javascript https://github.com/matthiasn/BirdWatch/blob/c52a8e2a2f465fdeeb12b929e1732c962f3ec834/app/assets/javascripts/services/crossfilter.js crossfilter.js %}
// crossfilter service
angular.module('birdwatch.services').factory('cf', function (utils) {
    var exports = {};

    // crossfilter object: browser side analytics library, holds array type data (w/incremental updates).
    // dimensions are fast queries on data, e.g. view sorted by followers_count or retweet_count of the original message
    var cf = crossfilter([]);
    var tweetIdDim   = cf.dimension(function(t) { return t.id; });
    var followersDim = cf.dimension(function(t) { return t.user.followers_count; });
    var retweetsDim  = cf.dimension(function(t) {
        if (t.hasOwnProperty("retweeted_status")) { return t.retweeted_status.retweet_count; }
        else return 0;
    });
    var originalIdDim  = cf.dimension(function(t) {
        if (t.hasOwnProperty("retweeted_status")) { return t.retweeted_status.id; }
        else return 0;
    });

    // Higher-order function, returns a function that rounds time down. Interval s is specified in seconds.
    // Example: returned function makes Jan 1, 2012, 16:45:00 out of Jan 1, 2012, 16:45:55 when interval is 60s
    function dateRound(s) { return function(t) { return s * Math.floor(Date.parse(t.created_at) / (s * 1000)) }; }

    var byMinGrp   = cf.dimension(dateRound(      60)).group();
    var by15MinGrp = cf.dimension(dateRound(   15*60)).group();
    var byHourGrp  = cf.dimension(dateRound(   60*60)).group();
    var by6HourGrp = cf.dimension(dateRound( 6*60*60)).group();
    var byDayGrp   = cf.dimension(dateRound(24*60*60)).group();

    exports.timeseries = function() {
             if (byMinGrp.size() < 60)   { return byMinGrp.all(); }
        else if (by15MinGrp.size() < 48) { return by15MinGrp.all(); }
        else if (byHourGrp.size() < 96)  { return byHourGrp.all(); }
        else if (by6HourGrp.size() < 40) { return by6HourGrp.all(); }
        else                             { return byDayGrp.all(); }
    };

    // freeze imposes filter on crossfilter that only shows anything older than and including the latest
    // tweet at the time of calling freeze. Accordingly unfreeze clears the filter
    exports.freeze    = function() { tweetIdDim.filter([0, tweetIdDim.top(1)[0].id]); };
    exports.unfreeze  = function() { tweetIdDim.filterAll(); };

    exports.add       = function(data)     { cf.add(data); };                            // add new items, as array
    exports.clear     = function()         { cf.remove(); };                             // reset crossfilter
    exports.noItems   = function()         { return cf.size(); };                        // crossfilter size total
    exports.numPages  = function(pageSize) { return Math.ceil(cf.size() / pageSize); };  // number of pages

    // predicates
    var retweeted     = function(t) { return t.hasOwnProperty("retweeted_status"); };

    // mapper functions
    var originalTweet = function(t) { return utils.formatTweet(t.retweeted_status); };   // returns original tweet
    var tweetId       = function(t) { return t.id; };                                    // returns tweet id
    var retweetCount  = function(t) { if (retweeted(t)) { return t.retweeted_status.retweet_count; } else return 0 };
    var maxRetweets   = function(t) {
        t.retweet_count = retweetCount(_.max(originalIdDim.filter(t.id).top(1000),
            function(t){ return t.retweeted_status.retweet_count; }));
        originalIdDim.filterAll();
        return t;
    };

    // deliver tweets for current page. fetches all tweets up to the current page,
    // throws tweets for previous pages away.
    exports.tweetPage = function(currentPage, pageSize, order) {
        return _.rest(fetchTweets(currentPage * pageSize, order), (currentPage - 1) * pageSize);
    };

    // fetch tweets from crossfilter dimension associated with particular sort order up to the current page,
    // potentially mapped and filtered
    var fetchTweets = function(pageSize, order) {
      if      (order === "latest")    { return tweetIdDim.top(pageSize); }    // latest: desc order of tweets by ID
      else if (order === "followers") { return followersDim.top(pageSize).map(maxRetweets); } // desc order of tweets by followers
      else if (order === "retweets") {  // descending order of tweets by total retweets of original message
          return _.first(               // filtered to be unique, would appear for each retweet in window otherwise
              _.uniq(retweetsDim.top(cf.size()).filter(retweeted).map(originalTweet), false, tweetId), pageSize);
      }
      else { return []; }
    };

    return exports;
});
{% endcodeblock %} 

A simple example is the **followersDim** dimension. The function provided does nothing but return the number of followers of the author of the Tweet. The dimension then provides access to the data set sorted by the followers count.

Dimensions can also be grouped, as can be seen with the different timing dimensions. In order to get all Tweets for a particular time span of say the hour between 4pm and 5pm of a particular day, the creation time for each Tweet is rounded down to the nearest hour and then the dimension is grouped by the hours. This powers the 'Activity by Time Unit' chart in which the number of Tweets for the current search is broken down into time units of varying length, depending on the total time span.

###ElasticSearch
**[ElasticSearch](http://www.elasticsearch.org)** is a distributed open source search engine. The more obvious feature is that it provides full-text search over our entire dataset, which by the time of the writing of this article consists of about ten million tweets.

{% img left /images/bw_expl_elastic1.png 'image' 'images'%}

The less obvious but very useful feature is that of the so called **[Percolation Queries](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-percolate.html)**. These are kind of reverse searches that allow the registration of an observing real-time search in the percolation index. Each new tweet is then presented to the percolation endpoint of ElasticSearch to determine which of the registered searches match on the new item. This allows us to notify the web clients on each new match for the current search (also see the controller description on the server side above). The IDs of the queries could be generated randomly. I have chosen a different approach here and use SHA-256 hashes of the search text instead. That way each unique query (e.g. "shutdown beer") only ever gets inserted (and matched against) once.

###nginx Proxy
In a production environment it might make sense to not expose applications to the outside world directly but instead have a reverse proxy in between which responds to all requests and routes the requests to the proper IP-address / port internally.

This can be useful for the following reasons:

* Load Balancing. The reverse proxy can talk to multiple server backends and distribute the load among them.
* Static file serving. Some implementations can serve static files much faster with less overhead than a solution based on the JVM.
* SSL encryption. Not all application servers support SSL themselved, but all we need then is a proxy that does.
* Using multiple server backend that run on different ports.
* Serving multiple domain names.

I am using **[nginx](http://wiki.nginx.org/Main)** as a reverse proxy for two instances of the application on the same server, one for tech-related stuff **[birdwatch.matthiasnehlsen.com](http://birdwatch.matthiasnehlsen.com)** and the other for things related to US politics **[beltway.matthiasnehlsen.com](http://beltway.matthiasnehlsen.com)**. That works really well, I have found nginx to be rock solid and very fast.

Here is the configuration file:

{% codeblock nginx config lang:text nginx.conf %}
user www-data;
worker_processes 4;
pid /var/run/nginx.pid;

events {
  worker_connections 15000;
}

http {
  proxy_buffering    off;
  proxy_set_header   X-Real-IP $remote_addr;
  proxy_set_header   X-Scheme $scheme;
  proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header   Host $http_host;

  upstream elastic {
    server 127.0.0.1:9200;
  }

  server {
    listen               80;
    keepalive_timeout    70;
    server_name birdwatch.matthiasnehlsen.com;

    location /tweets/search {
      proxy_pass  http://elastic/birdwatch_tech/tweets/_search;
    }

    location / {
      proxy_pass  http://127.0.0.1:9000;
    }
  }

  server {
    listen               80;
    keepalive_timeout    70;
    server_name beltway.matthiasnehlsen.com;

    location /tweets/search {
      proxy_pass  http://elastic/birdwatch_beltway/tweets/_search;
    }

    location / {
      proxy_pass  http://127.0.0.1:9001;
    }
  } 
}
{% endcodeblock %} 

Note the two server blocks in the configuration above for the two separate domains, each of which maps to one backend Play application. It would also be possible to have multiple backends for the same domain name and then let nginx balance the load between the multiple backends. There is only one shared ElasticSearch backend for the two domains, but /tweets/search maps to different indices depending on the domain name. In a development configuration this endpoint would be handled directly by the Play application, but for production I let nginx handle this transparently. 

Okay, this concludes the explanation of my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** toy project. Hope you enjoyed this rather long article. Please let me know if there is any need for clarification.

Cheers,
Matthias

Below are some books that I have found useful and I hope will be helpful for you as well. You can support this blog by clicking on the slideshow and buying anything on Amazon, no matter if it is a listed item or not. **Thank you!** Your support will allow me to write more articles like this one.

<SCRIPT charset="utf-8" type="text/javascript" src="http://r.matthiasnehlsen.com/slideshow1/wide"> </SCRIPT>