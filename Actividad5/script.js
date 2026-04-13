const sessionData = {
  explorationAnswers: {},
  completedScenes: {},
  sceneGroups: {},
  audios: {},
  writtenResponses: {},
  farScenesAnswers: {},
  timestamps: {}
};

const componentIds = [
  "contexto",
  "exploracion",
  "conjetura",
  "generalizacion",
  "justificacion",
  "validez",
  "reflexion"
];

const recorderState = {
  mediaRecorder: null,
  stream: null,
  chunks: [],
  activeKey: ""
};

let studentCode = "";

function byId(id) {
  return document.getElementById(id);
}

function setStatus(id, message, kind = "") {
  const target = byId(id);
  target.textContent = message;
  target.classList.remove("good", "bad");
  if (kind) {
    target.classList.add(kind);
  }
}

function markTimestamp(key) {
  sessionData.timestamps[key] = new Date().toISOString();
}

function showComponent(id) {
  componentIds.forEach((componentId) => {
    const section = byId(componentId);
    section.classList.toggle("active", componentId === id);
  });

  markTimestamp("show_" + id);

  if (id === "conjetura") {
    renderConjeturaSummary();
  }

  if (id === "generalizacion") {
    renderGeneralizationLists();
    renderSceneCards();
  }

  if (id === "reflexion") {
    renderFinalSummary();
  }
}

function isEven(sceneNumber) {
  return sceneNumber % 2 === 0;
}

function expectedAction(sceneNumber) {
  return isEven(sceneNumber) ? "aplausos" : "salto";
}

function expectedClaps(sceneNumber) {
  if (!isEven(sceneNumber)) {
    return 0;
  }
  return sceneNumber / 2;
}

function setupWelcomeFlow() {
  byId("enterBtn").addEventListener("click", () => {
    const code = byId("studentCodeInput").value.trim();
    if (!code) {
      setStatus("welcomeError", "Escribe tu codigo para continuar.", "bad");
      return;
    }

    studentCode = code;
    byId("confirmationQuestion").textContent = "Tu codigo es " + studentCode + "?";
    byId("ContenedorBienvenida").style.display = "none";
    byId("ContenedorConfirmacion").style.display = "flex";
    setStatus("welcomeError", "", "");
  });

  byId("confirmNoBtn").addEventListener("click", () => {
    byId("ContenedorConfirmacion").style.display = "none";
    byId("ContenedorBienvenida").style.display = "flex";
  });

  byId("confirmYesBtn").addEventListener("click", () => {
    byId("ContenedorConfirmacion").style.display = "none";
    byId("activityApp").style.display = "block";
    showComponent("contexto");
  });
}

function setupExplorationRows() {
  const selects = document.querySelectorAll(".action-select");

  selects.forEach((select) => {
    select.addEventListener("change", (event) => {
      const scene = event.target.dataset.scene;
      const action = event.target.value;
      const clapInput = document.querySelector(".clap-input[data-scene='" + scene + "']");

      clapInput.value = "";
      clapInput.disabled = action !== "aplausos";

      if (!sessionData.explorationAnswers[scene]) {
        sessionData.explorationAnswers[scene] = {};
      }

      sessionData.explorationAnswers[scene].action = action;
      if (action !== "aplausos") {
        sessionData.explorationAnswers[scene].claps = null;
      }

      syncCompletedScenes();
    });
  });

  const clapInputs = document.querySelectorAll(".clap-input");
  clapInputs.forEach((input) => {
    input.addEventListener("input", (event) => {
      const scene = event.target.dataset.scene;
      const value = event.target.value.trim();
      const numericValue = value ? Number(value) : null;

      if (!sessionData.explorationAnswers[scene]) {
        sessionData.explorationAnswers[scene] = {};
      }

      sessionData.explorationAnswers[scene].claps = numericValue;
      syncCompletedScenes();
    });
  });
}

function syncPredictions() {
  sessionData.explorationAnswers.scene7Prediction = byId("scene7Prediction").value.trim();
  sessionData.explorationAnswers.scene8Prediction = byId("scene8Prediction").value.trim();
  sessionData.explorationAnswers.textResponse = byId("exploracionTexto").value.trim();
}

function syncCompletedScenes() {
  [7, 8, 9, 10, 11, 12].forEach((sceneNumber) => {
    const scene = String(sceneNumber);
    const answer = sessionData.explorationAnswers[scene];

    if (!answer || !answer.action) {
      sessionData.completedScenes[scene] = false;
      return;
    }

    if (answer.action === "salto") {
      sessionData.completedScenes[scene] = true;
      return;
    }

    sessionData.completedScenes[scene] = Number.isInteger(answer.claps) && answer.claps > 0;
  });
}

