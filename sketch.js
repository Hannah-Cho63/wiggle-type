// =====================
//  Wiggle Type Tool
// =====================

// 폰트 / 포인트
let font;
let basePoints = [];
let centerX, centerY;

// 헤더 UI
let headerLeft, headerCenter;

// 오른쪽 패널 UI 요소들
let textInput, fontSizeSlider, warpSlider, noiseSlider, speedSlider;
let strokeWidthSlider;
let textColorPicker, bgColorPicker, fillColorPicker;
let loopCheckbox, fillCheckbox;

// 설정값
let config = {
  text: "R",
  fontSize: 360,
  warpAmount: 70,
  noiseScale: 0.02,
  speed: 0.01,
  strokeWidth: 12,
  textColor: "#ffffff",
  bgColor: "#000000",
  loopMotion: true,
  fillShape: false,
  fillColor: "#ff3f6c",
};

// 카메라 회전용
let rotationAngle = 0; // 라디안
let isDragging = false;
let lastMouseX = 0;
let autoRotate = false;

// =====================
//   p5 기본
// =====================

function preload() {
  // p5 에디터 왼쪽에 올린 Helvetica.ttf
  font = loadFont("Helvetica.ttf");
}

function setup() {
  const canvasW = windowWidth * 0.7; // 왼쪽 70%를 캔버스로
  const canvasH = windowHeight;

  createCanvas(canvasW, canvasH);

  centerX = width / 2;
  centerY = height / 2;

  angleMode(RADIANS);
  noFill();
  strokeJoin(ROUND);
  strokeCap(ROUND);

  setupHeader(); // 상단 "TOOLS — WIGGLE TYPE", "wiggle type"
  setupUI();     // 오른쪽 컨트롤 패널
  rebuildPoints();
}

function windowResized() {
  const canvasW = windowWidth * 0.7;
  const canvasH = windowHeight;

  resizeCanvas(canvasW, canvasH);
  centerX = width / 2;
  centerY = height / 2;

  rebuildPoints();
}

// =====================
//   상단 헤더 UI
// =====================

function setupHeader() {
  headerLeft = createDiv("TOOLS — WIGGLE TYPE");
  headerLeft.addClass("app-header-left");

  headerCenter = createDiv("wiggle type");
  headerCenter.addClass("app-header-center");
}

// =====================
//    오른쪽 패널 UI
// =====================

