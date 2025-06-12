// Explanation overlay variables
let explanations = [];
let currentExplanation = null;
let explanationStartTime = 0;
let explanationDuration = 7000; // 7 seconds
let state = 0;
let button;

// Track if the second, third, and fourth explanations have started
let secondExplanationStarted = false;
let thirdExplanationStarted = false;
let fourthExplanationStarted = false;

// Typing progress for explanation overlay
let typingProgress = 0;

// Fifth explanation and fade-to-white variables
let fifthExplanationStarted = false;
let fifthExplanationStartTime = 0;
let fadeToWhite = false;
let fadeAlpha = 0;

let videoElement;
let justEnteredState2 = false;
let gifPlayed = false;
let showingGif = false;

let lifeforms = [];
let decayedColors = [];
let stillStartTime = 0;
let isStill = false;
let zoomingIn = false, zoomingOut = false;
let zoomFactor = 1, targetZoom = 1, zoomSpeed = 0.05;
let densestPoint = { x: 0, y: 0 };
let nameInput = "", showInput = false;
let globalTraces = [];
let alreadyZoomed = false, canCreateLife = true;

let tipX = null, tipY = null;
let prevTip;
let smoothedPos, velocity, acceleration;

let mpHands, mpCamera;
let video;
let avgBrightness = 255;
let smoothedBrightness = 255;

let paletteColors = [];
let paletteRects = [];
let selectedBaseHue = 0;    // default to white hue
let selectedBaseSat = 0;    // default to white saturation
let selectedBaseBri = 100;  // default to white brightness

let averageColorCalculated = false;

// Flash-related variables
let flashTriggered = false;
let flashPhase = 0;
let flashAlpha = 0;
let pendingZoomStart = false;
let averageColor;
let networkMode = false;
let flashStartTime = 0;


let selectingColor = false;
let colorOverlayAlpha = 0;

function nextState() {
  if (state === 1) {
    justEnteredState2 = true;
    gifPlayed = false;
  }
  if (state < 6) state++;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(20);
  textAlign(CENTER, CENTER);
  colorMode(HSB, 360, 100, 100, 255);

  paletteColors = [
    color(190, 50, 90),  // 파스텔 하늘색
    color(140, 40, 90),  // 파스텔 연두색
    color(55, 40, 100),  // 파스텔 노랑색
    color(0, 30, 100),   // 파스텔 분홍색
    color(0, 0, 100)     // 흰색
  ];

  averageColor = color(0, 0, 100, 0);

  button = createButton('다음');
  button.position(width - 80, height - 50);
  button.mousePressed(nextState);

  prevTip = createVector(0, 0);
  smoothedPos = createVector(width/2, height/2);
  velocity = createVector(0, 0);
  acceleration = createVector(0, 0);
  initMediaPipeHands();

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
}

function preload() {
  videoElement = createVideo("./video_999.mp4");
  videoElement.hide();
  Font1 = loadFont('BookkMyungjo_Bold.ttf');
  image1 = loadImage('./image9.png');
  image2 = loadImage('./image.png');
  image3 = loadImage('./image1.png');

}

