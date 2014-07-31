---
layout: post
title: "Monetizing a blog with Amazon Affiliate Links"
date: 2014-07-30 17:44
comments: true
categories: 
---
It has been around 15 months since I wrote my first blog post. And I like writing these articles a lot, particularly the long one. I just constantly find that I do not have enough time for it. It should be immediately obvious when you for example look at **[this article](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** that writing and developing something like this is not doable with an hour a week or so. So I wondered what it would take to have the blog buy me some more time to focus on it.
From the number of visitors that I am seeing, it should be possible to make some money off of **[Amazon affiliate links](https://affiliate-program.amazon.com/gp/associates/join/landing/main.html)**, which in return would afford me to work less on other things and more on the blog.

<!-- more -->

Now affiliate links seem particularly suitable when the majority of visitors come from a single country. Otherwise there need to be different links for people from different countries, or you lose the commission. At the point of this writing, there are 11 Amazon storefronts world-wide, and you need to be an affiliate in each one where you have a significant amount of users. Have you ever seen pages with 11 different national flags with links to the different stores? Thanks but no thanks, that is not really not an option for me.

I have looked into two readily available commercial options, **[A-FWD](http://affiliate-geo-target.com/amazon.html)** and **[Georiot](http://www.georiot.com/home)**, both addressing the geo-fragmentation problem. They both have monetization strategies of different complexity. They have in common that both take a certain amount of visitors away by assigning their affiliate IDs in a share of visits instead of yours. 

I have not evaluated one against the other as I am more interested in implementing this myself. That way, I have more to write about and get to start another open source project. So what do I need to do? I need a reactive web application hosting the links for me for example as **http://r.matthiasnehlsen.com/amzn/ProductID**. Then, when a visitor clicks a link, a GeoIP lookup is performed and, based on the resulting country, the proper store is chosen if it so happens that an Amazon store is assigned for the country where the visitor is from, and the US store as a default when there is no store in that country.

Let us build this application in a simple form from scratch. I can see how a web application for managing links with realtime dashboards showing visitors can be useful at some later point. But for today I am focusing a very simple scenario possible and that is delivering a country specific slide show. I have created one for the US store with some books I have found useful:

<SCRIPT charset="utf-8" type="text/javascript" src="http://ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&MarketPlace=US&ID=V20070822%2FUS%2Fmatthiasnehls-20%2F8003%2Fc99b01ed-8119-449a-a7f3-07cbef1c84bb&Operation=GetScriptTemplate"> </SCRIPT> <NOSCRIPT><A HREF="http://ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&MarketPlace=US&ID=V20070822%2FUS%2Fmatthiasnehls-20%2F8003%2Fc99b01ed-8119-449a-a7f3-07cbef1c84bb&Operation=NoScript">Amazon.com Widgets</A></NOSCRIPT>


Here's the source code from Amazon:

{% codeblock Amazon Script lang:xml %}
<SCRIPT charset="utf-8" type="text/javascript" src="http://ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&MarketPlace=US&ID=V20070822%2FUS%2Fmatthiasnehls-20%2F8003%2Fc99b01ed-8119-449a-a7f3-07cbef1c84bb&Operation=GetScriptTemplate"></SCRIPT> 
<NOSCRIPT><A HREF="http://ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&MarketPlace=US&ID=V20070822%2FUS%2Fmatthiasnehls-20%2F8003%2Fc99b01ed-8119-449a-a7f3-07cbef1c84bb&Operation=NoScript">Amazon.com Widgets</A></NOSCRIPT>
{% endcodeblock %}

The above is really nothing more than a script tag with some JavaScript to run which will then display the slideshow. 


<SCRIPT charset="utf-8" type="text/javascript" src="http://r.matthiasnehlsen.com/slideshow1/wide"> </SCRIPT>



How can I make 

 a link leads the visitor to the Amazon storefront of the respective country, should it exist, and otherwise to the amazon.com website. At this point no products will be linked, that can come next, right now it will only be a redirect to Amazon store itself. Then later in the article I will ask you if you want to support this blog by clicking on the link before you intend to purchase something within the next 24 hours. That would really help supporting this blog. Actually, let's do that now and later:

Please support this blog through the Amazon affiliate link program so I have more time to write articles like this one.

---->> set up my Amazon page with list of favorite books and stuff?
- Books
- MacBook Retina
- Sony Cam

- Start photography sub page soon, focusing on manual focus lenses in front of Sony A7

Now let us get technical and implement this application from scratch. 


## Setting up local MaxMind GeoIP database?

    play new amazn-geo-defragmenter

    play idea or play intellij

edit routes to include amzn link

add controller action that performs the GeoIP lookup





At some later point I also want to be able to link to books and cool stuff directly as I write about these items, but that is not a problem to solve today.

This is it for today. As usual, please share this article if you find it useful. Certainly also let me know if you have additional questions. I'm happy to help. You can also get a little more involved in supporting this blog by clicking this Amazon affiliate link before you intend to make a purchase. A small portion of the sales will then contribute to running this blog. In return I will be able to write more articles like this one.

Cheers,
Matthias



http://www.associateprograms.com/articles/pat-flynn-interview-50k-a-month-affiliate.html
Seven Seven Seven Strategy

http://www.associateprograms.com/articles/geo-targeting-service-solves-amazon-associates-problem.html

http://www.mywritingblog.com/2013/11/georiot-alternative-to-fwd-for-creating.html

http://www.playframework.com/documentation/2.0/ScalaActions






---
