const sessionData = {
  character: null,
  progress: 0,
  missionsCompleted: [],
  timestamps: {},
  mission1: {
    current: createEmptyMission1Assignment(),
    saved: []
  }
};

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

const startIntroBtn = document.getElementById("startIntroBtn");

const characterGrid = document.getElementById("characterGrid");
const characterStatus = document.getElementById("characterStatus");
const confirmCharacterBtn = document.getElementById("confirmCharacterBtn");
const guideBadge = document.getElementById("guideBadge");

const missionNodes = Array.from(document.querySelectorAll(".mission-node"));
const mapHint = document.getElementById("mapHint");
const mapStage = document.querySelector(".map-stage");

const dragState = {
  active: false,
  pointerId: null,
  ghost: null,
  hoverMission: null
};

const mission1SlotOrder = ["leftTop", "rightTop", "leftMid", "rightMid", "bottom"];
const mission1ChipTray = document.getElementById("mission1ChipTray");
const mission1Drops = Array.from(document.querySelectorAll(".magicv-drop"));
const mission1SavedCount = document.getElementById("mission1SavedCount");
const mission1SavedList = document.getElementById("mission1SavedList");

const magicVFeedback = document.getElementById("magicVFeedback");
const checkMagicVBtn = document.getElementById("checkMagicVBtn");
const resetMagicVBtn = document.getElementById("resetMagicVBtn");
const completeMission1Btn = document.getElementById("completeMission1Btn");

const mission1DragState = {
  active: false,
  pointerId: null,
  chip: null,
  originSlot: null,
  ghost: null,
  hoverDrop: null,
  hoverTray: false
};

init();

function init() {
  setupEntryFlow();
  setupIntroductionScreen();
  setupCharacterMission();
  setupMap();
  setupGuideDragAndDrop();
  setupMission1();
  setupMissionCompletionButtons();
  setupBackToMapButtons();
  renderMission1SavedCombinations();
  clearMission1Board(false);
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
  startIntroBtn.addEventListener("click", () => {
    registerTimestamp("introductionViewed");
    showScreen("characterMissionScreen");
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

    setMessage(characterStatus, `${sessionData.character.name} sera tu guia en Numetrix.`, "good");
    confirmCharacterBtn.disabled = false;
  });

  confirmCharacterBtn.addEventListener("click", () => {
    if (!sessionData.character) {
      setMessage(characterStatus, "Selecciona un personaje para continuar.", "bad");
      return;
    }

    sessionData.progress = 1;
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
}

function canAccessMission(missionNumber) {
  return missionNumber <= sessionData.progress || sessionData.missionsCompleted.includes(missionNumber);
}

function setupMission1() {
  mission1ChipTray.addEventListener("pointerdown", startMission1ChipDrag);
  mission1Drops.forEach((drop) => {
    drop.addEventListener("pointerdown", startMission1ChipDrag);
  });

  window.addEventListener("pointermove", handleMission1ChipMove, { passive: false });
  window.addEventListener("pointerup", handleMission1ChipDrop);

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
      setMessage(magicVFeedback, "Verifica si la suma de los brazos es correcta.", "bad");
      return;
    }

    const serialized = serializeMission1Combination(current);
    const isDuplicate = sessionData.mission1.saved.some((item) => serializeMission1Combination(item) === serialized);

    if (isDuplicate) {
      setMessage(magicVFeedback, "Esa combinacion ya fue registrada, intenta una diferente.", "bad");
      return;
    }

    if (sessionData.mission1.saved.length >= 3) {
      setMessage(magicVFeedback, "Ya registraste las 3 combinaciones validas. Marca la mision como completada.", "good");
      return;
    }

    sessionData.mission1.saved.push({ ...current });
    renderMission1SavedCombinations();
    clearMission1Board(false);

    if (sessionData.mission1.saved.length === 3) {
      completeMission1Btn.disabled = false;
      setMessage(magicVFeedback, "Excelente. Ya completaste 3 combinaciones validas distintas.", "good");
      return;
    }

    const missing = 3 - sessionData.mission1.saved.length;
    setMessage(magicVFeedback, `Combinacion guardada. Te faltan ${missing} combinaciones validas.`, "good");
  });

  resetMagicVBtn.addEventListener("click", () => {
    clearMission1Board(false);
    setMessage(magicVFeedback, "Tablero reiniciado. Tus combinaciones guardadas siguen intactas.", "");
  });

  completeMission1Btn.addEventListener("click", () => {
    if (sessionData.mission1.saved.length < 3) {
      setMessage(magicVFeedback, "Debes registrar 3 combinaciones validas distintas antes de completar la mision.", "bad");
      return;
    }

    completeMission(1);
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
  completeMission1Btn.disabled = sessionData.mission1.saved.length < 3;

  if (resetMessage) {
    setMessage(magicVFeedback, "Tablero reiniciado.", "");
  }
}

function orderMission1TrayChips() {
  const chips = Array.from(mission1ChipTray.querySelectorAll(".magicv-chip"));
  chips
    .sort((a, b) => Number(a.dataset.value) - Number(b.dataset.value))
    .forEach((chip) => mission1ChipTray.appendChild(chip));
}

function renderMission1SavedCombinations() {
  mission1SavedCount.textContent = `${sessionData.mission1.saved.length}/3`;

  if (sessionData.mission1.saved.length === 0) {
    mission1SavedList.innerHTML = "<p class=\"magicv-saved-item-label\">Aun no tienes combinaciones guardadas.</p>";
    return;
  }

  mission1SavedList.innerHTML = sessionData.mission1.saved
    .map((combination, index) => {
      return `
        <article class="magicv-saved-item">
          <p class="magicv-saved-item-label">Valida ${index + 1}</p>
          <div class="magicv-mini-board">
            <span class="magicv-mini-dot" data-slot="leftTop">${combination.leftTop}</span>
            <span class="magicv-mini-dot" data-slot="rightTop">${combination.rightTop}</span>
            <span class="magicv-mini-dot" data-slot="leftMid">${combination.leftMid}</span>
            <span class="magicv-mini-dot" data-slot="rightMid">${combination.rightMid}</span>
            <span class="magicv-mini-dot" data-slot="bottom">${combination.bottom}</span>
          </div>
        </article>
      `;
    })
    .join("");
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

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active-screen");
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
