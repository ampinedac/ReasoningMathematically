// --- Modal Magic V Guardadas global ---
function setupMagicVSavedModal() {
  const modal = document.getElementById("magicVSavedModal");
  const closeBtn = document.getElementById("closeMagicVSavedModal");
  const content = document.getElementById("magicVSavedModalContent");
  // Botones en cada misión
  const btns = [
    document.getElementById("showMagicVSavedBtn"),
    document.getElementById("showMagicVSavedBtn2"),
    document.getElementById("showMagicVSavedBtn3"),
    document.getElementById("showMagicVSavedBtn4"),
    document.getElementById("showMagicVSavedBtn5")
  ].filter(Boolean);

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Renderizar tabla igual que en misión 1
      content.innerHTML = renderMagicVSavedTable();
      modal.style.display = "block";
    });
  });
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
  // Cerrar al hacer click fuera del contenido
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Devuelve el HTML de la tabla de Magic V guardadas (idéntico a misión 1)
function renderMagicVSavedTable() {
  if (!sessionData.mission1.saved.length) {
    return '<p class="magicv-saved-item-label">Aún no tienes combinaciones guardadas.</p>';
  }
  const rows = sessionData.mission1.saved.map((comb, index) => {
    const sumaCell = comb.sumaMagica !== null
      ? `<span class="magicv-suma-confirmed">✔ ${comb.sumaMagica}</span>`
      : `<span class="magicv-suma-pending">Sin verificar</span>`;
    let permutacionesHtml = "";
    if (comb.permutaciones && comb.permutaciones.length > 0) {
      permutacionesHtml = `<div class="magicv-permutaciones-list">` +
        comb.permutaciones.map((perm) => `
          <div class="magicv-mini-board magicv-mini-board-permutacion">
            <span class="magicv-mini-dot" data-slot="leftTop">${perm.leftTop}</span>
            <span class="magicv-mini-dot" data-slot="rightTop">${perm.rightTop}</span>
            <span class="magicv-mini-dot" data-slot="leftMid">${perm.leftMid}</span>
            <span class="magicv-mini-dot" data-slot="rightMid">${perm.rightMid}</span>
            <span class="magicv-mini-dot" data-slot="bottom">${perm.bottom}</span>
          </div>`).join("") + `</div>`;
    }
    return `<tr>
      <td>
        <div class="magicv-saved-item-label">V válida ${index + 1}</div>
        <div class="magicv-v-group">
          <div class="magicv-mini-board">
            <span class="magicv-mini-dot" data-slot="leftTop">${comb.leftTop}</span>
            <span class="magicv-mini-dot" data-slot="rightTop">${comb.rightTop}</span>
            <span class="magicv-mini-dot" data-slot="leftMid">${comb.leftMid}</span>
            <span class="magicv-mini-dot" data-slot="rightMid">${comb.rightMid}</span>
            <span class="magicv-mini-dot" data-slot="bottom">${comb.bottom}</span>
          </div>
          ${permutacionesHtml}
        </div>
      </td>
      <td class="magicv-suma-cell">${sumaCell}</td>
    </tr>`;
  }).join("");
  return `
    <table class="magicv-saved-table">
      <thead>
        <tr>
          <th>Magic V</th>
          <th>Suma mágica</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// --- Persistencia de progreso con sessionStorage ---
function getInitialSessionData() {
  try {
    const saved = sessionStorage.getItem("actividad3_sessionData");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Asegura estructura mínima
      return Object.assign({
        character: null,
        progress: 0,
        missionsCompleted: [],
        timestamps: {},
        mission1: {
          current: createEmptyMission1Assignment(),
          saved: [],
          explorationUnlocked: false,
          audioSubmitted: false
        }
      }, parsed, {
        mission1: Object.assign({
          current: createEmptyMission1Assignment(),
          saved: [],
          explorationUnlocked: false,
          audioSubmitted: false
        }, parsed.mission1 || {})
      });
    }
  } catch (e) {}
  // Por defecto
  return {
    character: null,
    progress: 0,
    missionsCompleted: [],
    timestamps: {},
    mission1: {
      current: createEmptyMission1Assignment(),
      saved: [],
      explorationUnlocked: false,
      audioSubmitted: false
    }
  };
}

let sessionData = getInitialSessionData();

// Guarda el progreso relevante en sessionStorage
function saveSessionProgress() {
  try {
    // Solo guardamos lo relevante (sin referencias a nodos DOM ni funciones)
    const toSave = {
      character: sessionData.character,
      progress: sessionData.progress,
      missionsCompleted: sessionData.missionsCompleted,
      timestamps: sessionData.timestamps,
      mission1: {
        current: sessionData.mission1.current,
        saved: sessionData.mission1.saved,
        explorationUnlocked: sessionData.mission1.explorationUnlocked,
        audioSubmitted: sessionData.mission1.audioSubmitted
      }
    };
    sessionStorage.setItem("actividad3_sessionData", JSON.stringify(toSave));
  } catch (e) {}
}

const TOTAL_MISSIONS = 5;
let studentCode = "";
let studentInfo = null;

const welcomeContainer = document.getElementById("ContenedorBienvenida");
const confirmContainer = document.getElementById("ContenedorConfirmacion");
const activityApp = document.getElementById("activityApp");

const studentCodeInput = document.getElementById("studentCodeInput");
const enterBtn = document.getElementById("enterBtn");
const welcomeError = document.getElementById("welcomeError");
const confirmationQuestion = document.getElementById("confirmationQuestion");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

const introSteps = Array.from(document.querySelectorAll(".intro-step"));
const introNextStep1Btn = document.getElementById("introNextStep1");
const introNextStep2Btn = document.getElementById("introNextStep2");
const startIntroBtn = document.getElementById("startIntroBtn");
let introCurrentStep = 0;

const characterGrid = document.getElementById("characterGrid");
const characterStatus = document.getElementById("characterStatus");
const confirmCharacterBtn = document.getElementById("confirmCharacterBtn");
const guideBadge = document.getElementById("guideBadge");

const missionNodes = Array.from(document.querySelectorAll(".mission-node"));
const mapHint = document.getElementById("mapHint");
const mapStage = document.querySelector(".map-stage");
const mapGlowCanvas = document.getElementById("mapGlowCanvas");
const mapFogCanvas = document.getElementById("mapFogCanvas");
const mapMissionAnchors = missionNodes.map((node) => ({
  id: Number(node.dataset.mission),
  left: Number.parseFloat(node.style.left),
  top: Number.parseFloat(node.style.top)
}));
const mapRevealProgress = Object.fromEntries(mapMissionAnchors.map((mission) => [mission.id, 0]));
const mapAnimatingMissions = new Set();
let mapVoronoiOwnerByPixel = null;
let mapResizeFrame = null;

const dragState = {
  active: false,
  pointerId: null,
  ghost: null,
  hoverMission: null
};

// --- BLOQUE 1: Foto y suma mágica ---
let bloque1Congelado = false; // Variable de control global para el bloqueo del tablero
const mission1SlotOrder = ["leftTop", "rightTop", "leftMid", "rightMid", "bottom"];
const boardFoto = document.getElementById("magicvBoardFoto");
const chipTrayFoto = document.getElementById("mission1ChipTray");
const checkMagicVBtn = document.getElementById("checkMagicVBtn");
const resetMagicVBtn = document.getElementById("resetMagicVBtn");
const magicVFeedback = document.getElementById("magicVFeedback");

// ...eliminado: referencias a contenedores y elementos dinámicos de bloques ahora estáticos...

const mission1DragState = {
  active: false,
  pointerId: null,
  chip: null,
  originSlot: null,
  ghost: null,
  hoverDrop: null,
  hoverTray: false
};

const mission1AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  submitting: false
};


// Asegura que init() se ejecute solo cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  setupEntryFlow();
  setupIntroductionScreen();
  setupCharacterMission();
  setupMap();
  setupGuideDragAndDrop();
  setupMission1();

  setupBackToMapButtons();
  renderMission1SavedCombinations();
  clearMission1Board(false);
  syncMission1ExplorationState();
  setupMagicVSavedModal();
}

function setupEntryFlow() {
  studentCodeInput.addEventListener("keydown", (event) => {
    const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  });

  studentCodeInput.addEventListener("input", () => {
    studentCodeInput.value = studentCodeInput.value.replace(/\D/g, "");
  });

  studentCodeInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      enterBtn.click();
    }
  });

  enterBtn.addEventListener("click", handleCodeSubmit);

  confirmNoBtn.addEventListener("click", () => {
    confirmContainer.style.display = "none";
    welcomeContainer.style.display = "flex";
    studentCodeInput.focus();
  });

  confirmYesBtn.addEventListener("click", () => {
    confirmContainer.style.display = "none";
    activityApp.style.display = "block";
    registerTimestamp("confirmationAccepted");
    showScreen("introductionScreen");
  });
}

function handleCodeSubmit() {
  const code = studentCodeInput.value.trim();

  if (!code) {
    setMessage(welcomeError, "Por favor escribe tu codigo.", "bad");
    return;
  }

  if (!/^\d+$/.test(code)) {
    setMessage(welcomeError, "Solo se permiten numeros.", "bad");
    return;
  }

  if (code === "0000") {
    const guest = window.prompt("Escribe tu nombre para ingresar como invitado");
    const guestName = (guest || "").trim();
    if (!guestName) {
      setMessage(welcomeError, "Para continuar como invitado debes escribir tu nombre.", "bad");
      return;
    }

    studentCode = code;
    studentInfo = { nombre: guestName, apellidos: "", curso: "INVITADO" };
    confirmationQuestion.textContent = `Eres ${toTitle(guestName)}?`;
    setMessage(welcomeError, "", "");
    welcomeContainer.style.display = "none";
    confirmContainer.style.display = "flex";
    return;
  }

  const estudiante = (window.estudiantesData || {})[code];
  if (!estudiante) {
    setMessage(welcomeError, "Codigo no encontrado. Verifica que este bien escrito.", "bad");
    return;
  }

  studentCode = code;
  studentInfo = estudiante;

  const nombre = toTitle(estudiante.nombre || "");
  const apellidos = toTitle(estudiante.apellidos || "");
  const curso = estudiante.curso || "";

  if (curso === "DOCENTE") {
    confirmationQuestion.textContent = `Eres ${nombre} ${apellidos}?`;
  } else {
    confirmationQuestion.textContent = `Eres ${nombre} ${apellidos} del curso ${curso}?`;
  }

  setMessage(welcomeError, "", "");
  welcomeContainer.style.display = "none";
  confirmContainer.style.display = "flex";
}

function setupIntroductionScreen() {
  setIntroStep(0);

  if (introNextStep1Btn) {
    introNextStep1Btn.addEventListener("click", () => {
      setIntroStep(1);
    });
  }

  if (introNextStep2Btn) {
    introNextStep2Btn.addEventListener("click", () => {
      setIntroStep(2);
    });
  }

  startIntroBtn.addEventListener("click", () => {
    registerTimestamp("introductionViewed");
    showScreen("characterMissionScreen");
  });
}

function setIntroStep(stepIndex) {
  if (!introSteps.length) {
    return;
  }

  introCurrentStep = Math.max(0, Math.min(stepIndex, introSteps.length - 1));

  introSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === introCurrentStep);
  });
}

function setupCharacterMission() {
  characterGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".character-card");
    if (!card) {
      return;
    }

    document.querySelectorAll(".character-card").forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");

    sessionData.character = {
      id: card.dataset.character,
      name: card.dataset.name,
      image: card.dataset.image
    };
    saveSessionProgress();
    setMessage(characterStatus, `${sessionData.character.name} sera tu guia en Numetrix.`, "good");
    confirmCharacterBtn.disabled = false;
  });

  confirmCharacterBtn.addEventListener("click", () => {
    if (!sessionData.character) {
      setMessage(characterStatus, "Selecciona un personaje para continuar.", "bad");
      return;
    }

    sessionData.progress = 1;
    saveSessionProgress();
    registerTimestamp("characterSelected");
    hydrateGuideBadges();
    renderMap();
    showScreen("mapScreen");
  });
}

function setupMap() {
  missionNodes.forEach((node) => {
    node.addEventListener("click", () => {
      setMessage(mapHint, "Para entrar a la mision, arrastra tu guia y sueltalo sobre el marcador activo.", "");
    });
  });

  window.addEventListener("resize", queueMapFogResize);
}

function setupGuideDragAndDrop() {
  guideBadge.addEventListener("pointerdown", (event) => {
    const dragHandle = event.target.closest(".guide-dragger");
    if (!dragHandle || !sessionData.character) {
      return;
    }

    const currentMission = getCurrentAvailableMission();
    if (!currentMission) {
      setMessage(mapHint, "No hay una mision disponible para abrir ahora.", "bad");
      return;
    }

    event.preventDefault();
    startGuideDrag(event);
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragState.active || event.pointerId !== dragState.pointerId) {
      return;
    }

    event.preventDefault();
    moveGuideGhost(event.clientX, event.clientY);
    updateDropHover(event.clientX, event.clientY);
  }, { passive: false });

  window.addEventListener("pointerup", (event) => {
    if (!dragState.active || event.pointerId !== dragState.pointerId) {
      return;
    }

    event.preventDefault();
    finishGuideDrag(event.clientX, event.clientY);
  });
}

function startGuideDrag(event) {
  dragState.active = true;
  dragState.pointerId = event.pointerId;
  dragState.hoverMission = null;
  mapStage.classList.add("dragging-guide");

  const ghost = document.createElement("div");
  ghost.className = "guide-drag-ghost";
  ghost.innerHTML = `<img src="${sessionData.character.image}" alt="${sessionData.character.name}">`;
  document.body.appendChild(ghost);

  dragState.ghost = ghost;
  moveGuideGhost(event.clientX, event.clientY);
  setMessage(mapHint, "Arrastra tu guia al marcador resaltado y sueltalo para entrar.", "");
}

function moveGuideGhost(clientX, clientY) {
  if (!dragState.ghost) {
    return;
  }

  dragState.ghost.style.left = `${clientX}px`;
  dragState.ghost.style.top = `${clientY}px`;
}

function updateDropHover(clientX, clientY) {
  const currentMission = getCurrentAvailableMission();
  const hoveredNode = document.elementFromPoint(clientX, clientY)?.closest(".mission-node");
  const hoveredMission = hoveredNode ? Number(hoveredNode.dataset.mission) : null;
  const isValidHover = currentMission && hoveredMission === currentMission;

  missionNodes.forEach((node) => {
    node.classList.remove("drop-hover");
  });

  if (isValidHover && hoveredNode) {
    hoveredNode.classList.add("drop-hover");
    dragState.hoverMission = hoveredMission;
    setMessage(mapHint, `Suelta para entrar a la mision ${hoveredMission}.`, "good");
    return;
  }

  dragState.hoverMission = null;
  setMessage(mapHint, "Suelta sobre el marcador activo para abrir la siguiente mision.", "");
}

function finishGuideDrag(clientX, clientY) {
  const currentMission = getCurrentAvailableMission();
  const droppedNode = document.elementFromPoint(clientX, clientY)?.closest(".mission-node");
  const droppedMission = droppedNode ? Number(droppedNode.dataset.mission) : null;
  const isValidDrop = currentMission && droppedMission === currentMission;

  if (isValidDrop) {
    openMission(currentMission);
  } else {
    setMessage(mapHint, "Punto invalido. El guia vuelve a su lugar.", "bad");
  }

  missionNodes.forEach((node) => {
    node.classList.remove("drop-hover");
  });

  mapStage.classList.remove("dragging-guide");
  if (dragState.ghost) {
    dragState.ghost.remove();
  }

  dragState.active = false;
  dragState.pointerId = null;
  dragState.ghost = null;
  dragState.hoverMission = null;
}

function getCurrentAvailableMission() {
  const nextMission = sessionData.progress;
  if (!nextMission || nextMission > TOTAL_MISSIONS) {
    return null;
  }

  if (sessionData.missionsCompleted.includes(nextMission)) {
    return null;
  }

  return nextMission;
}

function openMission(mission) {
  setMessage(mapHint, `Abriendo mision ${mission}...`, "good");
  showScreen(`mission${mission}Screen`);
  registerTimestamp(`mission${mission}Opened`);
}

function renderMap() {
  const currentMission = getCurrentAvailableMission();

  missionNodes.forEach((node) => {
    const mission = Number(node.dataset.mission);
    const stateSpan = node.querySelector(".node-state");
    node.classList.remove("locked", "available", "completed", "drop-hover");

    if (sessionData.missionsCompleted.includes(mission)) {
      node.classList.add("completed");
      stateSpan.textContent = "⭐";
      stateSpan.setAttribute("aria-label", "Mision completada");
      return;
    }

    if (mission === currentMission) {
      node.classList.add("available");
      stateSpan.textContent = "⭐";
      stateSpan.setAttribute("aria-label", "Mision desbloqueada");
      return;
    }

    node.classList.add("locked");
    stateSpan.textContent = "🔒";
    stateSpan.setAttribute("aria-label", "Mision bloqueada");
  });

  const done = sessionData.missionsCompleted.length;
  if (done === TOTAL_MISSIONS) {
    setMessage(mapHint, "Laboratorio reiniciado. Todas las misiones estan completadas.", "good");
  } else {
    setMessage(
      mapHint,
      `Misiones completadas: ${done}/${TOTAL_MISSIONS}. Arrastra tu guia al marcador activo para abrir la siguiente.`,
      ""
    );
  }

  syncMapFogWithProgress();
}

function queueMapFogResize() {
  if (!document.getElementById("mapScreen")?.classList.contains("active-screen")) {
    return;
  }

  if (mapResizeFrame) {
    cancelAnimationFrame(mapResizeFrame);
  }

  mapResizeFrame = window.requestAnimationFrame(() => {
    mapResizeFrame = null;
    ensureMapFogCanvases();
    drawMapFog();
    drawMapGlow();
  });
}

function ensureMapFogCanvases() {
  if (!mapStage || !mapFogCanvas || !mapGlowCanvas) {
    return false;
  }

  const width = Math.round(mapStage.clientWidth);
  const height = Math.round(mapStage.clientHeight);

  if (!width || !height) {
    return false;
  }

  const needsResize = mapFogCanvas.width !== width || mapFogCanvas.height !== height;

  if (needsResize) {
    mapFogCanvas.width = width;
    mapFogCanvas.height = height;
    mapGlowCanvas.width = width;
    mapGlowCanvas.height = height;
    mapVoronoiOwnerByPixel = computeMapVoronoi(width, height);
  } else if (!mapVoronoiOwnerByPixel) {
    mapVoronoiOwnerByPixel = computeMapVoronoi(width, height);
  }

  return true;
}

function computeMapVoronoi(width, height) {
  const pixelOwners = new Uint8Array(width * height);
  const nodes = mapMissionAnchors.map((mission) => ({
    id: mission.id,
    x: (mission.left / 100) * width,
    y: (mission.top / 100) * height
  }));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let closestMission = nodes[0].id;
      let minimumDistance = Number.POSITIVE_INFINITY;

      nodes.forEach((node) => {
        const deltaX = x - node.x;
        const deltaY = y - node.y;
        const distance = (deltaX * deltaX) + (deltaY * deltaY);

        if (distance < minimumDistance) {
          minimumDistance = distance;
          closestMission = node.id;
        }
      });

      pixelOwners[(y * width) + x] = closestMission;
    }
  }

  return pixelOwners;
}

function drawMapFog() {
  if (!ensureMapFogCanvases()) {
    return;
  }

  const width = mapFogCanvas.width;
  const height = mapFogCanvas.height;
  const context = mapFogCanvas.getContext("2d");
  const imageData = context.createImageData(width, height);
  const pixels = imageData.data;
  const maximumFogAlpha = 210;

  for (let index = 0; index < width * height; index += 1) {
    const missionId = mapVoronoiOwnerByPixel[index];
    const progress = mapRevealProgress[missionId] || 0;
    const easedProgress = progress < 1 ? 1 - ((1 - progress) ** 3) : 1;
    const alpha = Math.round(maximumFogAlpha * (1 - easedProgress));
    const pixelIndex = index * 4;

    pixels[pixelIndex] = 10;
    pixels[pixelIndex + 1] = 18;
    pixels[pixelIndex + 2] = 40;
    pixels[pixelIndex + 3] = alpha;
  }

  context.putImageData(imageData, 0, 0);
}

function drawMapGlow() {
  if (!ensureMapFogCanvases()) {
    return;
  }

  const width = mapGlowCanvas.width;
  const height = mapGlowCanvas.height;
  const context = mapGlowCanvas.getContext("2d");
  context.clearRect(0, 0, width, height);

  mapMissionAnchors.forEach((mission) => {
    const progress = mapRevealProgress[mission.id] || 0;
    if (progress <= 0) {
      return;
    }

    const centerX = (mission.left / 100) * width;
    const centerY = (mission.top / 100) * height;
    const radius = 72 + (progress * (width * 0.18));
    const alpha = progress * 0.24;
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

    gradient.addColorStop(0, `rgba(255, 236, 170, ${alpha})`);
    gradient.addColorStop(0.38, `rgba(255, 220, 145, ${alpha * 0.48})`);
    gradient.addColorStop(0.72, `rgba(255, 205, 120, ${alpha * 0.18})`);
    gradient.addColorStop(1, "rgba(255, 190, 100, 0)");

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
  });
}

function animateMapReveal(missionId) {
  if (mapRevealProgress[missionId] >= 1) {
    mapRevealProgress[missionId] = 1;
    mapAnimatingMissions.delete(missionId);
    drawMapFog();
    drawMapGlow();
    return;
  }

  mapRevealProgress[missionId] = Math.min(mapRevealProgress[missionId] + 0.011, 1);
  drawMapFog();
  drawMapGlow();
  window.requestAnimationFrame(() => animateMapReveal(missionId));
}

function syncMapFogWithProgress() {
  if (!ensureMapFogCanvases()) {
    return;
  }

  mapMissionAnchors.forEach((mission) => {
    const isCompleted = sessionData.missionsCompleted.includes(mission.id);

    if (!isCompleted) {
      mapRevealProgress[mission.id] = 0;
      mapAnimatingMissions.delete(mission.id);
      return;
    }

    if (mapRevealProgress[mission.id] >= 1 || mapAnimatingMissions.has(mission.id)) {
      return;
    }

    mapAnimatingMissions.add(mission.id);
    window.requestAnimationFrame(() => animateMapReveal(mission.id));
  });

  drawMapFog();
  drawMapGlow();
}

function canAccessMission(missionNumber) {
  return missionNumber <= sessionData.progress || sessionData.missionsCompleted.includes(missionNumber);
}

// ...eliminado: toda la lógica de manipulación dinámica de los bloques ahora estáticos...
      dragState.active = true;
      dragState.pointerId = event.pointerId;
      dragState.chip = chip;
      dragState.ghost = document.createElement('div');
      dragState.ghost.className = 'magicv-chip-ghost';
      dragState.ghost.textContent = chip.dataset.value;
      document.body.appendChild(dragState.ghost);
      moveGhost(event.clientX, event.clientY);
      feedback.textContent = '';
      feedback.classList.remove('good');
    
    function moveGhost(x, y) {
      if (!dragState.ghost) return;
      dragState.ghost.style.left = `${x}px`;
      dragState.ghost.style.top = `${y}px`;
    }
    function handleMove(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) return;
      event.preventDefault();
      moveGhost(event.clientX, event.clientY);
    }
    function handleDrop(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) return;
      event.preventDefault();
      const chip = dragState.chip;
      const targetDrop = document.elementFromPoint(event.clientX, event.clientY)?.closest('.magicv-drop:not([data-slot="bottom"])');
      const droppedInTray = Boolean(document.elementFromPoint(event.clientX, event.clientY)?.closest('#mission1ChipTrayExploracion'));
      if (targetDrop) {
        if (targetDrop.querySelector('.magicv-chip')) {
          tray.appendChild(targetDrop.querySelector('.magicv-chip'));
        }
        targetDrop.appendChild(chip);
      } else if (droppedInTray) {
        tray.appendChild(chip);
      }
      if (dragState.ghost) dragState.ghost.remove();
      dragState = { active: false, pointerId: null, chip: null, ghost: null };
      if (!feedback.classList.contains('good')) feedback.textContent = '';
      feedback.classList.remove('good');
    }
    Array.from(board.querySelectorAll('.magicv-drop')).forEach(drop => {
      if (drop.dataset.slot !== 'bottom') drop.addEventListener('pointerdown', startDrag);
    });
    Array.from(tray.querySelectorAll('.magicv-chip')).forEach(chip => {
      chip.addEventListener('pointerdown', startDrag);
    });
    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleDrop);
    // Validar combinación
    checkBtn.disabled = false;
    checkBtn.onclick = () => {
      const current = {};
      Array.from(board.querySelectorAll('.magicv-drop')).forEach(drop => {
        if (drop.dataset.slot === 'bottom') {
          current[drop.dataset.slot] = nucleo;
        } else {
          current[drop.dataset.slot] = drop.querySelector('.magicv-chip') ? Number(drop.querySelector('.magicv-chip').dataset.value) : null;
        }
      });
      const hasMissing = slots.some(slot => current[slot] === null);
      if (hasMissing) {
        feedback.textContent = 'Completa toda la V antes de comprobar.';
        return;
      }
      const leftArm = current.leftTop + current.leftMid;
      const rightArm = current.rightTop + current.rightMid;
      if (leftArm !== rightArm) {
        feedback.textContent = 'Verifica si la suma de los brazos es igual.';
        return;
      }
      // Validar unicidad (no repetida)
      const combinacion = [current.leftTop, current.rightTop, current.leftMid, current.rightMid];
      const yaExiste = sessionData.mission1.exploracionCombinaciones?.some(c =>
        c.leftTop === current.leftTop &&
        c.rightTop === current.rightTop &&
        c.leftMid === current.leftMid &&
        c.rightMid === current.rightMid
      );
      if (yaExiste) {
        feedback.textContent = 'Esa combinación ya la encontraste.';
        return;
      }
      // Guardar combinación
      if (!sessionData.mission1.exploracionCombinaciones) sessionData.mission1.exploracionCombinaciones = [];
      sessionData.mission1.exploracionCombinaciones.push({ ...current });
      feedback.textContent = '¡Combinación guardada!';
      feedback.classList.remove('bad');
      feedback.classList.add('good');
      renderExploracionCombinaciones();
      // Limpiar tablero (solo las 4 fichas)
      slots.filter(s=>s!=='bottom').forEach(slot=>{
        const drop = board.querySelector(`.magicv-drop[data-slot="${slot}"]`);
        if (drop && drop.querySelector('.magicv-chip')) tray.appendChild(drop.querySelector('.magicv-chip'));
      });
      // Habilitar audio si ya tiene 8
      if (sessionData.mission1.exploracionCombinaciones.length >= 8) {
        audioBlock.classList.remove('is-hidden');
        checkBtn.disabled = true;
        feedback.textContent = '¡Has encontrado todas las combinaciones! Ahora responde la pregunta por audio.';
        feedback.classList.remove('good');
      }
    };
    // Renderizar combinaciones encontradas
    function renderExploracionCombinaciones() {
      const arr = sessionData.mission1.exploracionCombinaciones || [];
      // Agrupar de a dos por fila
      let html = '';
      for (let i = 0; i < arr.length; i += 2) {
        html += `<div class='magicv-mini-row'>`;
        for (let j = i; j < i + 2 && j < arr.length; j++) {
          const c = arr[j];
          html += `
            <div class='magicv-mini-board magicv-mini-board-small'>
              <span>${c.leftTop}</span>
              <span>${c.rightTop}</span>
              <span>${c.leftMid}</span>
              <span>${c.rightMid}</span>
              <span>${c.bottom}</span>
            </div>
          `;
        }
        html += `</div>`;
      }
      savedList.innerHTML = html;
      savedCount.textContent = '';
    }
    renderExploracionCombinaciones();
    // Reset
    resetBtn.onclick = () => {
      sessionData.mission1.exploracionCombinaciones = [];
      renderExploracionCombinaciones();
      feedback.textContent = '';
      feedback.classList.remove('good');
      checkBtn.disabled = false;
      // Limpiar tablero
      slots.filter(s=>s!=='bottom').forEach(slot=>{
        const drop = board.querySelector(`.magicv-drop[data-slot="${slot}"]`);
        if (drop && drop.querySelector('.magicv-chip')) tray.appendChild(drop.querySelector('.magicv-chip'));
      });
      audioBlock.classList.add('is-hidden');
      feedback.textContent = '';
    };
  

  // Card dinámica para total mágico
  function mostrarCardTotalMagico(comb) {
    // Eliminar si ya existe
    const existente = document.getElementById("cardTotalMagico");
    if (existente) existente.remove();
    // Construir la card
    const card = document.createElement("article");
    card.className = "narrative-card narrative-card-magico";
    card.id = "cardTotalMagico";
    card.innerHTML = `
      <h3>¿Qué es un total mágico?</h3>
      <p>Llamaremos <strong>"total mágico"</strong> a la suma de los tres números que forman un brazo de una V mágica.</p>
      <p>En tu Magic V ¿cuál es el total mágico?</p>
      <label for="inputTotalMagico">Total mágico:</label>
      <input id="inputTotalMagico" type="number" min="1" max="100" class="chalk-input" style="width:120px; margin: 0 10px;">
      <button id="btnValidarTotalMagico" class="btn btn-primary">Validar</button>
      <div id="feedbackTotalMagico" class="status-text"></div>
    `;
    // Insertar debajo de la card principal
    const contenedor = document.querySelector("#mission1Screen > div > div");
    contenedor.appendChild(card);
    // Lógica de validación
    const input = card.querySelector("#inputTotalMagico");
    const btn = card.querySelector("#btnValidarTotalMagico");
    const feedback = card.querySelector("#feedbackTotalMagico");
    input.focus();
    btn.addEventListener("click", () => {
      const valor = parseInt(input.value, 10);
      if (!comb) {
        feedback.textContent = "Error interno. Recarga la página.";
        return;
      }
      const sumaCorrecta = comb.leftTop + comb.leftMid + comb.bottom;
      if (isNaN(valor)) {
        feedback.textContent = "Ingresa un número válido.";
        input.focus();
        return;
      }
      if (valor !== sumaCorrecta) {
        feedback.textContent = "Suma solamente los tres números de un brazo.";
        input.focus();
        return;
      }
      // Guardar la combinación como válida
      sessionData.mission1.saved.push({ ...comb, sumaMagica: valor, nucleo: comb.bottom, permutaciones: [] });
      delete sessionData.mission1._tmpFirstMagicV;
      saveSessionProgress();
      renderMission1SavedCombinations();
      clearMission1Board(false);
      card.remove();
      setMessage(magicVFeedback, "¡Correcto! Has encontrado el total mágico. Ahora busca más Magic V.", "good");
      totalMagicoCardMostrada = false;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  }

  if (resetMagicVBtn && typeof resetMagicVBtn.addEventListener === 'function') {
    resetMagicVBtn.addEventListener("click", () => {
      clearMission1Board(false);
      setMessage(magicVFeedback, "Tablero reiniciado. Tus combinaciones guardadas siguen intactas.", "");
    });
  }
// Eliminar llave de cierre extra aquí

function startMission1ChipDrag(event) {
  const chip = event.target.closest(".magicv-chip");
  if (!chip) {
    return;
  }

  event.preventDefault();

  mission1DragState.active = true;
  mission1DragState.pointerId = event.pointerId;
  mission1DragState.chip = chip;
  mission1DragState.originSlot = chip.dataset.slot || null;
  mission1DragState.hoverDrop = null;
  mission1DragState.hoverTray = false;

  chip.classList.add("dragging");

  const ghost = document.createElement("div");
  ghost.className = "magicv-chip-ghost";
  ghost.textContent = chip.dataset.value;
  document.body.appendChild(ghost);
  mission1DragState.ghost = ghost;
  moveMission1ChipGhost(event.clientX, event.clientY);
}

function handleMission1ChipMove(event) {
  if (!mission1DragState.active || event.pointerId !== mission1DragState.pointerId) {
    return;
  }

  event.preventDefault();
  moveMission1ChipGhost(event.clientX, event.clientY);
  updateMission1DropHover(event.clientX, event.clientY);
}

function handleMission1ChipDrop(event) {
  if (!mission1DragState.active || event.pointerId !== mission1DragState.pointerId) {
    return;
  }

  event.preventDefault();

  const chip = mission1DragState.chip;
  const targetDrop = document.elementFromPoint(event.clientX, event.clientY)?.closest(".magicv-drop");
  const droppedInTray = Boolean(document.elementFromPoint(event.clientX, event.clientY)?.closest("#mission1ChipTray"));

  if (targetDrop) {
    assignChipToDrop(chip, targetDrop);
  } else if (droppedInTray) {
    sendChipToTray(chip);
  }

  cleanupMission1Drag();
}

function moveMission1ChipGhost(clientX, clientY) {
  if (!mission1DragState.ghost) {
    return;
  }

  mission1DragState.ghost.style.left = `${clientX}px`;
  mission1DragState.ghost.style.top = `${clientY}px`;
}

function updateMission1DropHover(clientX, clientY) {
  const targetDrop = document.elementFromPoint(clientX, clientY)?.closest(".magicv-drop");
  const hoverTray = Boolean(document.elementFromPoint(clientX, clientY)?.closest("#mission1ChipTray"));

  mission1Drops.forEach((drop) => drop.classList.remove("drop-target"));
  mission1ChipTray.classList.remove("tray-target");

  mission1DragState.hoverDrop = targetDrop;
  mission1DragState.hoverTray = hoverTray;

  if (targetDrop) {
    targetDrop.classList.add("drop-target");
  }

  if (hoverTray) {
    mission1ChipTray.classList.add("tray-target");
  }
}

function cleanupMission1Drag() {
  if (mission1DragState.chip) {
    mission1DragState.chip.classList.remove("dragging");
  }

  if (mission1DragState.ghost) {
    mission1DragState.ghost.remove();
  }

  mission1Drops.forEach((drop) => drop.classList.remove("drop-target"));
  mission1ChipTray.classList.remove("tray-target");

  mission1DragState.active = false;
  mission1DragState.pointerId = null;
  mission1DragState.chip = null;
  mission1DragState.originSlot = null;
  mission1DragState.ghost = null;
  mission1DragState.hoverDrop = null;
  mission1DragState.hoverTray = false;
}

function assignChipToDrop(chip, targetDrop) {
  const targetSlot = targetDrop.dataset.slot;
  const currentSlot = chip.dataset.slot || null;

  if (currentSlot && currentSlot !== targetSlot) {
    clearMission1Slot(currentSlot);
  }

  const existingChip = targetDrop.querySelector(".magicv-chip");
  if (existingChip && existingChip !== chip) {
    sendChipToTray(existingChip);
  }

  targetDrop.appendChild(chip);
  chip.dataset.slot = targetSlot;
  sessionData.mission1.current[targetSlot] = Number(chip.dataset.value);
  targetDrop.classList.add("filled");
}

function sendChipToTray(chip) {
  const currentSlot = chip.dataset.slot || null;
  if (currentSlot) {
    clearMission1Slot(currentSlot);
  }

  chip.dataset.slot = "";
  mission1ChipTray.appendChild(chip);
  orderMission1TrayChips();
}

function clearMission1Slot(slot, boardSelector = "#magicvBoardFoto") {
  const board = document.querySelector(boardSelector);
  if (!board) return;
  const drop = Array.from(board.querySelectorAll('.magicv-drop')).find((item) => item.dataset.slot === slot);
  if (!drop) return;
  sessionData.mission1.current[slot] = null;
  drop.classList.remove("filled");
}

function clearMission1Board(resetMessage, boardSelector = "#magicvBoardFoto", chipTraySelector = "#mission1ChipTray") {
  const board = document.querySelector(boardSelector);
  if (!board) return;
  mission1SlotOrder.forEach((slot) => {
    sessionData.mission1.current[slot] = null;
    const drop = Array.from(board.querySelectorAll('.magicv-drop')).find((item) => item.dataset.slot === slot);
    if (drop) {
      drop.classList.remove("filled", "drop-target");
    }
  });
  const chips = Array.from(document.querySelectorAll(chipTraySelector + " .magicv-chip"));
  chips.forEach((chip) => {
    chip.classList.remove("dragging");
    chip.disabled = false;
  });
  orderMission1TrayChips();
  saveSessionProgress();
  if (resetMessage) {
    setMessage(magicVFeedback, "Tablero reiniciado.", "");
  }
}

function setupMission1AudioRecorder() {
  if (!mission1AudioRecordBtn || !mission1AudioStopBtn || !mission1AudioSubmitBtn || !mission1AudioStatus) {
    return;
  }

  syncMission1AudioButtons();

  mission1AudioRecordBtn.addEventListener("click", async () => {
    if (sessionData.mission1.audioSubmitted || mission1AudioState.submitting) {
      return;
    }

    try {
      const stream = await requestMission1AudioStream();
      const mediaRecorder = new MediaRecorder(stream);

      mission1AudioState.mediaRecorder = mediaRecorder;
      mission1AudioState.stream = stream;
      mission1AudioState.chunks = [];
      mission1AudioState.blob = null;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mission1AudioState.chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        mission1AudioState.blob = new Blob(mission1AudioState.chunks, {
          type: mission1AudioState.chunks[0]?.type || "audio/webm"
        });

        if (mission1AudioState.stream) {
          mission1AudioState.stream.getTracks().forEach((track) => track.stop());
        }

        mission1AudioState.stream = null;
        setMessage(mission1AudioStatus, "Audio listo para enviar.", "good");
        syncMission1AudioButtons();
      };

      mediaRecorder.start(250);
      setMessage(mission1AudioStatus, "Grabando...", "");
      syncMission1AudioButtons();
    } catch (error) {
      console.error("Error al acceder al micrófono de Misión 1:", error);
      setMessage(mission1AudioStatus, "No se pudo acceder al micrófono. Revisa permisos e intenta de nuevo.", "bad");
      syncMission1AudioButtons();
    }
  });

  mission1AudioStopBtn.addEventListener("click", () => {
    const mediaRecorder = mission1AudioState.mediaRecorder;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try {
        mediaRecorder.requestData();
      } catch (error) {
        console.warn("No fue posible forzar el volcado del buffer de audio:", error);
      }
      mediaRecorder.stop();
    }
  });

  mission1AudioSubmitBtn.addEventListener("click", () => {
    handleMission1AudioSubmit();
  });
}

function syncMission1AudioButtons() {
  if (!mission1AudioRecordBtn || !mission1AudioStopBtn || !mission1AudioSubmitBtn) {
    return;
  }

  const isRecording = Boolean(mission1AudioState.mediaRecorder && mission1AudioState.mediaRecorder.state === "recording");
  const hasAudio = Boolean(mission1AudioState.blob && mission1AudioState.blob.size > 0);
  const isLocked = sessionData.mission1.audioSubmitted || mission1AudioState.submitting;

  mission1AudioRecordBtn.style.display = isRecording ? "none" : "inline-flex";
  mission1AudioStopBtn.style.display = isRecording ? "inline-flex" : "none";

  mission1AudioRecordBtn.disabled = isLocked;
  mission1AudioStopBtn.disabled = !isRecording || isLocked;
  mission1AudioSubmitBtn.disabled = !hasAudio || isLocked;
}

async function requestMission1AudioStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("getUserMedia no está disponible en este navegador");
  }

  const preferredConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1
    }
  };

  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints);
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      throw error;
    }

    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

async function handleMission1AudioSubmit() {
  if (sessionData.mission1.audioSubmitted || mission1AudioState.submitting) {
    return;
  }

  if (!mission1AudioState.blob || mission1AudioState.blob.size === 0) {
    setMessage(mission1AudioStatus, "Primero graba una respuesta antes de enviarla.", "bad");
    return;
  }

  const firebaseServices = window.firebaseServices;
  if (!firebaseServices?.storage || !firebaseServices?.db) {
    setMessage(mission1AudioStatus, "Firebase no está disponible en este momento. Intenta de nuevo en unos segundos.", "bad");
    return;
  }

  mission1AudioState.submitting = true;
  syncMission1AudioButtons();
  setMessage(mission1AudioStatus, "Subiendo audio...", "");

  try {
    const {
      storage,
      db,
      ref,
      uploadBytes,
      getDownloadURL,
      collection,
      addDoc,
      serverTimestamp
    } = firebaseServices;

    const basePath = buildMission1ExplorationStorageBasePath();
    const fileName = buildMission1ExploracionFileName();
    const storageRef = ref(storage, `${basePath}/${fileName}.webm`);

    await uploadBytes(storageRef, mission1AudioState.blob, {
      contentType: mission1AudioState.blob.type || "audio/webm"
    });

    const audioURL = await getDownloadURL(storageRef);

    await addDoc(collection(db, "Actividad3"), {
      studentCode,
      studentName: getStudentDisplayName(),
      curso: studentInfo?.curso || "",
      isGuest: studentCode === "0000",
      tag: "A3M1Exploracion",
      componente: "1Exploración",
      storageBasePath: basePath,
      fileName: `${fileName}.webm`,
      audioURL,
      timestamp: serverTimestamp()
    });

    sessionData.mission1.audioSubmitted = true;
    setMessage(mission1AudioStatus, "✅ Audio enviado correctamente.", "good");
    setMessage(magicVFeedback, "Respuesta enviada. La misión 1 quedó completada.", "good");
    syncMission1AudioButtons();
    completeMission(1);
  } catch (error) {
    console.error("Error al enviar el audio de 1Exploración:", error);
    setMessage(mission1AudioStatus, "Error al guardar el audio. Revisa tu conexión e intenta de nuevo.", "bad");
  } finally {
    mission1AudioState.submitting = false;
    syncMission1AudioButtons();
  }
}

function unlockMission1Exploration() {
  sessionData.mission1.explorationUnlocked = true;
  syncMission1ExplorationState();

  if (!sessionData.mission1.audioSubmitted && !mission1AudioState.blob) {
    setMessage(mission1AudioStatus, "Cuando estés lista, graba tu respuesta y envíala.", "");
  }
}

function syncMission1ExplorationState() {
  if (!mission1ExploracionBlock) {
    return;
  }

  // Solo mostrar si hay 3 combinaciones y todas tienen suma mágica verificada, o si ya se envió el audio
  const allSumaVerificada = sessionData.mission1.saved.length === 3 && sessionData.mission1.saved.every(c => c.sumaMagica !== null);
  const shouldShow = sessionData.mission1.explorationUnlocked || allSumaVerificada || sessionData.mission1.audioSubmitted;
  sessionData.mission1.explorationUnlocked = shouldShow;
  mission1ExploracionBlock.classList.toggle("is-hidden", !shouldShow);
  syncMission1AudioButtons();
}

function orderMission1TrayChips(trayElement) {
  if (!trayElement || typeof trayElement.querySelectorAll !== 'function') return;
  const chips = Array.from(trayElement.querySelectorAll('.magicv-chip'));
  chips
    .sort((a, b) => Number(a.dataset.value) - Number(b.dataset.value))
    .forEach((chip) => trayElement.appendChild(chip));
}

function verificarSumaMagica(index) {
  const comb = sessionData.mission1.saved[index];
  if (!comb || comb.sumaMagica !== null) return;

  const input = mission1SavedList.querySelector(`.magicv-suma-input[data-index="${index}"]`);
  const errorSpan = document.getElementById(`sumaMagicaError${index}`);

  const ingresado = parseInt(input.value, 10);
  if (isNaN(ingresado) || input.value.trim() === "") {
    errorSpan.textContent = "Ingresa un número.";
    return;
  }

  const sumaCorrecta = comb.leftTop + comb.leftMid + comb.bottom;

  if (ingresado === sumaCorrecta) {
    comb.sumaMagica = ingresado;
    saveSessionProgress();
    renderMission1SavedCombinations();
  } else {
    errorSpan.textContent = "Verifica tu respuesta.";
    input.value = "";
    input.focus();
  }
}

function renderMission1SavedCombinations() {
  mission1SavedCount.textContent = `${sessionData.mission1.saved.length}/3`;

  if (sessionData.mission1.saved.length === 0) {
    mission1SavedList.innerHTML = "<p class=\"magicv-saved-item-label\">Aun no tienes combinaciones guardadas.</p>";
    return;
  }

  const rows = sessionData.mission1.saved.map((comb, index) => {
    const sumaCorrecta = comb.leftTop + comb.leftMid + comb.bottom;

    const sumaCell = comb.sumaMagica !== null
      ? `<span class="magicv-suma-confirmed">✔ ${comb.sumaMagica}</span>`
      : `<div class="magicv-suma-input-group">
           <input class="magicv-suma-input" type="number" min="1" max="99"
             data-index="${index}"
             aria-label="Ingresa la suma mágica de la combinación ${index + 1}">
           <button class="magicv-suma-check btn btn-primary" data-index="${index}" type="button">Verificar</button>
           <span class="magicv-suma-error" id="sumaMagicaError${index}"></span>
         </div>`;

    // Permutaciones asociadas visuales
    let permutacionesHtml = "";
    if (comb.permutaciones && comb.permutaciones.length > 0) {
      permutacionesHtml = `<div class="magicv-permutaciones-list">` +
        comb.permutaciones.map((perm) => `
          <div class="magicv-mini-board magicv-mini-board-permutacion">
            <span class="magicv-mini-dot" data-slot="leftTop">${perm.leftTop}</span>
            <span class="magicv-mini-dot" data-slot="rightTop">${perm.rightTop}</span>
            <span class="magicv-mini-dot" data-slot="leftMid">${perm.leftMid}</span>
            <span class="magicv-mini-dot" data-slot="rightMid">${perm.rightMid}</span>
            <span class="magicv-mini-dot" data-slot="bottom">${perm.bottom}</span>
          </div>`).join("") + `</div>`;
    }

    return `<tr>
      <td>
        <div class="magicv-saved-item-label">V válida ${index + 1}</div>
        <div class="magicv-v-group">
          <div class="magicv-mini-board">
            <span class="magicv-mini-dot" data-slot="leftTop">${comb.leftTop}</span>
            <span class="magicv-mini-dot" data-slot="rightTop">${comb.rightTop}</span>
            <span class="magicv-mini-dot" data-slot="leftMid">${comb.leftMid}</span>
            <span class="magicv-mini-dot" data-slot="rightMid">${comb.rightMid}</span>
            <span class="magicv-mini-dot" data-slot="bottom">${comb.bottom}</span>
          </div>
          ${permutacionesHtml}
        </div>
      </td>
      <td class="magicv-suma-cell">${sumaCell}</td>
    </tr>`;
  }).join("");

  mission1SavedList.innerHTML = `
    <table class="magicv-saved-table">
      <thead>
        <tr>
          <th>Magic V</th>
          <th>Suma mágica</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function serializeMission1Combination(combination) {
  return mission1SlotOrder.map((slot) => combination[slot]).join("-");
}

function createEmptyMission1Assignment() {
  return {
    leftTop: null,
    rightTop: null,
    leftMid: null,
    rightMid: null,
    bottom: null
  };
}



function setupBackToMapButtons() {
  document.querySelectorAll(".back-to-map").forEach((button) => {
    button.addEventListener("click", () => {
      renderMap();
      showScreen("mapScreen");
    });
  });
}

function completeMission(missionNumber) {
  if (!sessionData.missionsCompleted.includes(missionNumber)) {
    sessionData.missionsCompleted.push(missionNumber);
  }

  sessionData.missionsCompleted.sort((a, b) => a - b);
  sessionData.progress = Math.min(TOTAL_MISSIONS, Math.max(sessionData.progress, missionNumber + 1));
  registerTimestamp(`mission${missionNumber}Completed`);

  renderMap();
  showScreen("mapScreen");
}

function showScreen(id) {
  document.querySelectorAll(".app-screen").forEach((screen) => {
    screen.classList.remove("active-screen");
  });

  if (id === "introductionScreen") {
    setIntroStep(0);
  }

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active-screen");
  }

  if (id === "mission1Screen") {
    syncMission1ExplorationState();
  }

  if (id === "mapScreen") {
    window.requestAnimationFrame(() => {
      ensureMapFogCanvases();
      syncMapFogWithProgress();
    });
  }
}

