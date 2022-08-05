var width=$(window).width();
var height = $(window).height();

function noteToFreq(note) {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
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
  (typeof keymap[code]!=='undefined')&&_stage.playNote(keymap[code]);
});

$(window).load(function(){

  synth = new Tone.Synth().toDestination();
  _stage = new Stage('container');


  var speed = 2;
  var stopped = false;
  var anim = new Konva.Animation(function(frame) {
    var time = frame.time,
        timeDiff = frame.timeDiff,
        frameRate = frame.frameRate;
        for(n in _stage.notes){
        if(_stage.notes[n]){
          var _x = _stage.notes[n].circle.getX();
              _stage.notes[n].circle.setX(_x+speed);
          if(_x>width+10){
            _stage.notes.splice(_stage.notes.indexOf(_stage.notes[n]),1);
          }       
        }
       }
  
  }, _stage._layer);
  anim.start();

});

function midiNoteToColor(num){
  return 'hsl('+(360-(Math.ceil(Math.abs(11-num%12)*(360/11))))+',60%,35%)';
}

function translatePitchToY(num,amin,amax,bmin,bmax){ 
  return bmin + (Math.ceil(Math.abs(amax-num)*(bmax/amax)));
}

Note = function(midi_note, stage, layer){
  var that = this;
  this.midi_note      = midi_note;
  this.circle     = new Konva.Circle({
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

  synth.triggerAttackRelease(noteToFreq(midi_note), "8n");
}

Stage = function(container, s_context){
  this.stage  = new Konva.Stage({
      container: container,
      width: $(document).width(),
      height: $(document).height()
    });
  this.layer = (new Konva.Layer());
  this.notes  = [];
}

Stage.prototype.playNote = function(midi_note){
  note = new Note(midi_note, this.stage, this.layer);
  this.notes.push(note);
}
