// Estado global de la sesion de la actividad.
const sessionData = {
  explorationTime: 0,
  attempts: 0,
  validMagicVs: [],
  audios: {
    conjetura: [],
    justificacion: [],
    validez: [],
    reflexion: []
  },
  writtenResponses: {
    conjetura: "",
    generalizacion: "",
    reflexion: ""
  },
  validationAttempts: {
    with2: 0,
    with4: 0
  }
};

const COMPONENT_IDS = [
  "contexto",
  "exploracion",
  "conjetura",
  "generalizacion",
  "justificacion",
  "validez",
  "reflexion"
];

let studentCode = "";
let explorationSeconds = 0;
let explorationInterval = null;
let explorationPlacements = createEmptyPlacements();
let validezPlacements = createEmptyPlacements();
let validezPhaseIndex = 0;
const validezPhases = [2, 4];
const validezDone = { 2: false, 4: false };

const recorders = {};

const welcomeContainer = document.getElementById("ContenedorBienvenida");
const confirmContainer = document.getElementById("ContenedorConfirmacion");
const activityApp = document.getElementById("activityApp");

const studentCodeInput = document.getElementById("studentCodeInput");
const enterBtn = document.getElementById("enterBtn");
const welcomeError = document.getElementById("welcomeError");
const confirmationQuestion = document.getElementById("confirmationQuestion");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

const startMissionBtn = document.getElementById("startMissionBtn");
const timerDisplay = document.getElementById("timerDisplay");
const foundDisplay = document.getElementById("foundDisplay");
const numberPool = document.getElementById("numberPool");
const explorationBoard = document.getElementById("explorationBoard");
const checkExplorationBtn = document.getElementById("checkExplorationBtn");
const resetExplorationBtn = document.getElementById("resetExplorationBtn");
const explorationFeedback = document.getElementById("explorationFeedback");
const foundGallery = document.getElementById("foundGallery");

const conjeturaGallery = document.getElementById("conjeturaGallery");
const conjeturaText = document.getElementById("conjeturaText");
const continueConjeturaBtn = document.getElementById("continueConjeturaBtn");

const generalizacionText = document.getElementById("generalizacionText");
const continueGeneralizacionBtn = document.getElementById("continueGeneralizacionBtn");

const continueJustificacionBtn = document.getElementById("continueJustificacionBtn");

const validezPhase = document.getElementById("validezPhase");
const validezAttempts = document.getElementById("validezAttempts");
const validezNumberPool = document.getElementById("validezNumberPool");
const validezBoard = document.getElementById("validezBoard");
const checkValidezBtn = document.getElementById("checkValidezBtn");
const resetValidezBtn = document.getElementById("resetValidezBtn");
const validezFeedback = document.getElementById("validezFeedback");
const validezSummary = document.getElementById("validezSummary");
const validezReflectionBlock = document.getElementById("validezReflectionBlock");
const continueValidezBtn = document.getElementById("continueValidezBtn");

const reflexionText = document.getElementById("reflexionText");
const finalSummary = document.getElementById("finalSummary");
const restartMissionBtn = document.getElementById("restartMissionBtn");

init();

function init() {
  setupEntryFlow();
  setupExplorationDnD();
  setupValidezDnD();
  setupButtons();
  setupRecorders();
  buildNumberPool(numberPool, [1, 2, 3, 4, 5]);
  buildValidezPool();
}

function setupEntryFlow() {
  enterBtn.addEventListener("click", () => {
    const input = studentCodeInput.value.trim();
    if (!input) {
      welcomeError.textContent = "Escribe un codigo para continuar.";
      return;
    }

    studentCode = input;
    welcomeError.textContent = "";
    confirmationQuestion.textContent = `Tu codigo es ${studentCode}. Confirmas que esta correcto?`;
    welcomeContainer.style.display = "none";
    confirmContainer.style.display = "flex";
  });

  confirmNoBtn.addEventListener("click", () => {
    confirmContainer.style.display = "none";
    welcomeContainer.style.display = "flex";
  });

  confirmYesBtn.addEventListener("click", () => {
    confirmContainer.style.display = "none";
    activityApp.style.display = "block";
    showComponent("contexto");
  });
}