function hydrateGuideBadges() {
  if (!sessionData.character) {
    return;
  }

  const mapGuideHtml = `
    <button class="guide-dragger" aria-label="Arrastrar guia ${sessionData.character.name}" type="button">
      <img src="${sessionData.character.image}" alt="${sessionData.character.name}">
    </button>
    <span>Guia: ${sessionData.character.name}</span>
  `;

  const inlineGuideHtml = `
    <img src="${sessionData.character.image}" alt="${sessionData.character.name}">
    <span>Guia: ${sessionData.character.name}</span>
  `;

  guideBadge.innerHTML = mapGuideHtml;

  [
    "guideInlineMission1",
    "guideInlineMission2",
    "guideInlineMission3",
    "guideInlineMission4",
    "guideInlineMission5"
  ].forEach((id) => {
    const target = document.getElementById(id);
    if (target) {
      target.innerHTML = inlineGuideHtml;
    }
  });
}

function registerTimestamp(key) {
  sessionData.timestamps[key] = new Date().toISOString();
}

function setMessage(target, text, mode) {
  if (!target) {
    return;
  }

  target.textContent = text;
  target.classList.remove("good", "bad");

  if (mode === "good") {
    target.classList.add("good");
  }

  if (mode === "bad") {
    target.classList.add("bad");
  }
}

function normalizeStorageSegment(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function buildMission1ExplorationStorageBasePath() {
  return "Actividad3/1Exploracion";
}

function buildMission1ExploracionFileName() {
  const suffix = studentCode === "0000"
    ? (normalizeStorageSegment(studentInfo?.nombre || "invitado") || "invitado")
    : (normalizeStorageSegment(String(studentInfo?.curso || "sin-curso")) || "sin-curso");

  return `${studentCode}_1Exploracion_${suffix}`;
}

function getStudentDisplayName() {
  const nombre = toTitle(studentInfo?.nombre || "");
  const apellidos = toTitle(studentInfo?.apellidos || "");
  return [nombre, apellidos].filter(Boolean).join(" ");
}

function toTitle(value) {
  if (!value) {
    return "";
  }

  return value
    .toLocaleLowerCase("es-CO")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("es-CO") + word.slice(1))
    .join(" ");
}
