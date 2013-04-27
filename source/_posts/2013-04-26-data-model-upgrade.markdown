---
layout: post
title: "ReactiveMongo 0.9-SNAPSHOT and Lossless Persistence"
date: 2013-04-26 13:48
comments: true
categories: 
---
Initially I parsed the Tweets in the BirdWatch application into instances of a Tweet case class upon ingestion and then used that case class representation throughout, including for database persistence. Then I realized that that was actually not a good idea. Using a case class for passing around information in the application is very convenient and useful. But for the persistence, I argue that we cannot afford to be opinionated about what to keep and what to throw away. I fixed this together with the planned migration to **[ReactiveMongo](http://reactivemongo.org)** 0.9-SNAPSHOT in the latest commits, storing the entire observable fact coming from the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)**.

<!-- more -->

In the **[GitHub](https://github.com/matthiasn/BirdWatch/blob/6edda07bec721c61011aaef21f1ed4440130e48f/README.md)** project description I had been ranting about how any data model will almost invariably be wrong in the future as we cannot predict what we will want to analyze later. We can always change the data model at a later point and from then on store a different interpretation of the observable fact, but then we would not have complete historic information to test our hypotheses on retrospective data.

For this reason I decided that I wanted to store the Tweets in their complete JSON representation. **[MongoDB](http://www.mongodb.org)** is a great choice for this as it allows indexing our data while leaving the JSON structure intact. We get the best of two worlds, we have a lossless persistence this way, meaning that we can reconstruct the observable fact from the database while at the same time being able to quickly search through a potentially large dataset. The reconstructed observable fact might not be identical on a binary level as that would depend on the JSON to text serialization library and its configuration, but the restored facts will be semantically identical, which is good enough for our purpose.

Of course we could also store raw text in something like Hadoop or plain text files, but it would be much more effort to retrieve information later because we would have to deal with the indexing instead of leaving that to MongoDB.

In preparation for this, I had already stored raw Tweets in the database for a little while, but I had also still stored the case class instances and used the latter for preloading tweets upon startup of the browser. Storing duplicates needed to be fixed. The main change I had to make there was querying the last n raw Tweets from the database for the preloading and then parse Tweets from the JsObjects the same way I already did when initially ingesting the Tweets.

At the same time I wanted to upgrade to **[ReactiveMongo](http://reactivemongo.org)** 0.9 because that would supposedly fix a previous problem with Killcursors and also allowed better ways of limiting the number of results returned from a stream. Version 0.9 entails some major changes in the API, so it was a good idea to tackle the upgrade and the changes to the persistence layer together.
