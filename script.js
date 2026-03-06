const planesData = [
  { id: "K", latDeg: 65, color: "#a855f7" }, // Purple
  { id: "L", latDeg: 0, color: "#3b82f6" }, // Blue (Equator)
  { id: "M", latDeg: -55, color: "#ec4899" }  // Pink
];

const elements = {
  timeRange: document.getElementById('timeRange'),
  timeLabel: document.getElementById('timeLabel'),
  radiusInput: document.getElementById('radiusInput'),
  radiusLabel: document.getElementById('radiusLabel'),
  tableBody: document.getElementById('tableBody'),
  toggleAnimBtn: document.getElementById('toggleAnim'),
  showAnswerBtn: document.getElementById('showAnswer'),
  answerBox: document.getElementById('answer'),
  globe: document.getElementById('globe'),
  planesGroup: document.getElementById('planes'),
  parallelsBack: document.getElementById('parallels-back')
};

let isAnimating = false;
let startTime = 0;
let currentTheta = 0; // Starts at 0 (Right edge of globe)

// Globe configuration
const CX = 250, CY = 250, R = 200;
const TILT = 0.35; // Tilt factor (sin of pitch angle) for realistic 3D perception

function init() {
  drawMeridians();
  drawStaticParallels();
  updateData(); // Sets table and dynamically draws orbits and planes
  setupEventListeners();
  updatePlanesPositions(Math.PI / 4); // Start static planes at 45 degree angle for visual appeal
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
    if (planesData.find(p => p.latDeg === lat)) continue; // skip the ones with planes
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
  // Clear only planes so we can rebuild upon update without clearing grid
  elements.planesGroup.innerHTML = '';

  planesData.forEach(plane => {
    const latRad = plane.latDeg * Math.PI / 180;
    const rx = R * Math.cos(latRad);
    const ry = rx * TILT;
    const yCenter = CY - R * Math.sin(latRad);

    // Dynamic Orbit Path
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

    // Creating the plane group
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = "plane-" + plane.id;

    // Plane velocity vector (arrow)
    const vector = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vector.id = "vec-" + plane.id;
    vector.setAttribute("x1", "0");
    vector.setAttribute("y1", "0");
    vector.setAttribute("stroke", plane.color);
    vector.setAttribute("stroke-width", "2.5");
    vector.setAttribute("marker-end", `url(#arrowhead-${plane.id})`);
    vector.setAttribute("stroke-linecap", "round");

    // Plane marker (sleek jet icon)
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

    // Text Label for Plane
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
  // Normalize theta to 0 - 2PI range
  const normTheta = theta % (2 * Math.PI);

  // Math logic:
  // For the physical animation, the planes all complete 1 tour in exactly T hours.
  // Their angular velocity (Omega) is equal. So theta is the same for all.
  // BUT their tangential physical speed differs, so the vector arrow must reflect this.

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

    // Depth sorting (dim it if on the backside of the globe)
    if (Math.sin(normTheta) < 0) {
      g.style.opacity = "0.2";
      g.querySelector("text").style.display = "none"; // Hide label on backside to avoid clutter
    } else {
      g.style.opacity = "1";
      g.querySelector("text").style.display = "block";
    }

    // Velocity Vector
    // Derivative (tangent): dx = -rx*sin(theta), dy = ry*cos(theta)
    const dx = -rx * Math.sin(normTheta);
    const dy = ry * Math.cos(normTheta);

    // Constant scaling factor to make visual arrows proportionate to their true linear velocity (rx)
    // The length of the tangent on the orthographic projection varies slightly which creates a true 3D effect!
    const vecScale = 0.45;
    const vecX = dx * vecScale;
    const vecY = dy * vecScale;

    const vector = document.getElementById("vec-" + plane.id);
    vector.setAttribute("x2", vecX);
    vector.setAttribute("y2", vecY);

    const iconGroup = document.getElementById("iconGroup-" + plane.id);
    if (iconGroup) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      iconGroup.setAttribute("transform", `rotate(${angle})`);
    }
  });
}

function updateData() {
  const T = parseFloat(elements.timeRange.value);
  const Rkm = parseFloat(elements.radiusInput.value);

  elements.timeLabel.textContent = T;
  elements.radiusLabel.textContent = Rkm;

  let html = "";

  // Sort planes by speed just for displaying in logical order (L, M, K)
  const sortedPlanes = [...planesData].sort((a, b) => Math.abs(a.latDeg) - Math.abs(b.latDeg));

  sortedPlanes.forEach(plane => {
    const latRad = Math.abs(plane.latDeg) * Math.PI / 180;
    const radius = Math.cos(latRad);
    const rKm = Rkm * radius;
    const circumference = 2 * Math.PI * rKm;
    const speed = circumference / T;

    html += `
      <tr>
        <td><strong>${plane.id}</strong></td>
        <td>${plane.latDeg}°</td>
        <td>${rKm.toFixed(0)} km</td>
        <td><span style="color:${plane.color}; opacity: 0.9">${speed.toFixed(0)} km/h</span></td>
      </tr>
    `;
  });
  elements.tableBody.innerHTML = html;

  renderPlaneOrbits();
  updatePlanesPositions(currentTheta);
}

function loop(timestamp) {
  if (!isAnimating) return;

  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;

  // They complete one orbit visually every 6 seconds
  const visualDurationMs = 6000;
  currentTheta = (elapsed / visualDurationMs) * 2 * Math.PI;

  updatePlanesPositions(currentTheta);
  requestAnimationFrame(loop);
}

function setupEventListeners() {
  elements.timeRange.addEventListener('input', updateData);
  elements.radiusInput.addEventListener('input', updateData);

  elements.toggleAnimBtn.addEventListener('click', () => {
    isAnimating = !isAnimating;
    if (isAnimating) {
      elements.toggleAnimBtn.textContent = "Simülasyonu Durdur";
      elements.toggleAnimBtn.classList.add("active");

      // Calculate the start time so animation resumes smoothly from currentTheta
      startTime = performance.now() - (currentTheta / (2 * Math.PI)) * 6000;
      requestAnimationFrame(loop);
    } else {
      elements.toggleAnimBtn.textContent = "Simülasyonu Başlat";
      elements.toggleAnimBtn.classList.remove("active");
    }
  });

  elements.showAnswerBtn.addEventListener('click', () => {
    elements.answerBox.classList.remove('hidden');
    elements.showAnswerBtn.style.display = 'none'; // Optional: hide button once revealed
    // Add small delay for CSS transition to trigger
    setTimeout(() => {
      elements.answerBox.style.opacity = 1;
    }, 10);
  });
}

init();