function draw() {
  updateAverageBrightness();
  updateSpringMotion();

  if (selectingColor) {
    if (colorOverlayAlpha < 180) colorOverlayAlpha += 10;
    fill(0, colorOverlayAlpha * 0.6);
    noStroke();
    rect(0, 0, width, height);

    displayColorPalette();
    displayColorSelectionFeedback();


    if (
      state === 2 && gifPlayed &&
      tipX !== null && tipY !== null
    ) {
      let movement = p5.Vector.dist(smoothedPos, prevTip);
      let speed = velocity.mag();
      let angle = velocity.heading() + PI / 2;
      let offset = 0;
      if (movement > 30 && speed > 1.2) {
        offset = map(speed, 1.2, 8, -QUARTER_PI / 2, QUARTER_PI / 2, true);
      } else {
        offset = 0;
        angle = 0;
      }
      drawBlobCharacter(smoothedPos.x, smoothedPos.y, angle + offset);
    }
    return; // pause everything else
  } else if (!selectingColor && colorOverlayAlpha > 0) {
    colorOverlayAlpha -= 10;
    if (colorOverlayAlpha < 1) {
      colorOverlayAlpha = 0;
      // Do not clear paletteRects here — let selection logic handle it
    }
    fill(0, colorOverlayAlpha * 0.6);
    noStroke();
    rect(0, 0, width, height);
    if (
      state === 2 && gifPlayed &&
      tipX !== null && tipY !== null
    ) {
      let movement = p5.Vector.dist(smoothedPos, prevTip);
      let speed = velocity.mag();
      let angle = velocity.heading() + PI / 2;
      let offset = 0;
      if (movement > 30 && speed > 1.2) {
        offset = map(speed, 1.2, 8, -QUARTER_PI / 2, QUARTER_PI / 2, true);
      } else {
        offset = 0;
        angle = 0;
      }
      drawBlobCharacter(smoothedPos.x, smoothedPos.y, angle + offset);
    }
  }

  smoothedBrightness = lerp(smoothedBrightness, avgBrightness, 0.05);
  background(0, 0, map(smoothedBrightness, 0, 255, 0, 100));
  // Draw blocking rect if showingGif is true
  if (showingGif) {
    fill(0);
    noStroke();
    rect(0, 0, width, height);
  }

  if (state === 0) showIntro();
  else if (state === 1) showIntroDescribe1();
  else if (state === 2) {
    if (justEnteredState2 && !gifPlayed) {
      playGifAnimation();
    } else if (!justEnteredState2 && gifPlayed) {
      showContent();
    }
  }
  else if (state === 3) showIntroDescribe2();
  else if (state === 4) showOutro1();
  else if (state === 5) showOutro2();
  else if (state === 6) showOutro3();



  // Color overlay block for palette/feedback (when not selectingColor but overlay is visible)
  if (!selectingColor && colorOverlayAlpha > 0) {
    fill(0, colorOverlayAlpha * 0.6);
    noStroke();
    rect(0, 0, width, height);
    // displayColorPalette(); // REMOVED as per instructions
    displayColorSelectionFeedback();
    // drawBlobCharacter after overlays, if tip is present
    if (
      state === 2 && gifPlayed &&
      tipX !== null && tipY !== null
    ) {
      let movement = p5.Vector.dist(smoothedPos, prevTip);
      let speed = velocity.mag();
      let angle = velocity.heading() + PI / 2;
      let offset = 0;
      if (movement > 30 && speed > 1.2) {
        offset = map(speed, 1.2, 8, -QUARTER_PI / 2, QUARTER_PI / 2, true);
      } else {
        offset = 0;
        angle = 0;
      }
      drawBlobCharacter(smoothedPos.x, smoothedPos.y, angle + offset);
    }
  }

  // Always render the character when overlays are not present and state is active
  if (
    state === 2 && gifPlayed &&
    !selectingColor &&
    colorOverlayAlpha === 0 &&
    tipX !== null &&
    tipY !== null
  ) {
    let movement = p5.Vector.dist(smoothedPos, prevTip);
    let speed = velocity.mag();
    let angle = velocity.heading() + PI / 2;
    let offset = 0;
    if (movement > 30 && speed > 1.2) {
      offset = map(speed, 1.2, 8, -QUARTER_PI / 2, QUARTER_PI / 2, true);
    } else {
      offset = 0;
      angle = 0;
    }
    drawBlobCharacter(smoothedPos.x, smoothedPos.y, angle + offset);
  }

  if (flashTriggered) {
    // Move the trigger for the third explanation here, before the flash drawing logic
    if (flashPhase === 0 && !thirdExplanationStarted) {
      currentExplanation = {
        title: "화양연화",
        body: "인생에서 가장 아름다운 시절을 뜻하는 화양연화, \n당신의 공간을 가득 채운 색들이 얽히고설켜 하나의 아름다운 순간을 만들었습니다.",
        duration: 10000
      };
      explanationStartTime = millis();
      thirdExplanationStarted = true;
    }
    if (flashPhase < 30) { // 0.5초 페이드 인
      flashAlpha = map(flashPhase, 0, 30, 0, 255);
    } else if (flashPhase < 75) { // 1.5초 유지
      flashAlpha = 255;
    } else if (flashPhase < 105) { // 1초 페이드 아웃
      flashAlpha = map(flashPhase, 75, 105, 255, 0);
    }

    averageColor.setAlpha(flashAlpha);
    fill(averageColor);
    noStroke();
    rect(0, 0, width, height);
    flashPhase++;

    if (flashPhase >= 105) {
      flashStartTime = millis();
      flashAlpha = 0;
      flashTriggered = false;
      if (pendingZoomStart) {
        zoomingIn = true;
        showInput = true;
        nameInput = "";
        alreadyZoomed = true;
        pendingZoomStart = false;
      }
    }
  }

  // Display explanation overlay at the very end
  displayExplanationOverlay();
  if (
  fourthExplanationStarted &&
  !fifthExplanationStarted &&
  millis() - explanationStartTime > currentExplanation.duration
) {
  currentExplanation = {
    title: "\n특별한 순간과 색들을 간직한 채로,\n앞으로도 당신의 세상을 더 다채롭게 채워가며 \n 나아가길 바랍니다.",
    body: "",
    duration: 15000
  };
  explanationStartTime = millis();
  fifthExplanationStarted = true;
  fifthExplanationStartTime = millis();
}

  // Fade to white logic after fifth explanation
  if (fifthExplanationStarted && millis() - fifthExplanationStartTime > 7000) {
    fadeToWhite = true;
  }

  // Only show fade-to-white overlay during state 2, and reset after complete
  if (fadeToWhite && state === 2) {
    fadeAlpha = min(fadeAlpha + 2, 255);
    fill(0, 0, 100, fadeAlpha);
    noStroke();
    rect(0, 0, width, height);
    if (fadeAlpha >= 255) {
      fadeToWhite = false;
      fadeAlpha = 0;
    }
  }
}

function initMediaPipeHands() {
  const videoElement = document.getElementById('mpVideo');
  mpHands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  mpHands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });
  mpHands.onResults(onHandResults);
  mpCamera = new Camera(videoElement, {
    onFrame: async () => { await mpHands.send({ image: videoElement }); },
    width: 640,
    height: 480
  });
  mpCamera.start();
}

function onHandResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const lm = results.multiHandLandmarks[0];
    tipX = (1 - lm[8].x) * width;
    tipY = lm[8].y * height;

    let closed = 0;
    [[8,5],[12,9],[16,13],[20,17]].forEach(pair => {
      if (lm[pair[0]].y > lm[pair[1]].y) closed++;
    });
    if (closed === 4) {
      // Only open color selection when not already selecting and no zoom/flash/input in progress, and only if state === 2
      if (
        //팔레트 관련하여 문제가 많았어서 계속 조건들 두게 됨.
        state === 2 &&
        !selectingColor &&
        !zoomingIn &&
        !zoomingOut &&
        !flashTriggered &&
        !pendingZoomStart &&
        !showInput &&
        !alreadyZoomed &&
        !showingGif &&
        !(currentExplanation && millis() - explanationStartTime < (currentExplanation.duration || 7000))
      ) {
        selectingColor = true;
        colorOverlayAlpha = 0;
      }
      //console.log("ROCK!");
    }
  } else {
    tipX = tipY = null;
    isStill = false;
  }
}
// 코드 구현 도움 받음
function displayColorSelectionFeedback() {
  if (tipX !== null && tipY !== null) {
    for (let rect of paletteRects) {
      if (dist(tipX, tipY, rect.x, rect.y) < rect.w / 2) {
        if (!rect.enterTime) rect.enterTime = millis();
        let duration = millis() - rect.enterTime;
        noFill();
        stroke(255,100);
        strokeWeight(2);
        ellipse(rect.x, rect.y, 30 + sin(millis()*0.01)*2); //부드러운 운동
        // Require tip to stay for >2000ms to confirm color selection
        if (duration > 2000) {
          selectedBaseSat = rect.sat;
          selectedBaseBri = rect.bri;
          selectedBaseHue = rect.hue;
          selectingColor = false;
          colorOverlayAlpha = 0;
          paletteRects = [];
          return; // Exit early to prevent multiple palette interactions
        }
      } else {
        delete rect.enterTime;
      }
    }
  }
}








function showIntro() {
  background(0);
  fill(250);
  textSize(40);
  textFont(Font1);
  text("화양연화", width/2, height/2);
  textSize(20);
  text("당신과 색들이 만들어낸 가장 아름다운 순간", width/2, height/2 + 50);
}

function showIntroDescribe1() {
  background(0);
  fill(250);
  textAlign(LEFT);
  textFont(Font1);
  textSize(25);
  text(
    "이것은 색(의미)의 생성과 성장, \n" +
    "퇴보와 소멸 \n" +
    "그리고 그 사이의 가장 아름다운 순간을 그려내며 \n" +
    "생명력 있어 보이는 것들과의 관계 속, \n" + 
    "여러 찰나의 순간들을 담아낸 작품입니다.", 40, height/2 - 50);
  text("당신을 이끌기 위해 사용할 손가락과 도구가 될 숫자 1, 2, 3키에 신경 써주세요.",40,height/2 + 150);
  textSize(20);
  textAlign(CENTER);
}

function showIntroDescribe2() {
  background(0);
  fill(250);
  textSize(40);
  text("에필로그", width/2, 60);
  textAlign(LEFT);
  textSize(20);
  text("에필로그", width/2, 100);
  textSize(15);
  text(
    "주변의 다양한 것들 중 생각이 머문 것은 나의 세상에서 ‘하나의 의미’로 자라난다.\n" +
    "머문 것과 오래 지낼수록 더 다양한 의미들이 생겨나며, 의미가 생명처럼 형성되고 깊어진다.\n" +
    "그러다 여러 의미들이 겹쳐지고 섞이면서 강렬한 인상을 남기는 ‘화양연화’의 순간을 맞이한다.",
    4, height/2 + 10
  );
  text(
    "알게 모르게 찾아온 그 순간은 ‘하나의 뜻’으로 남아 평생토록 간직된다.\n" +
    "이후 생명(의미)들과의 관계는 쇠퇴해가고, 마침내 소멸하지만 그 자리엔 색(본질)을 남긴다.\n" +
    "남겨진 색은 나의 세상 어딘가에서, 조용히 하나의 배경으로 작용한다.",
    4, height/2 + 75
  );
  textAlign(CENTER);
}

function showOutro1() {
  textAlign(CENTER);
  background(0);
  fill(250);
  textSize(40);
  text("Credit", width/2, height/2 - 150);
  textAlign(LEFT);
  textSize(20);
  text("박희연", width/2-420, height/2 - 40);
  text("이승빈", width/2-420, height/2 + 20);
  text("주지현", width/2-420, height/2 + 120);

  text("이번 프로젝트에서는 다양한 역할을 수행하며 협업의 흐름을 이해할 수 있었습니다.\n 예정보다 빠듯해진 일정 속에서 변수에 대비한 유연한 시간 관리의 중요성도 깊이 느꼈습니다.", width/2-350, height/2 - 40);
  text("이번 팀플레이 과제에서는 각자 개발한 부분을 하나로 통합하는 작업이 중요하다는 것을 깨달았습니다. \n코드 충돌을 최소화하고 원활한 연동을 위해 협업의 중요성을 체감했습니다.\n 기능 통합 과정에서 발생한 오류를 함께 해결하면서 협업에 대한 장단점에 대해 깨달았습니다.", width/2 -350, height/2 + 40);
  text("이번 팀플레이를 통해 소통의 방법, 각 개인의 능력치를 최대로 이용하는 효율적인 과업 분배,\n 좋은 주제 선정과 내용 등 어떻게 해야 더 좋은 결과물을 낼 수 있을지에 대해 고민했지만\n 어설픈 지점들을 더 많이 느꼈던 것 같다. \n여러 고충들을 통해 더 좋은 방향으로 팀플레이를 이끄는 방법들을 깨닫게 된 것 같다.", width/2 -350, height/2 + 155);
}

