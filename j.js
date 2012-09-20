var width=$(window).width();
var height = $(window).height();
//var interval = 0;
function playNote(pitch){
	if(!sinewave.playing){
		sinewave.play();		
	}
	_stage.playNote(pitch);
}
function makeSilent(){
//	self.clearInterval(interval);
	sinewave.pause();	
}
var keymap={
	97:69,
	119:70,
	115:71,
	101:72,
	100:73,
	102:74,
	103:75,
	121:76,
	104:77,
	117:78,
	106:79,
	105:80,
	107:81,
	108:82,
	59:83
}
$(document).bind('keypress',function(e){
	var code = e.keyCode || e.which;
	(code==32)&&makeSilent();
	(typeof keymap[code]!=='undefined')&&playNote(keymap[code]);
})
window.AudioContext = (
  window.AudioContext ||
  window.webkitAudioContext ||
  null
);
if (!AudioContext) {
	$('#log').html('The WebAudio API is not supported in your browser.  <a href="https://www.google.com/intl/en/chrome/browser/">Try Google Chrome.</a>');
}
$(window).load(function(){

	context = new AudioContext();
	_stage = new Stage('container');
	sinewave = new SineWave(context);
// song = [{note:66},
// 		{note:64},
// 		{note:61},
// 		{note:54}
// 		];
// 		
// var iter=4;
// interval = self.setInterval(function(){
// 	var n =song[iter++%song.length]['note'];
// 	$('#log').text('playNote('+n+')');
// 	playNote(n);
// },500);
	var speed = 4;
	var stopped=false;
	var anim = new Kinetic.Animation({
	  func: function(frame) {
		    for(n in _stage.notes){
				if(_stage.notes[n]){
					var _x = _stage.notes[n].circle.getX();
			      	_stage.notes[n].circle.setX(_x+speed);
					if(_x>width+10){
						_stage.notes.splice(_stage.notes.indexOf(_stage.notes[n]),1);
					}				
				}
		   }
		(!stopped&&_stage.notes.length==0)&&makeSilent();
	  },
	  node: _stage.layer
	});
	  anim.start();
});
function midiNoteToColor(num){
	return 'hsl('+(360-(Math.ceil(Math.abs(11-num%12)*(360/11))))+',60%,35%)';
}
function translatePitchToY(num,amin,amax,bmin,bmax){ 
	return bmin + (Math.ceil(Math.abs(amax-num)*(bmax/amax)));
}
SineWave = function(context,init_note) {
  this.x = 0;
  this.context = context;
  this.sampleRate = this.context.sampleRate;
  this.frequency = 10;
  this.next_frequency = this.frequency;
  this.amplitude = 0.2;
  this.playing = false;
  this.nr = true; 
  this.node = context.createJavaScriptNode(2048, 1, 2);
  var that = this;
  this.node.onaudioprocess = function(e) { that.process(e) };
}
SineWave.prototype.setAmplitude = function(amplitude) {this.amplitude = amplitude;}
SineWave.prototype.setNR = function(nr) {this.nr = nr;}
SineWave.prototype.setFrequency = function(note) {
  freq=8.1758*Math.pow(2,(note)/12)
  this.next_frequency = freq;

  if (!this.playing) this.frequency = freq;
}
SineWave.prototype.process = function(e) {
  var right = e.outputBuffer.getChannelData(0),
      left = e.outputBuffer.getChannelData(1);
  for (var i = 0; i < right.length; ++i) {
    right[i] = left[i] = this.amplitude * Math.sin(this.x++ / (this.sampleRate / (this.frequency * 2 * Math.PI)));
    //low-pass
    if (this.next_frequency != this.frequency) {
      if (this.nr) {
        next_data = this.amplitude * Math.sin(this.x / (this.sampleRate / (this.frequency * 2 * Math.PI)));
        if (right[i] < 0.001 && right[i] > -0.001 && right[i] < next_data) {
          this.frequency = this.next_frequency;
          this.x = 0;
        }
      } else {
        this.frequency = this.next_frequency;
        this.x = 0;
      }
    }
  }
}
SineWave.prototype.play = function() {this.node.connect(this.context.destination);this.playing = true;}
SineWave.prototype.pause = function() {this.node.disconnect();this.playing = false;}

Note = function(midi_note,stage,layer){
	var that = this;
	this.midi_note 	    = midi_note;
	this.circle     = new Kinetic.Circle({
		x:0,
		y:translatePitchToY(midi_note,0,127,0,$(document).height()),
		radius: 9,
		fill: midiNoteToColor(midi_note)
		}
	);
	stage.add(
		layer.add(
			this.circle
		)
	);
	sinewave.setFrequency(midi_note);
}

Stage = function(container,s_context){
	this.stage  = new Kinetic.Stage({
	    container: container,
	    width: $(document).width(),
	    height: $(document).height()
	  });
	this.layer = (new Kinetic.Layer());
	this.notes  = [];
}

Stage.prototype.playNote = function(midi_note){
	note = new Note(midi_note,this.stage,this.layer);
	this.notes.push(note);
}

