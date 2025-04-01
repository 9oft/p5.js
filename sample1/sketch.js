let x;
let y;

function setup() {
  createCanvas(400, 400);
  x = width/2;  //화면의 중심에 원의 중심을 두고…
  y = height/2;
  background(128);
}


function draw() {
  x += random(-3, 3);
  y += random(-3, 3); 

  x = constrain(x, 0, width);
  y = constrain(y, 0, height); 

  ellipse(x, y, 30, 30);
}