---
layout: post
title: "BirdWatch: AngularJS vs. ReactJS"
date: 2014-03-18 22:21
comments: true
categories: 
---
**Summary:** in this article I will dicuss a new version of the BirdWatch application that uses **[ReactJS](http://facebook.github.io/react/)** on the client side instead of **[AngularJS](http://angularjs.org)**. No worries, I do not intend to replace AngularJS. Rather, I want to create yet another version of the client side BirdWatch application in order to get a better intuition for the pros and cons of different frameworks and libraries. So think of it as something like the **[TodoMVC](http://todomvc.com)** of reactive web applications. Well, not quite yet, but feel free to write another client version for comparison. EmberJS, anyone? Or whatever else you can think of, I will happily accept pull request demonstrating different approaches.

<!-- more -->

In this article I will not go into a lot of detail about the server side of the BirdWatch application, there's an **[article for that](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** already. What you need to know is that there is a server side application that connects to the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** and that subscribes to a defined set of terms, meaning that it will retrieve all tweets containing any of these terms up to a limit of 1% of all tweets at a given time[^1]. Then there is a client side JavaScript application, currently using AngularJS. The client side application allows users to perform a live search inside a stream of tweets, with live updates of the UI when new matches to the search come in. Here's how that looks like. Click the image to try out the application:

<a href="http://birdwatch.matthiasnehlsen.com" target="_blank"><img src="/images/bw_expl_beer.png" /></a>

Here's an animated architectural overview, mostly as a teaser for the previous article that describes the server side of the application in detail. Accordingly you can click it to get to that article:

<a href="http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/" target="_blank"><img src="/images/bw_expl_anim.gif" /></a>

This all works really nicely with AngularJS. Now let's see if we can build the same thing with ReactJS on the client side.

##Why might someone choose ReactJS over AngularJS
In the current version of BirdWatch, AngularJS decides when to figure out if the data model changes so that it can determine when to re-render the UI. That requires any calls to the data providing service to be idempotent [^2]. That requirement is fulfilled, any call to the crossfilter service for data is indeed itempotent, but there's a catch: every call to get data is potentially expensive, and I'd rather avoid unnecessary calls to the crossfilter service. Instead I want control on when the client UI is rendered by actively triggering it. 

As I have discussed in this **[recent article](http://matthiasnehlsen.com/blog/2014/01/24/scala-dot-js-and-reactjs/)**, ReactJS would also potentially be a better fit when working with immutable data. That is not a concern in the current version of BirdWatch, but it might be in the future.

##Implementing the existing functionality with ReactJS
There are four main areas of functionality in the application:

* Search: The user can start a search by entering the terms into the search bar, which will refresh the data and establish a Server Sent Event connection to the server that will deliver matches to the search in real time. At the same time previous matches are retrieved.

* Rendering of Tweets: Different sort orders of tweets are displayed in what I would call a list of tweet cards. In AngularJS, directives nicely handle the abstraction of one such tweet. 

* Pagination: The application loads many more tweets than can displayed on one page (with 5000 tweets being the default). The AngularJS version implements this with a modified subset of the AngularUI-Bootstrap project.

* Charts: different visualizations are rendered on the page. At the core, D3 does this for us. In the AngularJS version, relatively thin wrappers make directives out of these charts that get wired data and that re-render when the data changes.

Let us go through these areas one by one.

##Search
In this area, AngularJS and its two-way data-binding shines. There the content of the search input element is bound to a property on the $scope, just like the button is bound to a function that is also part of the $scope and that triggers a new search. With ReactJS, I found it a little more complicated to achieve the same thing. I am actually not using ReactJS at all to achieve this, instead I am assigning the functionality using onclick for triggering the search function, and jQuery to achieve the same when enter is pressed inside the input field. AngularJS offers more of a full framework solution for such problems, but I am okay with this solution here. 

Onclick:

    <button class="btn btn-primary" type="button" onclick="BirdWatch.search()">

Set up submit search by pressing Enter:

    $('#searchForm').submit(function (e) {
        BirdWatch.search();
        e.preventDefault();
        return false;
    });

Function for triggering search:

    BirdWatch.search = function () {
        var searchField = $("#searchField");
        BirdWatch.wordcount.reset();
        activePage = 1;
        BirdWatch.crossfilter.clear();
	    BirdWatch.tweets.search(searchField.val(), $("#prev-size").val());
    	searchField.focus();
	};

Note that the above is not necessary, one could pass the function to ReactJS and define the search bar as a component, which assigns the functionality itself.

ACTUALLY THIS WOULD BE CLEANER FOR COMPARISON, LET'S DO THAT...

##Rendering of tweets
This is where it gets much more interesting. AngularJS renders the list of tweets from the data model using **ng-repeat** like this:

                    <!-- Tweet Cards inside frame -->
                    <div class="col-lg-4" id="tweet-frame">
                        <div class="tweetCard" data-ng-repeat="tweet in cf.tweetPage(currentPage, pageSize, sortModel)"
                            data-tweet="tweet"></div>
                    </div>

where *cf.tweetPage* is a function delivering the data from the crossfilter object. The application code has little control over when this happens. It will certainly happen when explicitly calling *$scope.$apply* and also when anything else happens that has any effect on the data model anywhere. This is what I meant when I said earlier that this might not be the most desirably thing when this function call is potentially expensive. 

ReactJS works the other way around. The application instantiates a component for the list of tweets that knows how to render itself, and it will only subsequently do that when the application passes it new data. Let's look at that in more detail. In the HTML, there is only a single div without any special notation:


                        <!-- Tweet Cards inside frame -->
                    <div class="col-lg-4" id="tweet-frame"></div>



Then in the component declaration, it looks as follows:

    /** single Tweet component */
    var Tweet = React.createClass({
        render: function () { return (
            <div className="tweet">
                <span>
                    <a href={"http://www.twitter.com/" + this.props.t.user.screen_name} target="_blank">
                        <img className="thumbnail" src={this.props.t.user.profile_image_url} />
                    </a>
                </span>
                <a href={"http://www.twitter.com/" + this.props.t.user.screen_name} target="_blank">
                    <span className="username">{this.props.t.user.name}</span>
                </a>
                <span className="username_screen">&nbsp;&#64;{this.props.t.user.screen_name}</span>
                <div className="pull-right timeInterval">{fromNow(this.props.t.created_at)}</div>
                <div className="tweettext">
                    <div dangerouslySetInnerHTML={{__html: this.props.t.htmlText}} className=""></div>
                    <div className="pull-left timeInterval">{numberFormat(this.props.t.user.followers_count)} followers</div>
                    <RetweetCount count={this.props.t.retweet_count} />
                    <FavoriteCount count={this.props.t.favorite_count} />
                </div>
            </div>
        ); }
    });

    /** Tweet list component, renders all Tweet items (above) */
    var TweetList = React.createClass({
        render: function() {
            var tweetNodes = this.props.tweets.map(function (tweet) {
                if (!tweet) return "";
                return <Tweet t={tweet} key={tweet.id} />;
            }.bind(this));
            return <div id="tweet-list">{tweetNodes}</div>;
        }
    });

Notice the TweetList component at the bottom. This component itself has elements of the Tweet type as child elements which it generates inside its only method *render*. This is the only method that a component has to have. In this particular component, the child elements are generated by by using the map function on the props.tweet, which accordingly needs to be an array. In the mapper function, a Tweet component is created for every element of the array, and that element is passed to the Tweet component as props. 

The Tweet component itself also has the a *render* function in which it creates a div holding a Tweet. Dynamic data for this comes from accessing the tweet object that was passed in the TweetList component. Note that the code above is not regular JavaScript but JSX, which allows writing a syntax fairly similar to HTML. This JSX is cross-compiled into JavaScript during the build process. More informatio on this build process can be found in this README.






##Data observation (pull) vs. setProps (push)


In other words, I want to take the privilege of the client to ask for data away and instead decide in my application logic when the UI should update. This could be done in AngularJS as well by keeping a cached version of the last UI state, but I'd rather not waste any memory for that, particularly not on mobile.Instead I want my business logic to call the UI renderer exactly once whenever it wants to render data. No more, no less. 

ReactJS is a good fit for that. It does not impose any structure on my application, all it does is render the UI, and it does that really well by maintaining a virtual DOM that is used for diffing so that the DOM is only touched where changes have indeed happened. Check out my previous articles where I have explored this in more depth if you're curious.

##Build system
To round things off, I am also 


#Conclusion
ReactJS is a nice complement for rendering the UI of the BirdWatch application. From bird's-eye view, it is really nothing more than a function that accepts data and that a DOM representation in line with the provided data as a side effect. It does the rendering in a very efficient way and it is low-maintenance, it does not want any more attention than the call necessary to inform it about data changes.

Alright, this concludes today's article. In this article I have for the first time used footnotes. How do you like this? Feedback welcome. Feel free to subscribe to the newsletter if you want to stay up-to-date and hear first when new articles come out. If you want to see work-in-progress, both in terms of projects and articles, you can follow me on GitHub.

Until next time,
Matthias



 [^1]: The list of technical terms I am using for the live demo under birdwatch.matthiasnehlsen.com easily fits into this cap, in which case the application will receive all these tweets. The term **Obama** also usually fits into this limit. The term **love** on the other hand doesn't. If you were to download BirdWatch from GitHub, create a Twitter API key and replace the list of software terms with only the word **love**, I bet you will reach the 1% limit any second of the day. However not to worry, Twitter will still deliver at the rate limit, which last time I tried was about 4 million tweets per day. Sure, you might loose Tweets doing this, but not to worry when looking for popular tweets as those will appear time and time again as a retweet, making it highly unlikely to miss them over time. Only the current retweet count may lag behind when the last update as a retweet was dropped.

 [^2]: **Idempotent**: This basically means that it must be possible to call something multiple times without additional side-effects, if any at all. Idempotency is for example also essential in scenarios where some service gurantees at-least-once delivery. In that case you don't want to run into trouble (like wrongfully incrementing a counter) when that service delivers more than once.
