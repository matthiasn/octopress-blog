---
layout: post
title: "Building a geo-aware link shortener with Play Framework"
date: 2014-08-04 15:16
comments: true
categories: 
---
**[Last week](http://matthiasnehlsen.com/blog/2014/08/01/weekly-update/)** I wrote about blog monetization through the **[Amazon Affiliate Program](https://affiliate-program.amazon.com)**. I needed a way to serve country-specific URLs depending on the location of the page visitor, so I wrote a geo-aware link shortener using **[Play Framework](http://www.playframework.com)**. This week I would like to introduce that application. The source code is available on **[GitHub](https://github.com/matthiasn/amzn-geo-lookup)**. You may find that tool useful for your own purposes, or you may just want to read this as a tutorial on how to call backend services with Play Framework and the asynchronous **[WS client](http://www.playframework.com/documentation/2.3.2/ScalaWS)**.

<!-- more -->

Let us define the purpose of this application: visitors (for example on a blog) are to be redirected to country-specific banners, slideshows of or plain links to the matching Amazon store front of the country of origin of the request or, if none exists in the visitor's country, of the U.S. store. Links should be shortened as well. Let's look at an **example**. 

The link for ```http://r.matthiasnehlsen.com/amazon-landing/link``` is requested. Then, depending on the visitor's country, the following happens:

1) Request from the U.S.: the request is redirected to **[amazon.com](http://www.amazon.com/?_encoding=UTF8&camp=1789&creative=390957&linkCode=ur2&tag=matthiasnehls-20&linkId=2JYSWJ7Q5CJ7F7QW)**

2) Request from the UK: the request is redirected to **[amazon.co.uk](http://www.amazon.co.uk/?_encoding=UTF8&camp=1634&creative=19450&linkCode=ur2&tag=matthiasneh0c-21&linkId=O6XF3Z2DDAH6EUXU")**

3) Requests from countries that do not have an Amazon store (or where I have not created an account, such as India, Brazil, China, Japan) are redirected to **[amazon.com](http://www.amazon.com/?_encoding=UTF8&camp=1789&creative=390957&linkCode=ur2&tag=matthiasnehls-20&linkId=2JYSWJ7Q5CJ7F7QW)** as well.

You can try this for yourself by following **[this link](http://r.matthiasnehlsen.com/amazon-landing/link)**. When you click it, you should be directed to your country's own store if you're from the United States, Canada, the United Kingdom, France, Germany, Spain, or Italy, or otherwise to the U.S.. 

Now building this application was surprisingly simple with **[Play Framework](http://www.playframework.com)**. The relevant code easily fits on a single printed page. Before we get into the details, we will need a backend service for the actual lookup of the requesting IP address. One such open source service for that works well is already available: **[freegeoip](http://freegeoip.net)**. Freegeoip also runs as a free online service, but I would rather run this myself as that will give me a much faster and more predictable response time when there are only local requests. In fact, doing the GeoIP lookup locally only requires a consistent, single-digit number of milliseconds.

## Installing freegeoip
All you really need to do is follow the **[instructions here](https://github.com/fiorix/freegeoip)**. That worked well for me both on my development Mac and on my Ubuntu server, with a slight change in the **[upstart](http://upstart.ubuntu.com)** script on Ubuntu, which I have committed to the project as a **[pull request](https://github.com/fiorix/freegeoip/commit/90e974c653631e135e3e4e6ed08df6da39c7cef4)**.

## Building the link shortener with Play Framework
We will need to use three building blocks of Play applications: the **[WS client](http://www.playframework.com/documentation/2.3.2/ScalaWS)**, **[async controller actions](http://www.playframework.com/documentation/2.2.3/ScalaAsync)** and **[JSON parsing](http://www.playframework.com/documentation/2.2.3/ScalaJson)**. A client requests a resource, which is handled by an async action. Inside this action, the WS client performs a GeoIP lookup by calling the local freegeoip service. The result of this async WS call, which is JSON, is then parsed for the country code matching the request. Then the model is asked for the URL matching the requested resource and country. We will look at the source code below, but here is a flowchart first:

{% img left /images/amzn-geo-lookup.png 'flowchart'%}

I hope this flowchart helps a little in following through the source code below.

{% codeblock Async controller action lang:scala https://github.com/matthiasn/amzn-geo-lookup/blob/e75c16d198f9f266fa63dbe463856982a1b4fe22/app/controllers/Application.scala Application.scala %}
package controllers

import play.api._
import play.api.mvc._
import play.api.libs.ws.WS
import play.api.libs.concurrent.Execution.Implicits.defaultContext

import model._

object Application extends Controller {

  /**
   * Controller Action for redirecting requester to URL matching the shortUrl and the country for the remote address,
   * otherwise when shortUrl exists but country does not have a configured URL, the U.S. entry as a fallback. Should
   * the entry for the U.S. store also not exist, the default URL is used.
   *
   * The country of the requester is determined by performing a GeoIP lookup. For this, a local installation of
   * freegeoip is expected (https://github.com/fiorix/freegeoip).
   *
   * Handled errors:
   *   - freegeoip not running -> fallback URL
   *   - freegeoip not responding within 100ms -> fallback URL (critical, script loading blocks page load)
   *   - freegeoip responds with code other than 200 -> fallback URL
   * The fallback URL is the U.S store link for existing shortened links and a specified general default URL otherwise.
   *
   **/
  def redirect(shortUrl: String, format: String) = Action.async {
    req =>
      val fallbackUrl = Links.redirectMap.get(shortUrl + "." + format + ".US").getOrElse(Links.defaultRedirect)
      WS.url(Links.geoLookupAddress + req.remoteAddress).withRequestTimeout(100).get().map {
        geoRes =>
          geoRes.status match {
            case 200 =>
              val url = (geoRes.json \ "country_code").asOpt[String].flatMap {
                cc =>
                  val url = shortUrl + "." + format + "." + cc
                  ReqLogger.logCc(shortUrl, format, cc)

                  Links.redirectMap.get(url)
              }.getOrElse(fallbackUrl)
              ReqLogger.logUrl(shortUrl, format, url)
              Redirect(url)

            case status: Int =>
              ReqLogger.logGeoFail(shortUrl, format, "Status " + status, None)
              Redirect(fallbackUrl)
          }
      }.recover {
        case e: Exception =>
          ReqLogger.logGeoFail(shortUrl, format, e.getMessage, Some(e))
          Redirect(fallbackUrl)
      }
  }
}
{% endcodeblock %}

That is really all, including all the imports and four calls to a request logger. The actual code is a mere **23 lines** long, including error handling. Let's go through this line by line. *redirect* is a controller method that takes two parameters, *shortUrl* and *format*, both of which are strings. They come from the route definition:

{% codeblock routes lang:text https://raw.githubusercontent.com/matthiasn/amzn-geo-lookup/e75c16d198f9f266fa63dbe463856982a1b4fe22/conf/routes routes %}
GET   /:shortUrl/:format   controllers.Application.redirect(shortUrl: String, format: String)
{% endcodeblock %}

The above configuration means that the application will call *controllers.Application.redirect* with the two strings it parses out of the request's path. 

The controller action is built by Play's **[ActionBuilder](http://www.playframework.com/documentation/2.2.3/api/scala/index.html#play.api.mvc.ActionBuilder)** by calling *Action.async* with a block that takes a *request* of type **[play.api.mvc.Request](http://www.playframework.com/documentation/2.2.3/api/scala/index.html#play.api.mvc.Request)** and returns the future of a result. Next, we construct a fallback link to be delivered when the following GeoIP lookup fails in one way or another.

Next we fire up an asynchronous call to the local **freegeoip** instance for the IP address derived from the request. I only give this a timeout of 100 milliseconds as I do not want to hold up page loading for longer than that, no matter what. In reality, this is plenty for this local lookup if things are running smoothly and I usually only measure around 7 milliseconds to fulfill this request end to end.

First, we create the *fallbackUrl* which will either be the specific link to the U.S. store or a default URL if the map lookup with the *shortUrl* and *format* provided is unsuccessful. This is either the corresponding link to the shortUrl for the U.S. store, should that exist in the model, or a default URL (also specified in the model).

Next, we create a **[WsRequestHolder](http://www.playframework.com/documentation/2.2.3/api/scala/index.html#play.api.libs.ws.WS$$WSRequestHolder)** by specifying the URL, setting the timeout. Then we call *get()* on the request holder and *map* on it by providing a function to apply to a successful result of the future. In here, the result could either be a status code of **[200](http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)** or something else, for example a **[400](http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)** if the request failed. Such a failure can occur if freeogeoip is called locally from an IPv6 address, as is the case on my Mac. If the result is a **200**, we expect the result body to contain valid JSON, so we parse it for the country code. This parsing step returns the *Option* of a string, depending on whether it has found the specified JSON property or not. We *flatMap* with a function that itself returns an *Option* of a URL string by taking the parsed country code string and looking that up in the **[Map](http://docs.scala-lang.org/overviews/collections/maps.html)** of the model. If such an entry exists, the Map lookup will return **Some(urlString)**, otherwise it will return **[None](http://www.scala-lang.org/api/current/index.html#scala.None$)**. Using *flatMap* now returns a single option instead of having to map on two options. Then we call *getOrElse* on the resulting Option, retrieving either the lookup result or the *fallbackUrl*. When encountering any result code other than **200**, we redirect to the *fallbackUrl*.

Now there is a second failure scenario where not the result code indicates what went wrong, but instead the WS call fails altogether. That case would result in a failed future, which we can catch using *recover*, again redirecting to the *fallbackUrl*. To understand what is going on here, it is important to realize that both the map combinator on the WS result and the recover combinator return new futures, both of the **[SimpleResult](http://www.playframework.com/documentation/2.2.3/api/scala/index.html#play.api.mvc.SimpleResult)** type. **[This article](http://docs.scala-lang.org/overviews/core/futures.html)**, which I found in the Scala documentation, helped me to understand futures better. We could have used pattern matching on specific types of exceptions, but that wasn't necessary in this case as we simply want to return a redirect to the *fallbackUrl* (plus log the exception).

## The model
Right now all the data lives in the model's source code. Obviously it would be better to utilize a database for this purpose, but for a first version, this serves us fine. The model is really just a **[Map](http://docs.scala-lang.org/overviews/collections/maps.html)**. Here's a shortened version as an example:

{% codeblock Links model lang:scala amzn-geo-lookup/blob/e75c16d198f9f266fa63dbe463856982a1b4fe22/app/model/Links.scala Links.scala %}
package model

object Links {
  val redirectMap = Map[String, String](
    // Amazon landing page
    "amazon-landing.link.US" -> "http://www.amazon.com/?_encoding=UTF8&camp=1789&creative=390957&linkCode=ur2&tag=matthiasnehls-20&linkId=2JYSWJ7Q5CJ7F7QW",
    "amazon-landing.link.DE" -> "http://www.amazon.de/?_encoding=UTF8&camp=1638&creative=19454&linkCode=ur2&site-redirect=de&tag=matnehblo-21&linkId=GTDGKZ677SJ76DR2",
    "amazon-landing.link.GB" -> "http://www.amazon.co.uk/?_encoding=UTF8&camp=1634&creative=19450&linkCode=ur2&tag=matthiasneh0c-21&linkId=O6XF3Z2DDAH6EUXU",
    "amazon-landing.link.FR" -> "https://www.amazon.fr/?_encoding=UTF8&camp=1642&creative=19458&linkCode=ur2&tag=matthiasneh03-21&linkId=WATXOGQM2BDD44FL",
    "amazon-landing.link.CA" -> "http://www.amazon.ca/?_encoding=UTF8&camp=15121&creative=390961&linkCode=ur2&tag=matthiasneh0d-20",
    "amazon-landing.link.IT" -> "https://www.amazon.it/?_encoding=UTF8&camp=3370&creative=24114&linkCode=ur2&tag=matthiasneh01-21",
    "amazon-landing.link.ES" -> "https://www.amazon.es/?_encoding=UTF8&camp=3626&creative=24822&linkCode=ur2&tag=matthiasne0ac-21",
  )
}
{% endcodeblock %}

## Conclusion
Building this geo-aware link shortener (in a very basic form) was really easy with **[Play Framework](http://www.playframework.com)**. I am currently using this tool for the lookup of Amazon store fronts to redirect affiliate links to the country of the visitor. But there is no reason why this can't be used for all kinds of other scenarios where such a country-specific redirection of requests might be useful.
Of course, it is not ideal to store the links in code. Instead, that data should live in a database of some kind, probably with the stored values cached inside the application, to avoid having to introduce additional round-trips for every lookup. Placing the data in a model object is already the first step towards building it. The redirecting controller would not have to change at all when this model object is replaced with one that uses a database. Then it would also be really useful to create new links from a user interface. That could, for example, easily be achieved with an AngularJS application for link maintenance. There's surely stuff for me to do. Please let me know if you think this more elaborate version I just described (database, UI) is useful, either to use it yourself or to follow a tutorial in which we build this application. The more successful this application turns out to be in terms of contributing to this blog, the more time I will find to work on these improvements. You can literally vote with your wallet by clicking on links delivered by the described application.

<SCRIPT charset="utf-8" type="text/javascript" src="http://r.matthiasnehlsen.com/slideshow1/wide"> </SCRIPT>

Please let me know your thoughts on the above. I will be happy to clarify anything that is difficult to grasp right away. And please let me know if you encounter problems making any of this work for yourself.

That's it for today - hope to see you back soon. And now that you have made it this far in the article, why don't you follow me on Twitter **[@matthiasnehlsen](https://twitter.com/matthiasnehlsen)** so you'll know when the next article is out.

Cheers,
Matthias