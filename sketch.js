let score = 0
let highscore = 0
let scrollSpeed = 2
let terrainCount = 0
let spawnChance = 3
let spawnedFood = 0
let player
let objManager
let terrainTypes = ["pipe","block","hole"]
let nextBlocks = ["block"]
let mountains = []
let mountainsBehind = []
let mySound
let amp
let stars = []


function preload() {
  mySound = loadSound('gouda.m4a')
}

function setup() {
  createCanvas(720, 480)
  for (let i = 0; i < 50; i++) {
    stars.push(createVector(random(0, width), random(0, height), random(0.1, 2)))
  }
  amp = new p5.Amplitude()
  mySound.loop()
  highscore = localStorage.getItem("highscore") || 0


  textAlign(CENTER)
  objManager = ObjManager()
  player = Player()

  objManager.add(player)

  generateTerrain()
  //Mountains
  for (let x = 0; x < width + 120; x += 120) {
    mountains.push(Mountain(x, noise(x) * 400 + 150, 50))
    mountainsBehind.push(Mountain(x, noise(x + 100) * 500 + 10, 20))
  }
}

function draw() {
  rectMode(CORNER)
  for (let i = 0; i < mountains.length; i++) {
    let m = mountains[i]
    m.pos.x -= scrollSpeed / 2

    if (m.pos.x + m.scl <= 0) {
      m.pos.x = width
      m.pos.y = noise(millis()*0.0001) * 400 + 150

    }

  }

  for (let i = 0; i < mountainsBehind.length; i++) {
    let m = mountainsBehind[i]
    m.pos.x -= scrollSpeed / 4

    if (m.pos.x + m.scl <= 0) {
      m.pos.x = width
      m.pos.y = noise(millis()*0.0001) * 400

    }

  }


  objManager.update()
  updateTerrain()
  let eaten = objManager.colliding(player, "food")

  if (eaten) {
    player.foodCount++
    objManager.removeObj(eaten)
  }

  let checkp = objManager.colliding(player, "checkpoint")
  if (checkp && keyIsDown(DOWN_ARROW)) {
    let amountScore = player.foodCount * player.foodCount
    if (player.foodCount > 0) {
      for (i = 0; i < amountScore * 2; i++) {
        let c = checkp.c
        c.levels.forEach(x => x += 100)
        objManager.particles.push(Particle(checkp.pos.x + checkp.scl.x / 2, checkp.pos.y + checkp.scl.y / 2, c))

      }
    }
    score += amountScore
    player.foodCount = 0

  }
  let metEnemy = objManager.colliding(player,"enemy")

  if (metEnemy) {
    if(player.foodCount > 0){
      player.isDeflating = true
      objManager.removeObj(metEnemy);
    } else if(player.foodCount == 0){
      player.pos.y = height + 200
    }
  }

  background(0)
  fill(255)
  stroke(1)
  rectMode(CENTER)
  stars.forEach((star, i) => {
    let r = amp.getLevel() * 50 * random(0.5, 1) + 5
    let lerpedR = lerp()
    push()
    translate(star.x, star.y)
    rotate(noise(millis() / 1000 + i * 1000) * 10)
    rect(0, 0, r, r)
    pop()
  })
  rectMode(CORNER)

  mountainsBehind.forEach(m => m.display())
  mountains.forEach(m => m.display())

  objManager.display()
  player.display()


  //Text
  textSize(30)
  fill(255)

  if(player.pos.y < height + 50){
    let p = " + "
    textAlign(LEFT)

    text(score, width/2-textWidth(score)-(textWidth(" + ")/2), 50)
    if(player.foodCount > 0){
      fill(0,200,0)
    } else {
      fill(255)
    }


    if(!player.isDeflating){
      player.potentialScore = player.foodCount*player.foodCount;
    } else {
      fill(200,0,0)
    }
    text(round(100*player.potentialScore)/100,width/2+textWidth(" + ")/2,50)
    fill(255)

    textAlign(CENTER)
    text(" + ", width / 2, 50)
} else {

  if (score > highscore) {
    localStorage.setItem("highscore", score)
    highscore = score
  }

  textAlign(CENTER)
  rectMode(CENTER)
  stroke(20)
  strokeWeight(10)
  fill(70)
  rect(width / 2, height / 2, width /2 + textWidth(highscore), height / 2)
  fill(0)
  noStroke()
  text("SCORE: " + score, width / 2, height/2 - 50)
  text("HIGHSCORE: " + highscore, width / 2, height/2)
  text("Press 'r' to restart!", width / 2, height/2 + 50)
  rectMode(CORNER)
  strokeWeight(1)




  }





}

