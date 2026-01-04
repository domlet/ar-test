let hiroTex;
let angle = 0;

function preload() {
  hiroTex = loadImage("img/hiro.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
}

function draw() {
  background(220);
  // rotateY(angle);
  // rotateX(angle * 0.6);
  // angle += 0.005;
  noStroke();
  texture(hiroTex);
  let s = 150;

  // FRONT
  beginShape();
  vertex(-s, -s, s, 0, 0);
  vertex(s, -s, s, 1, 0);
  vertex(s, s, s, 1, 1);
  vertex(-s, s, s, 0, 1);
  endShape(CLOSE);
  // BACK
  beginShape();
  vertex(s, -s, -s, 0, 0);
  vertex(-s, -s, -s, 1, 0);
  vertex(-s, s, -s, 1, 1);
  vertex(s, s, -s, 0, 1);
  endShape(CLOSE);
  // RIGHT
  beginShape();
  vertex(s, -s, s, 0, 0);
  vertex(s, -s, -s, 1, 0);
  vertex(s, s, -s, 1, 1);
  vertex(s, s, s, 0, 1);
  endShape(CLOSE);
  // LEFT
  beginShape();
  vertex(-s, -s, -s, 0, 0);
  vertex(-s, -s, s, 1, 0);
  vertex(-s, s, s, 1, 1);
  vertex(-s, s, -s, 0, 1);
  endShape(CLOSE);
  // TOP
  beginShape();
  vertex(-s, -s, -s, 0, 0);
  vertex(s, -s, -s, 1, 0);
  vertex(s, -s, s, 1, 1);
  vertex(-s, -s, s, 0, 1);
  endShape(CLOSE);
  // BOTTOM
  beginShape();
  vertex(-s, s, s, 0, 0);
  vertex(s, s, s, 1, 0);
  vertex(s, s, -s, 1, 1);
  vertex(-s, s, -s, 0, 1);
  endShape(CLOSE);
}