function setupUI() {
  // 패널 컨테이너
  const panel = createDiv();
  panel.id("control-panel");

  // 화면 오른쪽 위에 고정
  panel.style("position", "fixed");
  panel.style("top", "40px");
  panel.style("right", "32px");
  panel.style("width", "240px");       // 살짝 넓게
  panel.style("color", "#ffffff");
  panel.style("font-family", "Helvetica, Arial, sans-serif");
  panel.style("font-size", "13px");    // ★ 폰트 사이즈 업
  panel.style("line-height", "1.5");
  panel.style("user-select", "none");

  // 섹션 타이틀 헬퍼
  function makeSectionTitle(txt) {
    const el = createP(txt);
    el.parent(panel);
    el.addClass("panel-section-title");
    // 여백 조금
    el.style("margin-top", "18px");
    el.style("margin-bottom", "6px");
    el.style("letter-spacing", "0.08em");
    el.style("text-transform", "uppercase");
    el.style("font-size", "11px");
    el.style("color", "#aaaaaa");
    return el;
  }

  // 라벨 헬퍼
  function makeLabel(txt) {
    const el = createSpan(txt);
    el.parent(panel);
    el.addClass("panel-label");
    el.style("display", "block");
    el.style("margin-top", "12px");    // 위 간격
    el.style("margin-bottom", "4px");  // 아래 간격
    return el;
  }

  // 슬라이더 헬퍼
  function makeSlider(min, max, value, step) {
    const s = createSlider(min, max, value, step);
    s.parent(panel);
    s.addClass("panel-slider");
    s.style("width", "100%");
    s.style("margin-bottom", "10px");  // 슬라이더 사이 거리
    return s;
  }

  // 컬러 피커 헬퍼
  function makeColorPicker(color) {
    const cp = createColorPicker(color);
    cp.parent(panel);
    cp.addClass("panel-color");
    cp.style("margin-top", "2px");
    cp.style("margin-bottom", "12px"); // 컬러 피커끼리 간격
    return cp;
  }

  // 체크박스 헬퍼
  function makeCheckbox(label, checked) {
    const cb = createCheckbox(label, checked);
    cb.parent(panel);
    cb.addClass("panel-checkbox");
    cb.style("margin-top", "8px");
    cb.style("margin-bottom", "6px");
    return cb;
  }

  // ===== TYPE SETTING =====
  makeSectionTitle("TYPE SETTING");

  textInput = createInput(config.text);
  textInput.parent(panel);
  textInput.addClass("panel-input");
  textInput.style("width", "100%");
  textInput.style("margin-bottom", "10px");
  textInput.input(() => {
    config.text = textInput.value() || "R";
    rebuildPoints();
  });

  makeLabel("fontSize");
  fontSizeSlider = makeSlider(120, 600, config.fontSize, 10);
  fontSizeSlider.input(() => {
    config.fontSize = fontSizeSlider.value();
    rebuildPoints();
  });

  // ===== MORPH =====
  makeSectionTitle("MORPH");

  makeLabel("warpAmount");
  warpSlider = makeSlider(0, 150, config.warpAmount, 1);
  warpSlider.input(() => {
    config.warpAmount = warpSlider.value();
  });

  makeLabel("noiseScale");
  noiseSlider = makeSlider(5, 50, config.noiseScale * 1000, 1);
  noiseSlider.input(() => {
    config.noiseScale = noiseSlider.value() / 1000.0;
  });

  makeLabel("speed");
  speedSlider = makeSlider(1, 40, config.speed * 1000, 1);
  speedSlider.input(() => {
    config.speed = speedSlider.value() / 1000.0;
  });

  // ===== STROKE =====
  makeLabel("strokeWidth");
  strokeWidthSlider = makeSlider(1, 60, config.strokeWidth, 1);
  strokeWidthSlider.input(() => {
    config.strokeWidth = strokeWidthSlider.value();
  });

  // loopMotion 체크
  loopCheckbox = makeCheckbox("loopMotion", config.loopMotion);
  loopCheckbox.changed(() => {
    config.loopMotion = loopCheckbox.checked();
    if (!config.loopMotion) frameCount = 0;
  });

  // ===== CAMERA =====
  makeSectionTitle("CAMERA");

  makeLabel("rotate");
  const rotSlider = makeSlider(-180, 180, 0, 1);
  rotSlider.input(() => {
    rotationAngle = radians(rotSlider.value());
  });

  const autoChk = makeCheckbox("autoRotate", autoRotate);
  autoChk.changed(() => {
    autoRotate = autoChk.checked();
  });

  // ===== COLOR =====
  makeSectionTitle("COLOR");

  makeLabel("text");
  textColorPicker = makeColorPicker(config.textColor);
  textColorPicker.input(() => {
    config.textColor = textColorPicker.value();
  });

  makeLabel("BG");
  bgColorPicker = makeColorPicker(config.bgColor);
  bgColorPicker.input(() => {
    config.bgColor = bgColorPicker.value();
  });

  makeLabel("fill");
  fillColorPicker = makeColorPicker(config.fillColor);
  fillColorPicker.input(() => {
    config.fillColor = fillColorPicker.value();
  });

  fillCheckbox = makeCheckbox("filled", config.fillShape);
  fillCheckbox.changed(() => {
    config.fillShape = fillCheckbox.checked();
  });
}

// =====================
//   텍스트 포인트 생성
// =====================

function rebuildPoints() {
  if (!font) return;

  const txt = config.text || "R";
  const size = config.fontSize;
  const lines = txt.split("\n");

  basePoints = [];

  const lineSpacing = size * 1.1;

  // 1) 로컬 좌표(0,0 근처)에서 전체 바운딩 박스 구하기
  let tmpPoints = [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (!line) continue;

    const bounds = font.textBounds(line, 0, 0, size);
    const pts = font.textToPoints(line, 0, 0, size, {
      sampleFactor: 0.2,
      simplifyThreshold: 0,
    });

    const lineOffsetY = li * lineSpacing;
    const dx = -bounds.x;
    const dy = -bounds.y + lineOffsetY;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const gx = p.x + dx;
      const gy = p.y + dy;

      tmpPoints.push({ x: gx, y: gy });

      if (gx < minX) minX = gx;
      if (gy < minY) minY = gy;
      if (gx > maxX) maxX = gx;
      if (gy > maxY) maxY = gy;
    }
  }

  if (!tmpPoints.length) return;

  const textCenterX = (minX + maxX) / 2;
  const textCenterY = (minY + maxY) / 2;

  const offX = centerX - textCenterX;
  const offY = centerY - textCenterY;

  basePoints = tmpPoints.map((p) => ({
    x: p.x + offX,
    y: p.y + offY,
  }));

  console.log("points:", basePoints.length);
}

// =====================
//       DRAW LOOP
// =====================

function draw() {
  background(config.bgColor);

  if (autoRotate) {
    rotationAngle += 0.003; // 자동 회전 속도
  }

  push();
  translate(centerX, centerY);
  rotate(rotationAngle);
  translate(-centerX, -centerY);

  drawTapeText();

  pop();
}

