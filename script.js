// --- PHYSICS & SVG SIMULATION ---
const planesData = [
  { id: "K", latDeg: 80, color: "#a855f7" },
  { id: "L", latDeg: 0, color: "#3b82f6" },
  { id: "M", latDeg: -45, color: "#ec4899" }
];

const elements = {
  timeRange: document.getElementById('timeRange'),
  timeLabel: document.getElementById('timeLabel'),
  tableBody: document.getElementById('tableBody'),
  globe: document.getElementById('globe'),
  planesGroup: document.getElementById('planes'),
  parallelsBack: document.getElementById('parallels-back')
};

let startTime = 0;
const CX = 250, CY = 250, R = 200, Rkm = 6371;
const TILT = 0.35;

function initSim() {
  drawMeridians();
  drawStaticParallels();
  updateData();
  elements.timeRange.addEventListener('input', updateData);
  requestAnimationFrame(loop);
}

function drawMeridians() {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI;
    const rx = R * Math.cos(angle);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    path.setAttribute("cx", CX);
    path.setAttribute("cy", CY);
    path.setAttribute("rx", Math.abs(rx));
    path.setAttribute("ry", R);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#27272a");
    path.setAttribute("stroke-width", "0.5");
    g.appendChild(path);
  }
  elements.parallelsBack.appendChild(g);
}

function drawStaticParallels() {
  for (let lat = -75; lat <= 75; lat += 15) {
    if (planesData.find(p => p.latDeg === lat)) continue;
    const rad = lat * Math.PI / 180;
    const rx = R * Math.cos(rad);
    const ry = rx * TILT;
    const cy = CY - R * Math.sin(rad);
    const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    ellipse.setAttribute("cx", CX);
    ellipse.setAttribute("cy", cy);
    ellipse.setAttribute("rx", rx);
    ellipse.setAttribute("ry", ry);
    ellipse.setAttribute("fill", "none");
    ellipse.setAttribute("stroke", "#27272a");
    ellipse.setAttribute("stroke-width", "0.5");
    elements.parallelsBack.appendChild(ellipse);
  }
}

function renderPlaneOrbits() {
  elements.planesGroup.innerHTML = '';
  planesData.forEach(plane => {
    const latRad = plane.latDeg * Math.PI / 180;
    const rx = R * Math.cos(latRad);
    const ry = rx * TILT;
    const yCenter = CY - R * Math.sin(latRad);

    const orbit = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    orbit.setAttribute("cx", CX);
    orbit.setAttribute("cy", yCenter);
    orbit.setAttribute("rx", rx);
    orbit.setAttribute("ry", ry);
    orbit.setAttribute("fill", "none");
    orbit.setAttribute("stroke", plane.color);
    orbit.setAttribute("stroke-width", "1.5");
    orbit.setAttribute("stroke-dasharray", "4 4");
    orbit.style.opacity = "0.3";
    elements.planesGroup.appendChild(orbit);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = "plane-" + plane.id;

    // Velocity Vector
    const vector = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vector.id = "vec-" + plane.id;
    vector.setAttribute("x1", "0");
    vector.setAttribute("y1", "0");
    vector.setAttribute("stroke", plane.color);
    vector.setAttribute("stroke-width", "2.5");
    vector.setAttribute("marker-end", `url(#arrowhead-${plane.id})`);
    vector.setAttribute("stroke-linecap", "round");

    // Plane marker
    const planeIconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    planeIconGroup.id = "iconGroup-" + plane.id;
    const dotGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dotGlow.setAttribute("r", "12");
    dotGlow.setAttribute("fill", plane.color);
    dotGlow.setAttribute("filter", "url(#glowBlur)");
    dotGlow.style.opacity = "0.6";

    const planeShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Sleek top-down airplane pointing right
    planeShape.setAttribute("d", "M 12 0 L 6 -2 L -2 -10 L -5 -10 L 0 -2 L -7 -2 L -11 -6 L -13 -6 L -10 -2 L -11 0 L -10 2 L -13 6 L -11 6 L -7 2 L 0 2 L -5 10 L -2 10 L 6 2 Z");
    planeShape.setAttribute("fill", "#ffffff");

    planeIconGroup.appendChild(dotGlow);
    planeIconGroup.appendChild(planeShape);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.textContent = plane.id;
    label.setAttribute("x", "16");
    label.setAttribute("y", "5");
    label.setAttribute("fill", "#fff");
    label.setAttribute("font-size", "14px");
    label.setAttribute("font-weight", "600");
    label.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";

    g.appendChild(vector);
    g.appendChild(planeIconGroup);
    g.appendChild(label);

    elements.planesGroup.appendChild(g);
  });
}

