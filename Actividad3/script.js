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
  })
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
      ? `<span class=\"magicv-suma-confirmed\">✔ ${comb.sumaMagica}</span>`
      : `<span class=\"magicv-suma-pending\">Sin verificar</span>`;
    let permutacionesHtml = "";
    if (comb.permutaciones && comb.permutaciones.length > 0) {
      permutacionesHtml = `<div class=\"magicv-permutaciones-list\">` +
        comb.permutaciones.map((perm) => `
          <div class=\"magicv-mini-board magicv-mini-board-permutacion\">\n            <span class=\"magicv-mini-dot\" data-slot=\"leftTop\">${perm.leftTop}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"rightTop\">${perm.rightTop}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"leftMid\">${perm.leftMid}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"rightMid\">${perm.rightMid}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"bottom\">${perm.bottom}</span>\n          </div>`).join("") + `</div>`;
    }
    return `<tr>
      <td>
        <div class=\"magicv-saved-item-label\">V válida ${index + 1}</div>
        <div class=\"magicv-v-group\">\n          <div class=\"magicv-mini-board\">\n            <span class=\"magicv-mini-dot\" data-slot=\"leftTop\">${comb.leftTop}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"rightTop\">${comb.rightTop}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"leftMid\">${comb.leftMid}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"rightMid\">${comb.rightMid}</span>\n            <span class=\"magicv-mini-dot\" data-slot=\"bottom\">${comb.bottom}</span>\n          </div>\n          ${permutacionesHtml}
        </div>
      </td>
      <td class=\"magicv-suma-cell\">${sumaCell}</td>
    </tr>`;
  }).join("");
  return `
    <table class=\"magicv-saved-table\">
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
      function setupMission1() {
        setupMission1AudioRecorder();

        // --- Card A ---
        mission1ChipTrayA.addEventListener("pointerdown", startMission1ChipDragA);
        mission1DropsA.forEach((drop) => {
          drop.addEventListener("pointerdown", startMission1ChipDragA);
        });

        // --- Card B ---
        mission1ChipTrayB.addEventListener("pointerdown", startMission1ChipDragB);
        mission1DropsB.forEach((drop) => {
          drop.addEventListener("pointerdown", startMission1ChipDragB);
        });

        // Listeners globales para ambos (puedes separar si lo deseas)
        window.addEventListener("pointermove", handleMission1ChipMoveA, { passive: false });
        window.addEventListener("pointerup", handleMission1ChipDropA);
        window.addEventListener("pointermove", handleMission1ChipMoveB, { passive: false });
        window.addEventListener("pointerup", handleMission1ChipDropB);

        // Verificación de suma mágica por delegación (puedes separar si cada card tiene su lista)
        mission1SavedList.addEventListener("click", (e) => {
          const btn = e.target.closest(".magicv-suma-check");
          if (!btn) return;
          verificarSumaMagica(Number(btn.dataset.index));
        });

        mission1SavedList.addEventListener("keydown", (e) => {
          const input = e.target.closest(".magicv-suma-input");
          if (!input || e.key !== "Enter") return;
          verificarSumaMagica(Number(input.dataset.index));
        });

        // Si tienes botones de verificación separados para cada card, sepáralos aquí
        // checkMagicVBtnA.addEventListener(...)
        // checkMagicVBtnB.addEventListener(...)
      }
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


// --- Misión 1: Card A ---
const mission1SlotOrderA = ["leftTop", "rightTop", "leftMid", "rightMid", "bottom"];
const mission1ChipTrayA = document.getElementById("mission1ChipTrayA_m1");
const mission1DropsA = Array.from(document.querySelectorAll(".magicv-dropA-m1"));
const checkMagicVBtnA = document.getElementById("checkMagicVBtnA");
const resetMagicVBtnA = document.getElementById("resetMagicVBtnA");
const inputTotalMagicoA = document.getElementById("inputTotalMagicoA");
const btnVerificarTotalMagicoA = document.getElementById("btnVerificarTotalMagicoA");
const feedbackTotalMagicoA = document.getElementById("feedbackTotalMagicoA");

// --- Misión 1: Card B ---
const mission1SlotOrderB = ["leftTop", "rightTop", "leftMid", "rightMid", "bottom"];
const mission1ChipTrayB = document.getElementById("mission1ChipTrayB_m1");
const mission1DropsB = Array.from(document.querySelectorAll(".magicv-dropB-m1"));
const checkMagicVBtnB = document.getElementById("checkMagicVBtn");
const resetMagicVBtnB = document.getElementById("resetMagicVBtn");
const magicVFeedbackB = document.getElementById("magicVFeedback");
const mission1SavedCount = document.getElementById("mission1SavedCount");
const mission1SavedList = document.getElementById("mission1SavedList");

// --- Misión 2 ---
const mission2SlotOrder = ["leftTop", "rightTop", "leftMid", "rightMid", "bottom"];
const mission2ChipTray = document.getElementById("mission2ChipTray");
const mission2Drops = Array.from(document.querySelectorAll(".magicv-dropA-m2"));

// Estados de drag independientes
const mission1DragStateA = { active: false, pointerId: null, chip: null, originSlot: null, ghost: null, hoverDrop: null, hoverTray: false };
const mission1DragStateB = { active: false, pointerId: null, chip: null, originSlot: null, ghost: null, hoverDrop: null, hoverTray: false };
const mission2DragState = { active: false, pointerId: null, chip: null, originSlot: null, ghost: null, hoverDrop: null, hoverTray: false };


// --- Estados de audio independientes para cada misión ---
const mission1AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  submitting: false
};
const mission2AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  submitting: false
};

// --- Botones de audio para misión 1 y 2 ---
const mission1AudioRecordBtn = document.getElementById("recordBtnA3M1Exploracion");
const mission1AudioStopBtn = document.getElementById("stopBtnA3M1Exploracion");
const mission1AudioSubmitBtn = document.getElementById("submitBtnA3M1Exploracion");
const mission1AudioStatus = document.getElementById("audioStatusA3M1Exploracion");

const mission2AudioRecordBtn = document.getElementById("recordBtnA3M2ReglaGeneral");
const mission2AudioStopBtn = document.getElementById("stopBtnA3M2ReglaGeneral");
const mission2AudioSubmitBtn = document.getElementById("submitBtnA3M2ReglaGeneral");
const mission2AudioStatus = document.getElementById("audioStatusA3M2ReglaGeneral");


init();

function init() {
  setupEntryFlow();
  setupIntroductionScreen();
  setupCharacterMission();
  setupMap();
  setupGuideDragAndDrop();
  setupMission1();
  setupMission2AudioRecorder();
  setupMissionCompletionButtons();
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

function setupMission1() {
  setupMission1AudioRecorder();

  mission1ChipTray.addEventListener("pointerdown", startMission1ChipDrag);
  mission1Drops.forEach((drop) => {
    drop.addEventListener("pointerdown", startMission1ChipDrag);
  });

  window.addEventListener("pointermove", handleMission1ChipMove, { passive: false });
  window.addEventListener("pointerup", handleMission1ChipDrop);

  // Verificación de suma mágica por delegación
  mission1SavedList.addEventListener("click", (e) => {
    const btn = e.target.closest(".magicv-suma-check");
    if (!btn) return;
    verificarSumaMagica(Number(btn.dataset.index));
  });

  mission1SavedList.addEventListener("keydown", (e) => {
    const input = e.target.closest(".magicv-suma-input");
    if (!input || e.key !== "Enter") return;
    verificarSumaMagica(Number(input.dataset.index));
  });

  checkMagicVBtn.addEventListener("click", () => {
    const current = sessionData.mission1.current;
    const hasMissing = mission1SlotOrder.some((slot) => current[slot] === null);

    if (hasMissing) {
      setMessage(magicVFeedback, "Completa toda la V antes de comprobar.", "bad");
      return;
    }

    const leftArm = current.leftTop + current.leftMid;
    const rightArm = current.rightTop + current.rightMid;
    const valid = leftArm === rightArm;

    if (!valid) {
      setMessage(magicVFeedback, "Verifica si la suma de los brazos es igual.", "bad");
      return;
    }

    // --- Lógica avanzada de Magic V: núcleo y permutaciones ---
    const nucleo = current.bottom;
    const brazos = [current.leftTop, current.rightTop, current.leftMid, current.rightMid];
    const sumaMagica = current.leftTop + current.leftMid + current.bottom; // suma de un brazo + núcleo

    // Buscar Magic V con el mismo núcleo
    let existente = sessionData.mission1.saved.find(item => item.nucleo === nucleo);
    if (existente) {
      // Duplicado exacto (misma disposición)
      const esExacta = existente.leftTop === current.leftTop && existente.rightTop === current.rightTop &&
        existente.leftMid === current.leftMid && existente.rightMid === current.rightMid;
      if (esExacta) {
        setMessage(magicVFeedback, "Esta Magic V ya está registrada.", "bad");
        return;
      }
      // Permutación: mismo núcleo, suma mágica igual, pero brazos permutados
      const brazosExistente = [existente.leftTop, existente.rightTop, existente.leftMid, existente.rightMid];
      const esPermutacion =
        brazos.slice().sort((a,b)=>a-b).join('-') === brazosExistente.slice().sort((a,b)=>a-b).join('-') &&
        sumaMagica === (existente.leftTop + existente.leftMid + existente.bottom);
      if (esPermutacion) {
        // Guardar como permutación asociada
        if (!existente.permutaciones) existente.permutaciones = [];
        existente.permutaciones.push({ ...current });
        saveSessionProgress();
        setMessage(magicVFeedback, `Esta Magic V es equivalente a la registrada con núcleo ${nucleo} porque la suma mágica es la misma.`, "good");
        renderMission1SavedCombinations();
        clearMission1Board(false);
        return;
      }
      // Si mismo núcleo pero brazos diferentes y suma diferente, permitir guardar como permutación (opcional, aquí lo bloqueamos)
      setMessage(magicVFeedback, "Esta Magic V ya tiene ese núcleo pero no es una permutación válida.", "bad");
      return;
    }

    // Si el núcleo es nuevo, guardar como nueva válida
    if (sessionData.mission1.saved.length >= 3) {
      unlockMission1Exploration();
      setMessage(magicVFeedback, "Ya registraste las 3 combinaciones validas. Responde la pregunta por audio para cerrar la misión.", "good");
      return;
    }

    sessionData.mission1.saved.push({ ...current, sumaMagica: null, nucleo, permutaciones: [] });
    saveSessionProgress();
    renderMission1SavedCombinations();
    clearMission1Board(false);

    if (sessionData.mission1.saved.length === 3) {
      unlockMission1Exploration();
      setMessage(magicVFeedback, "Excelente. Ya encontraste 3 combinaciones válidas distintas. Ahora responde la pregunta por audio.", "good");
      return;
    }

    const missing = 3 - sessionData.mission1.saved.length;
    setMessage(magicVFeedback, `Combinacion guardada. Te faltan ${missing} combinaciones validas.`, "good");
  });

  resetMagicVBtn.addEventListener("click", () => {
    clearMission1Board(false);
    setMessage(magicVFeedback, "Tablero reiniciado. Tus combinaciones guardadas siguen intactas.", "");
  });
}

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

function clearMission1Slot(slot) {
  const drop = mission1Drops.find((item) => item.dataset.slot === slot);
  if (!drop) {
    return;
  }

  sessionData.mission1.current[slot] = null;
  drop.classList.remove("filled");
}

function clearMission1Board(resetMessage) {
  mission1SlotOrder.forEach((slot) => {
    sessionData.mission1.current[slot] = null;
    const drop = mission1Drops.find((item) => item.dataset.slot === slot);
    if (drop) {
      drop.classList.remove("filled", "drop-target");
    }
  });

  const chips = Array.from(document.querySelectorAll(".magicv-chip"));
  chips.forEach((chip) => {
    chip.dataset.slot = "";
    mission1ChipTray.appendChild(chip);
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
      const stream = await requestMissionAudioStream();
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

function setupMission2AudioRecorder() {
  if (!mission2AudioRecordBtn || !mission2AudioStopBtn || !mission2AudioSubmitBtn || !mission2AudioStatus) {
    return;
  }
  syncMission2AudioButtons();
  mission2AudioRecordBtn.addEventListener("click", async () => {
    if (mission2AudioState.submitting) {
      return;
    }
    try {
      const stream = await requestMissionAudioStream();
      const mediaRecorder = new MediaRecorder(stream);
      mission2AudioState.mediaRecorder = mediaRecorder;
      mission2AudioState.stream = stream;
      mission2AudioState.chunks = [];
      mission2AudioState.blob = null;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mission2AudioState.chunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        mission2AudioState.blob = new Blob(mission2AudioState.chunks, {
          type: mission2AudioState.chunks[0]?.type || "audio/webm"
        });
        if (mission2AudioState.stream) {
          mission2AudioState.stream.getTracks().forEach((track) => track.stop());
        }
        mission2AudioState.stream = null;
        setMessage(mission2AudioStatus, "Audio listo para enviar.", "good");
        syncMission2AudioButtons();
      };
      mediaRecorder.start(250);
      setMessage(mission2AudioStatus, "Grabando...", "");
      syncMission2AudioButtons();
    } catch (error) {
      console.error("Error al acceder al micrófono de Misión 2:", error);
      setMessage(mission2AudioStatus, "No se pudo acceder al micrófono. Revisa permisos e intenta de nuevo.", "bad");
      syncMission2AudioButtons();
    }
  });
  mission2AudioStopBtn.addEventListener("click", () => {
    const mediaRecorder = mission2AudioState.mediaRecorder;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try {
        mediaRecorder.requestData();
      } catch (error) {
        console.warn("No fue posible forzar el volcado del buffer de audio:", error);
      }
      mediaRecorder.stop();
    }
  });
  mission2AudioSubmitBtn.addEventListener("click", () => {
    handleMission2AudioSubmit();
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

function syncMission2AudioButtons() {
  if (!mission2AudioRecordBtn || !mission2AudioStopBtn || !mission2AudioSubmitBtn) {
    return;
  }
  const isRecording = Boolean(mission2AudioState.mediaRecorder && mission2AudioState.mediaRecorder.state === "recording");
  const hasAudio = Boolean(mission2AudioState.blob && mission2AudioState.blob.size > 0);
  const isLocked = mission2AudioState.submitting;
  mission2AudioRecordBtn.style.display = isRecording ? "none" : "inline-flex";
  mission2AudioStopBtn.style.display = isRecording ? "inline-flex" : "none";
  mission2AudioRecordBtn.disabled = isLocked;
  mission2AudioStopBtn.disabled = !isRecording || isLocked;
  mission2AudioSubmitBtn.disabled = !hasAudio || isLocked;
}


async function requestMissionAudioStream() {
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
    const fileName = buildMission1ExplorationFileName();
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

async function handleMission2AudioSubmit() {
  if (mission2AudioState.submitting) {
    return;
  }
  if (!mission2AudioState.blob || mission2AudioState.blob.size === 0) {
    setMessage(mission2AudioStatus, "Primero graba una respuesta antes de enviarla.", "bad");
    return;
  }
  const firebaseServices = window.firebaseServices;
  if (!firebaseServices?.storage || !firebaseServices?.db) {
    setMessage(mission2AudioStatus, "Firebase no está disponible en este momento. Intenta de nuevo en unos segundos.", "bad");
    return;
  }
  mission2AudioState.submitting = true;
  syncMission2AudioButtons();
  setMessage(mission2AudioStatus, "Subiendo audio...", "");
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
    const basePath = buildMission2ReglaGeneralStorageBasePath();
    const fileName = buildMission2ReglaGeneralFileName();
    const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
    await uploadBytes(storageRef, mission2AudioState.blob, {
      contentType: mission2AudioState.blob.type || "audio/webm"
    });
    const audioURL = await getDownloadURL(storageRef);
    await addDoc(collection(db, "Actividad3"), {
      studentCode,
      studentName: getStudentDisplayName(),
      curso: studentInfo?.curso || "",
      isGuest: studentCode === "0000",
      tag: "A3M2ReglaGeneral",
      componente: "2ReglaGeneral",
      storageBasePath: basePath,
      fileName: `${fileName}.webm`,
      audioURL,
      timestamp: serverTimestamp()
    });
    setMessage(mission2AudioStatus, "✅ Audio enviado correctamente.", "good");
    syncMission2AudioButtons();
    completeMission(2);
  } catch (error) {
    console.error("Error al enviar el audio de 2ReglaGeneral:", error);
    setMessage(mission2AudioStatus, "Error al guardar el audio. Revisa tu conexión e intenta de nuevo.", "bad");
  } finally {
    mission2AudioState.submitting = false;
    syncMission2AudioButtons();
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

  // Siempre mostrar el bloque de exploración
  sessionData.mission1.explorationUnlocked = true;
  mission1ExploracionBlock.classList.remove("is-hidden");
  syncMission1AudioButtons();
}

function orderMission1TrayChips() {
  const chips = Array.from(mission1ChipTray.querySelectorAll(".magicv-chip"));
  chips
    .sort((a, b) => Number(a.dataset.value) - Number(b.dataset.value))
    .forEach((chip) => mission1ChipTray.appendChild(chip));
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

function setupMissionCompletionButtons() {
  document.getElementById("completeMission2Btn").addEventListener("click", () => completeMission(2));
  document.getElementById("completeMission3Btn").addEventListener("click", () => completeMission(3));
  document.getElementById("completeMission4Btn").addEventListener("click", () => completeMission(4));
  document.getElementById("completeMission5Btn").addEventListener("click", () => completeMission(5));
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
  return "Actividad3/1Exploración";
}
function buildMission1ExplorationFileName() {
  if (studentCode === "0000") {
    // Invitado: nombre_1exploracion
    const nombre = normalizeStorageSegment(studentInfo?.nombre || "invitado") || "invitado";
    return `${nombre}_1exploracion`;
  } else {
    // Estudiante: codigo_curso_1exploracion
    const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso")) || "sin-curso";
    return `${studentCode}_${curso}_1exploracion`;
  }
}

function buildMission2ReglaGeneralStorageBasePath() {
  return "Actividad3/2ReglaGeneral";
}
function buildMission2ReglaGeneralFileName() {
  if (studentCode === "0000") {
    // Invitado: nombre_2reglageneral
    const nombre = normalizeStorageSegment(studentInfo?.nombre || "invitado") || "invitado";
    return `${nombre}_2reglageneral`;
  } else {
    // Estudiante: codigo_curso_2reglageneral
    const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso")) || "sin-curso";
    return `${studentCode}_${curso}_2reglageneral`;
  }
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