function showOutro2() {
  background(0);
  fill(250);
  textSize(40);
  textAlign(CENTER);
  text("AI를 이용해 제작한 콘텐츠:", width/2, height/2 - 150);
  textAlign(LEFT);
  textSize(20);
  text("미디어파이프 핸즈 모델 이용", width/2 - 300, height/2 - 40);
  text("코드 구현 과정에서 GPT-4o, o4-mini-high 모델 이용", width/2 - 300, height/2 + 80);
  text("|전체적으로는 약 50~60% 정도 AI 기여 추정 AI는 손 인식, 색상 선택, 애니메이션 구현 등 구현에 초점,\n|사용자는 철학적 의도와 시각적 구조, 필요한 함수 제안 및 설계, 디렉팅 역할을 수행.", width/2 - 270, height/2 + 120);
  image(image1, width/2 -200, height/2 + 200, 300, 200);
}

function showOutro3() {
  background(0);
  fill(250);
  textSize(40);
  textAlign(CENTER);
  text("사용한 문법적인 사항과 기능", width/2, height/2 - 150);
  textAlign(LEFT);
  textSize(20);
  text("JavaScript 문법 요소", width/2 - 400, height/2 - 40);
  text("p5.js 문법 요소", width/2 + 50, height/2 - 40);
  text("외부 라이브러리 사용: MediaPipe Hands (Google)", width/2 + 300, height/2 + 50);
  text("클래스 문법 이용(Lifeform class)", width/2 + 300, height/2 + 130);
  image(image2, width/2 - 400, height/2 + 50, 200, 400);
  image(image3, width/2 + 10, height/2 + 50, 200, 400);

}