function updatePlanesPositions(theta) {
  const normTheta = theta % (2 * Math.PI);
  planesData.forEach(plane => {
    const latRad = plane.latDeg * Math.PI / 180;
    const rx = R * Math.cos(latRad);
    const ry = rx * TILT;
    const yCenter = CY - R * Math.sin(latRad);
    const x = CX + rx * Math.cos(normTheta);
    const y = yCenter + ry * Math.sin(normTheta);

    const g = document.getElementById("plane-" + plane.id);
    if (!g) return;

    g.setAttribute("transform", `translate(${x}, ${y})`);

    if (Math.sin(normTheta) < 0) {
      g.style.opacity = "0.2";
      g.querySelector("text").style.display = "none";
    } else {
      g.style.opacity = "1";
      g.querySelector("text").style.display = "block";
    }

    const dx = -rx * Math.sin(normTheta);
    const dy = ry * Math.cos(normTheta);
    const vecScale = 0.45;

    const vector = document.getElementById("vec-" + plane.id);
    vector.setAttribute("x2", dx * vecScale);
    vector.setAttribute("y2", dy * vecScale);

    const iconGroup = document.getElementById("iconGroup-" + plane.id);
    if (iconGroup) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      iconGroup.setAttribute("transform", `rotate(${angle})`);
    }
  });
}

function updateData() {
  const T = parseFloat(elements.timeRange.value);
  elements.timeLabel.textContent = T;

  let html = "";
  const sortedPlanes = [...planesData].sort((a, b) => Math.abs(a.latDeg) - Math.abs(b.latDeg));

  sortedPlanes.forEach(plane => {
    const radius = Math.cos(Math.abs(plane.latDeg) * Math.PI / 180);
    const circumference = 2 * Math.PI * (Rkm * radius);
    const speed = circumference / T;

    html += `
      <tr>
        <td><strong style="color:${plane.color}">${plane.id}</strong></td>
        <td>${plane.latDeg}°</td>
        <td>${speed.toFixed(0)} km/h</td>
      </tr>
    `;
  });
  elements.tableBody.innerHTML = html;

  renderPlaneOrbits();
}

function loop(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  // Make visual rotation scale with T slider (24 h default = slow, 1h = very fast)
  // Let's fix base duration to 8000ms for 24h
  const BaseT = 24;
  const currentT = parseFloat(elements.timeRange.value);
  const visualDurationMs = (currentT / BaseT) * 8000;

  const currentTheta = (elapsed / visualDurationMs) * 2 * Math.PI;
  updatePlanesPositions(currentTheta);
  requestAnimationFrame(loop);
}

// --- EDUCATIONAL SCENARIO LOGIC ---