function keyPressed() {
  if (key == "R") {
    score = 0
    objManager = ObjManager()
    player = Player()

    objManager.add(player)

    generateTerrain()
    //Mountains

    mountains = []
    mountainsBehind = []
    for (let x = 0; x < width + 120; x += 120) {
      mountains.push(Mountain(x, noise(x) * 300 + 10, 50))
      mountainsBehind.push(Mountain(x, noise(x + 100) * 500 + 10, 20))
    }
  }
}

function Particle(x, y, c) {

  return {
    c: color(c.levels[0], c.levels[1], c.levels[2], random(100, 255)),
    pos: createVector(x, y),
    vel: createVector(0, 0),
    acc: createVector(random(-0.5, 0.5), random(-1, 0)).normalize().mult(random(5, 10)),
    scl: createVector(10, 10),
    update: function() {

      this.acc.y += 0.2
      this.vel.add(this.acc)
      this.pos.add(this.vel)
      this.pos.x += scrollSpeed
      this.acc.mult(0)

      this.checkOut()

    },

    checkOut: function() {
      if(this.pos.y-this.scl.y>height){
        let i = objManager.particles.indexOf(this)
        objManager.particles.splice(i,1)
      }
    },

    display: function() {
      fill(this.c)
      noStroke()
      rect(this.pos.x, this.pos.y, this.scl.x, this.scl.y)
    }
  }
}

function Mountain(x, y, c) {
  return {
    c: c || 50,
    scl: 120,
    pos: createVector(x, y),
    display: function() {
      fill(c)
      noStroke()
      rect(this.pos.x, this.pos.y, this.scl + 4, height - this.pos.y)
    }
  }
}

function Enemy(x,y) {


  return {
    name: "enemy",
    big: 3,
    c: color(200, 0, 0),
    pos: createVector(x, y),
    vel: createVector(0, -1),
    scl: createVector(20, 20),
    lim: {down: y, up: y - player.scl.y * 2},
    acc: createVector(0,0),
    grav: createVector(0, 0.5),
    mvspd: 5,
    //scl: createVector(player.foodCount * player.foodCount + 10, player.foodCount * player.foodCount + 10),

    display: function() {

      noStroke()
      fill(this.c)
      rect(this.pos.x, this.pos.y, this.scl.x, this.scl.y)
    },

    update: function() {
      //this.vel = createVector(noise(millis() * 100), 0)
      if (this.pos.y > this.lim.down || this.pos.y < this.lim.up) {
        this.vel.y *= -1
      }
      this.pos.add(this.vel)

    }



  }
}

function getGrounded(name) {
  let displacements = []
  let blocks = objManager.objs.filter(obj => coll(player, obj) && obj.name === name)

  if (blocks.length > 0) {
    displacements = blocks.map(block => {
      let contacts = [
        createVector(0, (player.pos.y + player.scl.y) - block.pos.y),
        createVector(0, player.pos.y - (block.pos.y + block.scl.y)),
        createVector((player.pos.x + player.scl.x) - block.pos.x, 0),
        createVector(player.pos.x - (block.pos.x + block.scl.x), 0)
      ]

      contacts = contacts.sort((a, b) => a.magSq() - b.magSq())
      return contacts[0]

    })
    displacements.forEach(displacement => player.pos.sub(displacement))


  }
  return displacements
}