function validateExploracion() {
  syncPredictions();
  syncCompletedScenes();

  const scene7 = sessionData.explorationAnswers["7"];
  const scene8 = sessionData.explorationAnswers["8"];

  const isScene7Done = Boolean(scene7 && scene7.action && (scene7.action === "salto" || (Number.isInteger(scene7.claps) && scene7.claps > 0)));
  const isScene8Done = Boolean(scene8 && scene8.action && (scene8.action === "salto" || (Number.isInteger(scene8.claps) && scene8.claps > 0)));

  const hasAudio = Boolean(sessionData.audios.exploracion);
  const hasText = Boolean(sessionData.explorationAnswers.textResponse);

  if (!isScene7Done || !isScene8Done) {
    setStatus("statusExploracion", "Completa al menos las escenas 7 y 8.", "bad");
    return false;
  }

  if (!hasAudio && !hasText) {
    setStatus("statusExploracion", "Graba audio o escribe una respuesta breve para continuar.", "bad");
    return false;
  }

  setStatus("statusExploracion", "Exploracion guardada.", "good");
  markTimestamp("exploracion_completa");
  return true;
}

function renderConjeturaSummary() {
  const container = byId("conjeturaResumen");
  const rows = [];

  [7, 8, 9, 10, 11, 12].forEach((sceneNumber) => {
    const answer = sessionData.explorationAnswers[String(sceneNumber)];
    if (!answer || !answer.action) {
      return;
    }

    if (answer.action === "salto") {
      rows.push("<li>Escena " + sceneNumber + ": Salto</li>");
    } else {
      const claps = Number.isInteger(answer.claps) ? answer.claps : "?";
      rows.push("<li>Escena " + sceneNumber + ": " + claps + " aplausos</li>");
    }
  });

  const prediction7 = sessionData.explorationAnswers.scene7Prediction || "(sin respuesta)";
  const prediction8 = sessionData.explorationAnswers.scene8Prediction || "(sin respuesta)";

  container.innerHTML =
    "<h3>Resumen de escenas completadas</h3>" +
    "<p><strong>Prediccion escena 7:</strong> " + prediction7 + "</p>" +
    "<p><strong>Prediccion escena 8:</strong> " + prediction8 + "</p>" +
    "<ul>" + (rows.length ? rows.join("") : "<li>Aun no hay escenas registradas.</li>") + "</ul>";
}

function saveConjetura() {
  sessionData.writtenResponses.conjetura = {
    conjeturaSalto: byId("conjeturaSalto").value.trim(),
    conjeturaAplausos: byId("conjeturaAplausos").value.trim()
  };

  markTimestamp("conjetura_guardada");
}

function renderGeneralizationLists() {
  const saltoList = byId("saltoList");
  const aplausosList = byId("aplausosList");
  saltoList.innerHTML = "";
  aplausosList.innerHTML = "";

  for (let scene = 1; scene <= 12; scene += 1) {
    const item = document.createElement("li");
    if (expectedAction(scene) === "salto") {
      item.textContent = "Escena " + scene;
      saltoList.appendChild(item);
    } else {
      item.textContent = "Escena " + scene + " (" + expectedClaps(scene) + " aplausos)";
      aplausosList.appendChild(item);
    }
  }
}

function createSceneCard(sceneNumber) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "scene-card";
  card.draggable = true;
  card.dataset.scene = String(sceneNumber);
  card.textContent = "Escena " + sceneNumber;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", String(sceneNumber));
  });

  return card;
}

function renderSceneCards() {
  const cards = byId("sceneCards");
  cards.innerHTML = "";

  for (let scene = 1; scene <= 12; scene += 1) {
    cards.appendChild(createSceneCard(scene));
  }

  sessionData.sceneGroups = {
    salto: [],
    aplausos: []
  };

  byId("dropSalto").querySelector(".drop-slot").innerHTML = "";
  byId("dropAplausos").querySelector(".drop-slot").innerHTML = "";
}

function addSceneToGroup(sceneNumber, group) {
  const opposite = group === "salto" ? "aplausos" : "salto";

  sessionData.sceneGroups[group] = sessionData.sceneGroups[group] || [];
  sessionData.sceneGroups[opposite] = sessionData.sceneGroups[opposite] || [];

  if (!sessionData.sceneGroups[group].includes(sceneNumber)) {
    sessionData.sceneGroups[group].push(sceneNumber);
  }

  sessionData.sceneGroups[opposite] = sessionData.sceneGroups[opposite].filter((value) => value !== sceneNumber);

  renderGroupPills();
}

