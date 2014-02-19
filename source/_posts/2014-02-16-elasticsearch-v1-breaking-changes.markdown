---
layout: post
title: "ElasticSearch 1.0.0 - Breaking Changes"
date: 2014-02-16 18:50
comments: true
categories: 
---
**[ElasticSearch](http://www.elasticsearch.org)** 1.0.0 is out, hooray! Great stuff, congrats. Not that I had any complaints about v0.9, but still, v1 is a great achievement. One of the changes is some **[major rework](http://www.elasticsearch.org/blog/percolator-redesign-blog-post/)** on the **[Percolation Query API](http://www.elasticsearch.org/guide/en/elasticsearch/reference/master/search-percolate.html)**, making it much more powerful than before (it seems). Unfortunately, the update to v1.0.0 broke the percolation query mechanism in the **[BirdWatch](http://birdwatch.matthiasnehlsen.com)** application. But the fix wasn't very hard. So in today's article, I will revisit the topic of Percolation Queries by explaining what they are, how the new version of ElasticSearch has become more powerful and describing the changes needed to fix the application. Please refer to this **[article](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** when you want to know more about the overall architecture of the application.

<!-- more -->

After running ````brew update```` and ````brew upgrade```` I noticed that my new client wasn't working any longer in terms of streaming updates. Pressing *F5* did show new intermittent Tweets though, so the system did not appear completely broken. Luckily the 'old' client based on AngularJS still existed and showed the same problem. A look into the ElasticSearch changelog quickly revealed that they did some major rework on the Percolation API.

#So what is this percolation query thing?
A percolation query is a query like any other, with one difference: the query is not run against existing data but against future data, item by item as the data is inserted into an index. For that the query itself is stored in ElasticSearch and then each item (Tweet in this case) that is stored is also presented to the percolator to find the queries that have this item as a result. This resulting query ID is then used to find the streaming connection that is interested in maches to this query and stream the matched Tweet to the connected client immediately. This might sound a little abstract, so let me provide an example:

You are interested in Tweets that have the words **Scala** and **Akka** in them. Your query then looks like this: "scala AND akka". Well, there is a little more to it it, like which fields to use as a default, but for this example the simplification should suffice. First the query is run against exisiting data, for example returning the last 5000 items that match. But you are also interested in live data, not only in the past. So then the query is registered in the percolation query index, using the SHA-256 hash as the ID. Now when a Tweet comes along that has these words in them, it is presented to the percolator, which returns the ID of the query, potentially among others that match. This query ID is then used to find the streaming connection to your web client so that the Tweet can be streamed to you immediately.

Internally ElasticSearch stores all the percolation queries in memory. It then creates a temporary index for each document that is to be matched against all the queries and then runs all these queries against that index in order to determine matching queries.

#Changes in ElasticSearch
In previous versions of Elasticsearch there was a single, specialized index for percolation among cluster of nodes. The problem with that was that it did not scale particularly well. This limitation has been removed in the latest version now. Instead the percolation queries can be distributed over any number of shards, all of which will then be asked to percolate a document against the stored queries. With the change, now the percolation query mechanism should scale nicely, whereas before the performance would degrade relatively soon when there was a large number of queries to run against a new document.


{% img left /images/bw_expl_elastic1.png 'image' 'images'%}


#Changes to the BirdWatch code
I had to make changes in three different places, in the application.conf for the URLs and in the controller and the twitter client actor.

##URL changes
The 

{% codeblock Percolation URLs lang:text https://github.com/matthiasn/BirdWatch/blob/0ce1b15c27eb1ec9cbf29d9e95953cca68404cc0/conf/application.conf application.conf %}
elastic.PercolatorURL="http://localhost:9200/persistent_searches/tweets/_percolate/"
elastic.PercolationQueryURL="http://localhost:9200/persistent_searches/.percolator/"
{% endcodeblock %}

In the configuration file above, only the endpoints for the percolation queries have changed. Another thing to note is that percolation queries are now stored in a regular index that behaves like any other (because it is a standard index). This also means that the index is dynamically created when first addressed, so we do not need the initialization step for creating the index (using curl on the command line) before successfully running the application for the first time. That's great as I've had a few users run into that problem before.

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

Above, we are still POSTing every tweet to the percolation endpoint as we did before, however now the returned result is different. 




Okay, that's all for this article. Initially I wanted this one to be about replacing AngularJS with ReactJS, but then I did not have enough time left before my vacation. So that article is next, probably some time next week.

Cheers,
Matthias