function Player() {
  return {
    isDeflating: false,
    potentialScore: 0,
    dblJumped: false,
    reqspd: 0,
    grounded: false,
    name: "player",
    c: color(100, 100, 100),
    pos: createVector(width/2, 0),
    vel: createVector(0, 0),
    acc: createVector(0,0),
    grav: createVector(0, 0.5),
    mvspd: 5,
    foodCount: 0,
    scl: createVector(20, 10),
    update: function() {
      //this.pos.add(createVector(-scrollSpeed, 0))
      this.scl.y = lerp(this.scl.y, this.foodCount * this.foodCount + 10, 0.3)
      this.scl.x = lerp(this.scl.x, this.foodCount / 2 * this.foodCount + 30, 0.3)
      this.pos.y -= (this.foodCount * this.foodCount + 10 - this.scl.y)/4
      this.pos.x -= (this.foodCount / 2 * this.foodCount + 30 - this.scl.x)/4
      let currVel = createVector(0,0)
      if (keyIsDown(LEFT_ARROW))
        //this.vel.x = -(this.mvspd/(1+this.foodCount/10))
        this.reqspd = -(this.mvspd/(1+this.foodCount/10))
      else if (keyIsDown(RIGHT_ARROW))
        //this.vel.x = (this.mvspd/(1+this.foodCount/10))
        this.reqspd = (this.mvspd/(1+this.foodCount/10))
      else
        //this.vel.x = 0
        this.reqspd = 0


      if (keyIsDown(UP_ARROW) && this.grounded){
        this.acc.add(createVector(0, -10))
      }

      // if (keyIsDown(UP_ARROW) && !this.grounded && this.dblJumped) {
      //   this.foodCount = 0
      //   this.vel.add(createVector(60,0))
      //   this.vel.y = 0
      //
      // }
      if (keyIsDown(DOWN_ARROW) && !objManager.colliding(player, "checkpoint")) {
        this.isDeflating = true
      }


      if (this.isDeflating) {
        this.foodCount = 0
        this.potentialScore = lerp(this.potentialScore, 0, 0.1)
        if (this.potentialScore <= 0.1) {
          this.isDeflating = false
          this.potentialScore = 0
        }
      }




      this.vel.x = lerp(this.vel.x, this.reqspd, 0.6)
      this.acc.add(this.grav)
      this.vel.add(this.acc)
      this.vel.limit(10)
      this.pos.add(this.vel)


      //Bounce off ground
      let blockDisp = getGrounded("block")


      if (blockDisp.length > 0) {
        if (blockDisp.some(disp => disp.y > 0)) {
          this.grounded = true
        } else {
          this.grounded = false
        }
      }
      else {
        this.grounded = false
      }


      if (this.grounded) {
        this.vel.y = 0
      }
        // if (displacements.some(disp => disp.y > 0))
        //   this.grounded = true
        // else {
        //   this.grounded = false
        // }
      //this.vel.x = 0


      this.acc.mult(0)
    },
    display: function() {
      noStroke()
      fill(this.c)
      rect(this.pos.x, this.pos.y, this.scl.x, this.scl.y)
    },

  }
}

function Food(x,y) {
  return {
    name: "food",
    c: color(0, 100, 0),
    scl: createVector(10, 10),
    pos: createVector(x || 0, y || 0),
    display: function() {
      noStroke()
      fill(this.c)
      rect(this.pos.x, this.pos.y, this.scl.x, this.scl.y)
    }
  }
}

function coll(a, b) {
  if (a === b) return false

  return a.pos.x < b.pos.x + b.scl.x &&
         a.pos.x + a.scl.x > b.pos.x &&
         a.pos.y < b.pos.y + b.scl.y &&
         a.pos.y + a.scl.y > b.pos.y
}

function CheckPoint(x,y,sx,sy) {
  return {
    name: "checkpoint",
    c: color(0, 0, 100),
    pos: createVector(x, y),
    scl: createVector(sx, sy),
    display: function() {
      noStroke()
      fill(this.c)
      rect(this.pos.x, this.pos.y, this.scl.x, this.scl.y)
    },
    update: function() {
    }
  }
}

function Block(x, y, sx, sy, c) {
  return {
    name: "block",
    pos: createVector(x, y),
    scl: createVector(sx, sy),
    c: c,
    display: function() {
      //stroke(0)
      noStroke()
      fill(this.c)
      rect(this.pos.x, this.pos.y, this.scl.x, height - this.pos.y)
    },
    update: function(){}
  }
}

