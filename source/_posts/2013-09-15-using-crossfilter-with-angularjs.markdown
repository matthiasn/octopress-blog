---
layout: post
title: "Using Crossfilter with AngularJS"
date: 2013-09-15 20:40
comments: true
categories: 
---
So far I found my **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** application nice to look at but not terribly useful as an original way of finding information. Let's face it, the vast majority of tweets is not terribly useful. But there are some in there that are highly relevant. What are the characteristics of these? At the most basic level, they come from people with huge numbers of followers and / or have been retweeted a lot. These tweets have a large audience, not the ones from users with low follower counts. The latter make up the majority of the chatter though. How do we find these more relevant tweets within an observation period though?

<!-- more -->

In my private instance of the application which is listening to tweets on US politics I have been increasingly annoyed by an overwhelming amount of irrelevancy. I'd search for "Obama Syria" and get shiploads of tweets from crazies; finding the relevant stuff was next to impossible when only having the result set sorted by time.

**[Crossfilter](http://square.github.io/crossfilter/)** to the rescue. Over the weekend I have finally had time to integrate it into the project. Now you are able to sort tweets not only in natural order (by time) but also by the number of followers of the author

{% img left /images/cf_followers.png 'image' 'images'%}

or the number of times a particular tweet has been retweeted. As per usual you can **[try this out](http://birdwatch.matthiasnehlsen.com)**.
 
 {% img left /images/cf_retweets.png 'image' 'images'%}

The retweets sort order currently evaluates the number of total retweets during the entire lifecycle of the tweet, which makes this sort order somewhat biased towards older tweets that were retweeted a lot in the past but not necessarily proportionately often during the observation time, which is the time span between now (whenever looking at the page as searches are live) and the oldest tweet in the data set. One additional metric could be the number of retweets of a tweet during the observation period, not total. That should not be all that difficult using crossfilter.

Let's have a look at the source code. The **[Crossfilter](http://square.github.io/crossfilter/)** object lives in an **[AngularJS](http://angularjs.org)** service, which is a singleton within the application. The functionality is then exposed through exported functions for adding data, clearing the **[crossfilter](http://square.github.io/crossfilter/)** and retrieving items for the paginated tweets page.

{% codeblock Crossfilter service lang:javascript https://github.com/matthiasn/BirdWatch/blob/ff861aa0df86c0c0ea2a078a0c3af50a6bc877b1/app/assets/javascripts/services/crossfilter.js crossfilter.js %}
'use strict';

// crossfilter service
angular.module('birdwatch.services').service('cf', function (utils) {
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
    exports.tweetPage = function(currentPage, pageSize, order, live) {
        return _.rest(fetchTweets(currentPage * pageSize, order), (currentPage - 1) * pageSize);
    };

    // fetch tweets from crossfilter dimension associated with particular sort order up to the current page,
    // potentially mapped and filtered
    var fetchTweets = function(pageSize, order) {
      if      (order === "latest")    { return tweetIdDim.top(pageSize); }    // latest: desc order of tweets by ID
      else if (order === "followers") {
          return followersDim.top(pageSize).map(maxRetweets);
      }   // desc order of tweets by followers
      else if (order === "retweets") {  // descending order of tweets by total retweets of original message
          return _.first(               // filtered to be unique, would appear for each retweet in window otherwise
              _.uniq(retweetsDim.top(cf.size()).filter(retweeted).map(originalTweet), false, tweetId), pageSize);
      }
      else { return []; }
    };

    return exports;
});
{% endcodeblock %}

Depending on the selected sort order different dimensions are used for generating the paginated tweets list. Sorting by time of tweeting is achieved with a dimension sorting by tweet IDs (which are in chronological order). Another dimension sorts tweets by the follower count of the tweet author. In this case, maxRetweets (mapper function) looks up all retweets within the data set in memory and sets the retweet count to the highest value found. The tweets with the highest number of retweets are found using the retweets dimension. Within this dimension multiple versions of the same original tweet are returned when the tweet has been retweeted multiple times during the observation period. The _.uniq function from **[underscore.js](http://underscorejs.org/)** is used to filter out those duplicate entries. The descending order of retweet_count in the returned array from the dimension guarantees that the version of a retweet with the highest retweet count is found first and retained.

The paginated data is generated by retrieving all items from the selected dimension up to the current page. The _.rest function from **[underscore.js](http://underscorejs.org/)** then drops the items for all pages before the current page.

**[AngularJS](http://angularjs.org)** then takes care of rendering a view by calling the tweetPage function from the crossfilter service every time the UI is updated. This means that the visual representation of the data is always up to date, with automatic updates for example when a tweet in the followers order is retweeted again. All that without having to manipulate the DOM directly, thanks to 
**[AngularJS](http://angularjs.org)**.  

Evaluating the crossfilter dimension functions again and again can be problematic when tens of individual tweets per second are arriving through the **[Server Sent Events (SSE)](http://dev.w3.org/html5/eventsource/)** connection with the server though. In order to avoid evaluating the **[crossfilter](http://square.github.io/crossfilter/)** functions multiple times per second I am using _.throttle in the registerCallback function in controllers.js:

{% codeblock Insertion Cache inside Controller lang:javascript https://github.com/matthiasn/BirdWatch/blob/ff861aa0df86c0c0ea2a078a0c3af50a6bc877b1/app/assets/javascripts/controllers.js controllers.js %}
insertionCache = insertionCache.concat(t);    // every received item is appended to insertionCache.
_.throttle(function() {                       // throttle because every insertion triggers expensive
    $scope.wordCount.insert(insertionCache);  // $scope.apply(), insert cache once every 3 seconds,
    insertionCache = [];                      // then empty cache.
}, 3000)();
{% endcodeblock %}

By the way, you can now increase the number of pre-loaded tweets to up to 20,000 under **settings**. That might slow the application down though. Many things aren't optimized yet, but overall it seems to be working fine.

Anyhow, I will go into more detail later. My **[previous article](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** is the place to go for an explanation of the overall architecture of the application. It is a work in progress and I will get back to it in the next couple of days. For now I just wanted to give you a quick update you on what I have been up to this weekend. 

Until next time, 
Matthias