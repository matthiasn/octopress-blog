---
layout: post
title: "I'm writing a book about Building a System in Clojure"
date: 2014-12-19 16:15
comments: true
categories: 
---
I thought about where to take my series about **[Building a System in Clojure](http://matthiasnehlsen.com/blog/2014/09/24/Building-Systems-in-Clojure-1/)** next and realized that I don't like the format of a **blog series** all that much. Instead, the format of a **book** seems like a better choice; one where you, the potential reader, are invited to provide feedback from the very first moment of the writing process. I have already started that process and for now I have transferred the existing articles from the series into the book without much further editing. Over the next couple of weeks, I will be working on making the content more consistent with the book format. The book is available for free on **[leanpub.com](https://leanpub.com/building-a-system-in-clojure)**. Iff (if and only if) you find the content to be of value, you can pay a suggested price, but that's entirely up to you and something you can decide on later.

<!-- more -->

The book format will allow me to write a consistent narrative around the flow of data through a system, where we will follow the journey of data from a streaming source to a user interface that updates changes according to new data from the streaming source immediately, or rather within a few hundred microseconds.

As a sample application, we will use tweets streaming live from the Twitter Streaming API. In case you haven't seen it yet, this is how the application looks like:

{% img left /images/birdwatch-pure.jpg 'New Design with Pure CSS' 'New Design with Pure CSS' %}

There's also a **[live version](http://birdwatch2.matthiasnehlsen.com/)** of this application. I have ideas for additional sample applications, but they may or may not come into existence, depending on how much time I will have for this book project.

The process of writing this book will take place while exploring the problem space, not afterwards. All designs and implementations are fluid at this point and I will be happy to discuss all aspects of the system in this **[Google Group](https://groups.google.com/forum/#!forum/building-a-system-in-clojure/)** and adapt and rewrite aspects when better solutions arise in these discussions. You are also welcome to join the development process: do reach out when you have a suggestion on how to get involved. The project needs tests, better inline documentation, code reviews, and quite possibly better design and code. 

Regarding the book writing process, first and foremost I would love questions for clarification so the content will come out as approachable as possible. If you find a typo, please correct it and submit a **[pull request](https://github.com/matthiasn/clojure-system-book)** right away.

I am looking forward to the weeks to come. It's much better to be able to put some work in here and there on whatever I'm interested in that day instead of writing monolithic blog posts that aim at conclusively covering an aspect of the application, usually way before I have any conclusive understanding.

Would you do me a favor? [^1] Please sign up as a reader (for free and with no commitment whatsoever) right away if you think you might at all be interested in what we'll cover in this book. I would very much like to know how much interest there might be and I promise I will try to do what I can to make the time spent on reading this book or contributing to it worth your while.

Cheers and Happy Holidays,
Matthias

[^1]: As a little christmas present, if you will.