---
layout: post
title: "BirdWatch v0.2: Tweet Stream Analysis with AngularJS, ElasticSearch and Play Framework"
date: 2013-08-13 10:08
comments: true
categories: 
---
I am happy to get a huge update of the BirdWatch application out of the way. The changes are a lot more than what I would normally have wanted to work in for a single article, but then again there is enough interesting stuff going on in this new version that calls for multiple blog articles. Initially this application was only meant to be an exercise in streaming information to web clients. But along the way I noticed that this application can be useful and interesting beyond being a mere learning exercise. Let me explain what it has evolved to:

<!-- more -->

BirdWatch is an open-source real-time tweet search engine for a defined area of interest, and  I am running a <a target="_blank" href="http://birdwatch.matthiasnehlsen.com"><strong>public instance</strong></a> for software engineering related tweets. The application subscribes to all tweets containing at least one out of a set of terms (such as AngularJS, Java, JavaScript, MongoDB, Python, Scala, …). The application receives all those tweets immediately through the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)**. The limitation here is that the delivery is capped at one percent of all tweets. This is plenty for a well defined area of interest, considering that Twitter processes more than **[400 million tweets per day](http://articles.washingtonpost.com/2013-03-21/business/37889387_1_tweets-jack-dorsey-twitter)**.

Here is how it looks like:

{% img left /images/130812-screenshot.png 'image' 'images' %}

As you can see above, there is now a search bar which allows you to narrow down the selection of tweets the application reasons about. Any search result is bookmarkable, making it easy not only to revisit the search at a later time but also to pass around the link. A link represents the result for the query at the time the link is opened, not at the time it is bookmarked. The application will then load a user-selectable amount of recent tweets matching the search criteria plus any new match for as long as the browser window is open.

Here are some examples. 

You're a Java developer and you're looking for a new job? Try this search: <a target="_blank" href="http://birdwatch.matthiasnehlsen.com/#/(job%20OR%20hiring)%20java"><strong>java (job OR hiring)</strong></a>

You want to limit your job search to London? No problem. Here you go: <a target="_blank" href="http://birdwatch.matthiasnehlsen.com/#/(job%20OR%20hiring)%20java"><strong>java (job OR hiring) london</strong></a>

You're interested in tweets about Python the language but not about <a target="_blank" href="http://www.youtube.com/watch?v=kQFKtI6gn9Y&list=TLbNXOyfwTL14"><strong>Monty Python</strong></a>: <a target="_blank" href="http://birdwatch.matthiasnehlsen.com/#/python%20-monty"><strong>python -monty</strong></a>

Well, you get the idea. **AND** is the standard operator, it is applied unless **OR** is specifically used between two terms. 

You can download the application and run it for a different area of your choosing. Personally, I've been running an instance that listens to tweets related to U.S. politics, an area I have been interested in ever since I lived in Washington DC in 2009/2010. Usually I have found that a quick look at the application before  watching video podcasts of my favorite political shows would show me what is then talked about in the shows. I may decide to run the application publicly for this interest area at some point as well, but for that I want to have more sophisticated analytics and charts in place. I have plenty of ideas in that area, but for now I want to get this out instead of working on the project by myself for another couple of weeks. I am also looking for contributions here, particularly in the area of great looking and useful charts. 

So how can this be improved in the future? A stream of tweets filtered by topic area is a rich data set; the current charts really only scratch the surface of what is possible here. I would like to visualize the most often mentioned links so that I can see at a glance, which newspaper articles and other links are most talked about. This analysis could even be weighted by how many followers the person tweeting about a link has. After all, more followers mean that more people will be exposed to the link. Also there could be some visualizations about how tweets develop over time. What are the characteristics of people retweeting something? Is it picked up by someone with many followers and then later on by many people with few followers? Or is it the other way around? Get involved, there are plenty of options on how to work with the data. 

You can find a brief overview of the technology in the project description on <a target="_blank" href="https://github.com/matthiasn/BirdWatch"><strong>Github</strong></a>. 

In the future I will probably write some articles that further explain different parts of the application. Let me know what you are particularly interested in.

Alright, this is it for today. Until next time.
Matthias

Check out my **[reviews page](/reviews)** where I share my thoughts on books and gadgets.