// =====================
//   Tape Text Render
// =====================

function drawTapeText() {
  if (!basePoints.length) return;

  // 애니메이션 t
  let t;
  if (config.loopMotion) {
    t = (sin(frameCount * config.speed) + 1) / 2;
  } else {
    const duration = 5 * 60;
    t = constrain(frameCount / duration, 0, 1);
  }

  const maxWarp = config.warpAmount;
  const ns = config.noiseScale;

  // 1) 포인트를 세그먼트(글자 조각)로 나누기
  const jumpThreshold = config.fontSize * 0.3;
  let segments = [];
  let current = [];

  for (let i = 0; i < basePoints.length; i++) {
    const p = basePoints[i];

    if (i > 0) {
      const prev = basePoints[i - 1];
      const d = dist(prev.x, prev.y, p.x, p.y);
      if (d > jumpThreshold) {
        if (current.length > 0) segments.push(current);
        current = [];
      }
    }
    current.push(p);
  }
  if (current.length > 0) segments.push(current);

  if (!segments.length) return;

  // 2) 각 세그먼트의 중심점 계산
  let segInfos = segments.map((seg) => {
    let cx = 0;
    let cy = 0;
    for (const p of seg) {
      cx += p.x;
      cy += p.y;
    }
    const len = seg.length || 1;
    return { seg, cx: cx / len, cy: cy / len };
  });

  // 3) 폴리곤 안/밖 판정으로 outer / hole 분류
  let outerSegs = [];
  let holeSegs = [];

  for (let i = 0; i < segInfos.length; i++) {
    const info = segInfos[i];
    let isHole = false;

    for (let j = 0; j < segInfos.length; j++) {
      if (i === j) continue;
      const other = segInfos[j];
      if (pointInPolygon(info.cx, info.cy, other.seg)) {
        isHole = true;
        break;
      }
    }

    if (isHole) holeSegs.push(info.seg);
    else outerSegs.push(info.seg);
  }

  // 4) 세그먼트를 그리는 헬퍼
  function drawSegments(segList, useStroke, useFill, strokeCol, strokeW, fillCol) {
    if (useStroke) {
      stroke(strokeCol);
      strokeWeight(strokeW);
    } else {
      noStroke();
    }
    if (useFill) fill(fillCol);
    else noFill();

    for (const seg of segList) {
      if (seg.length < 2) continue;
      beginShape();
      for (const p of seg) {
        const n = noise(p.x * ns, p.y * ns, frameCount * config.speed);
        const eased = easeInOutCubic(n);
        const mag = maxWarp * t * eased;

        const angle = map(n, 0, 1, -PI, PI);
        const dx = cos(angle) * mag;
        const dy = sin(angle) * mag;

        const warpedX = p.x + dx;
        const warpedY = p.y + dy;

        curveVertex(warpedX, warpedY);
      }
      if (useFill) endShape(CLOSE);
      else endShape();
    }
  }

  // 5) 모드에 따라 렌더링
  if (!config.fillShape) {
    // 라인 모드
    drawSegments(
      segments,
      true,
      false,
      config.textColor,
      config.strokeWidth,
      null
    );
  } else {
    // 바깥을 채운 뒤
    drawSegments(
      outerSegs,
      true,
      true,
      config.textColor,
      config.strokeWidth,
      config.fillColor
    );

    // 구멍은 배경색으로 다시 채워서 뚫고
    drawSegments(
      holeSegs,
      false,
      true,
      null,
      1,
      config.bgColor || "#000000"
    );

    // 마지막으로 전체 아웃라인 다시
    drawSegments(
      segments,
      true,
      false,
      config.textColor,
      config.strokeWidth,
      null
    );
  }
}

// 폴리곤 안/밖 체크 (ray casting)
function pointInPolygon(x, y, poly) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;

    const intersect =
      (yi > y) !== (yj > y) &&
      x <
        ((xj - xi) * (y - yi)) / ((yj - yi) + 0.00001) + xi; // 0 나누기 방지용 eps
    if (intersect) inside = !inside;
  }
  return inside;
}

// 이징
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

// =====================
//   Mouse rotation
// =====================

function mousePressed() {
  // 오른쪽 UI 말고, 캔버스 영역에서만 드래그 인식
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isDragging = true;
    lastMouseX = mouseX;
  }
}

function mouseDragged() {
  if (!isDragging) return;

  const dx = mouseX - lastMouseX;
  rotationAngle += dx * 0.005; // 드래그 민감도
  lastMouseX = mouseX;
}

function mouseReleased() {
  isDragging = false;
}
