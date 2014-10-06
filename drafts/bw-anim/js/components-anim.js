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

//TweenLite.ticker.fps(30);

var birdwatchAnim = new TimelineMax({'paused': true });

birdwatchAnim
.add(TweenMax.from(tcChannels,          2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(twitterclient,       2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(persistenceChannels, 2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(persistence,         2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(percChannels,        2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(percolator,          2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(commChannels,        2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(communicator,        2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(http,                2, { opacity:0, ease:Power4.easeIn }))
.add(TweenMax.from(switchboard,         2, { opacity:0, ease:Power4.easeIn }));

birdwatchAnim.play().repeat(-1).repeatDelay(3);

$("#slider").slider({
  range: false,
  min: 0,
  max: 1,
  step:0.001,
  slide: function ( event, ui ) {
    birdwatchAnim.pause();
    //adjust the timeline's progress() based on slider value
    birdwatchAnim.progress( ui.value);
    }
});
/*
function updateSlider() {
  $("#slider").slider("value", birdwatchAnim.progress());
} 

$("#slider, .ui-slider-handle").mousedown(function() {
  $('html, #slider, .ui-slider-handle').one("mouseup", function(e){
    birdwatchAnim.resume();
  });
});
*/