function Grid(x, y, type) {
  let w = 120
  let grid = {
    name: "grid",
    type: type,
    c: color(100, 200, 50),
    pos: createVector(x || 0, y || 0),
    scl: createVector(w, height),
    objs: [],
    construct: function() {

      let block
      if (this.type === "block") {
        block = Block(x, height-y, w, y,color(80))
        objManager.add(block)
        this.objs.push(block)
        nextBlocks = ["enemy","block","pipe"]
        let r = floor(random(0, 3))

        if (r === 0) {

          if (spawnedFood >= 4) {
            objManager.add(CheckPoint(x + w / 2 - 15, height - y - 20, 30, 20))
            spawnedFood = 0
          } else {
            objManager.add(Food(x + w / 2 - 5, height - y - 30))
            spawnedFood++
          }
        }
      }
      if(this.type === "enemy"){
        block = Block(x, height-y, w, y,color(80))
        objManager.add(block)
        this.objs.push(block)
        nextBlocks = ["pipe", "hole","block"]
        let e = Enemy(x+w/2-10,height - y - 20)

        this.objs.push(e)

        objManager.add(e)
      }
      if (this.type === "hole") {
        nextBlocks = ["block"]
      }
      if (this.type === "pipe") {
        //objManager.add(Block(x+w/4, height-y, w/8, 70))
        let r = floor(random(0,5))
        block = Block(x+(r*w/5), height-y, w / (5), y,color(80))
        objManager.add(block)
        this.objs.push(block)
        nextBlocks = ["pipe", "pipe", "block"]
      }
      // Chance for enem or food or nothing, vooid
    },
    remove: function() {
      this.objs.forEach(obj => objManager.removeObj(obj))
      objManager.removeObj(this)
    },
    update: function() {},
    display: function() {}
  }
  grid.construct()
  return grid
}

function ObjManager() {
  return {
    objs: [],
    particles: [],
    getNames: function(name) {
      return this.objs.filter(obj => obj.name === name)
    },
    add: function(obj) {
      this.objs.push(obj)
    },
    get: function(i) {
      if (this.objs[i])
        return this.objs[i]
      return -1
    },
    removeObj: function(obj) {
      let i = this.objs.indexOf(obj)
      if (i != -1)
        this.objs.splice(i, 1)
    },
    removeI: function(i) {
      if (i != -1)
        this.objs.splice(i, 1)
    },
    display: function() {
      this.objs.forEach(obj => obj.display())
      this.particles.forEach(obj => obj.display())
    },
    update: function() {
      this.objs.forEach(obj => {
        obj.pos.add(createVector(-scrollSpeed, 0))
        if (obj.update != undefined) {
          obj.update()
        }
      })
      this.particles.forEach(particle => {
        particle.pos.add(createVector(-scrollSpeed, 0))
        particle.update()
      })
    },
    colliding: function(a, name) {
      let objs = this.getNames(name)
      return objs.find(obj => coll(a, obj))
    }
  }
}
function updateTerrain() {
  let grids = objManager.getNames("grid")
  let w = 120
  //blocks.forEach(block => block.pos.add(createVector(-2, 0)))
  let outGrid = grids.find(grid => grid.pos.x + grid.scl.x <= 0 && grid.pos.x >= -w)
  if (outGrid) {
    outGrid.remove()

    let h = noise(terrainCount / 10) * 300



    //objManager.add(Block(width, height-h, w, h))
    nb = nextBlocks.length
    let r = floor(random(0,nb))
    let grid = Grid(width, h, nextBlocks[r])

    objManager.add(grid)
    if (grid.type != "hole")
      terrainCount++
  }
}


//
//
function generateTerrain() {
  let w = 120

  for (let x = 0; x < width/w + 1; x++) {
    // let h = noise(terrainCount / 10) * 300
    // terrainCount++
    // let b = Block(x*w, height-h, w, h)
    // objManager.add(b)
    let h = noise(terrainCount / 10) * 300
    objManager.add(Grid(x*w, h, "block"))
    terrainCount++
  }
}
