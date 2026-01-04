// p5.js WEBGL: Numbered cube (1–6), random spin on double click,
// and label showing which face is most visible.

let faceTex = {}; // textures for each face
let rotX = -0.3;
let rotY = 0.6;
let rotZ = 0.0;

// 2D overlay layer for text (avoids WEBGL text font requirement)
let uiLayer;

// angular velocity for spin animation
let vX = 0;
let vY = 0;
let vZ = 0;

// sound
let rollSound;

const friction = 0.965; // spin slows down over time

function preload() {
  faceTex.front = loadImage("img/photo1.jpg");
  faceTex.back = loadImage("img/photo2.jpg");
  faceTex.right = loadImage("img/photo3.jpg");
  faceTex.left = loadImage("img/photo4.jpg");
  faceTex.top = loadImage("img/photo5.jpg");
  faceTex.bottom = loadImage("img/photo6.jpg");
  rollSound = loadSound("sounds/dice-roll.mp3", null, (err) => console.warn("roll sound failed", err));
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
  noStroke();

  uiLayer = createGraphics(windowWidth, windowHeight); // 2D renderer
  uiLayer.textFont("Arial");
  uiLayer.textSize(18);
  uiLayer.textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (uiLayer) {
    uiLayer.resizeCanvas(windowWidth, windowHeight);
    uiLayer.textFont("Arial");
    uiLayer.textSize(18);
    uiLayer.textAlign(CENTER, CENTER);
  }
}

function draw() {
  background(235);

  // Basic lighting so it feels 3D
  ambientLight(200);
  directionalLight(255, 255, 255, 0.25, 0.6, -1);

  // Apply spin velocity + friction
  rotX += vX;
  rotY += vY;
  rotZ += vZ;

  vX *= friction;
  vY *= friction;
  vZ *= friction;

  // Draw cube
  push();
  rotateX(rotX);
  rotateY(rotY);
  rotateZ(rotZ);

  drawTexturedCube(220);
  pop();

  // Determine most visible face (based on which face normal points most toward camera)
  const visible = mostVisibleFace(rotX, rotY, rotZ);

  // Draw UI text at bottom (2D overlay)
  drawOverlayText(`Most visible: ${visible}`);
}

// Double click on desktop
function doubleClicked() {
  if (rollSound && rollSound.isLoaded()) rollSound.play();
  spinRandomly();
  return false;
}

// Double tap on mobile (p5 will often still call doubleClicked, but this helps)
function touchStarted() {
  // Prevent accidental scroll
  return false;
}

function spinRandomly() {
  // Add a random "impulse" so it spins for a while
  // (ensure not too tiny)
  vX += random(-0.18, 0.18);
  vY += random(-0.22, 0.22);
  vZ += random(-0.18, 0.18);

  // If it happened to be too small, bump it
  if (abs(vX) + abs(vY) + abs(vZ) < 0.08) {
    vY += 0.18;
  }
}

function drawTexturedCube(size) {
  const s = size / 2;

  // FRONT (+z)
  texture(faceTex.front);
  beginShape();
  vertex(-s, -s, s, 0, 0);
  vertex(s, -s, s, 1, 0);
  vertex(s, s, s, 1, 1);
  vertex(-s, s, s, 0, 1);
  endShape(CLOSE);

  // BACK (-z)
  texture(faceTex.back);
  beginShape();
  vertex(s, -s, -s, 0, 0);
  vertex(-s, -s, -s, 1, 0);
  vertex(-s, s, -s, 1, 1);
  vertex(s, s, -s, 0, 1);
  endShape(CLOSE);

  // RIGHT (+x)
  texture(faceTex.right);
  beginShape();
  vertex(s, -s, s, 0, 0);
  vertex(s, -s, -s, 1, 0);
  vertex(s, s, -s, 1, 1);
  vertex(s, s, s, 0, 1);
  endShape(CLOSE);

  // LEFT (-x)
  texture(faceTex.left);
  beginShape();
  vertex(-s, -s, -s, 0, 0);
  vertex(-s, -s, s, 1, 0);
  vertex(-s, s, s, 1, 1);
  vertex(-s, s, -s, 0, 1);
  endShape(CLOSE);

  // TOP (y -)  (in p5, y increases downward)
  texture(faceTex.top);
  beginShape();
  vertex(-s, -s, -s, 0, 0);
  vertex(s, -s, -s, 1, 0);
  vertex(s, -s, s, 1, 1);
  vertex(-s, -s, s, 0, 1);
  endShape(CLOSE);

  // BOTTOM (y +)
  texture(faceTex.bottom);
  beginShape();
  vertex(-s, s, s, 0, 0);
  vertex(s, s, s, 1, 0);
  vertex(s, s, -s, 1, 1);
  vertex(-s, s, -s, 0, 1);
  endShape(CLOSE);
}

