---
layout: post
title: "Transforming Log Events into Information"
date: 2013-07-09 14:14
comments: true
categories: 
---
Last week I was dealing with an odd behavior of the chat application demo I was running for **[this article](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)**. The issue was timing-related and there were no actual exceptions that would have helped in identifying the problem. How are you going to even notice spikes and pauses in potentially thousands of lines in a logfile? I was upset, mostly with myself for not finding the issue earlier, and I promised myself to find a better tool. I needed a way to transform the raw logging data into useful information so I could first understand and then tackle the problem. In this article I will show what I have put together over the weekend. **Part I** describes the general approach and applies to any application out there, no matter what language or framework you are using. **Part II** describes one possible implementation of this approach using **[Play Framework](http://www.playframework.com)**.

<!-- more -->

###Part I: Mining log data with Kibana and ElasticSearch
I needed a way to filter events by event type and then visualize the events in a timeline, where vertical bars would indicate the number of items for a given time period. That would have made it immediately obvious that something was causing a delay in the delivery of messages to web clients. 

I will be using **[Kibana](http://three.kibana.org)** for this, a tool for analyzing **[logstash](http://logstash.net)** data that is stored within **[ElasticSearch](http://www.elasticsearch.org)**. Let me introduce these components quickly:

+ **[ElasticSearch](http://www.elasticsearch.org)** is a really powerful open-source search engine based on **[Apache Lucene](http://lucene.apache.org/core/)**. I have used it before and I know from experience that it works really well. 

+ **[logstash](http://logstash.net)** is a tool that collects all your logs from any application and transfers them into ElasticSearch from where they can be searched and analyzed.

+ **[Kibana](http://three.kibana.org)** is a data analysis tool that makes it super simple to create your own dashboards for analyzing logstash data. The latest version is written using **[AngularJS](http://angularjs.org)**. 

While **[logstash](http://logstash.net)** is great for collecting and parsing logfiles and  storing them in a daily index in **[ElasticSearch](http://www.elasticsearch.org)**, there is no good reason to dump the log data into a text file first and then have it parsed later. Instead we can generate **[JSON](http://tools.ietf.org/html/rfc4627)** in the logstash format directly within an application and put it into ElasticSearch using the **[REST API](http://www.elasticsearch.org/guide/reference/api/)**. It will then be immediately available for analysis within **[Kibana](http://three.kibana.org)**.

Let's look at this in action before going into details. We will be using a new branch of **[sse-chat](https://github.com/matthiasn/sse-chat/tree/130707-kibana-demo)** for this. This simple chat application demo is logging the start and end time of SSE streams plus the delivery of individual messages from Romeo and Juliet, more about that **[here](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)**. The data is from actual visits. For privacy reasons I am only logging country and region, not the city and most importantly not the IP address. I do believe that this will leave your privacy as a visitor uncompromised. But please let me know if you have other thoughts on the subject. You can have a look at the **[source code](https://github.com/matthiasn/sse-chat)** if you are interested in what exactly is being logged.

{% img left /images/kibana.png 'image' 'images' %}

**<a href="http://kibana.matthiasnehlsen.com/#/dashboard/elasticsearch/sse-chat" target="_blank">CLICK HERE</a>** to see a live version. The dashboard is interactive, so please play with it.

You can then open the **<a href="http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/" target="_blank">article with the chat demo</a>** in another window. Your visit should show up within the refresh interval, and then again once you either close the window or refresh it.

Here is another dashboard, this one shows all the messages that have been delivered over SSE. This is the one that would have helped me finding the timing issues I have mentioned in the beginning:

{% img left /images/kibana2.png 'image' 'images' %}

**<a href="http://kibana.matthiasnehlsen.com/#/dashboard/elasticsearch/sse-chat2" target="_blank">CLICK HERE</a>** to have a look for yourself.

Note that **[Kibana](http://three.kibana.org)** comes with the tools to configure dashboards as you need them. This really only takes minutes for a simple dashboard and there is no coding involved.

Making this logging approach to logging work is really simple. All you need to do is have your web application generate log data in the proper format and **[POST](http://tools.ietf.org/html/rfc2616#section-9.5)** it into the ElasticSearch index for the current day. This is how your **[JSON](http://tools.ietf.org/html/rfc4627)** log items could look like if you want to use Kibana out of the box:

{% codeblock JSON item for SSE disconnect lang:javascript %}
{  "_index" : "logstash-2013.07.07",
   "_type" : "play",
   "_source" : { "@source":"sse-chat", 
      "@tags":[], 
      "@fields": { "instanceID":"sse-chat",
         "request":"GET /chatFeed/room1",
         "requestID":64,
         "user-agent":"Mozilla/5.0 […]",
         "httpCode":200,
         "duration_ms":2036},
      "@timestamp":"2013-07-07T23:15:12.803Z",   
      "@source_host":"mn.local",
      "@source_path":"GET /chatFeed/room1",
      "@message":"SSE disconnected",
      "@type":"INFO" }
 }
{% endcodeblock %}

That should be fairly easy to generate, with any modern web framework. Logstash uses a daily index for log items. That makes it easy to archive or purge older entries. Kibana makes this transparent, it automatically pulls in the correct indices when a query spans multiple days. Field names starting with '@' are predefined by logstash. The predefined fields would be better than textfile-based logging on their own because of the full-text search capabilities within ElasticSearch. It becomes extremely handy once you start making use of '@fields': you can store arbitrary **[JSON](http://tools.ietf.org/html/rfc4627)** in here and use the fields in the Kibana dashboard later. For example I am storing the geolocation data in here, in addition to data about browser and OS. It can be anything. All of the fields will become available in within Kibana, no further work necessary.

A major advantage of the approach described above is that you can easily integrate all your other logs as well and search them in the same tool. Please refer to the **[logstash](http://logstash.net/docs/1.1.13/)** documentation for that.

###Part II: Implementation using Play Framework and Scala
Let us implement this in Scala and Play using the **[sse-chat sample application](https://github.com/matthiasn/sse-chat/tree/130707-kibana-demo)**. You may want to stop reading here if you are using a framework other than Play. However, you made it this far; you might as well have a look at an approach with Play Framework. You may find it worth considering for your next project, who knows.  

So without further ado, here is the Logger object:

{% codeblock Logger Object (partially) Controller lang:scala https://github.com/matthiasn/sse-chat/blob/4f118e5e73b17036ab0168ba78faa2061074a259/app/utilities/Logger.scala Logger.scala %}

/** LogStash-format logger, allows passing anything that can 
 * be expressed as a JsValue in addition to standard fields
 * @param sourcePath  source path of event 
 * @param msg         event message   
 * @param eventType   event type
 * @param fields      arbitrary data as JsValue
 **/
def log(sourcePath: String, msg: String, eventType: String, fields: Option[JsValue]) {
    val now = new DateTime(DateTimeZone.UTC)     
    val logItem = Json.obj(
      "@source" -> instanceID,
      "@tags" -> JsArray(),
      "@fields" -> fields,
      "@timestamp" -> dtFormat.print(now),
      "@source_host" -> "mn.local",
      "@source_path" -> sourcePath,
      "@message" -> msg,
      "@type" -> eventType
    )
    WS.url(elasticURL + "/logstash-" + indexFmt.print(now) + "/play").post(logItem)
}
{% endcodeblock %}

Above I am showing the basic logging functionality. All I am doing is to create a logstash-formatted **[JSON](http://tools.ietf.org/html/rfc4627)** object and then POSTing it into the ElasticSearch index for the current day. Note that I am using UTC, this is more a personal preference than anything. Kibana will convert this to your local time if you so choose. The Geo-IP lookup is not the topic of this article, but have a look at the full source code, it should be pretty self-explanatory if you understand the code above. I'd be happy to add a section on this if there is demand. 

Eventually I'd like to make an independent module out of this. First I would like to collect some ideas as to what the functionality should be, though. One thing I want to add is a controller that allows switching individual log events on and off, no matter if the application is run in production or development mode. That would make it possible to peek into a production environment and have fine-grained controlled over which events are logged.

So for now I have integrated the Logger object into a **[new branch of the sse-chat project](https://github.com/matthiasn/sse-chat/tree/130707-kibana-demo)**. Copy and paste that into your own project as you see fit. And please let me know what other functionality you would like to see, I'll be happy to integrate it into the planned module.

Cheers,
Matthias