function goToStep(stepId) {
  document.querySelectorAll('.scenario-step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + stepId).classList.add('active');
}

function showFeedback(stepNum, type, message) {
  const fb = document.getElementById(`feedback-${stepNum}`);
  fb.className = `feedback-box ${type}`;
  fb.innerHTML = message;
  fb.classList.remove('hidden');
}

// Step 1: Multiple choice
function checkStep1(answer, btnObj) {
  document.querySelectorAll('.step1-btn').forEach(b => {
    b.classList.remove('selected', 'correct', 'wrong');
  });

  if (answer === 'L') {
    btnObj.classList.add('correct');
    showFeedback(1, 'success', '<strong>Tebrikler!</strong> Dünya\'nın gövdesi Ekvator\'da en kalındır (şişkinlik). Kapsadığı mesafe çok uzun olduğundan 1 turu aynı sürede (örneğin 24 saatte) tamamlayabilmesi için K ve M uçaklarından çok daha yüksek bir hızla gitmesi gerekir. L\'nin hız vektörünün ne kadar uzun olduğuna dikkat edin!');
    document.getElementById('next-1').classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    showFeedback(1, 'error', `Yanlış. ${answer} uçağı Ekvatorda değil. Ekvator yayının uzunluğunu ve uçağın bu yolu kat edebilmek için atması gereken deparı düşünün.`);
  }
}

// Step 2: Fill in the blank
function checkStep2(answer, btnObj) {
  document.querySelectorAll('.step2-btn').forEach(b => {
    b.classList.remove('selected', 'correct', 'wrong');
  });
  const blank = document.getElementById('blank-word');
  blank.textContent = answer;
  blank.classList.add('filled');

  if (answer === 'sapmaya uğrar') {
    btnObj.classList.add('correct');
    showFeedback(2, 'success', '<strong>Doğru bir varsayım!</strong> Dünya her yerinde aynı hızla dönseydi rüzgârlar dümdüz eserdi. Ancak alttaki zemin hareketli ve çizgisel hızı sürekli değiştiği için rüzgârların yönü de adeta savrulur. (Bknz: Coriolis Etkisi)');
    document.getElementById('next-2').classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    blank.classList.remove('filled');
    showFeedback(2, 'error', '<strong>Yanlış.</strong> Hava kütlesi dümdüz gitmek ister, ancak onun altında hızla hareket eden bir zemin (Dünya) vardır. Zemin ona göre hızlı veya yavaş kalırsa ne olur?');
  }
}

// Step 3: Wind Animation
function shootWind() {
  const btn = document.getElementById('btn-shoot-wind');
  btn.disabled = true;
  btn.textContent = "💨 Rüzgâr Esiyor...";

  const windPath = document.getElementById('wind-path');

  // Create an arc representing the wind trajectory from North moving towards Equator
  // Deviates to the right (South-West, which is screen-left) due to Coriolis in Northern Hemisphere
  const startX = CX;
  const startY = CY - R + 20; // Start at the North Pole region, inside the globe
  // Target Equator but swept by rotation
  const endX = CX - 120; // Deflected to the West (Left)
  const endY = CY + 10;  // Reach the Equator region

  // Bezier Curve: Control point starts straight down (South), then curves West
  // By keeping control point's X equal to startX, initial direction is straight south.
  // It curves "right" relative to its path, landing in the South-West!
  windPath.setAttribute("d", `M ${startX} ${startY} Q ${CX} ${CY - 60} ${endX} ${endY}`);

  // Reset dash array for drawing animation (Disable transition so it snaps back instantly)
  windPath.style.transition = "none";
  windPath.classList.remove('blink-arrow'); // Clear blink if running again
  windPath.style.opacity = "1";

  const length = windPath.getTotalLength();
  windPath.style.strokeDasharray = length;
  windPath.style.strokeDashoffset = length;

  // Force a clean reflow
  windPath.getBoundingClientRect();

  // Allow browser time to apply "none" transition before we activate it again
  setTimeout(() => {
    windPath.style.transition = "stroke-dashoffset 2s ease-out";
    windPath.style.strokeDashoffset = "0";
  }, 50);

  setTimeout(() => {
    document.getElementById('feedback-3').classList.remove('hidden');
    document.getElementById('next-3').classList.remove('hidden');
    btn.textContent = "✅ Rüzgâr Sapması Doğrulandı";

    // Start blinking after the path is fully drawn
    windPath.classList.add('blink-arrow');

    // reset visual after a while to let them play again if needed
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "🌪 Rüzgârı Tekrar Fırlat";
    }, 1500); // Allow them to click again sooner, arrow stays blinking
  }, 2100);
}

// Step 4: True/False Conclusion
function checkStep4(answer, btnObj) {
  document.querySelectorAll('.step4-btn').forEach(b => {
    b.classList.remove('selected', 'correct', 'wrong');
  });

  if (answer === 'Hayır') {
    btnObj.classList.add('correct');
    showFeedback(4, 'success', '<strong>Müthiş bir analiz!</strong> Eğer dinamik (hız kaynaklı) bu sapma faktörü olmasaydı rüzgârlar sıcaklığın izini takip ederek dümdüz gider, belirli enlemlerde yığılarak basınç kuşaklarını oluşturmazdı. Hava kütlelerini çemberlere hapseden yegane güç sapmadır.');
    document.getElementById('next-4').classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    showFeedback(4, 'error', '<strong>Tekrar düşünün.</strong> Sadece güneş ışınları ısınma/soğuma yaratır ama yığılma ve burgular hız sapmasının (Coriolis) marifetidir.');
  }
}

function resetScenario() {
  document.querySelectorAll('.feedback-box').forEach(fb => fb.classList.add('hidden'));
  document.querySelectorAll('.next-step, [id^="next-"]').forEach(btn => btn.classList.add('hidden'));
  document.querySelectorAll('.choice-btn, .chip').forEach(btn => btn.classList.remove('selected', 'correct', 'wrong'));

  const blank = document.getElementById('blank-word');
  if (blank) {
    blank.textContent = "...";
    blank.classList.remove('filled');
  }

  goToStep('intro');
}

// Initialize
initSim();