function setupButtons() {
  startMissionBtn.addEventListener("click", () => {
    showComponent("exploracion");
    startExplorationTimer();
  });

  checkExplorationBtn.addEventListener("click", handleExplorationCheck);
  resetExplorationBtn.addEventListener("click", () => {
    explorationPlacements = createEmptyPlacements();
    renderPlacements(explorationBoard, explorationPlacements, null);
    setStatus(explorationFeedback, "Reiniciaste la Magic V.", false);
  });

  continueConjeturaBtn.addEventListener("click", () => {
    const hasAudio = sessionData.audios.conjetura.length > 0;
    const text = conjeturaText.value.trim();
    sessionData.writtenResponses.conjetura = text;

    if (!hasAudio && !text) {
      alert("Para continuar, graba audio o escribe tu idea.");
      return;
    }

    showComponent("generalizacion");
  });

  continueGeneralizacionBtn.addEventListener("click", () => {
    const response = generalizacionText.value.trim();
    if (!response) {
      alert("Escribe la regla antes de continuar.");
      return;
    }

    sessionData.writtenResponses.generalizacion = response;
    showComponent("justificacion");
  });

  continueJustificacionBtn.addEventListener("click", () => {
    if (!sessionData.audios.justificacion.length) {
      alert("Debes grabar audio para continuar.");
      return;
    }

    showComponent("validez");
    resetValidezForCurrentPhase();
  });

  checkValidezBtn.addEventListener("click", handleValidezCheck);
  resetValidezBtn.addEventListener("click", resetValidezForCurrentPhase);

  continueValidezBtn.addEventListener("click", () => {
    const allDone = validezDone[2] && validezDone[4];
    if (!allDone || !sessionData.audios.validez.length) {
      alert("Completa las pruebas con 2 y 4, y graba el audio para continuar.");
      return;
    }

    showComponent("reflexion");
    renderFinalSummary();
  });

  restartMissionBtn.addEventListener("click", () => {
    location.reload();
  });

  reflexionText.addEventListener("input", () => {
    sessionData.writtenResponses.reflexion = reflexionText.value.trim();
  });
}

function setupExplorationDnD() {
  // Cada casilla recibe numeros arrastrados desde el panel de numeros.
  explorationBoard.querySelectorAll(".dropzone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      const dragged = Number(event.dataTransfer.getData("text/plain"));
      const pos = zone.dataset.pos;
      placeNumber(explorationPlacements, pos, dragged);
      renderPlacements(explorationBoard, explorationPlacements, null);
    });
  });
}

function setupValidezDnD() {
  validezBoard.querySelectorAll(".dropzone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      const pos = zone.dataset.pos;
      if (pos === "bottom") {
        return;
      }

      const dragged = Number(event.dataTransfer.getData("text/plain"));
      placeNumber(validezPlacements, pos, dragged);
      renderPlacements(validezBoard, validezPlacements, getCurrentFixedBottom());
    });
  });
}

function handleExplorationCheck() {
  sessionData.attempts += 1;

  if (!isComplete(explorationPlacements)) {
    setStatus(explorationFeedback, "Todavia no es una Magic V", false);
    return;
  }

  const valid = isMagicV(explorationPlacements);
  if (!valid) {
    setStatus(explorationFeedback, "Todavia no es una Magic V", false);
    return;
  }

  const signature = getSignature(explorationPlacements);
  const alreadyExists = sessionData.validMagicVs.some((item) => item.signature === signature);

  if (alreadyExists) {
    setStatus(explorationFeedback, "Si es una Magic V, pero esa ya estaba en tu galeria.", true);
    return;
  }

  const magicV = {
    ...explorationPlacements,
    signature
  };

  sessionData.validMagicVs.push(magicV);
  setStatus(explorationFeedback, "Si es una Magic V", true);
  renderFoundGallery(foundGallery, sessionData.validMagicVs, false);
  updateFoundCounter();

  if (sessionData.validMagicVs.length === 3) {
    stopExplorationTimer();
    sessionData.explorationTime = explorationSeconds;

    setTimeout(() => {
      showComponent("conjetura");
      renderFoundGallery(conjeturaGallery, sessionData.validMagicVs, true);
    }, 850);
  }
}

