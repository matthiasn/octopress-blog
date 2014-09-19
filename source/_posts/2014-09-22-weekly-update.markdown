---
layout: post
title: "Weekly Update: "
date: 2014-09-22 19:06
comments: true
categories: 
---
In this weekly update, I will just give you a very brief update on what I've been doing. Most notably, I have refactored the **[Clojure](http://clojure.org)** version of my **[BirdWatch](https://github.com/matthiasn/BirdWatch)** application to use Stuart Sierra's **[component library](https://github.com/stuartsierra/component)**. Other than that, I am calling in sick for the week. 

<!-- more -->

<script src="http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js"/></script>

<script type="text/javascript">
document.getElementById("bw-omni").addEventListener("load", function() {
    var birdwatchAnim = new TimelineMax({'paused': true });

    alert("hello")
    var doc = this.getSVGDocument();
     id4Graphic = doc.querySelector("#id4_Graphic");
    
    birdwatchAnim.add(new TweenMax(id4Graphic, 2.5, {
        x: -250,
        y: 250,
       // opacity: 0.5,

      //repeat: 1,
      //yoyo: true
    }));

    TweenLite.to(id4Graphic, 10, {x:-150, y:400});
    
    //birdwatchAnim.play().repeat(1).repeatDelay(2);
});    
</script>

<script language="javascript" type="text/javascript">
  function resizeIframe(obj) {
    obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
  }
</script>

<iframe width="100%;" src="/iframes/bw-anim/index.html" frameborder="0" scrolling="no" onload="javascript:resizeIframe(this);" ></iframe>

## Closing remarks
Okay, back to bed, I need to get rid of this nasty cold ASAP. I have stuff to do, other than coughing. The bugs came without invitation last week and now they don't seem inclined to leave. But on the upside, I went to the doctor today and he gave me a prescription for three different pharmaceuticals and assured me that I'll likely survive.

Have a great remaining week,
Matthias