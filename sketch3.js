let tex = {};
let rotX = 20;
let rotY = 20;
let rotZ = 0;

// zoom state
let zoom = 1;
let lastPinchDist = null;

// velocity (for inertia)
let vX = 0;
let vY = 0;
let vZ = 0;

// roll state
let isRolling = false;
let rollStartTime = 0;
let rollDuration = 1400;
let rollStart = { x: 0, y: 0, z: 0 };
let rollEnd = { x: 0, y: 0, z: 0 };
let rollFace = null;

// audio
let rollSound;

// label element
let faceLabel;

// tuning
const dragToRot = 0.01; // swipe sensitivity
const inertia = 0.092; // 0.85–0.95 (higher = more glide)
const idleSpin = 0.0005; // slow spin when not dragging
const zoomMin = 0.5;
const zoomMax = 3;
const pinchToZoom = 0.005;

function preload() {
  tex.front = loadImage("img/photo1.jpg");
  tex.back = loadImage("img/photo2.jpg");
  tex.right = loadImage("img/photo3.jpg");
  tex.left = loadImage("img/photo4.jpg");
  tex.top = loadImage("img/photo5.jpg");
  tex.bottom = loadImage("img/photo6.jpg");
  rollSound = loadSound("sounds/dice-roll.mp3", null, (err) => console.warn("roll sound failed", err));
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
  noStroke();

  faceLabel = createDiv("");
  faceLabel.style("position", "fixed");
  faceLabel.style("left", "50%");
  faceLabel.style("bottom", "40px");
  faceLabel.style("transform", "translateX(-50%)");
  faceLabel.style("color", "white");
  faceLabel.style("font-family", "Arial, sans-serif");
  faceLabel.style("font-size", "32px");
  faceLabel.style("font-weight", "bold");
  faceLabel.style("text-shadow", "0 2px 8px rgba(0,0,0,0.6)");
  faceLabel.style("padding", "12px 20px");
  faceLabel.style("background", "rgba(0,0,0,0.4)");
  faceLabel.style("border-radius", "8px");
  faceLabel.hide();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(230);

  // Rolling animation overrides velocities
  if (isRolling) {
    const t = constrain((millis() - rollStartTime) / rollDuration, 0, 1);
    const ease = 1 - pow(1 - t, 3); // easeOutCubic
    rotX = lerp(rollStart.x, rollEnd.x, ease);
    rotY = lerp(rollStart.y, rollEnd.y, ease);
    rotZ = lerp(rollStart.z, rollEnd.z, ease);
    if (t >= 1) {
      isRolling = false;
      vX = vY = vZ = 0;
      showFaceLabel(rollFace?.label || "");
    }
  } else {
    // If user is not dragging, add a tiny idle rotation
    if (!mouseIsPressed && touches.length === 0) {
      vY += idleSpin;
    }

    // Apply velocity to rotation
    rotX += vX;
    rotY += vY;
    rotZ += vZ;

    // Inertia damping
    vX *= inertia;
    vY *= inertia;
    vZ *= inertia;
  }

  // Optional: clamp rotX so you can't flip too wildly
  rotX = constrain(rotX, -PI / 2, PI / 2);

  // Lights to help it feel 3D (textures still show fine)
  ambientLight(200);
  directionalLight(255, 255, 255, 0.2, 0.6, -1);

  // Rotate cube
  rotateX(rotX);
  rotateY(rotY);
  rotateZ(rotZ);
  scale(zoom);

  // Draw the textured cube
  drawTexturedCube(200);
}

// Drag/swipe adds velocity (works for mouse + touch)
function mouseDragged() {
  if (isRolling) return false;
  vY += movedX * dragToRot;
  vX -= movedY * dragToRot;
  return false; // prevent page scroll on mobile
}

