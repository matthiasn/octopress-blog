---
layout: post
title: "Making BirdWatch Interactive"
date: 2013-05-26 20:45
comments: true
categories: 
---
Some weeks ago when I started working on the BirdWatch project, I basically wanted to play around with Iteratees and stream information to the browser, any information. But in the meantime, I have become more interested in making Tweet visualizations useful and interesting. First I needed to move the reasoning over to the client though as the server side reasoning did not scale well at all. I the latest update I address both client-side reasoning and the first steps in making the application interactive.

<!-- more -->

My other application on GitHub, sse-perf, was quite useful in identifying where the scalability problem was. When getting as many as 1% of all Tweets from Twitter, which is the current limit for the Twitter Streaming API (3-4 million Tweets a day), server-side calculations for each client only allowed somewhere between ten and twenty concurrent connections whereas moving the calculations now allows about 600 concurrent connections under the same load.

With that problem out of the way, I also added interactive functionality where the words in the word cloud and in the bar chart are now clickable, allowing to drill into the data. Currently this works with a logical AND. Only previous and live Tweets are now shown that contain all of the search words. The queries are now resources that can be bookmarked, with the query encoded in the URL, comparable to a Google search.

Ok, this is becoming a little more interesting than the previous version where the observer did not have any influence over what was shown on the screen. But it is definitely not as useful as it could be. I have used the version you can find on GitHub for following Tweets about the Champions League final between Bayern München and Borussia Dortmund at Wembley stadium (besides the TV, of course). It was interesting to see a correlation between events in the game and the teams being mentioned in the Tweets. But that experience also showed me what is missing and could be addressed in a future version: a time component. I would find it interesting to track words and hashtags over time. That will be something for a future version.

Let's look at a few implementation details in the current version:

####Filter Enumeratee
Tweets from the TwitterClient are delivered to connected clients using a channel and enumerator provided by Concurrent.broadcast in the Play Iteratee API. The Tweets are from there fed into the EventSource object which acts as a simple Iteratee that does nothing more than generate a chunked HTTP response, with "data: " prepended to every piece of data (Tweets as JSON in this case). I already used a transforming Enumeratee before, for transforming Tweets in case class form into JSON. This Enumerator piping into an Enumeratee and then into the Iteratee made it very simple to put another Enumeratee into this chain for filtering only those Tweets that contain the desired search words.

####REST endpoints for queries and streams

####No more image processing
Initially I was playing around with image processing on the server side. But once that was working with a supervised actor hierarchy, it really wasn't all that interesting any more. I know that I can easily process 4 million of the large Twitter profile images a day without putting substantial load on my quadcore server. That's what I wanted to know. Other than that, the images were littering my harddrive space, without being useful enough for me to keep them. I removed that functionality from the application. 

####Client-side Wordcount implementation in Coffeescript 
I wanted to move the Wordcount functionality into the client when I discovered that Play comes with nice features for compiling Coffeescript into JavaScript. I have done a little bit with Coffeescript in the past and I remembered finding it pleasant enough to give it another try. But that will be the topic for a future article.

####Performance of the current version
Right before the Champions League final, I measured the performance for the search words I had selected for the game. At that time I was receiving about 4 Tweets per second which I was then able to simultaneausly stream to 10,000 clients. 

{% img left /images/champions_league_10k.png 'image' 'images' %}

Not too bad, I'm really glad Play does not spawn a thread for every single one of those connections. I have not filtered those Tweets but instead delivered all Tweets to all clients. I remains to be seen how much of a performance hit the matching algorithm will incur.

-Matthias