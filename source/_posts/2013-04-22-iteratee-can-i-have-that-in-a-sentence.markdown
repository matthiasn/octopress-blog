---
layout: post
title: "Iteratee: can I have that in a sentence?"
date: 2013-04-22 13:08
comments: true
categories: 
---
A couple of weeks back I was trying to wrap my head around Iteratees so I read what I could find on Google. Afterwards, I had a very high level idea about Enumerators producing or emitting a stream of information and Iteratees consuming that information, potentially with aggregate state. At the same time, the Iteratee was supposed to be immutable. Okay, so I have this immutable thing which aggregates state. That did not seem right. 

<!-- more -->

I had to see it in action in order to understand how this Iteratee thing works. So I was looking for a stream of information that I could use. I found it in the Twitter Streaming API. A stream of Tweets can be interesting, having chosen the right topic(s), and Tweets coming in at this moment for a topic is something that seems easy to relate to. I also wanted to try out a supervised actor hierarchy in this project, so I decided to download the original profile images from Twitter for every single Tweet, downconvert them using a couple of actors doing image manipulation and storing an 80x80px PNG thumbnail in MongoDB. This supervised image manipulation will be the topic of another post though.

On the client side I wanted something flashy that makes it obvious that live information from the real world is flowing through the system and reasoned about. I had recently taken an interest in D3.js and I had seen the Wordcloud implementation by Jason Davies which is nice to look at, so I wondered if it would be difficult to drive it from data streaming to the client over a WebSocket connection. The UI at this point was not supposed to be particularly useful, it was really only for the effect. I am fully aware that a wordcloud is not the best way for showing the frequency of words, and having it regenerate every 5 seconds makes it even less useful perceptually since whatever you look at will be gone before you can even fully focus on the smaller items. That being said, I was interested in how Iteratees work. The D3 I use for this project is very basic, I will focus on doing more useful things with D3.js later on.

So I started working on this reactive web application called BirdWatch. I will go through the parts of the application that are relevant when trying to understand Iteratees in this article. 

Let's look at my initial high-level architectural drawing:

{% img left /images/BirdWatch.png 'image' 'images' %}

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

This at first seduced me into believing that the Iteratee was one particular instance that performed these repeated actions as specified in the foreach part. But that is actually not the case. The Iteratee is immutable and every time we pass information to an Iteratee in a step, a new one is created in return. This does not seem terribly useful as long as we only want to a foreach without accumulated state. But bear with me.

Let's have a look at another Enumerator / Iteratee couple in the application, then this will make more sense.

For the wordcount which feeds both the wordcloud and the bar chart, we analyze a rolling window of tweets. For this, we need to keep state over say the last 1000 tweets as is the case here.





Something does not seem right here. How can we repeatedly pass information to an immutable object which aggregates state? Turns out we can't. There is no one Iteratee receiving and processing information, instead every step of the Iteratee returns a new Iteratee, with the new state. 



Okay, that makes  