/**
 * Returns the image name (photoN) of the face whose outward normal points most toward the camera.
 * Camera is effectively on +Z looking toward origin, so "most visible" ≈ max dot(normal, (0,0,1)).
 */
function mostVisibleFace(ax, ay, az) {
  // Face normals in cube-local coords
  const faces = [
    { label: "photo1", n: { x: 0, y: 0, z: 1 } },
    { label: "photo2", n: { x: 0, y: 0, z: -1 } },
    { label: "photo3", n: { x: 1, y: 0, z: 0 } },
    { label: "photo4", n: { x: -1, y: 0, z: 0 } },
    { label: "photo5", n: { x: 0, y: -1, z: 0 } },
    { label: "photo6", n: { x: 0, y: 1, z: 0 } },
  ];

  let best = faces[0].label;
  let bestDot = -Infinity;

  for (const f of faces) {
    const t = rotateNormal(f.n, ax, ay, az);
    // dot with view vector (0,0,1) is just z component
    const dot = t.z;

    if (dot > bestDot) {
      bestDot = dot;
      best = f.label;
    }
  }
  return best;
}

/**
 * Rotate a vector by X then Y then Z (matching rotateX(); rotateY(); rotateZ(); order in draw).
 */
function rotateNormal(v, ax, ay, az) {
  // Rx
  let x = v.x;
  let y = v.y * cos(ax) - v.z * sin(ax);
  let z = v.y * sin(ax) + v.z * cos(ax);

  // Ry
  let x2 = x * cos(ay) + z * sin(ay);
  let y2 = y;
  let z2 = -x * sin(ay) + z * cos(ay);

  // Rz
  let x3 = x2 * cos(az) - y2 * sin(az);
  let y3 = x2 * sin(az) + y2 * cos(az);
  let z3 = z2;

  return { x: x3, y: y3, z: z3 };
}

function drawOverlayText(msg) {
  if (!uiLayer) return;

  uiLayer.clear();
  uiLayer.textFont("Arial");
  uiLayer.textSize(18);
  uiLayer.textAlign(CENTER, CENTER);

  const pad = 10;
  const tw = uiLayer.textWidth(msg);
  const boxW = tw + pad * 2;
  const boxH = 30;
  const x = (uiLayer.width - boxW) / 2;
  const y = uiLayer.height - boxH - 12;

  uiLayer.noStroke();
  uiLayer.fill(255, 245);
  uiLayer.rect(x, y, boxW, boxH, 12);

  uiLayer.fill(0);
  uiLayer.text(msg, uiLayer.width / 2, y + boxH / 2);

  // draw the overlay onto the WEBGL canvas
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);
  image(uiLayer, 0, 0);
  pop();
}

function mostVisibleFaceFromMatrix(m) {
  // Face normals in local cube coords
  const faces = [
    { n: 1, v: [0, 0, 1] }, // front
    { n: 2, v: [0, 0, -1] }, // back
    { n: 3, v: [1, 0, 0] }, // right
    { n: 4, v: [-1, 0, 0] }, // left
    { n: 5, v: [0, -1, 0] }, // top
    { n: 6, v: [0, 1, 0] }, // bottom
  ];

  // In view space, camera looks down -Z (common OpenGL convention).
  // So "most visible" means normal points most toward camera = most NEGATIVE z.
  let bestN = faces[0].n;
  let bestScore = Infinity; // we want smallest z

  for (const f of faces) {
    const tv = multMatVec3(m, f.v); // transformed normal (approx; ok for pure rotations)
    const z = tv[2];

    if (z < bestScore) {
      bestScore = z;
      bestN = f.n;
    }
  }
  return bestN;
}

// Multiply a 4x4 matrix by a 3D vector (w=0 for a direction/normal)
function multMatVec3(m, v) {
  // p5.Matrix stores elements in .mat4 (length 16)
  const a = m.mat4;

  const x = v[0],
    y = v[1],
    z = v[2];
  const w = 0; // direction vector

  // Column-major multiplication (p5 uses column-major matrices)
  const rx = a[0] * x + a[4] * y + a[8] * z + a[12] * w;
  const ry = a[1] * x + a[5] * y + a[9] * z + a[13] * w;
  const rz = a[2] * x + a[6] * y + a[10] * z + a[14] * w;

  return [rx, ry, rz];
}
