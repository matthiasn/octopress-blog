---
layout: post
title: "ElasticSearch 1.0.0 - Breaking Changes"
date: 2014-02-16 18:50
comments: true
categories: 
---
**[ElasticSearch](http://www.elasticsearch.org)** 1.0.0 is out, hooray! Great stuff, congrats to everyone involved. Not that I had any complaints about **v0.9**, but still, this is a great achievement. One of the changes is some **[major rework](http://www.elasticsearch.org/blog/percolator-redesign-blog-post/)** of the **[Percolation Query API](http://www.elasticsearch.org/guide/en/elasticsearch/reference/master/search-percolate.html)**, making it much more powerful than before. Unfortunately, the update broke the percolation query mechanism in the **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** application. But the fix wasn't very hard. So in today's article, I will revisit the topic of Percolation Queries by explaining what they are, how the new version has become more powerful and what was needed to fix my application. Please refer to this earlier **[article](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** if you want to know more about the overall architecture of the **BirdWatch** application.

<!-- more -->

After running ````brew update```` and ````brew upgrade```` I noticed that live query result updates in my local installation did not work any longer. Pressing *F5* did show new intermittent Tweets though, so the system did not appear completely broken. A look into the ElasticSearch changelog quickly revealed that there had been some major rework on the Percolation API. Exactly this API is used for matching new Tweets to currently established streaming connections.

##So what is this percolation query thing?
A percolation query is a query like any other, with one difference: the query is not run against existing data but against future data, item by item as the data is inserted into an index. For that the query itself is stored in ElasticSearch and then each item (Tweet in this case) that is stored is also presented to the percolator mechanism to find the queries that have this item as a result. This resulting query ID is then used to find the streaming connection that is interested in matches to this query and stream the matched Tweet to the connected client immediately. This might sound a little abstract, so let me provide an example:

You are interested in Tweets that have the words **Scala** and **Akka** in them. Your query then looks like this: "scala AND akka". Well, there is a little more to it, like which fields to use as a default, but for this example the simplification should suffice. First the query is run against existing data, for example returning the last 5000 items that match. But you are also interested in live data, not only in the past. So then the query is registered in the percolation query index, using the **[SHA-256](http://de.wikipedia.org/wiki/SHA-2)** hash as the ID. Now when a Tweet comes along that has these words in them, it is presented to the percolator, which returns the ID of the query, potentially among others that match. This query ID is then used to find the streaming connection to your web client so that the Tweet can be streamed to you immediately.

Internally, ElasticSearch stores all the percolation queries in memory. It then creates a temporary index for each document that is to be matched against all the queries and then runs all these queries against that index in order to determine matching queries.

##Changes in ElasticSearch v1.0.0
In previous versions of Elasticsearch there was a single, specialized index for percolation among cluster of nodes. The problem with that was that it did not scale particularly well. This limitation has been removed in the latest version. Instead the percolation queries can be distributed over any number of shards, all of which will then be asked to percolate a document against the stored queries. With the change, now the percolation query mechanism should scale nicely, whereas before the performance would degrade relatively soon when there was a large number of queries to run against a new document. Every query still has to run over a new document that is tested for a match, but at least that work can now be distributed over many nodes. Also there is nothing special about the percolation index any longer, it is just a regular index.

Let us look at an example using **curl**. We have three persisted queries in our index:

{% codeblock Percolation Queries lang:javascript %}
curl 'localhost:9200/persistent_searches/.percolator/_search?pretty=true'
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 1.0,
    "hits" : [ {
      "_index" : "persistent_searches",
      "_type" : ".percolator",
      "_id" : "38a0963a6364b09ad867aa9a66c6d009673c21e182015461da236ec361877f77",
      "_score" : 1.0, "_source" : {"query":{"query_string":{"default_field":"text","default_operator":"AND","query":"(java) AND lang:en"}},"timestamp":"2014-02-19T19:19:32.237Z"}
    }, {
      "_index" : "persistent_searches",
      "_type" : ".percolator",
      "_id" : "684888c0ebb17f374298b65ee2807526c066094c701bcc7ebbe1c1095f494fc1",
      "_score" : 1.0, "_source" : {"query":{"query_string":{"default_field":"text","default_operator":"AND","query":"(*) AND lang:en"}},"timestamp":"2014-02-19T19:35:54.332Z"}
    }, {
      "_index" : "persistent_searches",
      "_type" : ".percolator",
      "_id" : "49d0feca545a82d29fffbdf6749dcf0086f9c44f6faa9b8e1e2e008b5716e488",
      "_score" : 1.0, "_source" : {"query":{"query_string":{"default_field":"text","default_operator":"AND","query":"(akka scala) AND lang:en"}},"timestamp":"2014-02-19T20:00:04.312Z"}
    } ]
  }
}
{% endcodeblock %}