function touchMoved() {
  if (isRolling) return false;
  // Handle pinch zoom when two touches are active
  if (touches.length >= 2) {
    const d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    if (lastPinchDist !== null) {
      zoom = constrain(zoom + (d - lastPinchDist) * pinchToZoom, zoomMin, zoomMax);
    }
    lastPinchDist = d;
    return false;
  }

  // Single touch rotates
  lastPinchDist = null;
  vY += movedX * dragToRot;
  vX -= movedY * dragToRot;
  return false; // prevent scrolling
}

function doubleClicked() {
  if (isRolling) return false;
  startRoll();
  return false;
}

function startRoll() {
  const faces = [
    { label: "photo1", rot: { x: 0, y: 0, z: 0 } }, // front
    { label: "photo2", rot: { x: 0, y: PI, z: 0 } }, // back
    { label: "photo3", rot: { x: 0, y: HALF_PI, z: 0 } }, // right
    { label: "photo4", rot: { x: 0, y: -HALF_PI, z: 0 } }, // left
    { label: "photo5", rot: { x: -HALF_PI, y: 0, z: 0 } }, // top
    { label: "photo6", rot: { x: HALF_PI, y: 0, z: 0 } }, // bottom
  ];

  rollFace = random(faces);
  rollStart = { x: rotX, y: rotY, z: rotZ };

  // add wild spins before settling on target
  const spins = 4 + floor(random(3));
  rollEnd = {
    x: rollFace.rot.x + TWO_PI * random(1, spins),
    y: rollFace.rot.y + TWO_PI * random(1, spins),
    z: rollFace.rot.z + TWO_PI * random(1, spins),
  };

  rollStartTime = millis();
  isRolling = true;
  faceLabel.hide();

  if (rollSound && rollSound.isLoaded()) {
    rollSound.play();
  }
}

function showFaceLabel(name) {
  if (!name) return;
  faceLabel.html(name.toUpperCase());
  faceLabel.show();
}

function touchEnded() {
  if (touches.length < 2) {
    lastPinchDist = null;
  }
}

function mouseWheel(event) {
  zoom = constrain(zoom * (1 - event.delta * 0.001), zoomMin, zoomMax);
  return false; // prevent page scroll on desktop
}

function drawTexturedCube(size) {
  const s = size / 2;

  // FRONT (z +)
  texture(tex.front);
  beginShape();
  vertex(-s, -s, s, 0, 0);
  vertex(s, -s, s, 1, 0);
  vertex(s, s, s, 1, 1);
  vertex(-s, s, s, 0, 1);
  endShape(CLOSE);

  // BACK (z -)
  texture(tex.back);
  beginShape();
  vertex(s, -s, -s, 0, 0);
  vertex(-s, -s, -s, 1, 0);
  vertex(-s, s, -s, 1, 1);
  vertex(s, s, -s, 0, 1);
  endShape(CLOSE);

  // RIGHT (x +)
  texture(tex.right);
  beginShape();
  vertex(s, -s, s, 0, 0);
  vertex(s, -s, -s, 1, 0);
  vertex(s, s, -s, 1, 1);
  vertex(s, s, s, 0, 1);
  endShape(CLOSE);

  // LEFT (x -)
  texture(tex.left);
  beginShape();
  vertex(-s, -s, -s, 0, 0);
  vertex(-s, -s, s, 1, 0);
  vertex(-s, s, s, 1, 1);
  vertex(-s, s, -s, 0, 1);
  endShape(CLOSE);

  // TOP (y -)
  texture(tex.top);
  beginShape();
  vertex(-s, -s, -s, 0, 0);
  vertex(s, -s, -s, 1, 0);
  vertex(s, -s, s, 1, 1);
  vertex(-s, -s, s, 0, 1);
  endShape(CLOSE);

  // BOTTOM (y +)
  texture(tex.bottom);
  beginShape();
  vertex(-s, s, s, 0, 0);
  vertex(s, s, s, 1, 0);
  vertex(s, s, -s, 1, 1);
  vertex(-s, s, -s, 0, 1);
  endShape(CLOSE);
}
