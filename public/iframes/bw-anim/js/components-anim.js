var doc = document.getElementById("bw-omni");
var http = doc.querySelector("#id532_Graphic");
var percolator = doc.querySelector("#id4_Graphic");
var persistence = doc.querySelector("#id528_Graphic");
var switchboard = doc.querySelector("#id529_Graphic");
var twitterclient = doc.querySelector("#id530_Graphic");
var communicator = doc.querySelector("#id531_Graphic");
var commChannels = doc.querySelector("#id533_Graphic");
var tcChannels = doc.querySelector("#id534_Graphic");
var persistenceChannels = doc.querySelector("#id535_Graphic");
var percChannels = doc.querySelector("#id536_Graphic");
var comment1 = doc.querySelector("#id540_Graphic");
var comment2 = doc.querySelector("#id541_Graphic");
var comment3 = doc.querySelector("#id543_Graphic");
var comment4 = doc.querySelector("#id542_Graphic");

var birdwatchAnim = new TimelineMax({onUpdate:updateSlider, repeatDelay: 3, repeat:-1});

birdwatchAnim
    .add(TweenMax.from(comment1,            1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(tcChannels,          1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(comment2,            1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(twitterclient,       1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(persistenceChannels, 1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(persistence,         1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(percChannels,        1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(percolator,          1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(commChannels,        1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(communicator,        1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.to(comment1,              2, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.to(comment2,              2, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(comment3,            1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(http,                1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.to(comment3,              2, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(comment4,            1, { delay:1,opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(switchboard,         1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.to(comment4,              2, { delay:2, opacity:0, ease:Power4.easeIn }));

birdwatchAnim.play();

$("#slider").slider({
    range: false,
    min: 0,
    max: 1,
    step:0.001,
    slide: function ( event, ui ) {
        birdwatchAnim.pause();
        //adjust the timeline's progress() based on slider value
        birdwatchAnim.progress(ui.value);
    }
});

function updateSlider() {
    $("#slider").slider("value", birdwatchAnim.progress());
}

$("#slider, .ui-slider-handle").mousedown(function() {
    $('html, #slider, .ui-slider-handle').one("mouseup", function(e){
        birdwatchAnim.resume();
    });
});

$("#play-pause").click(function(){
    if(this.innerHTML === "play"){
        this.innerHTML = "pause";
        birdwatchAnim.play();
        TweenLite.to(birdwatchAnim, 2, {timeScale:1});
    } else {
        this.innerHTML = "play";
        TweenLite.to(birdwatchAnim, 2, {timeScale:0, onComplete:function(){birdwatchAnim.pause();}});
    }
});

$("#slower-faster").click(function(){
    if(this.innerHTML === "slower"){
        this.innerHTML = "faster";
        birdwatchAnim.timeScale(0.5);
    } else {
        this.innerHTML = "slower";
        birdwatchAnim.timeScale(1);
    }
});
