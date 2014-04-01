---
layout: post
title: "BirdWatch: AngularJS vs. ReactJS"
date: 2014-03-28 22:21
comments: true
categories: 
---
**Summary:** in this article I will present a new version of the BirdWatch application that uses **[ReactJS](http://facebook.github.io/react/)** on the client side instead of **[AngularJS](http://angularjs.org)**. No worries if you liked the previous AngularJS version, I do not intend to replace it. Rather, I want to create another version of the client side web application in order to get a better intuition for the pros and cons of different frameworks and libraries. So think of it as something like the **[TodoMVC](http://todomvc.com)** of reactive web applications. Well, not quite yet, but feel free to write another client version for comparison. EmberJS, anyone?
For this new version I have also rewritten the barchart as a ReactJS component with integrated trend analysis and no dependency on **[D3.js](http://d3js.org)**. 

<!-- more -->

In this article I will not go into a lot of detail about the server side of the BirdWatch application, there's an **[article for that](http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/)** already. What you need to know is that there is a server side application that connects to the **[Twitter Streaming API](https://dev.twitter.com/docs/streaming-apis)** and that subscribes to a defined set of terms, meaning that it will retrieve all tweets containing any of these terms up to a limit of 1% of all tweets at a given time[^1]. Then there is a client side JavaScript application that allows users to perform a live search inside a stream of tweets, with realtime updates of the UI when new matches to the search come in. Here's how that looks like. Click the image to try out the application:

<a href="http://birdwatch.matthiasnehlsen.com" target="_blank"><img src="/images/bw_reactjs.png" /></a>

Here's an animated architectural overview, mostly as a teaser for the previous article that describes the server side of the application in detail. Accordingly you can click it to get to that article:

<a href="http://matthiasnehlsen.com/blog/2013/09/10/birdwatch-explained/" target="_blank"><img src="/images/bw_expl_anim.gif" /></a>

This all has been working really nicely with AngularJS for a couple of months. Now let's see if we can build the same thing with **[ReactJS](http://facebook.github.io/react/)** on the client side.

##Why might someone choose ReactJS over AngularJS
In the current version of BirdWatch, AngularJS decides when to figure out if the data model changes so that it can determine when to re-render the UI. These calls can happen at any time, so these calls need to be idempotent [^2]. That requirement is fulfilled, any call to the crossfilter service for data is indeed itempotent, but there's a catch: every call to get data is potentially expensive, and I'd rather avoid unnecessary calls to the crossfilter service. Instead I want control on when the client UI is rendered by actively triggering it. That way I have full control when and how often the UI renderer is fed with new data. 

As I have discussed in this **[recent article](http://matthiasnehlsen.com/blog/2014/01/24/scala-dot-js-and-reactjs/)**, ReactJS would also potentially be a better fit when working with immutable data. That is not a concern in the current version of BirdWatch, but it might well be in the future.

##Implementing the existing functionality with ReactJS
There are four main areas of functionality in the application:

* **Search:** The user can start a search by entering the terms into the search bar, which will refresh the data and establish a Server Sent Event connection to the server that will deliver matches to the search in real time. At the same time previous matches are retrieved.

* **Rendering of Tweets:** Different sort orders of tweets are displayed in what I call a list of tweet cards. In AngularJS, directives nicely handle the abstraction of one such tweet. 

* **Pagination:** The application loads many more tweets than can displayed on one page (with 5000 tweets being the default). The AngularJS version implements this with a modified subset of the **[AngularUI-Bootstrap project](http://angular-ui.github.io/bootstrap/)**.

* **Charts:** different visualizations are rendered on the page. At the core, D3 does this for us. In the AngularJS version, relatively thin wrappers make directives out of these charts that get wired data and that re-render when the data changes.

Let us go through these areas one by one.

##Search
In this area, AngularJS and its two-way data-binding shines. There the content of the search input element is bound to a property on the **$scope**, just like the button is bound to a function that is also part of the **$scope** and that triggers a new search. ReactJS, on the other hand, does not offer two-way binding out of the box. There are helpers to achieve this, notably **[ReeactLink](http://facebook.github.io/react/docs/two-way-binding-helpers.html)**, but I have not tried this out. It also seems discouraged, generally. Here in this case it was fairly trivial to achieve the functionality without ReactJS at all, instead I am assigning the functionality using onclick for triggering the search function, and jQuery to achieve the same when enter is pressed inside the input field. AngularJS offers more of a full framework solution for such problems, but I am okay with this solution here.

{% codeblock Search Button lang:html https://github.com/matthiasn/BirdWatch/blob/603d4dfb85330e346afdf9241e36a62313eaa620/app/views/react_js.scala.html react_js.scala.html %}
<button class="btn btn-primary" type="button" onclick="BirdWatch.search()">
{% endcodeblock %}

The button is plain HTML with an onclick handler. As the handler I have assigned the *search* function which lives in a property of the global BirdWatch object. In addition to the click handler for the button, I also want to be able to trigger a search when pressing ENTER inside the search field. jQuery is perfect for that:

{% codeblock Handling Enter in Search Field lang:javascript https://github.com/matthiasn/BirdWatch/blob/ca0ffd54795f26bcbfdcdf5e3e61ea6d0e2d1950/react-js/src/app.js app.js %}
  $('#searchForm').submit(function (e) {
    BirdWatch.search();
    e.preventDefault();
    return false;
  });
{% endcodeblock %}

Finally here is the function that triggers the search:

{% codeblock Function for triggering search lang:javascript https://github.com/matthiasn/BirdWatch/blob/ca0ffd54795f26bcbfdcdf5e3e61ea6d0e2d1950/react-js/src/app.js app.js %}
  BirdWatch.search = function () {
    var searchField = $("#searchField");
    BirdWatch.wordcount.reset();
    activePage = 1;
    BirdWatch.crossfilter.clear();
    BirdWatch.tweets.search(searchField.val(), $("#prev-size").val());
    searchField.focus();
  };
{% endcodeblock %}

The above is plain old HTML / JavaScript / jQuery. You might think that that is such an old-fashioned way of doing it. But on the upside, no special framework knowledge is required, anyone who has done any web development in the last decade can do this. Alternatively, we could make a ReactJS component out of the search bar and pass this component the handler function as part of the **props** [^3]. In this simple case I don't feel like it is necessary to create a component for this, but this would be the way to go when more complex behavior and / or usability is desired.

##Rendering of tweets
This is where it gets much more interesting. AngularJS renders the list of tweets from the data model using **ng-repeat** like this:

{% codeblock ng-repeat in AngularJS version lang:html https://github.com/matthiasn/BirdWatch/blob/ca0ffd54795f26bcbfdcdf5e3e61ea6d0e2d1950/app/views/index.scala.html index.scala.html %}
<!-- Tweet Cards inside frame -->
<div class="col-lg-4" id="tweet-frame">
    <div class="tweetCard" data-ng-repeat="tweet in cf.tweetPage(currentPage, pageSize, sortModel)"
        data-tweet="tweet"></div>
</div>
{% endcodeblock %}

where *cf.tweetPage* is a function delivering the data from the crossfilter object. The application code has little control over when this happens. It will certainly happen when explicitly calling *$scope.$apply* and also when anything else happens that has any effect on the data model anywhere. This is what I meant when I said earlier that this might not be the most desirably thing when this function call is potentially expensive. 

ReactJS works the other way around. The application instantiates a component for the list of tweets that knows how to render itself, and it will only subsequently do that when the application feeds it new data. Let's look at that in more detail. In the HTML, there is only a single div without any special notation:

{% codeblock Tweet List Div in ReactJS lang:html https://github.com/matthiasn/BirdWatch/blob/ca0ffd54795f26bcbfdcdf5e3e61ea6d0e2d1950/app/views/react_js.scala.html react_js.scala.html %}
    <!-- Tweet Cards inside frame -->
    <div class="col-lg-4" id="tweet-frame"></div>
{% endcodeblock %}

Then in the component declaration, it looks as follows:

{% codeblock Tweet List Div in ReactJS lang:javascript https://github.com/matthiasn/BirdWatch/blob/ca0ffd54795f26bcbfdcdf5e3e61ea6d0e2d1950/react-js/jsx/tweetlist.js tweetlist.js %}
/** Component for conditional rendering of retweet count inside Tweet */
var RetweetCount = React.createClass({
    render: function() {
        if(this.props.count > 0) {
            return <div className="pull-right timeInterval">{numberFormat(this.props.count)} RT</div>
        }
        else return <div></div>;
    }
});

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
        var tweetNodes = this.props.tweets.map(function (tweet, idx, arr) {
            return <Tweet t={tweet} key={idx} />;
        }.bind(this));
        return <div id="tweet-list">{tweetNodes}</div>;
    }
});

/** render BirdWatch components */
var tweetListComp = React.renderComponent(<TweetList tweets={[]}/>, document.getElementById('tweet-frame'));
var tweetCount = React.renderComponent(<TweetCount count={0}/>, document.getElementById('tweet-count'));

BirdWatch.setTweetCount = function (n) { tweetCount.setProps({count: n}); };
BirdWatch.setTweetList = function (tweetList) { tweetListComp.setProps({tweets: tweetList}); };
{% endcodeblock %}

Notice the **TweetList** component at the bottom. This component itself has elements of the **Tweet** component type as child elements which it generates inside its only method *render*. *Render* is the only method that a component is required to have. In this particular component, the child elements are generated by by using the map function on the props.tweet, which accordingly needs to be an array. In the mapper function, a Tweet component is created for every element of the array, and that element is passed to the Tweet component as **props**. 

The Tweet component itself also has the a *render* function in which it creates a div holding a Tweet. Dynamic data for this comes from accessing the tweet object that was passed in the TweetList component. Note that the code above is not regular JavaScript but JSX, which allows writing a syntax fairly similar to HTML. This JSX is cross-compiled into JavaScript during the build process. More informatio on this build process can be found in this README.

The Tweet component then includes the **RetweetCount** component, which it passes the RT count, again as **props**. This component has conditional logic in which it decided itself if it wants to return an empty **div** or actual content. The same goes for the **FollowersCount** component, which I have omitted here as it follows the same principle. 

##Build system
To round things off, I have configured a **[grunt-based](http://gruntjs.com)** a build system that automatically transpiles the JSX into plain old JavaScript and then concatenates the files into a single JavaScript file. I have also included tasks for **[JsHint](http://www.jshint.com)** and **[Plato code analysis](https://github.com/es-analysis/plato)** to improve the quality of the code. Ideally there should be additional tasks for a CSS preprocessor such as LESS and minification of HTML, CSS and JavaScript files to achieve the best user experience possible. Maybe I'll get around to that at some point.

##Building an SVG Bar Chart with ReactJS (without D3.js)
**[D3.js](http://d3js.org)** is an amazing technology and really great visualizations have been built with it. However it also has a considerably steep learning curve. I personally find ReactJS easier to reason about because unlike D3.js it does not have the notion of ***update***. Instead, we always pass it the entire data and it will put the changes in effect itself through an intelligent diffing mechanism where it compares current and previous versions of a (fast) virtual DOM and only puts the detected changes into effect in the (slow) actual DOM. Now I thought it would be nice if this concept could be applied to SVG (scalable vector graphics) as well and not only to HTML. Turns out the same principles apply so I found it fairly simple to re-build the bar chart and have ReactJS instead of D3 create the SVG. The resulting code is much shorter than the previous D3 version despite a lot of added functionality. The previous version was a simplistic bar chart whereas the new version has a built-in trend analysis using **[regression-js](https://github.com/Tom-Alexander/regression-js)**, a neat little regression analysis library. In this new chart every bar is aware of its history and determines its trends using linear regression. Here's how that looks like:

<img src="/images/react-barchart.png" />

Each bar has two associated trend indicators, one for showing recent movements in the ranking and the other for an overall trend of the word occurrence. For today I don't have the time to go into detail about the implementation of this chart, but this will make for a nice article in the future. 

#Conclusion
ReactJS is a nice complement for rendering the UI of the BirdWatch application. From bird's-eye view, it is really not more than a function that accepts data and that a DOM representation in line with the provided data as a side effect. It does the rendering in a very efficient way and it is low-maintenance, it does not want any more attention than the call necessary to inform it about data changes. I find its data flow model very easy to reason about, simpler in fact than the multide of concepts one needs to think about when building an application with AngularJS. 

Alright, this concludes today's article. As a new feature I have tried out footnotes and I am curious if you find them useful or distracting. 

Would you like to see work-in-progress, both in terms of projects and articles? <iframe src="http://ghbtns.com/github-btn.html?user=matthiasn&type=follow&count=true" allowtransparency="true" frameborder="0" scrolling="0" width="165" height="20"></iframe>

Until next time,
Matthias


[^1]: The list of technical terms I am using for the live demo under birdwatch.matthiasnehlsen.com easily fits into this cap, in which case the application will receive all these tweets. The term **Obama** also usually fits into this limit. The term **love** on the other hand doesn't. If you were to download BirdWatch from GitHub, create a Twitter API key and replace the list of software terms with only the word **love**, I bet you will reach the 1% limit any second of the day. However not to worry, Twitter will still deliver at the rate limit, which last time I tried was about 4 million tweets per day. Sure, you might loose Tweets doing this, but not to worry when looking for popular tweets as those will appear time and time again as a retweet, making it highly unlikely to miss them over time. Only the current retweet count may lag behind when the last update as a retweet was dropped.

[^2]: **Idempotent**: This basically means that it must be possible to call something multiple times without additional side-effects, if any at all. Idempotency is for example also essential in scenarios where some service gurantees at-least-once delivery. In that case you don't want to run into trouble (like wrongfully incrementing a counter) when that service delivers more than once.
 
[^3]: **Props** in ReactJS refers to immutable data dynamically passed to a component. The component will then render itself according to the data it is fed. Functions, being first class in JavaScript, can also be passed as props. JavaScript does not actually know immutable data structures, but conceptionally we should treat any data passed to a component as immutable as it will make our component much easier to reason about. 


