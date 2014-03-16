---
layout: post
title: "Replacing AngularJS with ReactJS"
date: 2014-02-28 22:21
comments: true
categories: 
---
**Summary:** in this article I will dicuss how to replace **[AngularJS](http://angularjs.org)** with **[ReactJS](http://facebook.github.io/react/)** in my **[BirdWatch](https://github.com/matthiasn/Birdwatch)** project. Despite the somewhat catchy title of this post, I do not intend to say that one should replace AngularJS with ReactJS necessarily. Rather, I wanted to create yet another version of the BirdWatch application in order to get a better intuition for the pros and cons of different frameworks and libraries. The AngularJS version will also not be replaced, rather multiple versions of the client exist at the same time for comparison. So think of it as something like the TodoMVC of reactive web applications. Well, not quite yet, but feel free to write another client version for comparison. EmberJS, anyone? Or whatever else you can think of.

I will not go into a lot of detail about the BirdWatch application as such. What you need to know is that there is a server side application that connects to the Twitter Streaming API and that subscribes to a defined set of terms, meaning that it will retrieve all tweets containing any of these terms up to a limit of 1% of all tweets at a given time[^1]. Then there is a client side JavaScript application, using AngularJS. Please check out **[this article](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** if you want to find out more. What you need to know about it for this 


That being said, let me dive right into why I felt like I wanted to replace AngularJS with ReactJS. Fear not if you prefer AngularJS, I will not kick it out, I am just writing a new version of the client side application. In the current version of BirdWatch, AngularJS decides when to figure out if the data model changes so that it can determine when to re-render the UI. That requires any calls to the data providing service to be idempotent. That requirement is fulfilled, any call to the crossfilter service for data is indeed itempotent, but there's a catch: any call to get data is potentially expensive, and I'd rather avoid unnecessary calls to the service. Instead I want control on when the client UI is rendered. In other words, I want to take the priviledge of the client to ask for data away and instead decide in my application logic when the UI should update. This could be done in AngularJS as well by keeping a cached version of the last UI state, but I'd rather not waste any memory for that, particularly not on mobile.Instead I want my business logic to call the UI renderer exactly once whenever it wants to render data. No more, no less. 

ReactJS is a good fit for that. It does not impose any structure on my application, all it does is render the UI, and it does that really well by maintaining a virtual DOM that is used for diffing so that the DOM is only touched where changes have indeed happened. Check out my previous articles where I have explored this in more depth if you're curious.


#Conclusion
ReactJS is a nice complement for rendering the UI of the BirdWatch application. From bird's-eye view, it is really nothing more than a function that accepts data and that a DOM representation in line with the provided data as a side effect. It does the rendering in a very efficient way and it is low-maintenance, it does not want any more attention than the call necessary to inform it about data changes.



 [^1]: The list of technical terms I am using for the live demo under birdwatch.matthiasnehlsen.com easily fits into this cap, in which case the application will receive all these tweets. The term **Obama** also usually fits into this limit. The term **love** on the other hand doesn't. If you were to download BirdWatch from GitHub, create a Twitter API key and replace the list of software terms with only the word **love**, I bet you will reach the 1% limit any second of the day. However not to worry, Twitter will still deliver at the rate limit, which last time I tried was about 4 million tweets per day. Sure, you might loose Tweets doing this, but not to worry when looking for popular tweets as those will appear time and time again as a retweet, making it highly unlikely to miss them over time. Only the current retweet count may lag behind when the last update as a retweet was dropped.