Now if I insert a tweet in English that contains the words **Akka** and **Scala**, two of these queries should match. The second query matches anything that is in English and the third more specifically matches anything with these words. Let's see:

{% codeblock Percolation Queries lang:javascript %}
curl 'localhost:9200/persistent_searches/tweets/_percolate?pretty=true' -d '{
>     "doc" : {
>         "text" : "blah, blah, akka blah, scala blah, blah",
>         "lang" : "en"
>     }
> }'
{
  "took" : 2,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "total" : 2,
  "matches" : [ {
    "_index" : "persistent_searches",
    "_id" : "684888c0ebb17f374298b65ee2807526c066094c701bcc7ebbe1c1095f494fc1"
  }, {
    "_index" : "persistent_searches",
    "_id" : "49d0feca545a82d29fffbdf6749dcf0086f9c44f6faa9b8e1e2e008b5716e488"
  } ]
}
{% endcodeblock %}


##Changes to the BirdWatch code
The URL format has changed, I have created the **persistent_searches** index, into which the queries of type **.percolator** are inserted. We have seen these URLs in action above already.

As mentioned above, percolation queries are now stored in a regular index that behaves like any other (because it **is** a standard index). This also means that the index is dynamically created when first addressed, so we no longer need the initialization step for creating the index (using curl on the command line) before successfully running the application for the first time. That's great as I've had a few users run into that problem before.

In previous versions of ElasticSearch, there was no result header. Instead there was only a simple array of the matched query IDs. In **v1**, there is now a result header, just like in regular ElasticSearch queries, and the *matches* array. This array contains one object per resulting percolation query. Each of these match objects not only contains the *id* of the matching query but also the *index* where this search was stored. In this application we do not need any of this, so we can parse only the IDs of the matching queries: 

{% codeblock Twitter Client lang:scala https://github.com/matthiasn/BirdWatch/blob/0ce1b15c27eb1ec9cbf29d9e95953cca68404cc0/app/actors/TwitterClient.scala TwitterClient.scala %}
/** Takes JSON and matches it with percolation queries in ElasticSearch
  * @param json JsValue to match against 
  */
def matchAndPush(json: JsValue): Unit = {
  WS.url(elasticPercolatorURL).post(Json.obj("doc" -> json)).map {
    res => (Json.parse(res.body) \ "matches").asOpt[List[JsValue]].map {
      matches => {
        val items = matches.map { m => (m \ "_id").as[String] }
        jsonTweetsChannel.push(Matches(json, HashSet.empty[String] ++ items))
      }
    }
  }
}
{% endcodeblock %}

Above, the tweet is **POSTed** to the *elasticPercolatorURL* inside the *doc* property of a **JSON** object. The result *res* is then parsed for the *matches* array as a List[Jsvalue], which is then mapped into a List[String] with the matching query IDs. Finally, a HashSet[String] is built from this list and pushed into the *jsonTweetsChannel* together with the json inside a **Matches** object. 

Okay, that's all for this article. Initially I wanted it to be about replacing **AngularJS** with **ReactJS**, but then I did not have enough time left before my vacation and after running into this problem. So that article is next, probably some time later this month.

Cheers,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>