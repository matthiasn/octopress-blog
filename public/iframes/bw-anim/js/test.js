document.getElementById("bw-omni").addEventListener("load", function() {
    var birdwatchAnim = new TimelineMax({'paused': true });

    var doc = this.getSVGDocument();
     id4Graphic = doc.querySelector("#id4_Graphic"); // suppose our image contains a <rect>
    
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

//    <object id="bw-omni" type="image/svg+xml" data="BirdWatch.svg"></object>
