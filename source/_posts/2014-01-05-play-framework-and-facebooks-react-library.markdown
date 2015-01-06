---
layout: post
title: "Play Framework and Facebook's React library"
date: 2014-01-05 23:30
comments: true
categories: 
---
Over the holidays I discovered Facebook's **[React](http://facebook.github.io/react)**, an interesting library for generating reactive user interfaces. I wanted to try it out in a real-world application, and I thought of one such application I still had running as a demo: **[sse-chat](https://github.com/matthiasn/sse-chat)**, a little chat application I wrote last summer to learn how to make **[Play Framework](http://www.playframework.com/)** and **[AngularJS](http://angularjs.org/)** cooperate in a very basic way. So I thought, why not rewrite the client side using **[React](http://facebook.github.io/react)**, offering the exact same functionality as the **[AngularJS](http://angularjs.org/)** version. Both are also available in the new version with no changes to the backend code except for the added route, as both versions can be accessed in parallel. 

<!-- more -->

The constraint of making it behave exactly like the AngularJS version was a great practice and it actually only took me an afternoon to complete. Touching the existing demo version also had me notice that the live version of it had been up for like 4 months or so, without any trouble. I have the same experience with my **[BirdWatch](http://birdwatch.matthiasnehlsen.com/#/)** application. Kudos to the Play Framework and Akka developers for enabling such reliable server systems.

Here's the new version using **React** instead of **AngularJS**:

<iframe width="420" height="475" src="http://sse-chat.matthiasnehlsen.com/react" frameborder="0"></iframe>

You can open the AngularJS version of the demo inside the **[article from last summer](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)** in another browser and communicate between the two, they share the same backend. Romeo and Juliet are having a chat in room 1, but hey, why not. Better than you just chatting with yourself. You can learn more about the server side in the previous article. In this article we will look exclusively at the web client. Here's an overview of the architecture with React:

{% img left /images/react-sse-chat.png 'image' 'images'%}

So what is different with the **React** library? It offers a **declarative** approach just like AngularJS, but it is subtantially different in many quite interesting ways:

+ **Components** are the basic building blocks, they encapsulate markup and logic together in one place.
+ Components receive **immutable** data (called **props**) from parent elements.
+ Components can have state if necessary.
+ React **prefers immutable** props over mutable state wherever possible, making state changes much easier to reason about.
+ Each component knows how to **render itself**.
+ Components can have other components as children. They can pass their own state or props to these as immutable props. 
+ The entire DOM is rendered into a (fast) **virtual DOM** with every change made. Changes can either come from mutated state or from parent elements as immutable props.
+ This virtual DOM is then **diffed** against a representation of the current DOM, with the actual DOM only being manipulated where new and old versions differ.
+ Data coming from business logic outside will not be touched; React can work with **immutable data** thoughout.
+ Hierarchical components, props, state, handlers. That's pretty much it, no more rather unintuitive concepts to understand. 

## How is it different from AngularJS? 

What I find most intriguing here is how React can work with immutable data. AngularJS, on the other hand needs to modify data that is used in **$scope** in order to keep track of changes.

I tried to use AngularJS with **[ClojureScript](https://github.com/clojure/clojurescript)** a few months back and I ran into a problem with **[infinite digest loops (StackOverflow)](http://stackoverflow.com/questions/19863873/angularjs-infinite-digest-loop-when-no-scope-changes)**, something I quite honestly didn't want to know about. So the problem seemed to be, and please correct me if I'm wrong, that ClojureScript was handing a shiny new data structure to AngularJS over and over again in order to guarantee immutability internally, just like Underscore generated a new data structure on every call to filter (see the StackOverflow discussion cited above). Angular needs to modify data in order to keep track of updates though, resulting in an infinite cycle that it fortunately is clever enough to stop after a few iterations. Let's have a quick look at what Angular does with data. It needs to mark individual elements in a collection with a **hashKey** property in order to keep track of their changes:

{% img left /images/ng-hash-key.png 'image' 'images'%}

Now that's a problem when the data is considered immutable. I assume ClojureScript delivered fresh JavaScript objects from the ClojureScript data structures at the edge of the application where I called a function from Angular, with the result being that on subsequent calls the hashKey was always missing, making Angular upset. Let's emulate this behavior by getting the data for the ng-repeat from a function call that is guaranteed to deliver an array consisting of shiny new objects on every call:

{% codeblock Causing an Infinite Digest Loop in Angular lang:javascript https://github.com/matthiasn/sse-chat/blob/e0b55172eede0f265cedf03cde46ae6b39639e82/app/assets/javascripts/controllers.js controllers.js %}
    var msgs = [];
    $scope.msgs = function () {
        return _.last(JSON.parse(JSON.stringify(msgs)), 3);
    }; 
{% endcodeblock %}

Note that we also need to change the index.html to have the ng-repeat get the data from a function call, but just follow the link in the code block above to see the full source code for the branch I have created. With these changes in place, every subsequent call to the ***msgs*** function will be an array with newly generated objects, causing the following error on every single change to the application state, each of which triggers the digest cycle:

{% img left /images/ng-digest.png 'image' 'images'%}

Note that the error output in the browser console is 23KB in size, even when using the minified production version of Angular, so I can only assume this is real problem.

Now in my daytime job I mostly write Scala code and I really like the peace of mind that immutability can give us, so I'd rather not have to depend on letting the UI part of the web application modify the data model just to keep track of changes. I want to further explore immutability in the browser, for example by using ClojureScript or the younger **[Scala.js](http://www.scala-js.org/)**, which also allows working with immutable data structures. I have only played around a little bit with the latter, but it certainly is an interesting approach.

A nice example of working with immutable data (from ClojureScript) and React is David Nolen's great **[Om library](https://github.com/swannodette/om)**. Immutability allows for amazing features like a simple undo functionality, even saving the entire history of state mutation during the lifecycle of the application. It shouldn't be too difficult to achieve the same in Scala.js, for example by modelling the application state as an immutable data structure and then pushing each version into an array that is then used as a stack. Pop the last state and render what you can peek at, undo done. Conceptually this is really simple to think about iff (if and only if) your UI rendering code requires no state of its own and simply renders an immutable data structure, which React is capable of.

## Source code time

Let's now have a look at the actual source code of the new React based client written in JavaScript and **[JSX](http://facebook.github.io/react/docs/jsx-in-depth.html)**. JSX is a JavaScript XML syntax, which is transformed into plain old JavaScript using a preprocessor. It makes writing DOM elements simpler, however there is no need to use it; instead we can write a React application in (somewhat clunkier) JavaScript code directly instead. It is recommended to do the conversion on the server side, for example in a grunt task, but there is a client-side script for development as well. I chose to ignore the recommendation in this demo for simplicity; your browser will handle the conversion just fine. However for a commercial product I would certainly follow the recommendation to make the client side loading experience as smooth as possible. 

The HTML for our app becomes very simple. In this application it is called react.scala.html, but that's really only because it made the hookup to a route easier, otherwise there is no good reason to use a play/scala template here:

{% codeblock react.scala.html lang:html https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/app/views/react.scala.html %}
<body>
    <div id="chat-app"></div>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
    <script src="//fb.me/react-0.8.0.min.js"></script>
    <script src="//fb.me/JSXTransformer-0.8.0.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min.js"></script>
    <script type="text/jsx" src="assets/js/react-app.js"></script>
</body>
{% endcodeblock %}

All we do above is provide a DOM element hosting the application markup plus loading the necessary scripts. All the interesting stuff happens inside **react.app.js**, which is loaded last. Let us go through, component by component, starting from the top of the hierarchy with the **ChatApp** component:

{% codeblock ChatApp component lang:javascript https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/public/js/react-app.js react-app.js %}
/** randomly generate initial user name */
var initialName = function () { return "Jane Doe #" + Math.floor((Math.random()*100)+1) };

/** ChatApp is the main component in this application, it holds all state, which is passed down to child components
 *  only as immutable props */
var ChatApp = React.createClass({
    getInitialState: function () {
        return { data: [], room: 1, name: initialName() };  // creates initial application state
    },
    componentWillMount: function () {
        this.listen(this.state.room);  // called on initial render of the application
    },
    handleNameChange: function (event) {
        this.setState({name: event.target.value});  // update name state with new value in text box
    },
    handleRoomChange: function (event) {
        this.setState({room: event.target.value});  // update room state with the newly selected value
        this.listen(event.target.value);  // re-initialize SSE stream with new room
    },
    addMsg: function (msg) {
        this.state.data.push(JSON.parse(msg.data));  // push message into state.data array
        this.setState({data: _.last(this.state.data, 4)});  // replace state.data with up to last 5 entries
    },
    listen: function () {
        var chatFeed;            // holds SSE streaming connection for chat messages for current room
        return function(room) {   // returns function that takes room as argument
            if (chatFeed) { chatFeed.close(); }    // if initialized, close before starting new connection
            chatFeed = new EventSource("/chatFeed/room" + room);       // (re-)initializes connection
            chatFeed.addEventListener("message", this.addMsg, false);  // attach addMsg event handler
        }
    }(),
    render: function () { return (
        <div>
            <NameRoomBox name={this.state.name} handleNameChange={this.handleNameChange}
                handleRoomChange={this.handleRoomChange} />
            <MsgList data={this.state.data} name={this.state.name} />
            <SaySomethingBox name={this.state.name} room={this.state.room} />
        </div>
    );}
});
{% endcodeblock %}

In this simple example, the ChatApp component is where most of the application logic lives in. I would probably prefer if it lived somewhere completely outside of React in more complex applications, for example in ClojureScript or Scala.js code, or in well-organized JavaScript code using underscore. Then not even the top element of the React application would need to have state at all. But in this simple example it should suffice to keep everything together in the top-level React component. So what goes on in said component?

+ Inside the ***getInitialState function***, the **initial state** is provided.
+ The ***listen*** function initiates the SSE connection for the current chat room, potentially closing an already established connection. It is organized as an enclosing function that is immediately called upon initialization of the component. That initial call sets up a chatFeed var and returns another function that henceforth lives inside the ***listen*** property of the component. This function can then be called when an open connection to the SSE stream for the current room is desired. 
+ The ***addMsg*** function mutates component state by calling **this.setState**.
+ The ***handleRoomChange*** and **handleNameChange** functions modify **room** and **name** state. ***handleRoomChange*** also calls listen again to re-establish the SSE stream for the new room. 
+ The ***componentWillMount*** function establishes the SSE connection by calling ***listen(room)***, once, upon initialization of the component. 

Next let's look at the first child component of the single **ChatApp** component.

{% codeblock NameRoomBox component lang:javascript https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/public/js/react-app.js react-app.js %}
/** name and room selection component */
var NameRoomBox = React.createClass({
    roomOpts: [1,2,3,4,5].map(function (room) { return <option value={room}>Room {room}</option> }),
    render: function() { return (
        <div id="header">
            Your Name: <input type="text" name="user" className="userField" value={this.props.name}
                onChange={this.props.handleNameChange}/>
            <select id="roomSelect" onChange={this.props.handleRoomChange} value={this.props.room}>
                {this.roomOpts}
            </select>
        </div>
    );}
});
{% endcodeblock %}

In the **NameRoomBox** component, only two things actually happen:

+ The **roomOpts** property is initialized with a list of all 5 room <option> elements. The JSX transpiler thankfully does this for us.
+ The ***render*** function returns a ```<div>``` with an ```<input>``` for the name and a ```<select>``` for the room inside, using the ```<option>```elements created in the first step. It also attaches the handler functions provided inside **props** to respond to user input.

The next component inside **ChatApp** is the **MsgList** component:

{% codeblock MsgList component lang:javascript https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/public/js/react-app.js react-app.js %}
/** chat messages list component, renders all ChatMsg items (above) */
var MsgList = React.createClass({
    render: function() {
        var msgNodes = this.props.data.map(function (msg) {
            return <ChatMsg user={msg.user} time={msg.time} text={msg.text} name={this.props.name} />;
        }.bind(this));
        return <div id="chat">{msgNodes}</div>;
    }
});
{% endcodeblock %}

The **MsgList** component only has one function: ***render***, which takes the array of messages provided as props and maps it into individual **ChatMsg** components, which we will look at next:

{% codeblock ChatMsg component lang:javascript https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/public/js/react-app.js react-app.js %}
/** single chat message component */
var ChatMsg = React.createClass({
    render: function() { return (
        <div className={"msg " + (this.props.user === "Juliet" ? "juliet" : this.props.user !== this.props.name ? "others" : "")}>
            {this.props.time}<br/>
            <strong>{this.props.user} says: </strong>
            {this.props.text}
        </div>
    );}
});
{% endcodeblock %}

The **ChatMsg** component above only knows how to render itself. Depending on the name of the user sending a message, it is rendered in different colors by assigning the element different CSS classes. Now the last component to look at is the **SaySomethingBox**:

{% codeblock SaySomethingBox component lang:javascript https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/public/js/react-app.js react-app.js %}
/** chat message input component*/
var SaySomethingBox = React.createClass({
    handleSubmit: function () {
        var msg = { text: this.refs.text.getDOMNode().value, user: this.props.name,
            time: (new Date()).toUTCString(), room: "room" + this.props.room };
        $.ajax({url: "/chat", type: "POST", data: JSON.stringify(msg),
            contentType:"application/json; charset=utf-8", dataType:"json"});
        this.refs.text.getDOMNode().value = ""; // empty text field
        return false;
    },
    render: function () { return (
        <div id="footer">
            <form onSubmit={this.handleSubmit}>
                <input type="text" id="textField" ref="text" placeholder="Say something" className="input-block-level" />
                <input type="button" className="btn btn-primary" value="Submit" onClick={this.handleSubmit} />
            </form>
        </div>
     );}
});
{% endcodeblock %}

In the **SaySomethingBox** component, two things happen:
+ The ***render*** function renders the UI and attaches the ***handleSubmit*** function to the events fired by either submitting the form by pressing enter inside the ```<input>``` element or clicking the submit button.
+ The ***handleSubmit*** function POSTs the text in the ```<input>``` field to the server using jQuery's ```$.ajax``` function. It uses the **name** and **room** from **props** to construct the JSON message. The message POSTing logic could just as well live inside the top level component, maybe it should, but I don't feel like changing it right now.

That's pretty much it, with one last function call to get the whole application started:

{% codeblock React.renderComponent lang:javascript https://github.com/matthiasn/sse-chat/blob/6ee4f3de7076c2a9ac39ab75f62d95062df04ede/public/js/react-app.js react-app.js %}
/** render top-level ChatApp component */
React.renderComponent(<ChatApp />, document.getElementById('chat-app'));
{% endcodeblock %}

##Conclusion
**[React](http://facebook.github.io/react)** offers an intriguing way of rendering potentially immutable data into a virtual DOM with every single change of the data. This virtual DOM will then be diffed against the current DOM (or, more likely, the previous version of the virtual DOM, but just guessing there) and then only the changes are performed on the real DOM, limiting the supposedly slow DOM manipulations to an absolute minimum. I have yet to convince myself about this, but reportedly this whole process is very fast, allowing for 60 FPS even in a mobile WebView, with JavaScript performaning a lot worse than in "real" browsers such as Mobile Safari, Mobile Chrome and any recent Desktop browser. React is also conceptually very simple; there are not a lot of things to understand. However I do feel that I need to develop better ideas on how to structure a larger application.

So far all this may sound like a lot of praise for React, but let me emphasize where **AngularJS** really has the edge at this point:

+ Workable best practices for organizing large applications.
+ Many more online resources. I don't feel much love for Angular's own documentation, but at least there are plenty of great tutorials and blog articles about it out there.
+ Reasonably mature support for automated building and testing.

So, will I continue using AngularJS? **Yes**. Am I curious about doing more with React? **Another yes**. I need a larger project in order to experience React in a more complex setting. Oh, there's one project that comes to mind, but that's a story for another day. Before I forget: you can find the source code for the application on **[GitHub](https://github.com/matthiasn/sse-chat)**.

Cheers,
Matthias

<iframe width="160" height="400" src="https://leanpub.com/building-a-system-in-clojure/embed" frameborder="0" allowtransparency="true"></iframe>