let state = 0;
let button;
let Font1;
let Font2;

let lifeforms = [];
let prevMouse;
let stillStartTime = 0;
let isStill = false;
let zoomingIn = false, zoomingOut = false;
let zoomFactor = 1, targetZoom = 1, zoomSpeed = 0.01;
let densestPoint = { x: 0, y: 0 };
let nameInput = "", showInput = false;
let globalTraces = [];
let alreadyZoomed = false, canCreateLife = true;

function preload() {
  Font1 = loadFont('BookkMyungjo_Bold.ttf');
  // Font2 = loadFont('QingNiaoHuaGuangFanBaoSong-2.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  prevMouse = createVector(mouseX, mouseY);
  textSize(20);
  textAlign(CENTER, CENTER);
  colorMode(HSB, 360, 100, 100, 255);
  button = createButton('다음');
  button.position(width - 30, height - 50);
  button.mousePressed(nextState);
}

function draw() {
  background(255);

  if (state === 0) {
    showIntro();
  } else if (state === 1) {
    showIntroDescribe1();
  } else if (state === 2) {
    showContent(); // 생태계(도형/확대/흔적 등) 시스템
  } else if (state === 3) {
    showIntroDescribe2();
  } else if (state === 4) {
    showOutro();
  }
}

function nextState() {
  if (state < 4) {
    state++;
  } else {
    console.log("종료");
  }
}

function showIntro() {
  background(0);
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(250);
  textFont(Font1);
  text("화양연화", width / 2, height / 2);
  textSize(20);
  text("관계의 가장 아름다운 시절", width / 2, height / 2 + 50);
}

function showIntroDescribe1() {
  background(0);
  textFont(Font1);
  textAlign(LEFT);
  textSize(25);
  fill(250);
  text("어떤 것에 대해 생각하는 순간 관계 맺음은 시작된다.", 20, height / 2 - 50);
  textSize(20);
  text("생성과 성장, 쇠퇴와 소멸 \n그리고 그 사이의 가장 아름다운 시절들을 그려내며 \n생명력 있어 보이는 것들과의 관계를 다룬 작품입니다.", 20, height / 2 + 70);
}

function showIntroDescribe2() {
  background(0);
  textFont(Font1);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("본래 의도", width/2, 60);
  textAlign(LEFT);
  textSize(15);
  fill(250);
  text("주변의 다양한 것들 중 생각이 머문 것은 나의 세상에서 ‘하나의 의미’로 자라난다.\n머문 것과 오래 지낼수록 더 다양한 의미들이 생겨나며, 의미가 생명처럼 형성되고 깊어진다.\n그러다 여러 의미들이 겹쳐지고 섞이면서 강렬한 인상을 남기는 ‘화양연화’의 순간을 맞이한다.", 4, height / 2 + 10);
  text("알게 모르게 찾아온 그 순간은 ‘하나의 뜻’으로 남아 평생토록 간직된다. \n이후 생명(의미)들과의 관계는 쇠퇴해가고, 마침내 소멸하지만 그 자리엔 색(본질)을 남긴다. \n남겨진 색은 나의 세상 어딘가에서, 조용히 하나의 배경으로 작용한다.", 4, height / 2 + 75);
}

function showOutro() {
  background(0);
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(250);
  text("Credit", width / 2, height / 2 - 150);
  textSize(20);
  text("박희연", width / 2, height / 2 - 40);
  text("이승빈", width / 2, height / 2 + 20);
  text("주지현", width / 2, height / 2 + 80);
}
























function showContent() {
  background(0, 0, 100); // HSB 하얀 배경

  globalTraces = [];
  let isFrozen = (zoomingIn || zoomingOut || showInput);

  if (zoomingIn || zoomingOut) {
    push();
    translate(width / 2, height / 2);
    scale(zoomFactor);
    translate(-densestPoint.x, -densestPoint.y);
  }

  canCreateLife = !showInput && !zoomingIn && !zoomingOut && !allDeclining();

  if (isFrozen) {
    for (let i = lifeforms.length - 1; i >= 0; i--) {
      let lf = lifeforms[i];
      lf.display(true);
      for (let t of lf.traces) globalTraces.push(t);
    }
  } else {
    createLifeformIfMouseStill();
    for (let i = lifeforms.length - 1; i >= 0; i--) {
      let lf = lifeforms[i];
      lf.update();
      lf.display(false);
      if (lf.size < 0.5) lifeforms.splice(i, 1);
      for (let t of lf.traces) globalTraces.push(t);
    }
  }
  if (zoomingIn || zoomingOut) pop();

  triggerZoomIfDenseCellFilled();
  updateZoomAnimations();
  displayInputIfNeeded();
  displayCharacter();
}


function allDeclining() {
  if (lifeforms.length === 0) return false;
  for (let lf of lifeforms) if (!lf.isDeclining) return false;
  return true;
}

function createLifeformIfMouseStill() {
  let currentMouse = createVector(mouseX, mouseY);
  let distance = p5.Vector.dist(currentMouse, prevMouse);
  if (distance < 1 && canCreateLife) {
    if (!isStill) {
      stillStartTime = millis();
      isStill = true;
    } else if (millis() - stillStartTime > 1600) {
      lifeforms.push(new Lifeform(mouseX, mouseY));
      stillStartTime = millis();
    }
  } else {
    isStill = false;
  }
  prevMouse = currentMouse.copy();
}

function triggerZoomIfDenseCellFilled() {
  if (!alreadyZoomed && !zoomingIn && !zoomingOut) {
    let { bestCell, maxCount } = getDensestRegion(globalTraces);
    if (maxCount >= 1600) { // 셀(280x210)에 흔적 1600개 이상
      densestPoint = bestCell;
      targetZoom = min(width / 280, height / 210);
      zoomSpeed = 0.06;
      zoomingIn = true;
      showInput = true;
      nameInput = "";
      alreadyZoomed = true;
    }
  }
}

