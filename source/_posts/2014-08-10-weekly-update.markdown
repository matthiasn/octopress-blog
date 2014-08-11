---
layout: post
title: "Weekly Update"
date: 2014-08-10 22:06
comments: true
categories: 
---
I mostly kept myself busy with **[AngularJS](http://angularjs.org)** this week. Then, my **[geo-specific link shortener](https://github.com/matthiasn/amzn-geo-lookup)** generated it's first contribution to running this blog. I also read a little more this week: **[The Clean Coder: A Code of Conduct for Professional Programmers](http://r.matthiasnehlsen.com/unclebob-cleancoder/link)** by Robert C. Martin (Uncle Bob).

<!-- more -->

This week I have been doing a lot of **[AngularJS](http://angularjs.org)** work. I haven't announced this much so far, but last year I have started co-authoring a book about **[AngularUI Development](https://www.packtpub.com/web-development/angularjs-ui-development)**. This book will come out later this year and is scheduled to be out in November. Right now I am doing the finishing touches on the chapters that I wrote. I added quite a few pages to the first chapter about bootstrapping an **[AngularJS](http://angularjs.org)** environment, in particular about AngularJS integration tests using **[Protractor](https://github.com/angular/protractor)**. I am quite happy with how testability of AngularJS application is progressing. Protractor is really powerful and I am looking forward to implementing a comprehensive testing strategy at my current work project. Protractor looks like it will be up to the job. I will be interesting to integrate this into the overall **[Scala](http://www.scala-lang.org)** / **[Play Framework](http://www.playframework.com)** / **[SBT](http://www.scala-sbt.org)** build chain, though. Maybe that'll be an article for another day. 

Then earlier this week I **[wrote about building](http://matthiasnehlsen.com/blog/2014/08/04/building-a-geo-aware-link-shortener-with-play-framework/)** an application for country-specific embedding of links for the **[Amazon Affiliate Program](https://affiliate-program.amazon.com)**, with the idea of having purchases on **[Amazon](http://r.matthiasnehlsen.com/amazon-landing/link)** contribute to the running costs of this blog. Besides the time that I invest, I also rent a server for serving my **[BirdWatch application](http://birdwatch.matthiasnehlsen.com)** at **[Hetzner Online AG](http://www.hetzner.de)**, spending **€81** per months. Today I am happy to report that in the first week, clicks on **[Amazon links](http://r.matthiasnehlsen.com/amazon-landing/link)** have generated roughly **$37** in advertising fees aka revenue through orders in the **[U.S. store](http://www.amazon.com/?_encoding=UTF8&camp=1789&creative=390957&linkCode=ur2&tag=matthiasnehls-20&linkId=2JYSWJ7Q5CJ7F7QW)**. Sweet, thanks a lot to the purchasers, much appreciated. If that became the weekly average, the running costs for my server would be covered. Feels great that my baby, the blog, might be well on the way to paying its own rent. I will have to make my **[geo-specific link shortener](https://github.com/matthiasn/amzn-geo-lookup)** application more user friendly though; it is already annoying me a lot to store created links in code. But that's on my list anyway; for this week the idea was to create a proof-of-concept and for that, storing the links in code was okay.

Also I was able to read a little more in **[Uncle Bob](https://twitter.com/unclebobmartin)**'s book, **[The Clean Coder: A Code of Conduct for Professional Programmers (Robert C. Martin Series)](http://r.matthiasnehlsen.com/unclebob-cleancoder/link)**. I enjoy this book a lot and I will make sure to share some thoughts soon. The main idea about sharing thoughts on what I read is that I read a lot but that I forget too much too soon. I have been planning on taking notes by chapter for the books I am reading for a while, but never really got around to that. By publishing those notes, I will be able to force myself to actually take good notes. First of all, I want to have these notes for my future reference so that I can more easily recap what I learned. If anyone else finds my notes useful, so much the better. More on that soon.

Okay, that's it for today. Next week I will stay busy with the book chapters for a good part, but I also want to try to get back to my work in progress **[article about writing the BirdWatch client in ClojureScript](http://matthiasnehlsen.com/blog/2014/07/24/birdwatch-cljs-om/)**.

Are  you interested in receiving news about my weekly updates? If so, you can sign up for the newsletter right here:

<!-- Begin MailChimp Signup Form -->
<link href="//cdn-images.mailchimp.com/embedcode/slim-081711.css" rel="stylesheet" type="text/css">
<style type="text/css">
	#mc_embed_signup{background:#fff; clear:left; font:14px Helvetica,Arial,sans-serif; }
</style>
<div id="mc_embed_signup">
<form action="//matthiasnehlsen.us7.list-manage.com/subscribe/post?u=798fd7b50a1d9cc58be41c2af&amp;id=e8729041d5" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
	<label for="mce-EMAIL">Subscribe to weekly updates</label>
	<input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="email address" required>
    <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
    <div style="position: absolute; left: -5000px;"><input type="text" name="b_798fd7b50a1d9cc58be41c2af_e8729041d5" tabindex="-1" value=""></div>
    <div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
</form>
</div>
<!--End mc_embed_signup-->

Have a great week,
Matthias