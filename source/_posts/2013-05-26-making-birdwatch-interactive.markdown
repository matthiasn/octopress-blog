---
layout: post
title: "Making BirdWatch Interactive"
date: 2013-05-26 20:45
comments: true
categories: 
---
Some weeks ago when I started working on the BirdWatch project, I basically wanted to play around with Iteratees and stream information to the browser, any information. But in the meantime, I have become more interested in making Tweet visualizations useful and interesting. First I needed to move the reasoning over to the client though as the server side reasoning did not scale well at all. I the latest update I adress both client-side reasoning and the first steps in making the application interactive.

<!-- more -->

My other application on GitHub, sse-perf, was quite useful in identifying where the scalability problem was. When getting as many as 1% of all Tweets from Twitter, which is the current limit for the Twitter Streaming API (3-4 million Tweets a day), server-side calculations for each client only allowed somewhere between ten and twenty concurrent connections whereas moving the calculations now allows about 600 concurrent connections under the same load.

With that problem out of the way, I also added interactive functionality where the words in the word cloud and in the bar chart are now clickable, allowing to drill into the data. Currently this works with a logical AND. Only previous and live Tweets are now shown that contain all of the search words. The queries are now resources that can be bookmarked, with the query encoded in the URL, comparable to a Google search.

Ok, this is becoming a little more interesting than the previous version where the observer did not have any influence over what was shown on the screen. But it is definitely not as useful as it could be. I have used the version you can find on GitHub for following Tweets about the Champions League final between Bayern München and Borussia Dortmund at Wembley stadium (besides the TV, of course). It was interesting to see a correlation between events in the game and the teams being mentioned in the Tweets. But that experience also showed me what is missing and could be addressed in a future version: a time component. I would find it interesting to track words and hashtags over time. That will be something for a future version.

Let's look at a few implementation details in the current version:

####filter enumeratee

####coffeescript compiled into require.js compatible JavaScript

####REST endpoints for queries and streams

####wordcount implementation on client


####No more image processing
