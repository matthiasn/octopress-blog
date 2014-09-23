var doc = document.getElementById("bw-omni");
var http = doc.querySelector("#http");
var percolator = doc.querySelector("#percolator");
var persistence = doc.querySelector("#persistence");
var switchboard = doc.querySelector("#switchboard");
var twitterclient = doc.querySelector("#twitterclient");
var communicator = doc.querySelector("#communicator");
var commChannels = doc.querySelector("#comm-channels");
var tcChannels = doc.querySelector("#tc-channels");
var persistenceChannels = doc.querySelector("#persistence-channels");
var percChannels = doc.querySelector("#perc-channels");

var birdwatchAnim = new TimelineMax({onUpdate:updateSlider, repeatDelay: 3, repeat:-1});

birdwatchAnim
    .add(TweenMax.from(tcChannels,          1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(twitterclient,       1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(persistenceChannels, 1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(persistence,         1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(percChannels,        1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(percolator,          1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(commChannels,        1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(communicator,        1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(http,                1, { opacity:0, ease:Power4.easeIn }))
    .add(TweenMax.from(switchboard,         1, { opacity:0, ease:Power4.easeIn }));

birdwatchAnim.timeScale(0.9);
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

$("#playPause").click(function(){
    if(this.innerHTML === "play"){
        this.innerHTML = "pause"
        TweenLite.to(birdwatchAnim, 2, {timeScale:1})
    } else {
        this.innerHTML = "play"
        TweenLite.to(birdwatchAnim, 2, {timeScale:0})
    }
});

