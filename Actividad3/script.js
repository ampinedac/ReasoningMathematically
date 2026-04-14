const sessionData = {
  character: null,
  progress: 0,
  missionsCompleted: [],
  timestamps: {}
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

const mission1Controls = {
  leftTop: document.getElementById("m1-leftTop"),
  rightTop: document.getElementById("m1-rightTop"),
  leftMid: document.getElementById("m1-leftMid"),
  rightMid: document.getElementById("m1-rightMid"),
  bottom: document.getElementById("m1-bottom")
};

const magicVFeedback = document.getElementById("magicVFeedback");
const checkMagicVBtn = document.getElementById("checkMagicVBtn");
const resetMagicVBtn = document.getElementById("resetMagicVBtn");
const completeMission1Btn = document.getElementById("completeMission1Btn");

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
  seedMission1Selects();
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
  checkMagicVBtn.addEventListener("click", () => {
    const values = readMission1Values();
    const hasZero = values.some((n) => n === 0);

    if (hasZero) {
      setMessage(magicVFeedback, "Completa todas las posiciones con numeros entre 1 y 9.", "bad");
      return;
    }

    const leftArm = values[0] + values[2];
    const rightArm = values[1] + values[3];
    const bottom = values[4];
    const valid = leftArm === rightArm && bottom % 2 === 1;

    if (!valid) {
      setMessage(
        magicVFeedback,
        "Combinacion no valida. Recuerda: ambos brazos deben sumar igual y el inferior debe ser impar.",
        "bad"
      );
      return;
    }

    setMessage(
      magicVFeedback,
      `Combinacion valida. Brazos equilibrados (${leftArm}) y vertice inferior impar (${bottom}).`,
      "good"
    );
    completeMission1Btn.disabled = false;
  });

  resetMagicVBtn.addEventListener("click", () => {
    Object.values(mission1Controls).forEach((select) => {
      select.value = "0";
    });
    completeMission1Btn.disabled = true;
    setMessage(magicVFeedback, "Aun no has comprobado.", "");
  });

  completeMission1Btn.addEventListener("click", () => {
    completeMission(1);
  });
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

function seedMission1Selects() {
  const optionList = ['<option value="0">Selecciona</option>'];
  for (let i = 1; i <= 9; i += 1) {
    optionList.push(`<option value="${i}">${i}</option>`);
  }

  Object.values(mission1Controls).forEach((select) => {
    select.innerHTML = optionList.join("");
    select.value = "0";
  });
}

function readMission1Values() {
  return [
    Number(mission1Controls.leftTop.value),
    Number(mission1Controls.rightTop.value),
    Number(mission1Controls.leftMid.value),
    Number(mission1Controls.rightMid.value),
    Number(mission1Controls.bottom.value)
  ];
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