function updateZoomAnimations() {
  if (zoomingIn && zoomFactor < targetZoom) {
    zoomFactor += zoomSpeed * (targetZoom - zoomFactor);
    if (zoomFactor >= targetZoom - 0.01) {
      zoomFactor = targetZoom;
      zoomSpeed = 0.01;
    }
  }
  if (zoomingOut) {
    zoomFactor -= 0.025 * (zoomFactor - 1);
    if (zoomFactor <= 1.01) {
      zoomFactor = 1;
      zoomingOut = false;
    }
  }
}

function displayInputIfNeeded() {
  if (showInput) {
    fill(250, 30);
    rect(0, 0, width, height);
    fill(0, 0, 0);
    text("WHAT IS THIS: " + nameInput, width / 2 - 270, height / 2 + 150);
  }
}

function keyTyped() {
  if (showInput) {
    if (key === '\n' || keyCode === ENTER) {
      zoomingIn = false;
      zoomingOut = true;
      showInput = false;
      for (let lf of lifeforms) lf.isDeclining = true;
    } else {
      nameInput += key;
    }
  }
}

// 생명체 클래스
class Lifeform {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.base = this.pos.copy();
    this.traces = [];
    this.birthTime = millis();
    this.lastCloneTime = millis();
    this.lastTraceTime = millis();
    this.size = 10;
    this.isDeclining = false;
    this.baseHue = random(190, 230);
    this.baseSat = random(40, 90);
    this.baseBri = random(80, 100);
    this.breathPhase = random(TWO_PI);
    this.traceSize = 5;
    this.childCount = 0;
    this.declineTime = random(15000, 16000);
  }
  update() {
    let move = p5.Vector.random2D().mult(random(0.6, 1.8));
    this.pos.add(move);
    let maxDist = 50;
    this.pos.x = constrain(this.pos.x, this.base.x - maxDist, this.base.x + maxDist);
    this.pos.y = constrain(this.pos.y, this.base.y - maxDist, this.base.y + maxDist);

    if (millis() - this.lastTraceTime > 2000) {
      let hue = this.baseHue + random(-10, 15);
      let sat = this.baseSat + random(-8, 10);
      let bri = this.baseBri + random(-15, 10);
      let alpha = 180 + random(-40, 40);
      this.traceSize = map(this.size, 10, 40, 4, 14, true);
      this.traces.push({
        x: this.pos.x,
        y: this.pos.y,
        col: color(hue, sat, bri, alpha),
        sz: this.traceSize
      });
      this.lastTraceTime = millis();
    }

    //핵심들

    if (this.traces.length > 3000) this.traces.shift();
    
    if (!this.isDeclining && millis() - this.birthTime > this.declineTime) this.isDeclining = true;

    if (!this.isDeclining && this.childCount < 3 && millis() - this.lastCloneTime > 5000) {
      lifeforms.push(new Lifeform(this.pos.x, this.pos.y));
      this.lastCloneTime = millis();
      this.childCount++;
    }
    
    if (!this.isDeclining) this.size += 0.05;
    else this.size -= 0.05;

  }
  display(noBreath) {
    let now = millis();
    let breath = 0;
    if (!noBreath) {
      breath = sin(now * 0.0035 + this.breathPhase) * (this.size * 0.06);
    }
    fill(this.baseHue, this.baseSat, this.baseBri, 150);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size + breath, this.size + breath);
    for (let t of this.traces) {
      fill(t.col);
      ellipse(t.x, t.y, t.sz, t.sz);
    }
  }
}

function getDensestRegion(traces) {
  let cellSizeX = 280, cellSizeY = 210, maxCount = 0, bestCell = { x: 0, y: 0 };
  let grid = {};
  for (let t of traces) {
    let keyX = floor(t.x / cellSizeX);
    let keyY = floor(t.y / cellSizeY);
    let key = keyX + "," + keyY;
    if (!grid[key]) grid[key] = 0;
    grid[key]++;
    if (grid[key] > maxCount) {
      maxCount = grid[key];
      bestCell = { x: keyX * cellSizeX + cellSizeX / 2, y: keyY * cellSizeY + cellSizeY / 2 };
    }
  }
  return { bestCell, maxCount };
}

function displayCharacter(){
  push();
  translate(mouseX, mouseY);
  scale(0.1);
  translate(-194, -151);
  strokeWeight(19/3); stroke(0);
  line(174,262,176, 297);
  line(221, 260,223, 295);
  noStroke(); fill(0);
  square(125, 137, 130);
  circle(194, 151, 120);
  circle(274, 176, 70);
  circle(259, 249, 80);
  circle(150, 253, 65);
  ellipse(123, 157, 70, 40);
  circle(119, 180, 50);
  noFill(); stroke(0); strokeWeight(10/3);
  bezier(194,95, 219, 88,243, 113, 255, 136);
  bezier(255, 136, 260, 142,270, 143,284, 142);
  point(256, 144);
  bezier(284, 142, 301, 143, 309, 158,310, 175);
  bezier(310, 175,304, 200, 298, 199, 277, 203);
  bezier(286, 203, 278, 210,277, 212,289, 226);
  point(273, 211);
  point(257, 209);
  bezier(291, 204, 288, 211, 288, 221, 296, 233);
  bezier(296, 233, 302, 250,296, 271, 282, 282);
  bezier(282, 282, 263,286,256, 281,243, 271 );
  strokeWeight(8/3);
  bezier(90,158,88,171,93,178,99,192);
  stroke(0, 0, 100);
  point(171, 149);
  point(211,148);
  pop();
}