function renderGroupPills() {
  const saltoSlot = byId("dropSalto").querySelector(".drop-slot");
  const aplausosSlot = byId("dropAplausos").querySelector(".drop-slot");

  saltoSlot.innerHTML = "";
  aplausosSlot.innerHTML = "";

  const saltoScenes = (sessionData.sceneGroups.salto || []).slice().sort((a, b) => a - b);
  const aplausosScenes = (sessionData.sceneGroups.aplausos || []).slice().sort((a, b) => a - b);

  saltoScenes.forEach((scene) => {
    const pill = document.createElement("span");
    pill.className = "drop-pill";
    pill.textContent = "Escena " + scene;
    saltoSlot.appendChild(pill);
  });

  aplausosScenes.forEach((scene) => {
    const pill = document.createElement("span");
    pill.className = "drop-pill";
    pill.textContent = "Escena " + scene;
    aplausosSlot.appendChild(pill);
  });
}

function setupDragGroups() {
  ["dropSalto", "dropAplausos"].forEach((dropId) => {
    const drop = byId(dropId);

    drop.addEventListener("dragover", (event) => {
      event.preventDefault();
      drop.classList.add("active-drop");
    });

    drop.addEventListener("dragleave", () => {
      drop.classList.remove("active-drop");
    });

    drop.addEventListener("drop", (event) => {
      event.preventDefault();
      drop.classList.remove("active-drop");
      const text = event.dataTransfer.getData("text/plain");
      if (!text) {
        return;
      }

      const scene = Number(text);
      if (!Number.isInteger(scene)) {
        return;
      }

      const group = drop.dataset.group;
      addSceneToGroup(scene, group);
    });
  });
}

function saveGeneralizacion() {
  sessionData.writtenResponses.generalizacion = {
    escenasSalto: byId("generalizacionSaltos").value.trim(),
    escenasAplausos: byId("generalizacionAplausos").value.trim(),
    reglaGeneral: byId("reglaGeneral").value.trim()
  };

  markTimestamp("generalizacion_guardada");
}

function saveJustificacion() {
  sessionData.writtenResponses.justificacion = {
    texto: byId("justificacionTexto").value.trim()
  };

  markTimestamp("justificacion_guardada");
}

function syncFarSceneSelectors() {
  const scene30Action = byId("scene30Action").value;
  const scene45Action = byId("scene45Action").value;

  byId("scene30Claps").disabled = scene30Action !== "aplausos";
  byId("scene45Claps").disabled = scene45Action !== "aplausos";

  if (scene30Action !== "aplausos") {
    byId("scene30Claps").value = "";
  }

  if (scene45Action !== "aplausos") {
    byId("scene45Claps").value = "";
  }
}

function saveValidez() {
  sessionData.farScenesAnswers = {
    scene30: {
      action: byId("scene30Action").value,
      claps: byId("scene30Claps").value ? Number(byId("scene30Claps").value) : null
    },
    scene45: {
      action: byId("scene45Action").value,
      claps: byId("scene45Claps").value ? Number(byId("scene45Claps").value) : null
    },
    explanation: byId("validezExplicacion").value.trim()
  };
}

function validateValidez() {
  saveValidez();

  const hasScene30 = Boolean(sessionData.farScenesAnswers.scene30.action);
  const hasScene45 = Boolean(sessionData.farScenesAnswers.scene45.action);
  const hasAudio = Boolean(sessionData.audios.validez);

  if (!hasScene30 || !hasScene45) {
    setStatus("statusValidez", "Responde que pasa en la escena 30 y en la 45.", "bad");
    return false;
  }

  if (!hasAudio) {
    setStatus("statusValidez", "Debes grabar audio para continuar.", "bad");
    return false;
  }

  setStatus("statusValidez", "Validez guardada.", "good");
  markTimestamp("validez_guardada");
  return true;
}

function saveReflexion() {
  sessionData.writtenResponses.reflexion = {
    descubri: byId("reflexionDescubri").value.trim(),
    paraSaber: byId("reflexionEscena").value.trim(),
    nombrePelicula: byId("nombrePelicula").value.trim()
  };

  markTimestamp("reflexion_guardada");
}

function renderFinalSummary() {
  saveReflexion();

  const summary = byId("finalSummary");
  const scene30 = sessionData.farScenesAnswers.scene30 || { action: "", claps: null };
  const scene45 = sessionData.farScenesAnswers.scene45 || { action: "", claps: null };

  const scene30Text = scene30.action === "aplausos"
    ? "Aplausos (" + (scene30.claps ?? "?") + ")"
    : (scene30.action === "salto" ? "Salto" : "Sin responder");

  const scene45Text = scene45.action === "aplausos"
    ? "Aplausos (" + (scene45.claps ?? "?") + ")"
    : (scene45.action === "salto" ? "Salto" : "Sin responder");

  const conjetura = sessionData.writtenResponses.conjetura || {};
  const generalizacion = sessionData.writtenResponses.generalizacion || {};
  const reflexion = sessionData.writtenResponses.reflexion || {};

  summary.innerHTML =
    "<h3>Resumen final</h3>" +
    "<p><strong>Escena 30:</strong> " + scene30Text + "</p>" +
    "<p><strong>Escena 45:</strong> " + scene45Text + "</p>" +
    "<p><strong>Idea sobre saltos:</strong> " + (conjetura.conjeturaSalto || "-") + "</p>" +
    "<p><strong>Idea sobre aplausos:</strong> " + (conjetura.conjeturaAplausos || "-") + "</p>" +
    "<p><strong>Regla general:</strong> " + (generalizacion.reglaGeneral || "-") + "</p>" +
    "<p><strong>Nombre propuesto:</strong> " + (reflexion.nombrePelicula || "-") + "</p>";
}

