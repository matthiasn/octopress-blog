---
layout: post
title: "BirdWatch with ReactJS"
date: 2014-02-12 22:21
comments: true
categories: 
---
**Summary:** in this article I will dicuss how to replace AngularJS with ReactJS in the BirdWatch project. If this doesn't concern you, you might as well take the time to go get some fresh air, read something else or even talk to your spouse. 

That being said, let me dive right into why I felt like I wanted to replace AngularJS with ReactJS. Fear not if you prefer AngularJS, I will not kick it out, I am just writing a new version of the client side application. In the current version of BirdWatch, AngularJS decides when to figure out if the data model changes so that it can determine when to re-render the UI. That requires any calls to the data providing service to be idempotent. That requirement is fulfilled, any call to the crossfilter service for data is indeed itempotent, but there's a catch: any call to get data is potentially expensive, and I'd rather avoid unnecessary calls to the service. Instead I want control on when the client UI is rendered. In other words, I want to take the priviledge of the client to ask for data away and instead decide in my application logic when the UI should update. This could be done in AngularJS as well by keeping a cached version of the last UI state, but I'd rather not waste any memory for that, particularly not on mobile.Instead I want my business logic to call the UI renderer exactly once whenever it wants to render data. No more, no less. 

ReactJS is a good fit for that. It does not impose any structure on my application, all it does is render the UI, and it does that really well by maintaining a virtual DOM that is used for diffing so that the DOM is only touched where changes have indeed happened. Check out my previous articles where I have explored this in more depth if you're curious.


#Conclusion
ReactJS is a nice complement for rendering the UI of the BirdWatch application. From bird's-eye view, it is really nothing more than a function that accepts data and that a DOM representation in line with the provided data as a side effect. It does the rendering in a very efficient way and it is low-maintenance, it does not want any more attention than the call necessary to inform it about data changes.

