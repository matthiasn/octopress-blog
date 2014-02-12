---
layout: post
title: "Scala.js and ReactJS"
date: 2014-01-24 12:45
comments: true
categories: 
---
In this article I will present a simple reactive web application using **[Scala.js](http://www.scala-js.org)** and **[ReactJS](http://facebook.github.io/react/)** on the client side. It is based on **[sse-chat](https://github.com/matthiasn/sse-chat)**, an application I initially wrote for demonstrating the use of **[AngularJS with Play Framework](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)**. I then rewrote the client for an article about **[using ReactJS on the client side](http://matthiasnehlsen.com/blog/2014/01/05/play-framework-and-facebooks-react-library/)**. In the latest version now, there is an additional client that connects to the same server and utilizes Scala.js to build the web client. I recently gave a talk about this at Ping Conference in Budapest, **[check it out](http://m.ustream.tv/recorded/42780242)** if you're interested. I discovered ReactJS through **[David Nolen's blog](http://swannodette.github.io/2013/12/17/the-future-of-javascript-mvcs/)** and his excellent **[OM library](https://github.com/swannodette/om)** which combines ReactJS with **[ClojureScript](https://github.com/clojure/clojurescript)**. His **[second article on Om](http://swannodette.github.io/2013/12/31/time-travel/)** also inspired me to try out an **undo** functionality with the immutable data structures that Scala.js has to offer. For learning more about ReactJS, I recommend going through the **[tutorial](http://facebook.github.io/react/docs/tutorial.html)** and also reading my last **[blog post](http://matthiasnehlsen.com/blog/2014/01/05/play-framework-and-facebooks-react-library/)**. 

<!-- more -->

# Why would someone want Scala on the client in the first place?
Great question, I am glad you asked. A couple of things come to my mind:

* If you work with Scala on the server side, you will be familiar with its powerful collection library. You will be able to use it instead of wrapping your head around stuff like **[underscore](http://underscorejs.org)**. Nothing wrong with underscore, it just adds to the things we have to think about when writing an application.

* JavaScript, while being powerful in its own right, is quite different from Scala. If you are working in Scala on the backend anyways, you can avoid context switches. These inevitably occur when going back and forth between Scala and JavaScript.

* Immutable data structures are powerful and make reasoning about an application much more straightforward. Implementing an **undo** functionality becomes almost trivial with this approach.

Here is the new client in action. Note that **undo** will revert the application state by one step (including name changes and such). **Undo all** will go through all steps until the beginning of time at a fast pace.

<iframe width="420" height="600" src="http://sse-chat.matthiasnehlsen.com/react-scalajs-opt" frameborder="0"></iframe>

<br />
<br />

# Architectural Overview
The server side has stayed the same with the different clients. All clients (AngularJS, ReactJS, ReactJS and Scala.js) co-exist in the same project on **[GitHub](https://github.com/matthiasn/sse-chat)**. I would like to refer you to **[this article](http://matthiasnehlsen.com/blog/2013/06/23/angularjs-and-play-framework/)** if you want to learn more about the server side. From the client's perspective, there is a **[Server Sent Event](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events)** stream of messages for a particular chat room that the client subscribes to via an **[EventSource](http://www.w3.org/TR/2011/WD-eventsource-20110208/)** object. New messages are POSTed using an **[XmlHttpRequest](http://de.wikipedia.org/wiki/XMLHttpRequest)** object (facilitated by **[jQuery](http://jquery.com/)**). Users can change their names, they can select the chat room and they can submit messages to the chat room they are connected to. Romeo and Juliet are having a conversation in room 1, just to make it a little more interesting to watch. 

{% img left /images/sse-chat-scalajs.png %}

Application state is represented by a Scala **[Case Class](http://www.scala-lang.org/old/node/107)**. A case class object stores the current name of the user, the name of the room and the last 4 messages. The undo functionality is modeled through a **Stack**. Each time information changes, a copy of the head of the stack is made and a new version of the application state with the desired change is pushed on top of the stack. Thus going back in time becomes easy: the combination of pop and peek will go back one step in time. Remember that a **[Stack](http://en.wikibooks.org/wiki/Data_Structures/Stacks_and_Queues)** is a **LIFO** (last-in-first-out) data structure that typically offers *push* for putting a new item on top of a stack, *pop* for removing the top element (with potentially consuming it) and *peek* or *top* for accessing the top element without removing it. In Scala's stack *peek* is called *head* as a more general abstract term to get the first element of a collection.

Application state, in its current version, is passed to ReactJS for full render every single time something changes. This may sound like a lot of overhead if React completely re-rendered the DOM every single time. Luckily, it does not need to do that. Instead it utilizes a fast **[Virtual DOM](http://facebook.github.io/react/index.html)**. It then diffs subsequent version of this virtual DOM and only manipulates the actual browser DOM where changes have occurred. This is really fast. If you run the chat app demo above for a while (or interact with it multiple times) so that the stack contains sufficient elements (hundreds), you should see changes in the browser at a full **60 frames per second**. 

{% img left /images/undo-all-60fps.png 'images' 'images'%}

React's rendering performance can still be optimized, ut it runs fine at 60 fps as it is. **Tip: You want 60fps** in your application all the time, otherwise the user may experience jerky and overall unpleasant scrolling if anything that happens takes longer than the time between each frame. For 60fps that means every action must be finished within 16ms, preferably faster.

# Source Code
So without further ado, let's have a look at how to implement the client side chat functionality. What I suggest here is probably far from ideal, but it's a start. Please let me know about improvements you think should be made, ideally as a pull request.

First we will look at the main application logic:

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


First of all, the following is happening:

+ There is a case class for capturing each individual step of the application state.

+ A stack takes care of managing a history of application states. This stack is aware of changes. When such a change occurs, it will call the function specified upon initialization, in this case *InterOp.triggerReact*.

+ Undo pops the application state representation on top of the stack, causing *triggerReact* with the previous state.

+ *UndoAll* steps through the entire history until application startup.

+ Setters obtain the top of the stack, copy and modify it and push the result on top of the stack (again causing a re-render). 

+ Finally, in *main*  the application is initialized by starting the SSE connection.

Next there is the **InterOp** file:

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

Let's go through this file step by step:

+ **ChatMsgTrait** represents an individual message.

+ The **SseChatApp** object represents a JavaScript object outside the Scala.js application. This makes the specified functions available from Scala.js code.

+ The **InterOp** object itself contains functions that are exported so that they are accessible from the outside world. We will look at the export mechanism below. As an example of such an exported function, *setUser* allows the ReactJS application to call the App.setRoom function. 

Next we have the change-aware stack implementation: 

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

This implementation is straightforward:

+ **ChangeAwareStack[T]** extends **scala.collection.mutable.Stack[T]** and takes a function that is called when the data on the stack changes.

+ *push* and *pop* are overridden, calling the function each overrides plus additionally calling the onChange functions.

+ *peek* is just another name for *head*.

+ Finally a companion object allows instantiation without using **new**.

Functions from the **InterOp** object are then exported with specified names; this happens in order to protect their respective names. Otherwise, the **[Google Closure Compiler](https://developers.google.com/closure/compiler/)** would rename them. Without exporting the functions, they would also not be publicly accessible at all after the closure compiler optimization phase.

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

Besides naming the exported functions by putting them in an object on the global scope, there is also a call to the *main* method of the Scala.js application. Personally, I am not terribly happy with putting anything at all on the global scope. Right now I have two global objects, one for the React side of things and one for the exported functions from the Scala.js application. This could quite easily be brought down to one by exporting the functions as properties of the same object used by the ReactJS application. I am just too lazy to do this right now. Please let me know if you have any ideas on how to reduce this to zero objects on the global scope. 

Now let's have a look at an excerpt of the ReactJS application, written in JSX. Please note that for simplicity reasons I am running the JSX to JavaScript in your browser. You don't want to do that in a production system. 

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

+ **UndoBox** is one of the application's components, handling the undo functionality described above. All it does is assigning handlers to the buttons, in which the functions passed in as props are called.

+ **ChatApp** is the main component of the application, it wires together the individual components and passes through the individual props.

+ **tlComp** is the rendered top level component. In this call, we specify where to render the component and we also pass in the handler functions as props.

+ *SseChat.setProps* is the function that passes props to the top level component. Once the JSX is compiled and initialized, this will replace the placeholder function inside react-interop.js.

+ At the end of the file, *ScalaApp.triggerReact* is called. This is done only to render the initial state (with a random name) independent of a message sent by the server. It just makes the initial rendering a bit smoother; otherwise it will not be needed.

Finally, we have some JavaScript code for interoperability and communication with the server side:

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

+ *listen* is a function that is called for establishing a Server Sent Event connection to the server. Upon file loading, a self calling function closes over the ChatFeed variable so that it becomes accessible (and cancellable) on subsequent calls. This self-call then returns the actual function that allows establishing (and replacing) a connection to the stream for a particular room.

+ *submitMsg* **POST**s a message to the server.

+ There are multiple functions setting props in the top level ReactJS component, such as *SseChatApp.setMsgsProps*. *SseChatApp.setProps* is a placeholder, it gets replaced once the JSX compiler has run and the ReactJS application has been loaded (see above).

# Conclusion
Scala.js is an interesting approach for client side development and certainly a technology to watch, particularly when you are working with **[Scala](http://www.scala-lang.org/)** on the server side anyhow. It is still in the experimental phase, so I probably won't have the Next Big Thing depend on it yet, but it may get there if there is enough interest in the community. 

**[ReactJS](http://facebook.github.io/react/)** is a library I already fully recommend. Working with it has been a breeze so far and it took a lot less time to get familiar with its features in comparison to **[AngularJS](http://angularjs.org/)**. Its approach to immutable data is very natural for a functional programmer. 
It is great to only have to think about components and then be able to build your application around that in the way you like it, instead of being forced to stick to a prescribed way of doing things. 

I hope you found this useful; as always let me know what you think.

Until next time,
Matthias

*Want to be informed about new articles => **[newsletter](#signup)**.*