function handleValidezCheck() {
  sessionData.attempts += 1;
  const fixedBottom = getCurrentFixedBottom();

  if (!isComplete(validezPlacements, true)) {
    setStatus(validezFeedback, "Todavia no funciona", false);
    incrementValidezAttempts(fixedBottom);
    return;
  }

  const valid = isMagicV({ ...validezPlacements, bottom: fixedBottom });
  incrementValidezAttempts(fixedBottom);

  if (valid) {
    setStatus(validezFeedback, "Si funciona", true);
    validezSummary.textContent = `Con vertice ${fixedBottom} si lograste una configuracion valida.`;
  } else {
    setStatus(validezFeedback, "No funciona", false);
    validezSummary.textContent = `Con vertice ${fixedBottom} no lograste equilibrio en este intento.`;
  }

  validezDone[fixedBottom] = true;
  maybeAdvanceValidezPhase();
}

function maybeAdvanceValidezPhase() {
  if (validezPhaseIndex === 0 && validezDone[2]) {
    validezPhaseIndex = 1;
    resetValidezForCurrentPhase();
    setStatus(validezFeedback, "Ahora prueba con vertice fijo en 4.", false);
    return;
  }

  if (validezDone[2] && validezDone[4]) {
    validezReflectionBlock.classList.remove("hidden");
    validezSummary.textContent = "Ya probaste con 2 y con 4. Completa la reflexion en audio.";
  }
}

function incrementValidezAttempts(fixedBottom) {
  if (fixedBottom === 2) {
    sessionData.validationAttempts.with2 += 1;
  }

  if (fixedBottom === 4) {
    sessionData.validationAttempts.with4 += 1;
  }

  validezAttempts.textContent = `Intentos con 2: ${sessionData.validationAttempts.with2} | Intentos con 4: ${sessionData.validationAttempts.with4}`;
}

function resetValidezForCurrentPhase() {
  validezPlacements = createEmptyPlacements();
  const fixed = getCurrentFixedBottom();
  validezPhase.textContent = `Fase: vertice inferior fijo en ${fixed}`;
  buildValidezPool();
  renderPlacements(validezBoard, validezPlacements, fixed);
}

function buildValidezPool() {
  const fixed = getCurrentFixedBottom();
  const available = [1, 2, 3, 4, 5].filter((n) => n !== fixed);
  buildNumberPool(validezNumberPool, available);
}

function getCurrentFixedBottom() {
  return validezPhases[validezPhaseIndex];
}

function showComponent(componentId) {
  COMPONENT_IDS.forEach((id) => {
    const component = document.getElementById(id);
    if (id === componentId) {
      component.classList.add("active");
      component.classList.remove("hidden");
    } else {
      component.classList.remove("active");
      component.classList.add("hidden");
    }
  });
}

function startExplorationTimer() {
  if (explorationInterval) {
    return;
  }

  explorationSeconds = 0;
  timerDisplay.textContent = "Tiempo: 00:00";

  explorationInterval = setInterval(() => {
    explorationSeconds += 1;
    timerDisplay.textContent = `Tiempo: ${formatTime(explorationSeconds)}`;
  }, 1000);
}

function stopExplorationTimer() {
  if (!explorationInterval) {
    return;
  }

  clearInterval(explorationInterval);
  explorationInterval = null;
}

function updateFoundCounter() {
  foundDisplay.textContent = `Magic V encontradas: ${sessionData.validMagicVs.length}/3`;
}

function createEmptyPlacements() {
  return {
    leftTop: null,
    leftMid: null,
    bottom: null,
    rightMid: null,
    rightTop: null
  };
}

function placeNumber(placementObj, targetPos, number) {
  Object.keys(placementObj).forEach((key) => {
    if (placementObj[key] === number) {
      placementObj[key] = null;
    }
  });

  placementObj[targetPos] = number;
}

function renderPlacements(board, placementObj, fixedBottom) {
  board.querySelectorAll(".dropzone").forEach((zone) => {
    const pos = zone.dataset.pos;

    if (pos === "bottom" && fixedBottom !== null && fixedBottom !== undefined) {
      zone.textContent = String(fixedBottom);
      zone.classList.add("filled");
      return;
    }

    const value = placementObj[pos];
    if (value === null || value === undefined) {
      zone.textContent = getZoneLabel(pos);
      zone.classList.remove("filled");
    } else {
      zone.textContent = String(value);
      zone.classList.add("filled");
    }
  });
}

