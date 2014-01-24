---
layout: post
title: "Scala.js and ReactJS - Part 1"
date: 2014-01-23 12:45
comments: true
categories: 
---
In this article I will present my attempt at writing a reactive web application using **[Scala.js](http://www.scala-js.org)** and **[ReactJS](http://facebook.github.io/react/)** on the client side. It is based on **[sse-chat](https://github.com/matthiasn/sse-chat)**, an application I initially wrote for demonstrating the usage of **[AngularJS with Play Framework](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)**. I then rewrote the client for an article about **[using ReactJS on the client side](http://matthiasnehlsen.com/blog/2014/01/05/play-framework-and-facebooks-react-library/)**. In the latest version now, there is an additional client that connects to the same server and uses utilizes Scala.js for building the web client. I recently gave a talk about this at Ping Conference in Budapest, **[check it out](http://m.ustream.tv/recorded/42780242)** if you're interested. I discovered ReactJS through **[David Nolen's blog](http://swannodette.github.io/2013/12/17/the-future-of-javascript-mvcs/)** and his excellent **[OM library](https://github.com/swannodette/om)**, which combines ReactJS with **[ClojureScript](https://github.com/clojure/clojurescript)**. His **[second article on Om](http://swannodette.github.io/2013/12/31/time-travel/)** also inspired me to try out an undo functionality with the immutable data structures that Scala.js has to offer. For learning more about ReactJS, I recommend going through the **[tutorial](http://facebook.github.io/react/docs/tutorial.html)** and also reading my last **[blog post](http://matthiasnehlsen.com/blog/2014/01/05/play-framework-and-facebooks-react-library/)**. 

<!-- more -->

# Why would someone want Scala on the client in the first place?
Great question, I am glad you asked. A couple of things come to my mind:

* If you work with Scala on the server side, you will be familiar with its powerful collection library. You will be able to use it instead of wrapping your head around stuff like **[underscore](http://underscorejs.org)**. Nothing wrong with underscore, it just adds to the things we have to think about when writing an application.

* JavaScript, while being very powerful in its own right, is quite different from Scala. If you are working in Scala on the backend anyways, you could avoid context switches that would inevitably occur when going back and forth between Scala and JavaScript.

* Immutable data structures are a powerful thing that make reasoning about an application much more straightforward. Implementing an an undo functionality becomes almost trivial with this approach, as I will try to show you in this article.

Here is how the client looks like in action. Note that **undo** will revert the application state by one step (including name changes and such), whereas **undo all** will very quickly go through all steps until the beginning of time.

<iframe width="420" height="550" src="http://sse-chat.matthiasnehlsen.com/react-scalajs-opt" frameborder="0"></iframe>

<br />
<br />

# Architectural Overview
The server side has remained the same with all different clients (AngularJS, ReactJS, ReactJS and Scala.js) and all clients co-exist in the same project on **[GitHub](https://github.com/matthiasn/sse-chat)**. I would like to refer you to **[this article](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)** if you want to learn more about the server side. From the client's perspective, there is a **[Server Sent Event](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events)** stream of messages for a particular chat room that the client subscribes to via an **[EventSource](http://www.w3.org/TR/2011/WD-eventsource-20110208/)** object. New messages are POSTed using an **[XmlHttpRequest](http://de.wikipedia.org/wiki/XMLHttpRequest)** object (facilitated by **[jQuery](http://jquery.com/)**). Users can change their name, they can select the chat room and they can submit messages into the chat room they are connected to. Romeo and Juliet are having a conversation in room 1, just to make it a little more interesting to watch. 





{% img left /images/sse-chat-scalajs.png %}

Application state is modeled through a Scala case class that holds the current name of the user, the name of the room and the last 4 messages. The undo functionality is modeled through a Stack. Every time some information changes, a copy of the head of the stack is made and a new version of the application state with the desired change pushed on top of the stack. Thus going back in time becomes easy: the combination of pop and peek will go back one step in time. Remember that a **[stack](http://en.wikibooks.org/wiki/Data_Structures/Stacks_and_Queues)** is a LIFO (last-in-first-out) data strucure that typically offers *push* for putting a new item on top of a stack, *pop* for removing the top element (with potentially consuming it) and *peek* or *top* for accessing the top element without removing it. In Scala peek is called head as a more general abstraction for getting the first element of a collection.

Application state, in its current version / incarnation, is passed to ReactJS for full render every single time somthing changes. This might sound like a lot of overhead if React completely and potentially expensively re-rendered the DOM every single time. Luckily, it does not do that. Instead it has a fast virtual DOM, which it uses for diffing versions of the (virtual) DOM and only manipulates the actual browser DOM where changes have occured. This is really fast. If you let the chat app demo above run for a while (or interact with it multiple times) so that the stack contains sufficiently many elements, you should see changes in the browser at a full 60 frames per second. There are optimization that can still be made in terms of React's rendering performance, but this runs fine at 60 fps without. Please note that for simplicity I am running the JSX to JavaScript in your browser. You don't want to do that in a production system. 

# Source Code
So without further ado, let us have a look at the code I have come up with so far for implementing the client side chat functionality. I am very certain it is far from ideal at this point but you may find it interesting nonetheless.









{% codeblock Main Application lang:scala https://github.com/matthiasn/sse-chat/blob/71081d0978eed13cf1e1a896c3c69e011bcbff15/scala-js/src/main/scala/com/matthiasnehlsen/sseChat/SseChat.scala SseChat.scala %}
package com.matthiasnehlsen.sseChat

/** current version of application state modeled as immutable case class */
case class AppState(user: String, room: String, msgs: Vector[ChatMsgTrait])

object App {
  /** Application state history modeled as stack. New versions of state get pushed onto stack.
   *  Previous states are available with a combination of pop and peek (called head in Scala implementation) */
  val stack = ChangeAwareStack[AppState](InterOp.triggerReact)
  stack.push(Utils.getInitialState)

  /** undo state change by popping stack and trigger rendering (which reads the head) */
  def undo(all: Boolean = false): Unit = if (stack.size > 1) stack.pop()

  /** perform undo repeatedly until only initial element left, with interval duration between steps */
  def undoAll(interval: Int): Unit = {
    if (stack.size > 1) {
      undo()
      InterOp.setTimeout( () => undoAll(interval), interval)
    }
  }

  /** functions generating new version of state which are then pushed onto stack using updateState() */
  def setUser(name: String) = stack.push(stack.peek.copy(user = name))
  def addMsg(msg: ChatMsgTrait) = stack.push(stack.peek.copy(msgs = stack.peek.msgs.takeRight(3) :+ msg))

  def setRoom(newRoom: String) = {
    stack.push(stack.peek.copy(room = newRoom))
    SseChatApp.listen(stack.peek.room, InterOp.addMsg _)
  }

  def main(): Unit = SseChatApp.listen(stack.peek.room, InterOp.addMsg _)
}
{% endcodeblock %}







{% codeblock InterOp lang:scala https://github.com/matthiasn/sse-chat/blob/71081d0978eed13cf1e1a896c3c69e011bcbff15/scala-js/src/main/scala/com/matthiasnehlsen/sseChat/InterOp.scala InterOp.scala %}
package com.matthiasnehlsen.sseChat

import scala.scalajs.js
import js.Dynamic.{ global => g }

trait ChatMsgTrait extends js.Object {
  var text: js.String = ???
  var user: js.String = ???
  var time: js.String = ???
  var room: js.String = ???
}

/** Scala representation of SseChatApp JavaScript object holding the JS side of the app */
object SseChatApp extends js.Object {
  def submitMessage(msg: ChatMsgTrait): Unit = ???
  def listen(room: String, handler: js.Function1[ChatMsgTrait, Unit]): Unit = ???
  def setUserProps(user: String): Unit = ???
  def setRoomProps(room: String): Unit = ???
  def setMsgsProps(msgs: js.Array[ChatMsgTrait]): Unit = ???
  def setStackSizeProps(stackSize: String): Unit = ???
  def setApp(interOp: InterOp.type): Unit = ???
}

/** methods of this object are individually exported in startup.js (to avoid having the closure compiler rename them) */
object InterOp {
  def addMsg(msg: ChatMsgTrait): Unit = App.addMsg(msg)

  def triggerReact(): Unit = {
    val state = App.stack.peek
    SseChatApp.setUserProps(state.user)
    SseChatApp.setRoomProps(state.room)
    SseChatApp.setMsgsProps(state.msgs.toArray[ChatMsgTrait])
    SseChatApp.setStackSizeProps(App.stack.size.toString)
  }

  def setUser(user: String): Unit = App.setUser(user.toString)
  def setRoom(room: String): Unit = App.setRoom(room)

  def submitMsg(msg: ChatMsgTrait) = {
    msg.room = App.stack.peek.room
    msg.user = App.stack.peek.user
    SseChatApp.submitMessage(msg)
  }

  def undo(): Unit = App.undo()
  def undoAll(interval: String): Unit = App.undoAll(interval.toInt)

  def setTimeout(fn: () => Unit, millis: Int): Unit = g.setTimeout(fn, millis)
}
{% endcodeblock %}




{% codeblock Stack implementation lang:scala https://github.com/matthiasn/sse-chat/blob/71081d0978eed13cf1e1a896c3c69e011bcbff15/scala-js/src/main/scala/com/matthiasnehlsen/sseChat/ChangeAwareStack.scala ChangeAwareStack.scala %}
package com.matthiasnehlsen.sseChat

import scala.collection.mutable.Stack
// custom stack implementation based on mutable Stack for any type T
// takes callback function argument, which it will call on changes with the current head after the change
class ChangeAwareStack[T](onChange: () => Unit) extends Stack[T] {

  override def push(elem: T) = {
    val res = super.push(elem)
    onChange()
    res
  }

  override def pop() = {
    val res = super.pop()
    onChange()
    res
  }

  def peek = super.head  // convenience method since stack implementation does not implement peek()
}

object ChangeAwareStack {
  def apply[T](onChange: () => Unit) = new ChangeAwareStack[T](onChange)

}
{% endcodeblock %}




{% codeblock Exported Functions lang:javascript https://github.com/matthiasn/sse-chat/blob/71081d0978eed13cf1e1a896c3c69e011bcbff15/scala-js/js/startup.js startup.js %}
ScalaJS.modules.com_matthiasnehlsen_sseChat_App().main();

var ScalaApp = {};
ScalaApp.InterOp = ScalaJS.modules.com_matthiasnehlsen_sseChat_InterOp();

ScalaApp["setUser"] = ScalaApp.InterOp.setUser__T__V;
ScalaApp["setRoom"] = ScalaApp.InterOp.setRoom__T__V;
ScalaApp["undo"] = ScalaApp.InterOp.undo__V;
ScalaApp["undoAll"] = ScalaApp.InterOp.undoAll__T__V;
ScalaApp["submitMsg"] = ScalaApp.InterOp.addMsg__Lcom_matthiasnehlsen_sseChat_ChatMsgTrait__V;
ScalaApp["triggerReact"] = ScalaApp.InterOp.triggerReact__V;

window['ScalaApp'] = ScalaApp;
{% endcodeblock %}




{% codeblock ReactJS application (excerpt) lang:javascript https://github.com/matthiasn/sse-chat/blob/71081d0978eed13cf1e1a896c3c69e011bcbff15/public/js/react-app-scalajs.js react-app-scalajs.js %}
/** undo component*/
var UndoBox = React.createClass({
    handleUndo: function () { this.props.scalaApp.undo(); },
    handleUndoAll: function () { this.props.scalaApp.undoAll(10); },
    render: function () { return (
        <div className="undo">
            <input type="button" className="btn" value="Undo" onClick={this.handleUndo} />
            <input type="button" className="btn" value="Undo All" onClick={this.handleUndoAll} />
            <span> Stack size:  {this.props.undoSize}</span>
        </div>
     );}
});

/** ChatApp is the main component in this application, it holds all state, which is passed down to child components
 *  only as immutable props */
var ChatApp = React.createClass({
    handleNameChange: function (event) { this.props.scalaApp.setUser(event.target.value) },
    handleRoomChange: function (event) { this.props.scalaApp.setRoom(event.target.value); },
    render: function () { return (
        <div>
            <UndoBox scalaApp={this.props.scalaApp} undoSize={this.props.stackSize}/>
            <NameRoomBox name={this.props.user} handleNameChange={this.handleNameChange}
            room={this.props.room} handleRoomChange={this.handleRoomChange} />
            <MsgList data={this.props.msgs} name={this.props.user}/>
            <SaySomethingBox scalaApp={this.props.scalaApp}/>
        </div>
    );}
});

/** render top-level ChatApp component */
var tlComp = React.renderComponent(<ChatApp scalaApp={ScalaApp}/>, document.getElementById('chat-app'));

/** pass props to top level component */
SseChatApp.setProps = function (props) { tlComp.setProps(props); };

/** application ready, call initial trigger so that name and room get loaded without receiving message */
ScalaApp.triggerReact();
{% endcodeblock %}






{% codeblock ReactJS application (excerpt) lang:javascript https://github.com/matthiasn/sse-chat/blob/71081d0978eed13cf1e1a896c3c69e011bcbff15/public/js/react-interop.js react-interop.js %}
var SseChatApp = SseChatApp || {};

SseChatApp.listen = function () {
    var chatFeed; // holds SSE streaming connection for chat messages for current room
    return function (room, handler) { // returns function that takes room as argument
        if (chatFeed) {
            chatFeed.close();
        } // if initialized, close before starting new connection
        chatFeed = new EventSource("/chatFeed/" + room); // (re-)initializes connection
        chatFeed.addEventListener("message", function (msg) {
            handler(JSON.parse(msg.data));
        }, false); // attach addMsg event handler
    }
}();

/** POST chat message */
SseChatApp.submitMessage = function (msg) {
    $.ajax({ url: "/chat", type: "POST", data: JSON.stringify(msg),
        contentType: "application/json; charset=utf-8", dataType: "json" });
};

/** placeholder until replaced with real implementation upon compiling / initializing JSX */
SseChatApp.setProps = function (props) {};

/**
 * individual setProps because otherwise the closure compiler renamed function names on application state
 * case class object (would be more elegant with a single case class object)
 */
SseChatApp.setUserProps      = function (user)      { SseChatApp.setProps({ user: user }); };
SseChatApp.setRoomProps      = function (room)      { SseChatApp.setProps({ room: room }); };
SseChatApp.setMsgsProps      = function (msgs)      { SseChatApp.setProps({ msgs: msgs }); };
SseChatApp.setStackSizeProps = function (stackSize) { SseChatApp.setProps({ stackSize: stackSize }); };
{% endcodeblock %}











# Conclusion
Scala.js is an interesting approach for client side development for sure and certainly a technology to watch. It is still in experimental phase, so I probably wouldn't have the Next Big Thing depend on it, but it might get there if there is enough interest from the community. 

**[ReactJS](http://facebook.github.io/react/)** is something I would already fully recommend. Working with it has been a breeze and it took much less time to feel familiar with what it can do in comparison to **[AngularJS](http://angularjs.org/)**. It's approach to immutable data feels very natural for a functional programmer. 
It is great to only have to think about components and then be able to build your application around it the way you like, instead of much more being forced into a precribed way of doing things.
