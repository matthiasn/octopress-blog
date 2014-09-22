var doc = document.getElementById("bw-omni");
var id4Graphic = doc.querySelector("#id4_Graphic");
var id155Graphic = doc.querySelector("#id155_Graphic");

//TweenLite.ticker.fps(30);

var birdwatchAnim = new TimelineMax({'paused': true });
    
birdwatchAnim.add(new TweenMax(id4Graphic, 2.5, {
    x:-300, y:150
}));
birdwatchAnim.add(new TweenMax(id4Graphic, 1.5, {
    x: "+=100", y: "+=100"
}));
birdwatchAnim.add(new TweenMax(id4Graphic, 1.5, {
    x: "+=-100", y: "+=100"
}));
birdwatchAnim.add(new TweenMax(id4Graphic, 1.5, {
    x: "+=100", y: "+=100"
}));

birdwatchAnim.add(new TweenMax(id4Graphic, 2.5, {
    x:0, y:0, ease:Bounce.easeOut
}));

birdwatchAnim.add(new TweenMax(id155Graphic, 1.5, {
    x: -100
}));

birdwatchAnim.add(new TweenMax(id155Graphic, 1.5, {
    x: 0, ease:Bounce.easeOut
}));

birdwatchAnim.play()

/*birdwatchAnim.add(new TweenMax(id4Graphic, 2.5, {
    x: -250,
    y: 250,
    repeat: -1,
    repeatDelay: 2,
    yoyo: true
}));*/

//birdwatchAnim.play().repeat(-1).repeatDelay(2);
//birdwatchAnim.play()

//TweenLite.to(id4Graphic, 3, {x:-150, y:400, opacity: 0.6, ease:Bounce.easeOut});
//TweenLite.to(id4Graphic, 3, {x:-150, y:"+=40", ease:Bounce.easeOut});
//TweenLite.to(id4Graphic, 6, {x:-150, y:"+=80", ease:Bounce.easeOut});

//TweenLite.to(logo, 3, {left:"440px", ease:Bounce.easeOut});
