---
layout: post
title: "A farewell note to a programming language"
date: 2014-12-04 14:55
comments: true
categories: 
---
Dear Scala, 

Do you remember how we first met, back in 2012? I thought your functional approach was fresh, and different. For a while I believed we were made for each other. A first project was a success; on my own I was comfortable with the good parts of you. But as soon as I started working in teams writing Scala, your immense syntax started drowning me. At first, I took it as a compliment that you tried to please me by offering me to work the way I liked. But then I noticed that it wasn’t something you did for me in particular. Instead, you try to be everybody’s darling by offering every software development paradigm known to man.

<!-- more -->

I found that to be particularly gruesome when working with seasoned Java developers. Yeah, sure, they have been doing OOP for a long time, for whatever that’s worth. But that doesn’t mean that it’s a good idea to recreate Java in Scala with just a little bit less of boilerplate. In well over a year of working in Scala teams there hasn’t been a single day where I felt that there was a shared mindset about how to develop a system or even approach a problem.

All this is not to say that one can’t develop powerful systems with you; there’s plenty of proof otherwise, but my heart is no longer in it and I am not even sure it ever was.

Last year I wrote this little application called **[BirdWatch](https://github.com/matthiasn/BirdWatch)** in **[Scala](http://www.scala-lang.org/)** and **[Play Framework](https://www.playframework.com)**, initially only to have something to show when interviewing for jobs. But then the whole thing developed a life of its own. It was like a cute little stray dog that all of a sudden showed up on your porch. You don’t really know what to do with it but it sure looks hungry, so you feed it; it decides to stick around and before you know it, you find yourself making regular appointments at a dog spa. You know, that kind of story. It’s cute though, I’m not complaining.

But I never felt compelled to put much work in the server side implementation, in part because I already spent my workdays writing Scala. Also, while the server side implementation looks deceptively simple, it is actually hard to understand in depth because it uses the **[Iteratee library](https://www.playframework.com/documentation/2.2.x/Iteratees)**. I find this library difficult to understand, even more difficult to explain to other people, and next to impossible to grasp the source code of. As a matter of due diligence, I prefer to rely only on library code that I have read and understood well. In this case, I could not fix even the smallest bug, and that’s a huge red flag.

So I spent more time working on different clients. Initially, there was the AngularJS/JavaScript version, then another version with ReactJS/JavaScript and even another one with ReactJS/ScalaJS.

All the while I was flirting with **[Clojure](http://clojure.org/)**, so it was a logical next step for me to write a client with **[ClojureScript](https://github.com/clojure/clojurescript)** and **[Om](https://github.com/swannodette/om)**. I quickly abandoned that one, not because I didn’t like it, but because I liked the ClojureScript experience so much that I wanted to abandon you altogether, dear Scala, in favor of an all-Clojure version.

So here it is. I have met another programming language, and for the first time I feel like I’ve met a soul mate, as far as programming languages go [^1]. Sorry about that, but I have to follow my heart.

But why am I writing this all of a sudden, you might ask? Good question. The other day yet another recruiter approached me about a Scala project, which happens more often than I even care to look up whom the project is for. But this time it was different. I felt the need to make a clean break. Considering my career, I decided that you, Scala, would not be a part of it, no matter how high the demand or how impressive the daily rate for freelance gigs.

I will be happier with projects in Clojure. Which brings me to an unfortunate observation I made at the Conj. I was a little surprised about the number of people I spoke to that wished they could code Clojure to pay their rent [^2].

To sum up things, dear Scala, it is definitely over between the two of us. I don’t need to take a break; I have found a better match. That doesn’t mean anyone else should follow my example blindly, though. But what it may get people thinking about is that whatever the language they are currently using, if they’re not happy, they may want to look for a better fit for themselves. I don’t know about other people’s life, but mine is too short for working with something that I don’t love.

Cheers,
Matthias

[^1]: The whole LISP / S-expression / homoiconicity thing seems very compatible with the operating system of my brain, and I also feel that constraint is bliss. There aren’t nearly as many ways to write idiomatic Clojure as there are ways to write a Scala program.

[^2]: It must be possible to start a lucrative business around software written in Clojure, in particular when I consider how much more productive I personally am when I write Clojure compared to Scala. If you know of any opportunities where my skillset could be an asset, please let me know. Ideally, I’d favor multiple short-term projects over one long project. These short projects could start with an analysis of a problem or an existing system, a prototype for something new and then checking back on it from time to time. If that sounds like something you may need, please contact me offline. My email is on my GitHub repo.