function getZoneLabel(pos) {
  const labels = {
    leftTop: "Izq superior",
    leftMid: "Izq media",
    bottom: "Inferior",
    rightMid: "Der media",
    rightTop: "Der superior"
  };
  return labels[pos] || "";
}

function isComplete(placementObj, ignoreBottom = false) {
  const keys = Object.keys(placementObj).filter((key) => !(ignoreBottom && key === "bottom"));
  return keys.every((key) => placementObj[key] !== null && placementObj[key] !== undefined);
}

function isMagicV(placements) {
  const left = placements.leftTop + placements.leftMid + placements.bottom;
  const right = placements.bottom + placements.rightMid + placements.rightTop;
  return left === right;
}

function getSignature(placements) {
  return [
    placements.leftTop,
    placements.leftMid,
    placements.bottom,
    placements.rightMid,
    placements.rightTop
  ].join("-");
}

function buildNumberPool(container, numbers) {
  container.innerHTML = "";

  numbers.forEach((number) => {
    const button = document.createElement("button");
    button.className = "drag-number";
    button.type = "button";
    button.textContent = String(number);
    button.setAttribute("draggable", "true");

    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", String(number));
    });

    container.appendChild(button);
  });
}

function renderFoundGallery(container, list, highlightBottom) {
  container.innerHTML = "";

  list.forEach((item, index) => {
    const mini = document.createElement("article");
    mini.className = "mini-v";
    const bottomValue = highlightBottom
      ? `<span class="bottom-mark">${item.bottom}</span>`
      : item.bottom;

    mini.innerHTML = [
      `<strong>Magic V ${index + 1}</strong>`,
      `<div>Izq: ${item.leftTop} - ${item.leftMid}</div>`,
      `<div>Abajo: ${bottomValue}</div>`,
      `<div>Der: ${item.rightMid} - ${item.rightTop}</div>`
    ].join("");

    container.appendChild(mini);
  });
}

function setStatus(element, message, good) {
  element.textContent = message;
  element.classList.toggle("good", Boolean(good));
  element.classList.toggle("bad", !good);
}

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function setupRecorders() {
  configureRecorder("conjetura", "recordConjeturaBtn", "stopConjeturaBtn", "statusConjetura");
  configureRecorder("justificacion", "recordJustificacionBtn", "stopJustificacionBtn", "statusJustificacion");
  configureRecorder("validez", "recordValidezBtn", "stopValidezBtn", "statusValidez");
  configureRecorder("reflexion", "recordReflexionBtn", "stopReflexionBtn", "statusReflexion");
}

function configureRecorder(key, recordBtnId, stopBtnId, statusId) {
  const recordBtn = document.getElementById(recordBtnId);
  const stopBtn = document.getElementById(stopBtnId);
  const status = document.getElementById(statusId);

  if (!recordBtn || !stopBtn || !status) {
    return;
  }

  stopBtn.disabled = true;

  recordBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        sessionData.audios[key].push({
          createdAt: new Date().toISOString(),
          blob,
          url
        });

        status.textContent = `Grabacion guardada. Total: ${sessionData.audios[key].length}`;
        stream.getTracks().forEach((track) => track.stop());
      };

      recorders[key] = mediaRecorder;
      mediaRecorder.start();
      status.textContent = "Grabando...";
      recordBtn.disabled = true;
      stopBtn.disabled = false;
    } catch (error) {
      status.textContent = "No fue posible iniciar la grabacion en este navegador.";
    }
  });

  stopBtn.addEventListener("click", () => {
    const mediaRecorder = recorders[key];
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      return;
    }

    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function renderFinalSummary() {
  const totalAudios =
    sessionData.audios.conjetura.length +
    sessionData.audios.justificacion.length +
    sessionData.audios.validez.length +
    sessionData.audios.reflexion.length;

  finalSummary.innerHTML = [
    `<h3>Resumen final</h3>`,
    `<p>Tiempo en exploracion: <strong>${formatTime(sessionData.explorationTime)}</strong></p>`,
    `<p>Numero de intentos: <strong>${sessionData.attempts}</strong></p>`,
    `<p>Numero de Magic V validas encontradas: <strong>${sessionData.validMagicVs.length}</strong></p>`,
    `<p>Audios grabados: <strong>${totalAudios}</strong></p>`
  ].join("");
}

window.sessionData = sessionData;
