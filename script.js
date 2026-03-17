// --- PHYSICS & SVG SIMULATION ---
const planesData = [
  { id: "K", latDeg: 80, color: "#a855f7" },
  { id: "L", latDeg: 0, color: "#3b82f6" },
  { id: "M", latDeg: -45, color: "#62db96df" }
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
let isAnimating = false;
let currentTheta = Math.PI / 4;
let savedTheta = Math.PI / 4;
const CX = 250, CY = 250, R = 200, Rkm = 6371;
const TILT = 0.35;
const defaultStep1StateApi = {
  createInitialStep1State: () => ({
    hasActivated: false,
    choicesVisible: false,
    triggerHidden: false,
    triggerDisabled: false,
    shouldStartAnimation: false
  }),
  activateStep1: (currentState) => {
    const state = currentState || defaultStep1StateApi.createInitialStep1State();

    if (state.hasActivated) {
      return {
        ...state,
        shouldStartAnimation: false
      };
    }

    return {
      hasActivated: true,
      choicesVisible: true,
      triggerHidden: true,
      triggerDisabled: true,
      shouldStartAnimation: true
    };
  }
};
const step1StateApi = window.Step1State || defaultStep1StateApi;
const browserHandlersApi = window.BrowserHandlers || {
  registerWindowHandlers: (target, handlers) => {
    Object.entries(handlers).forEach(([name, handler]) => {
      target[name] = handler;
    });

    return target;
  }
};
let step1UiState = step1StateApi.createInitialStep1State();

function initSim() {
  drawMeridians();
  drawStaticParallels();
  updateData();
  elements.timeRange.addEventListener('input', updateData);
  updatePlanesPositions(currentTheta);
  resetStep1Challenge();
  updateSimulationControlIcons();
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
    path.setAttribute("stroke", "#52525b");
    path.setAttribute("stroke-width", "1");
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
    ellipse.setAttribute("stroke", "#52525b");
    ellipse.setAttribute("stroke-width", "1");
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
  // Sort by ID: K, L, M
  const sortedPlanes = [...planesData].sort((a, b) => a.id.localeCompare(b.id));

  sortedPlanes.forEach(plane => {
    const radius = Math.cos(Math.abs(plane.latDeg) * Math.PI / 180);
    const circumference = 2 * Math.PI * (Rkm * radius);
    const speed = circumference / T;

    // Check if we should show speeds (only after step1 activation)
    const speedDisplay = (step1UiState && step1UiState.showSpeeds) 
      ? `${speed.toFixed(0)} km/h` 
      : '---';

    // Format latitude with K (Kuzey) or G (Güney) suffix
    let latDisplay;
    if (plane.latDeg === 0) {
      latDisplay = '0°';
    } else if (plane.latDeg > 0) {
      latDisplay = `${plane.latDeg}° K`;
    } else {
      latDisplay = `${Math.abs(plane.latDeg)}° G`;
    }

    html += `
      <tr>
        <td><strong style="color:${plane.color}">${plane.id}</strong></td>
        <td>${latDisplay}</td>
        <td>${speedDisplay}</td>
      </tr>
    `;
  });
  elements.tableBody.innerHTML = html;

  renderPlaneOrbits();
  if (typeof updatePlanesPositions === 'function') {
    updatePlanesPositions(currentTheta);
  }
}

function loop(timestamp) {
  if (!isAnimating) return;
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  // Make visual rotation scale with T slider (24 h default = slow, 1h = very fast)
  // Let's fix base duration to 8000ms for 24h
  const BaseT = 24;
  const currentT = parseFloat(elements.timeRange.value);
  const visualDurationMs = (currentT / BaseT) * 8000;

  const deltaTheta = (elapsed / visualDurationMs) * 2 * Math.PI;
  currentTheta = savedTheta + deltaTheta;
  updatePlanesPositions(currentTheta);

  if (isAnimating) {
    requestAnimationFrame(loop);
  }
}

function updateSimulationControlIcons() {
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');

  if (!iconPlay || !iconPause) {
    return;
  }

  iconPlay.classList.toggle('hidden', isAnimating);
  iconPause.classList.toggle('hidden', !isAnimating);
}

function startSim() {
  if (isAnimating) {
    return false;
  }

  isAnimating = true;
  updateSimulationControlIcons();
  startTime = performance.now();
  requestAnimationFrame(loop);
  return true;
}

function stopSim() {
  if (!isAnimating) {
    return false;
  }

  isAnimating = false;
  savedTheta = currentTheta;
  startTime = 0;
  updateSimulationControlIcons();
  return true;
}

function toggleSim() {
  if (isAnimating) {
    stopSim();
    return;
  }

  startSim();
}

// --- EDUCATIONAL SCENARIO LOGIC ---

function startActivity() {
  const introScreen = document.getElementById('intro-screen');
  if (introScreen) {
    introScreen.classList.add('hidden-intro');
  }
}

function goToStep(stepId) {
  document.querySelectorAll('.scenario-step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + stepId).classList.add('active');

  if (String(stepId) === '1') {
    applyStep1UiState();
  }
}

function showFeedback(stepNum, type, message) {
  const fb = document.getElementById(`feedback-${stepNum}`);
  fb.className = `feedback-box ${type}`;
  fb.innerHTML = message;
  fb.classList.remove('hidden');
}

function applyStep1UiState() {
  const triggerButton = document.getElementById('step1-trigger');
  const choicesGroup = document.getElementById('step1-choices');

  if (triggerButton) {
    triggerButton.disabled = step1UiState.triggerDisabled;
    triggerButton.classList.toggle('hidden', step1UiState.triggerHidden);
  }

  if (choicesGroup) {
    choicesGroup.classList.toggle('hidden', !step1UiState.choicesVisible);
  }
}

function activateStep1Challenge() {
  step1UiState = step1StateApi.activateStep1(step1UiState);
  applyStep1UiState();

  if (step1UiState.shouldStartAnimation) {
    startSim();
    step1UiState = {
      ...step1UiState,
      shouldStartAnimation: false
    };
  }
}

function resetStep1Challenge() {
  step1UiState = step1StateApi.createInitialStep1State();
  applyStep1UiState();
}

// Step 1: Multiple choice
function checkStep1(answer, btnObj) {
  document.querySelectorAll('.step1-btn').forEach(b => {
    b.classList.remove('selected', 'correct', 'wrong');
  });

  if (answer === 'L') {
    btnObj.classList.add('correct');
    
    // Show speeds when correct answer is given
    step1UiState.showSpeeds = true;
    updateData();
    
    showFeedback(1, 'success', '<strong>Doğru.</strong> Dünya\'nın şekli nedeniyle 0° enlemi, en geniş çevre uzunluğuna sahiptir. Tüm enlemlerde bir tam dönüş 24 saatte tamamlandığı için (açısal hızın eşitliği), Ekvator üzerindeki L noktasının katetmesi gereken mesafe daha fazladır. Bu durum, L uçağının çizgisel hızının K ve M uçaklarına göre daha yüksek olmasını zorunlu kılar.');
    document.getElementById('next-1').classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    showFeedback(1, 'error', `Yanlış. ${answer} uçağı Ekvator'da değil. Ekvator yayının uzunluğunu ve uçağın aynı sürede bu yolu bitirebilmek için sahip olması gereken yüksek hızı düşünün.`);
    document.getElementById('next-1').classList.add('hidden');
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
    showFeedback(2, 'success', '<strong>Doğru bir varsayım!</strong> Dünya her yerde aynı hızla dönseydi rüzgârlar dümdüz eserdi. Ancak alttaki zemin hareketli ve çizgisel hızı sürekli değiştiği için rüzgârların yönü değişir. (Bknz: Coriolis Etkisi)');
    document.getElementById('next-2').classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    blank.classList.remove('filled');
    showFeedback(2, 'error', '<strong>Yanlış.</strong> Hava kütlesi dümdüz gitmek ister, ancak onun altında hızla hareket eden bir zemin (Dünya) vardır. Zemin ona göre hızlı veya yavaş kalırsa ne olur?');
    document.getElementById('next-2').classList.add('hidden');
  }
}

// Step 3: Wind Animation
function shootWind() {
  const btn = document.getElementById('btn-shoot-wind');
  btn.disabled = true;
  btn.textContent = "💨 Rüzgar Başlatıldı...";

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
      btn.textContent = "🌪 Rüzgarı Tekrar Başlat";
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
    showFeedback(4, 'success', '<strong>Doğru bir analiz.</strong> Dünya\'nın dönüşünden kaynaklanan Coriolis etkisi olmasaydı, hava kütleleri sadece basınç farkına bağlı olarak kutuplar ve Ekvator arasında doğrusal bir rota izlerdi. Bu sapma kuvveti, rüzgârların yönünü değiştirerek atmosferik sirkülasyonu ve dinamik basınç kuşaklarının oluşmasını sağlar.');
    document.getElementById('next-4').classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    showFeedback(4, 'error', '<strong>Tekrar düşünün.</strong> Sadece güneş ışınları ısınma/soğuma yaratır ama yığılma ve burgular hız sapmasının (Coriolis) marifetidir.');
    document.getElementById('next-4').classList.add('hidden');
  }
}

// Step Outro: Final Question
function checkStepOutro(answer, btnObj) {
  document.querySelectorAll('.step-outro-btn').forEach(b => {
    b.classList.remove('selected', 'correct', 'wrong');
  });

  const feedbackOutro = document.getElementById('feedback-outro');
  const finalEval = document.getElementById('final-evaluation');

  if (answer === 'Hayır') {
    btnObj.classList.add('correct');
    feedbackOutro.className = 'feedback-box success mt-4';
    feedbackOutro.innerHTML = '<strong>Tebrikler!</strong> Doğru cevap. Eğer hız farkı olmasaydı atmosfer de tıpkı bir kutu gibi birlikte hareket ederdi, rüzgârların yönünü saptıracak bir savrulma ortaya çıkmazdı.';
    finalEval.classList.remove('hidden');
  } else {
    btnObj.classList.add('wrong');
    feedbackOutro.className = 'feedback-box error mt-4';
    feedbackOutro.innerHTML = '<strong>Tekrar düşünün.</strong> Sapmayı yaratan şey sadece Dünya\'nın dönmesi değil, Ekvator ile Kutuplar arasındaki <em>hız farkı</em>\'dır.';
    finalEval.classList.add('hidden');
  }
}

function resetScenario() {
  document.querySelectorAll('.feedback-box').forEach(fb => fb.classList.add('hidden'));
  document.querySelectorAll('.next-step, [id^="next-"]').forEach(btn => btn.classList.add('hidden'));
  document.querySelectorAll('.choice-btn, .chip').forEach(btn => btn.classList.remove('selected', 'correct', 'wrong'));

  const finalEval = document.getElementById('final-evaluation');
  if (finalEval) finalEval.classList.add('hidden');

  const blank = document.getElementById('blank-word');
  if (blank) {
    blank.textContent = "...";
    blank.classList.remove('filled');
  }

  resetStep1Challenge();
  stopSim();
  goToStep('intro');
}

browserHandlersApi.registerWindowHandlers(window, {
  startActivity,
  toggleFullScreen,
  toggleSim,
  goToStep,
  checkStep1,
  checkStep2,
  shootWind,
  checkStep4,
  checkStepOutro,
  resetScenario,
  activateStep1Challenge
});

// Initialize
initSim();

function toggleFullScreen() {
  const doc = window.document;
  const docEl = doc.documentElement;
  const iconFullScreen = document.getElementById('icon-fullscreen');
  const iconExitFullScreen = document.getElementById('icon-exit-fullscreen');

  const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    if (requestFullScreen) {
      requestFullScreen.call(docEl);
      if (iconFullScreen) iconFullScreen.classList.add('hidden');
      if (iconExitFullScreen) iconExitFullScreen.classList.remove('hidden');
    }
  } else {
    if (cancelFullScreen) {
      cancelFullScreen.call(doc);
      if (iconExitFullScreen) iconExitFullScreen.classList.add('hidden');
      if (iconFullScreen) iconFullScreen.classList.remove('hidden');
    }
  }
}