async function startRecording(componentKey, statusId) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus(statusId, "Tu navegador no permite grabar audio.", "bad");
    return;
  }

  if (recorderState.mediaRecorder && recorderState.mediaRecorder.state === "recording") {
    setStatus(statusId, "Ya hay una grabacion en curso.", "bad");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorderState.mediaRecorder = recorder;
    recorderState.stream = stream;
    recorderState.chunks = [];
    recorderState.activeKey = componentKey;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recorderState.chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recorderState.chunks, { type: "audio/webm" });
      sessionData.audios[componentKey] = {
        blob,
        createdAt: new Date().toISOString()
      };

      recorderState.stream.getTracks().forEach((track) => track.stop());
      recorderState.mediaRecorder = null;
      recorderState.stream = null;
      recorderState.chunks = [];
      recorderState.activeKey = "";

      setStatus(statusId, "Grabacion lista", "good");
    };

    recorder.start();
    setStatus(statusId, "Grabando...", "");
  } catch (error) {
    setStatus(statusId, "No fue posible iniciar la grabacion.", "bad");
  }
}

function stopRecording(expectedKey, statusId) {
  const recorder = recorderState.mediaRecorder;
  if (!recorder || recorder.state !== "recording") {
    setStatus(statusId, "No hay grabacion activa", "bad");
    return;
  }

  if (recorderState.activeKey !== expectedKey) {
    setStatus(statusId, "La grabacion activa pertenece a otra seccion.", "bad");
    return;
  }

  recorder.stop();
}

function setupAudioControls() {
  const audioMap = [
    { key: "exploracion", start: "recordExploracionBtn", stop: "stopExploracionBtn", status: "statusExploracion" },
    { key: "conjetura", start: "recordConjeturaBtn", stop: "stopConjeturaBtn", status: "statusConjetura" },
    { key: "justificacion", start: "recordJustificacionBtn", stop: "stopJustificacionBtn", status: "statusJustificacion" },
    { key: "validez", start: "recordValidezBtn", stop: "stopValidezBtn", status: "statusValidez" },
    { key: "reflexion", start: "recordReflexionBtn", stop: "stopReflexionBtn", status: "statusReflexion" }
  ];

  audioMap.forEach((item) => {
    byId(item.start).addEventListener("click", () => startRecording(item.key, item.status));
    byId(item.stop).addEventListener("click", () => stopRecording(item.key, item.status));
  });
}

function setupNavigationActions() {
  byId("startActivityBtn").addEventListener("click", () => {
    showComponent("exploracion");
  });

  byId("goConjeturaBtn").addEventListener("click", () => {
    if (!validateExploracion()) {
      return;
    }
    showComponent("conjetura");
  });

  byId("goGeneralizacionBtn").addEventListener("click", () => {
    saveConjetura();
    showComponent("generalizacion");
  });

  byId("goJustificacionBtn").addEventListener("click", () => {
    saveGeneralizacion();
    showComponent("justificacion");
  });

  byId("goValidezBtn").addEventListener("click", () => {
    saveJustificacion();

    if (!sessionData.audios.justificacion) {
      setStatus("statusJustificacion", "Debes grabar audio para continuar.", "bad");
      return;
    }

    setStatus("statusJustificacion", "Justificacion guardada.", "good");
    showComponent("validez");
  });

  byId("goReflexionBtn").addEventListener("click", () => {
    if (!validateValidez()) {
      return;
    }

    showComponent("reflexion");
  });

  byId("restartBtn").addEventListener("click", () => {
    window.location.reload();
  });
}

function setupFarSceneListeners() {
  byId("scene30Action").addEventListener("change", syncFarSceneSelectors);
  byId("scene45Action").addEventListener("change", syncFarSceneSelectors);
}

function init() {
  setupWelcomeFlow();
  setupExplorationRows();
  setupDragGroups();
  setupAudioControls();
  setupNavigationActions();
  setupFarSceneListeners();

  byId("scene7Prediction").addEventListener("input", syncPredictions);
  byId("scene8Prediction").addEventListener("input", syncPredictions);
  byId("exploracionTexto").addEventListener("input", syncPredictions);

  showComponent("contexto");
}

init();
