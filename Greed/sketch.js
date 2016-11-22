
// all notes have a fixed height


// Generate stream of notes to playd

// play sound when notes are played

// Score

// Menu and stuff


// lines for notes above or below note system




const noteAlphabet = ["C", "D", "E", "F", "G", "A", "B"]

const notesAlphHalfSteps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const noteLookUp = {
  C0: {valves: [0, 0, 0], midi: 0},
  D0: {valves: [1, 0, 1], midi: 2},
  E0: {valves: [1, 1, 0], midi: 4},
  F0: {valves: [1, 0, 0], midi: 5},
  G0: {valves: [0, 0, 0], midi: 7},
  A0: {valves: [1, 1, 0], midi: 9},
  B0: {valves: [0, 1, 0], midi: 11},
  C1: {valves: [0, 0, 0], midi: 12},
  D1: {valves: [1, 0, 0], midi: 14},
  E1: {valves: [0, 0, 0], midi: 16},
  F1: {valves: [1, 0, 0], midi: 17},
  G1: {valves: [0, 0, 0], midi: 19},
  A1: {valves: [1, 1, 0], midi: 21},
  B1: {valves: [0, 1, 0], midi: 23},
  C2: {valves: [0, 0, 0], midi: 24}
}

let instrument
let noteSystem
let score = {
  value: 0,
  combo: 1,
  combAmtForMult: 4,
  multiplier: 1,
  multLim: 10,

}

function setup() {
  createCanvas(800, 800)
  instrument = BrassInstrument(width/2, height/2)
  instrument.sound.amp(0)
  instrument.sound.start()

  noteSystem = NoteSystem()


}

function draw() {
  background(225, 225, 200)
  // Draw the note lines

  instrument.update()
  //console.log(instrument.notesPlaying())

  instrument.shouldPlay = noteSystem.getShouldPlay()

  if (instrument.shouldPlay) {
    let c
    if (instrument.notesPlaying().some(note => note === instrument.shouldPlay.pitch)) {
      instrument.sound.amp(0.2)
      instrument.sound.freq(instrument.shouldPlay.getFreq())
      c = color(0, 200, 0)

      if (instrument.shouldPlay != instrument.prevShouldPlay) {
        score.value += 100 * score.multiplier
        score.combo++

        if (score.combo === score.combAmtForMult && score.multiplier <= score.multLim) {
          score.multiplier++
          score.combo = 0
        }
      }
    } else {
      instrument.sound.amp(0)
      c = color(200, 0, 0)

      score.combo = 0
      score.multiplier = 1

    }
    instrument.shouldPlay.c = lerpColor(instrument.shouldPlay.c, c, 0.2)
  } else {
    instrument.sound.amp(0)
  }

  instrument.prevShouldPlay = instrument.shouldPlay


  noteSystem.update(instrument.notesPlaying())

  noteSystem.display()
  instrument.display()
  text("SCORE: " + score.value, 100, 50)
  text("MULT: " + score.multiplier, 100, 80)
  text("COMBO: " + score.combo, 100, 20)
}


const generateNotes = function() {
  let possibleNotes = Object.keys(noteLookUp)
  let start = 0
  let notes = []
  for (let i = 0; i < 500; i++) {
    let noiseVal = round(map(cos(i / 2) * sin(i), -1, 1, 1, possibleNotes.length - 4))
    let pitch = possibleNotes[noiseVal]
    //let duration = floor(random(1, 4)) * 0.5
    //let duration = round(random(2, 8)) * 0.25
    //let duration = round(map(noise(i + 1000), 0, 1, 2, 4)) * 0.5
    let duration = 1
    notes.push(Note(pitch, start, duration - 0.4))

    start += duration
  }

  return notes

}

const Note = function(pitch, start, duration) {
  return {
    pitch: pitch,
    howToPlay: noteLookUp[pitch].valves,
    start: start,
    duration: duration,
    c: color(0),
    getFreq: function() {
      let noteIndex = notesAlphHalfSteps.indexOf(this.pitch[0])
      let halfSteps = noteIndex - notesAlphHalfSteps.indexOf("A") + this.pitch[1] * 12

      return 440 * pow(pow(2, 1/12), halfSteps)
    },
    move(metronome) {
      if (this.start > 0) {
        this.start -= metronome / 10000
      } else {
        this.start = 0
        this.duration -= metronome / 10000
      }
    }
  }
}

const NoteSystem = function(notes) {
  let state = {
    octave: 6,
    barW: 400,
    betweenLines: 40,
    notes: generateNotes(),
    lines: 5,
    timeSig: 4, //Always fourths
    metronome: 400
  }

  return {
    display: function() {
      push()
      translate(50, 100)
      //Draw the lines
      strokeWeight(3)
      stroke(0)
      for (let y = 0; y < state.lines; y++) {
        let offsetX = 50
        line(0, y * state.betweenLines, width - 100, y * state.betweenLines)
      }

      rectMode(CENTER)

      state.notes.forEach(note => {
        let pitchToNum = noteAlphabet.indexOf(note.pitch[0]) + (noteAlphabet.length) * note.pitch[1]
        let posY = 5 * state.betweenLines - pitchToNum * state.betweenLines / 2

        let noteW = note.duration * state.barW / 4
        fill(note.c)
        noStroke()
        rect(note.start * state.barW / 4 + noteW / 2, posY, noteW, state.betweenLines / 2)
      })
      pop()
    },

    update: function(notesPlaying) {
      // Move the notes
      state.notes.forEach(note => note.move(state.metronome))

      //state.metronome += 0.1

      // remove off screen
      state.notes = state.notes.filter(note => note.start + note.duration > 0)
    },

    getShouldPlay() {
      return state.notes.find(note => note.start <= 0)
    }
  }
}

// Bad naming, afterall this is just valves.
const BrassInstrument = function(x, y) {
  let scl = 50
  let cDown = color(255, 165, 0)
  let cUp = color(200, 200, 175)

  let state = {
    pos: createVector(x, y),
    w: scl * 3,
    pitch: [],
    valves: [
      {isDown: 0, inputKey: 81, pos: createVector(x - scl/2, y), c: cUp},
      {isDown: 0, inputKey: 87, pos: createVector(x + scl, y), c: cUp},
      {isDown: 0, inputKey: 69, pos: createVector(x + scl * 2.5, y), c: cUp}
    ]
  }
  //bad naming
  return {
    shouldPlay: undefined,
    prevShouldPlay: undefined,
    sound: new p5.TriOsc(),
    display: function() {
      push()
      translate(-scl * 3 / 2, 0)
      state.valves.forEach((valve, i) => {
        let c = valve.isDown ? cDown : cUp
        //console.log(c);
        valve.c = lerpColor(valve.c, c, 0.2)
        fill(valve.c)
        noStroke()
        rectMode(CORNER)
        rect(valve.pos.x, valve.pos.y, scl, scl)
      })
      pop()
    },

    update: function() {
      state.valves.forEach(valve => valve.isDown = keyIsDown(valve.inputKey) ?  1 : 0)
    },

    notesPlaying: function() {
      //Get list of valves pressed
      let currValves =
      Object.keys(state.valves)
      .map(key => state.valves[key].isDown)


      let playing =
      Object.keys(noteLookUp)
      .filter(key => !noteLookUp[key].valves.some((valve, i) => currValves[i] != valve))

      return playing
    }
  }
}
