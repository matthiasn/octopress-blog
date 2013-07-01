---
layout: post
title: "AngularJS and Play Framework"
date: 2013-06-23 14:36
comments: true
categories: 
---
I felt a sudden urge to write a **[chat application](http://bit.ly/sse-chat-github)** during **[Scala Days](http://scaladays.org)**. Writing the server side code in **[Scala](http://www.scala-lang.org)** was fun and only took like 30 minutes. The JavaScript part was not nearly as gratifying. Changing the client to **[AngularJS](http://angularjs.org)** over the last couple of days allowed me to reclaim client side development joy. **UPDATE 06/27/2013:** Here is how it looks like. **[Deploy it yourself](https://github.com/matthiasn/sse-chat/)** if you want full chat functionality.

<iframe width="420" height="425" src="http://birdwatch2.matthiasnehlsen.com:9001/" frameborder="0" allowfullscreen></iframe>

<!-- more -->

There should be actors randomly reciting Romeo and Juliet in Room 1 above if everything is working, but that's not our problem right now. Last month I was writing about **[Server Sent Events vs. WebSockets](http://matthiasnehlsen.com/blog/2013/05/01/server-sent-events-vs-websockets/)** and decided to go with SSE for my **[BirdWatch](http://bit.ly/BirdWatch)** application. In that application information only flows from server to the client though so I wanted a proof of concept that REST style calls are an appropiate way to communicate back with the server.
 
I challenged myself to write a chat server for this purpose, with 10 lines of code on the server side (or less). I knew this would be possible thanks to the awesome **[Play Iteratee library](http://www.playframework.com/documentation/2.1.1/Iteratees)**:

{% codeblock Chat Controller lang:scala https://github.com/matthiasn/sse-chat-example/blob/6d39660cca26ce089c6c80238a155ce6610b3684/app/controllers/ChatApplication.scala ChatApplication.scala %}
object ChatApplication extends Controller {
  /** Central hub for distributing chat messages */
  val (chatOut, chatChannel) = Concurrent.broadcast[JsValue]

  /** Controller action serving chat page */
  def index = Action { Ok(views.html.index("Chat using Server Sent Events")) }

  /** Controller action for POSTing chat messages */
  def postMessage = Action(parse.json) { req => chatChannel.push(req.body); Ok }

  /** Enumeratee for filtering messages based on room */
  def filter(room: String) = Enumeratee.filter[JsValue] { 
    json: JsValue => (json \ "room").as[String] == room 
  }

  /** Controller action serving activity based on room */
  def chatFeed(room: String) = Action { 
    Ok.stream(chatOut &> filter(room) &> EventSource()).as("text/event-stream") 
  } 
}
{% endcodeblock %}

What happens here is fairly straightforward once we look at the drawing:

{% img left /images/sse-chat.png 'image' 'images' %}

The **[Concurrent object](https://github.com/playframework/Play20/tree/2.1.0/framework/src/iteratees/src/main/scala/play/api/libs/iteratee/Concurrent.scala)** is the central information hub which provides us with a channel to push JSON into. The messages from all clients are pushed into the chatChannel **[Broadcaster](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Concurrent$$Broadcaster)**. The individual streaming connections then attach an Iteratee to the provided chatOut **[Enumerator](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Enumerator)**, with **[Enumeratees](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Enumeratee)**  in between.

What is an **[Iteratee](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Iteratee)**? An Iteratee is a function that represents a single step of an ongoing computation. Any state it might have is immutable; supplying input results in a new function / a new Iteratee. This ongoing computation is driven by an Enumerator which keeps track of the latest step. The Enumerator calls the associated Iteratee function with new input when available and then stores that resulting Iteratee (and so on). The way state is handled is somewhat comparable to a fold function that holds intermediate state in an accumulator using an immutable data structure, with the difference here being that the computation can run over an infinite stream. 

**[Enumeratees](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.libs.iteratee.Enumeratee)** are adapters between Enumerators and Iteratees. They allow for example type transformation or filtering. The filter Enumeratee makes sure input is only used when the input matches the criteria, which here is the message being for the correct chat room for a particular stream / client connection. EventSource provides a transforming Enumeratee for wrapping chunks as Server Sent Events.

In the **chatFeed** function we have a chain of Enumerator and two Enumeratees: **chatOut &> filter(room) &> EventSource()** which results in a composed Enumerator. We pass this composed Enumerator into Ok.stream, which internally connects the Enumerator with a simple Iteratee. This simple Iteratee does not hold intermediate state, it only does something for each input item: deliver it as a chunk of bytes to the client over the open HTTP connection.

Let's visualize this:

{% img left /images/sse-chat2.png 'image' 'images' %}

A message is pushed into the chatChannel and distributed to all attached Iteratees (wrapped by the filter Enumeratee and the EventSource). The message is then sent to the client as a Server Sent Event, but only if the filter predicate evaluates to true.

#AngularJS Client
I wrote an **[initial version](https://github.com/matthiasn/sse-chat/blob/0af191e628a450ca8fd4d41bcbff382011cd0a13/app/assets/javascripts/main.js)** using jQuery to manipulate the DOM. It worked fine, just getting there wasn't really much fun at all. I would have liked the expressive greatness of **[templates in Play](http://www.playframework.com/documentation/2.1.1/ScalaTemplates)**, but without having to reload the page every time the model changes.

Last week I started learning AngularJS, so I thought I'd give it a try. The resulting code is not only more than 30% smaller, it also also is a real pleasure to work with. Dynamic views are written in an extended HTML vocabulary which attaches elements on the page to the $scope, which can be seen as the ViewModel of the application. The views are then automatically updated when the associated data changes. 

{% codeblock AngularJS Chat View lang:html https://github.com/matthiasn/sse-chat/blob/6d39660cca26ce089c6c80238a155ce6610b3684/app/views/index.scala.html index.scala.html %}
<div ng-controller="ChatCtrl">
    <div id="header">
        Your Name: <input type="text" name="user" id="userField" value="John Doe" 
          ng-model="user" />
        <select ng-model="currentRoom" ng-change="setCurrentRoom(currentRoom)" 
          ng-options="r.name for r in rooms"></select>
    </div>

    <div id="chat">
        <div class="{{msg.who}} msg" ng-repeat="msg in msgs | limitTo:-10"
        ng-class="msg.user !== user ? 'others' : ''"
        data-ng-show="hidden == false" data-ng-hide="hidden == true"
        data-ng-animate="'fadeIn'">{{msg.time}}<br/>
            <strong>{{msg.user}} says: </strong>{{msg.text}}<br/>
        </div>
    </div>

    <div id="footer">
        <form ng-submit="submitMsg()">
            Say something: <input type="text" name="chat" id="textField" 
              ng-model="inputText" />
            <input type="button" id="saySomething" value="Submit" 
              ng-click="submitMsg()" />
        </form>
    </div>
</div>        
{% endcodeblock %}

The latest 10 items within **$scope.msgs** are rendered into the "chat" div above. The color of each div is also defined in the view by testing if the current user is the sender of the message and adding css class 'others' if not. No more direct DOM manipulation. Very nice.

{% codeblock AngularJS Chat Controller lang:javascript https://github.com/matthiasn/sse-chat/blob/6d39660cca26ce089c6c80238a155ce6610b3684/app/assets/javascripts/controllers.js controllers.js %}
/** Controllers */
angular.module('sseChat.controllers', ['sseChat.services']).
    controller('ChatCtrl', function ($scope, $http, chatModel) {
        $scope.rooms = chatModel.getRooms();
        $scope.msgs = [];
        $scope.inputText = "";
        $scope.user = "Jane Doe #" + Math.floor((Math.random() * 100) + 1);
        $scope.currentRoom = $scope.rooms[0];

        /** change current room, restart EventSource connection */
        $scope.setCurrentRoom = function (room) {
            $scope.currentRoom = room;
            $scope.chatFeed.close();
            $scope.listen();
        };

        /** posting chat text to server */
        $scope.submitMsg = function () {
            $http.post("/chat", { text: $scope.inputText, user: $scope.user,
                time: (new Date()).toUTCString(), room: $scope.currentRoom.value });
            $scope.inputText = "";
        };

        /** handle incoming messages: add to messages array */
        $scope.addMsg = function (msg) { 
            $scope.$apply(function () { $scope.msgs.push(JSON.parse(msg.data)); });
        };

        /** start listening on messages from selected room */
        $scope.listen = function () {
            $scope.chatFeed = new EventSource("/chatFeed/" + $scope.currentRoom.value);
            $scope.chatFeed.addEventListener("message", $scope.addMsg, false);
        };

        $scope.listen();
    });
{% endcodeblock %}

The **$scope** is managed by **[AngularJS](http://angularjs.org)** and we declare its properties inside the controller, for example **$scope.msgs** as an empty array. Whenever new messages come in, they are appended to the array, automagically updating the view. Note that manipulations to the data structure that are not triggered by AngularJS itself must be wrapped in an **apply()** call in order to update the UI. That was one of the valuable lessons I learned.

I have to say I am really impressed by AngularJS, it is a great addition to my toolbox. I now feel that client side development will be as much fun as server side development already is with Play Framework. I will probably use this newly gained knowledge in the next version of the **[BirdWatch](http://bit.ly/BirdWatch)** application.

If you enjoyed this post, then make sure you subscribe to my **<a href="http://eepurl.com/y0HWv" target="_blank">Newsletter</a>**. Oh and please leave a comment particularly if you find anything in this article to be unclear or imprecise.

Thanks, until next time!

-Matthias