//코드 구현 도움 받음
function showContent() {
  globalTraces = [];
  let isFrozen = zoomingIn || zoomingOut || showInput;
  if (zoomingIn || zoomingOut) {
    push();
    translate(width/2, height/2);
    scale(zoomFactor);
    translate(-densestPoint.x, -densestPoint.y);
  }
  canCreateLife = !showInput && !zoomingIn && !zoomingOut && !allDeclining();
  if (!isFrozen) {
    createLifeformIfFingerStill();
    for (let i = lifeforms.length - 1; i >= 0; i--) {
      let lf = lifeforms[i];
      lf.update();
      lf.display(false);
      if (lf.size < 0.2) {
        decayedColors.push(color(lf.baseHue, lf.baseSat, lf.baseBri));
        lifeforms.splice(i, 1);
      } else {
        lf.traces.forEach(t => globalTraces.push(t));
      }
    }
  } else {
    lifeforms.forEach(lf => {
      lf.display(true);
      lf.traces.forEach(t => globalTraces.push(t));
    });
  }

  //이 함수설계도움받음
  if (networkMode) {
  stroke(0, 0, 100);
  strokeWeight(1);
  // connect each lifeform to its two nearest neighbors
  for (let lf of lifeforms) {
    let neighbors = lifeforms
      .filter(o => o !== lf)
      .map(o => ({ node: o, d: dist(lf.pos.x, lf.pos.y, o.pos.x, o.pos.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (let nb of neighbors) {
      line(lf.pos.x, lf.pos.y, nb.node.pos.x, nb.node.pos.y);
    }
  }
  noStroke();
  }


  if (zoomingIn || zoomingOut) pop();
  triggerZoomIfDenseCellFilled();
  updateZoomAnimations();
  displayInputIfNeeded();
}

function createLifeformIfFingerStill() {
  if (tipX == null) return;
  let current = createVector(tipX, tipY);
  let d = p5.Vector.dist(current, prevTip);
  if (d < 10 && canCreateLife) {
    console.log("손가락이 충분히 가만히 있음", millis() - stillStartTime);
    if (!isStill) {
      stillStartTime = millis();
      isStill = true;
    } else if (millis() - stillStartTime > 1600) {
      // Trigger the second explanation overlay only once, before the first shape is created
      if (!secondExplanationStarted) {
        setTimeout(() => {
          currentExplanation = {
            title: "성장",
            body: "색은 당신의 세상(공간) 속에서 숨 쉬고 움직이면서 흔적을 남기고, 자식도 낳아가며 성장해갑니다.\n더 많은 색들을 탄생시켜, 당신의 공간을 가득 채워주세요.\n \n숫자 키인 1은 망각하게 이끌어주고\n2는 기존의 색을 더 크게  3은 더 작게 만들어주고\n  마지막으로 4는 가시적인 관계를 보여줄 거예요",
            duration: 19000
          };
          explanationStartTime = millis();
        }, 5000); // Delay by 5 seconds
        secondExplanationStarted = true;
      }
      // Apply initial random variation ±15 to the selected base color,
      // and lock white (baseSat ≤ 0) to hue and saturation
      let initHue, initSat, initBri;
      if (selectedBaseSat <= 0) {
        initHue = selectedBaseHue;
        initSat = 0;
        initBri = selectedBaseBri + random(-15, 15);
      } else {
        initHue = selectedBaseHue + random(-15, 15);
        initSat = selectedBaseSat + random(-15, 15);
        initBri = selectedBaseBri + random(-15, 15);
      }
      lifeforms.push(new Lifeform(
        tipX, tipY,
        initHue, initSat, initBri
      ));
      // Immediately display the newly created lifeform so it is visible right away
      lifeforms[lifeforms.length - 1].display(false);
      stillStartTime = millis();
    }
  } else {
    isStill = false;
  }
  prevTip = current.copy();
}

function allDeclining() {
  return lifeforms.length > 0 && lifeforms.every(lf => lf.isDeclining);
}

function triggerZoomIfDenseCellFilled() {
  if (!alreadyZoomed && !zoomingIn && !zoomingOut) {
    let { bestCell, maxCount } = getDensestRegion(globalTraces);
    if (maxCount >= 1600) {

      densestPoint = bestCell;
      targetZoom = min(width/480, height/360);
      zoomSpeed = 0.06;
      if (lifeforms.length > 0) {
        let totalHue = 0, totalSat = 0, totalBri = 0;
        lifeforms.forEach(lf => {
          totalHue += lf.baseHue;
          totalSat += lf.baseSat;
          totalBri += lf.baseBri;
        });
        let avgHue = totalHue / lifeforms.length;
        let avgSat = totalSat / lifeforms.length;
        let avgBri = totalBri / lifeforms.length;
        averageColor = color(avgHue, avgSat, avgBri, 0);
      } else {
        averageColor = color(0, 0, 100, 0);
      }
      // Instead of enabling zoom directly, trigger flash and set pendingZoomStart
      if (!flashTriggered && !zoomingIn && !zoomingOut && !showInput) {
        flashTriggered = true;
        flashPhase = 0;
        flashAlpha = 0;
        pendingZoomStart = true;
      }
    }
  }
}

function updateZoomAnimations() {
  if (zoomingIn && zoomFactor < targetZoom) {
    // Only calculate averageColor once before zooming in
    if (!averageColorCalculated) {
      averageColor = getAverageDecayedColor();
      averageColorCalculated = true;
    }
    zoomFactor += zoomSpeed * (targetZoom - zoomFactor);
    if (zoomFactor >= targetZoom - 0.01) {
      zoomFactor = targetZoom;
      zoomSpeed = 0.01;
    }
  }
  // Throttle the check for zoom-in trigger using frameCount % 3 === 0
  if (
    !zoomingIn &&
    flashPhase === 1 &&
    frameCount % 3 === 0 &&
    millis() - flashStartTime > 2000
  ) {
    console.log("줌 트리거 조건 충족");
    zoomingIn = true;
  }
  if (zoomingOut) {
    zoomFactor -= 0.04 * (zoomFactor - 1);
    if (zoomFactor <= 1.01) {
      zoomFactor = 1;
      zoomingOut = false;
    }
  }
}

function displayInputIfNeeded() {
  // Bold-effect text drawing function
  function drawBoldText(txt, x, y) {
    for (let dx = -0.5; dx <= 0.5; dx += 0.5) {
      for (let dy = -0.5; dy <= 0.5; dy += 0.5) {
        text(txt, x + dx, y + dy);
      }
    }
  }
  if (showInput) {
    fill(250, 30);
    rect(0, 0, width, height);
    fill(0);
    textAlign(LEFT);
    textSize(28);
    let inputPrompt = "이 순간은 온전히 당신과 색들이 만들어냈습니다.\n사라지기 전, 이 순간을 당신의 언어로 남겨주세요 \n :" + nameInput;
    let lines = inputPrompt.split("\n");
    for (let i = 0; i < lines.length; i++) {
      drawBoldText(lines[i], width/2 - 430, height/2 + 240 + i * 32);
    }
  }
}

function keyTyped() {
  if (showInput) {
    if (key === '\n' || keyCode === ENTER) {
      zoomingIn = false;
      // Insert fourth explanation overlay before zoomingOut
      if (!fourthExplanationStarted) {
        currentExplanation = {
          title: "퇴보 그리고 소멸",
          body: "사실 우리가 알게 모르게 일찍 태어난 색들은 퇴보하고 있었습니다.\n소멸된 색은 당신의 몸속에 하나의 배경색으로 남아 평생을 함께합니다.",
          duration: 15000
        };
        explanationStartTime = millis();
        fourthExplanationStarted = true;
      }
      zoomingOut = true;
      showInput = false;
      lifeforms.forEach(lf => lf.isDeclining = true);
    } else {
      nameInput += key;
    }
  }
}

// 1번 누르면 모든 자식과 흔적 클리어
// 2번 누르면 lifeform과 trace 크기를 각각 10씩 증가
function keyPressed() {
  if (key === '1') {
    // lifeforms 배열을 비우고 전역 흔적도 초기화
    lifeforms = [];
    globalTraces = [];
  } else if (key === '2') {
    // Smooth increase
    lifeforms.forEach(lf => {
      lf.pendingSizeDelta = (lf.pendingSizeDelta || 0) + 10;
      lf.traces.forEach(t => {
        t.pendingSzDelta = (t.pendingSzDelta || 0) + 10;
      });
    });
  } else if (key === '3') {
    // Smooth decrease
    lifeforms.forEach(lf => {
      lf.pendingSizeDelta = (lf.pendingSizeDelta || 0) - 10;
      lf.traces.forEach(t => {
        t.pendingSzDelta = (t.pendingSzDelta || 0) - 10;
      });
    });
  } else if (key === '4') {
    networkMode = !networkMode;
  }
}

class Lifeform {
  constructor(x, y, baseHue = null, baseSat = null, baseBri = null) {
    this.pos = createVector(x, y);
    this.base = this.pos.copy();
    this.traces = [];
    this.birthTime = millis();
    this.lastCloneTime = millis();
    this.lastTraceTime = millis();
    this.size = 10;
    this.isDeclining = false;
    this.baseHue = baseHue !== null && baseHue !== undefined ? baseHue : random(190, 230);
    this.baseSat = baseSat !== null && baseSat !== undefined ? baseSat : random(40, 90);
    this.baseBri = baseBri !== null && baseBri !== undefined ? baseBri : random(80, 100);
    this.breathPhase = random(TWO_PI);
    this.childCount = 0;
    this.declineTime = random(15000, 16000);
    this.baseDirection = p5.Vector.random2D();
    this.directionNoiseOffset = random(1000);
    this.lastDirectionChange = millis();
    this.pendingSizeDelta = 0;
    // Precompute static radial gradient layers for this blob
    this.gradientLayers = 30;
    this.gradientData = [];
    for (let i = this.gradientLayers; i >= 1; i--) {
      const t = i / this.gradientLayers;
      const alpha = map(i, 1, this.gradientLayers, 0, 200);
      const offsetX = random(-2, 2);
      const offsetY = random(-2, 2);
      this.gradientData.push({ t, alpha, offsetX, offsetY });
    }
  }
  update() {
        // Smooth size adjustments
    if (this.pendingSizeDelta !== 0) {
      const step = this.pendingSizeDelta > 0 ? 1 : -1;
      this.size += step;
      this.pendingSizeDelta -= step;
    }
    let moveSpeed = map(avgBrightness, 0, 255, 0.8, 3.5);
    if (this.isDeclining) moveSpeed *= 0.6;
    if (millis() - this.lastDirectionChange > 1000) {
      this.baseDirection = p5.Vector.random2D();
      this.lastDirectionChange = millis();
    }
    let angleOffset = noise(this.directionNoiseOffset) * QUARTER_PI - QUARTER_PI / 2;
    let dynamicDirection = p5.Vector.random2D();
    let direction = p5.Vector.lerp(this.baseDirection, dynamicDirection, 0.1).rotate(angleOffset);
    direction.setMag(moveSpeed);
    let move = direction;
    this.pos.add(move);
    if (move.mag() < 0.01) {
      move = p5.Vector.random2D().mult(0.5);
      this.pos.add(move);
    }
    let maxDistance = 50;
    let toBase = p5.Vector.sub(this.base, this.pos);
    if (toBase.mag() > maxDistance) {
      toBase.normalize().mult(0.8); // stronger return force
      this.pos.add(toBase);
    }

    // Adjust growth rate based on avgBrightness
    let traceInterval = map(avgBrightness, 0, 255, 4000, 500);  // traces appear faster in bright light
    let cloneInterval = map(avgBrightness, 0, 255, 10000, 2000); // clones appear faster in bright light

    if (millis() - this.lastTraceTime > traceInterval) {
      // Widened variability: hue ±15, saturation ±15, brightness ±15
      let hueVar, satVar, briVar;
      if (this.baseSat <= 0) {
        hueVar = this.baseHue;
        satVar = 0;
        briVar = this.baseBri + random(-15, 15);
      } else {
        hueVar = this.baseHue + random(-15, 15);
        satVar = this.baseSat + random(-15, 15);
        briVar = this.baseBri + random(-15, 15);
      }
      let alpha = 180 + random(-40, 40);
      let sz = map(this.size, 10, 40, 4, 14, true);
      this.traces.push({ x: this.pos.x, y: this.pos.y, col: color(hueVar, satVar, briVar, alpha), sz });
      this.lastTraceTime = millis();
      if (this.traces.length > 3000) this.traces.shift();
    }
    if (!this.isDeclining && millis() - this.birthTime > this.declineTime) this.isDeclining = true;
    if (!this.isDeclining && this.childCount < 3 && millis() - this.lastCloneTime > cloneInterval) {
      lifeforms.push(new Lifeform(
        this.pos.x,
        this.pos.y,
        this.baseHue,
        this.baseSat,
        this.baseBri
      ));
      this.lastCloneTime = millis();
      this.childCount++;
    }
    this.size += this.isDeclining ? -0.15 : 0.05;
    this.directionNoiseOffset += 0.01;
  }
  display(noBreath) {
    let breath = noBreath
      ? 0
      : sin(millis() * 0.0035 + this.breathPhase) * (this.size * 0.06);

    fill(this.baseHue, this.baseSat, this.baseBri, 150);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size + breath);
    // Draw gradient sphere instead of solid ellipse
    // Smooth trace size adjustments
    this.traces.forEach(t => {
      if (t.pendingSzDelta) {
        const step = t.pendingSzDelta > 0 ? 1 : -1;
        t.sz += step;
        t.pendingSzDelta -= step;
      }
    });

    this.traces.forEach(t => {
      fill(t.col);
      ellipse(t.x, t.y, t.sz);
    });
  }
}

function getDensestRegion(traces) {
  let cellSizeX = 280, cellSizeY = 210, maxCount = 0, bestCell = { x: 0, y: 0 }, grid = {};
  traces.forEach(t => {
    let keyX = floor(t.x / cellSizeX), keyY = floor(t.y / cellSizeY), key = `${keyX},${keyY}`;
    grid[key] = (grid[key] || 0) + 1;
    if (grid[key] > maxCount) {
      maxCount = grid[key];
      bestCell = { x: keyX * cellSizeX + cellSizeX / 2, y: keyY * cellSizeY + cellSizeY / 2 };
    }
  });
  return { bestCell, maxCount };
}

function displayCharacterAt(x, y, angle = 0) {
  push();
  translate(x, y);
  rotate(angle);
  scale(0.1);
  translate(-194, -151);
  strokeWeight(19 / 3); stroke(0);
  line(174, 262, 176, 297); line(221, 260, 223, 295);
  noStroke(); fill(0);
  square(125, 137, 130);
  circle(194, 151, 120); circle(274, 176, 70);
  circle(259, 249, 80); circle(150, 253, 65);
  ellipse(123, 157, 70, 40); circle(119, 180, 50);
  noFill(); stroke(0); strokeWeight(10 / 3);
  beginShape(); vertex(194, 95); bezierVertex(219, 88, 243, 113, 255, 136); bezierVertex(260, 142, 270, 143, 284, 142); endShape();
  beginShape(); vertex(284, 142); bezierVertex(301, 143, 309, 158, 310, 175); bezierVertex(304, 200, 298, 199, 277, 203); bezierVertex(278, 210, 277, 212, 289, 226); endShape();
  strokeWeight(8 / 3); beginShape(); vertex(90, 158); bezierVertex(88, 171, 93, 178, 99, 192); endShape();
  noStroke(); fill('rgb(0,0,100)'); circle(171, 149, 4); circle(211, 148, 4);
  pop();
}

function updateAverageBrightness() {
  video.loadPixels();
  if (video.pixels.length === 0) return;
  let centerX = video.width / 2;
  let centerY = video.height / 2;
  let regionSize = 20;
  let totalBrightness = 0;
  let count = 0;

  for (let x = centerX - regionSize / 2; x < centerX + regionSize / 2; x++) {
    for (let y = centerY - regionSize / 2; y < centerY + regionSize / 2; y++) {
      let index = (int(x) + int(y) * video.width) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];

      let brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      count++;
    }
  }

  avgBrightness = totalBrightness / count;
}

function updateSpringMotion() {
  if (tipX !== null && tipY !== null) {
    let target = createVector(tipX, tipY);
    let force = p5.Vector.sub(target, smoothedPos).mult(0.1); // spring strength
    acceleration = force;
    velocity.add(acceleration);
    velocity.mult(0.85); // damping
    smoothedPos.add(velocity);
  }
}

function displayColorPalette() {
  if (!selectingColor) return;
  // Center and dimensions
  const cx = width / 2;
  const cy = height / 2;
  const n = paletteColors.length;
  const innerRadius = 110;
  const outerRadius = min(width, height) * 0.5 + 40;
  const angleStep = TWO_PI / n;

  // Generate paletteRects once when first displaying
  if (paletteRects.length === 0) {
    for (let i = 0; i < n; i++) {
      const baseAngle = i * angleStep - HALF_PI;
      const nextAngle = baseAngle + angleStep;
      // Compute the midpoint for the color hit area
      const midAngle = (baseAngle + nextAngle) / 2;
      const rx = cx + cos(midAngle) * (innerRadius + outerRadius) / 2;
      const ry = cy + sin(midAngle) * (innerRadius + outerRadius) / 2;
      const w = outerRadius * 0.28;
      paletteRects.push({
        x: rx,
        y: ry,
        w,
        hue: hue(paletteColors[i]),
        sat: saturation(paletteColors[i]),
        bri: brightness(paletteColors[i])
      });
    }
  }

  // Draw each wedge segment every frame
  for (let i = 0; i < n; i++) {
    const baseAngle = i * angleStep - HALF_PI;
    const nextAngle = baseAngle + angleStep;
    const baseHue = hue(paletteColors[i]);
    const baseSat = saturation(paletteColors[i]);
    const baseBri = brightness(paletteColors[i]);
    const radialSteps = 40;
    const angularSteps = 2;
    for (let r = 0; r < radialSteps; r++) {
      const r0 = innerRadius + (outerRadius - innerRadius) * (r / radialSteps);
      const r1 = innerRadius + (outerRadius - innerRadius) * ((r + 1) / radialSteps);
      const sat0 = lerp(baseSat * 0.65, min(100, baseSat * 1.25), r / radialSteps);
      const bri0 = lerp(baseBri, max(30, baseBri * 0.65), r / radialSteps);
      const sat1 = lerp(baseSat * 0.65, min(100, baseSat * 1.25), (r + 1) / radialSteps);
      const bri1 = lerp(baseBri, max(30, baseBri * 0.65), (r + 1) / radialSteps);
      beginShape();
      for (let a = 0; a <= angularSteps; a++) {
        const angle = lerp(baseAngle, nextAngle, a / angularSteps);
        vertex(cx + cos(angle) * r0, cy + sin(angle) * r0);
        fill(baseHue, sat0, bri0, 240);
      }
      for (let a = angularSteps; a >= 0; a--) {
        const angle = lerp(baseAngle, nextAngle, a / angularSteps);
        vertex(cx + cos(angle) * r1, cy + sin(angle) * r1);
        fill(baseHue, sat1, bri1, 240);
      }
      endShape(CLOSE);
    }
  }

  // Draw central circle to cover the inner hole
  fill(0, 0, 100, 255);
  noStroke();
  ellipse(cx, cy, innerRadius * 2);
}

/*
function mousePressed() {
  for (let rect of paletteRects) {
    if (dist(mouseX, mouseY, rect.x, rect.y) < rect.w / 2) {
      selectedBaseHue = rect.hue;
      //console.log("Selected hue:", selectedBaseHue);
      break;
    }
  }
}
*/
function playGifAnimation() {
  let w = windowWidth;
  let h = windowWidth * 9 / 16;
  if (h > windowHeight) {
    h = windowHeight;
    w = windowHeight * 16 / 9;
  }

  videoElement.size(w, h);
  videoElement.position((windowWidth - w) / 2, (windowHeight - h) / 2);
  videoElement.show();
  videoElement.play();
  showingGif = true;
  justEnteredState2 = false;

  videoElement.onended(() => {
    videoElement.hide();
    gifPlayed = true;
    showingGif = false;
    currentExplanation = {
      title: "탄생",
      body: "당신은 색(의미)들로 가득 찰 잠재력을 지닌 무의 공간에서 깨어났습니다.\n주먹을 쥐고, 관계를 맺고 싶은 색에 머물러주세요.\n한자리에 머물다 보면 색이 태어날 거예요.",
      duration: 14000
    };
    explanationStartTime = millis();
  });
}
function getAverageDecayedColor() {
  if (decayedColors.length === 0) return color(200); // default gray
  let h = 0, s = 0, b = 0;
  for (let c of decayedColors) {
    h += hue(c);
    s += saturation(c);
    b += brightness(c);
  }
  return color(h / decayedColors.length, s / decayedColors.length, b / decayedColors.length);
}

function drawBlobCharacter(x, y, angle = 0) {
  push();
  translate(x, y);
  rotate(angle);
  scale(0.3);
  translate(-200, -200);

  stroke(0);
  strokeWeight(4);
  fill(getAverageDecayedColor());

  let radii = [80, 60, 70, 55, 75, 65, 70, 55, 80, 60];
  let m = radii.length;
  beginShape();
  for (let j = m - 2; j < m; j++) {
    let angle = -HALF_PI + TWO_PI * j / m;
    let r = radii[j];
    // curveVertex(cos(angle) * r + 200, sin(angle) * r + 200);
  }
  for (let i = 0; i < m; i++) {
    let angle = -HALF_PI + TWO_PI * i / m;
    let r = radii[i];
    curveVertex(cos(angle) * r + 200, sin(angle) * r + 200);
  }
  for (let i = 0; i < 2; i++) {
    let angle = -HALF_PI + TWO_PI * i / m;
    let r = radii[i];
    curveVertex(cos(angle) * r + 200, sin(angle) * r + 200);
  }
  endShape(CLOSE);

  // 눈
  stroke(0);
  strokeWeight(3);
  fill(255);
  ellipse(175, 180, 30, 20);
  ellipse(225, 180, 30, 20);
  fill(0);
  noStroke();
  ellipse(175, 180, 12, 12);
  ellipse(225, 180, 12, 12);

  // 다리
  stroke(0);
  strokeWeight(4);
  fill(255);
  arc(180, 265, 15, 30, 0, PI);
  arc(220, 268, 15, 30, 0, PI);

  pop();
}
// 오버레이 관련 도움 받음
function displayExplanationOverlay() {
  if (
    currentExplanation
  ) {
    if (millis() - explanationStartTime > (currentExplanation.duration || 7000) + 500) return;
    let alpha = 255;
    let centerX = width / 2;
    let gradientHeight = 400;
    let gradientWidth = 600;
    noStroke();
    let step = 4; // increased step size for performance
    for (let x = -gradientWidth; x <= gradientWidth; x += step) {
      for (let y = 0; y <= gradientHeight; y += step) {
        let alphaY = map(y, 0, gradientHeight, 255, 0);
        let alphaX = map(abs(x), 0, gradientWidth, 1, 0);
        fill(0, 255 * (alphaY * alphaX) / 255);
        rect(centerX + x, y, step, step);
      }
    }
    fill(255);
    textAlign(CENTER);
    textFont(Font1);
    textSize(40);
    text(currentExplanation.title, width / 2, 55);
    textSize(23);

    // Gradually reveal explanation body text only if state === 2
    let fullText = currentExplanation.body;
    let shownText = fullText;
    if (state === 2) {
      let elapsed = millis() - explanationStartTime;
      // Increase typing speed: use fullText.length * 1.5
      let maxChars = floor(map(elapsed, 0, currentExplanation.duration || 7000, 0, fullText.length * 1.3));
      shownText = fullText.substring(0, maxChars);
    }
    let lines = shownText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], width/2, 100 + i * 28);
    }
  }
}
