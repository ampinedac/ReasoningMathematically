const sessionData = {
  explorationTime: null,
  savedOutfits: [],
  attempts: [],
  audios: {},
  writtenResponses: {},
  predictedTotal: null,
  validationChecks: null
};

const ALL_TOPS = [
  { id: "camiseta-rosa", label: "Camiseta rosa", icon: "👕" },
  { id: "camiseta-lila", label: "Camiseta lila", icon: "👚" },
  { id: "camiseta-turquesa", label: "Camiseta turquesa", icon: "🎽" }
];

const ALL_BOTTOMS = [
  { id: "pantalon", label: "Pantalon", icon: "👖" },
  { id: "falda", label: "Falda", icon: "🩳" }
];

let timerInterval = null;
let timerStart = null;
let elapsedBeforeStop = 0;

let selectedTop = null;
let selectedBottom = null;
let studentCode = "";

const recorderState = {
  currentKey: null,
  mediaRecorder: null,
  stream: null,
  chunks: []
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

function byId(id) {
  return document.getElementById(id);
}

function showComponent(id) {
  componentIds.forEach((componentId) => {
    const section = byId(componentId);
    section.classList.toggle("active", componentId === id);
  });

  if (id === "conjetura") {
    renderGallery("conjeturaGallery");
  }

  if (id === "validez") {
    renderValidezGallery();
    renderMissingOutfits();
  }

  if (id === "reflexion") {
    renderSummary();
  }
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return minutes + ":" + seconds;
}

function startTimer() {
  timerStart = Date.now() - elapsedBeforeStop;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - timerStart;
    byId("timerDisplay").textContent = "Tiempo: " + formatTime(elapsed);
  }, 250);
}

function stopTimer() {
  if (timerStart) {
    elapsedBeforeStop = Date.now() - timerStart;
  }
  clearInterval(timerInterval);
  timerInterval = null;
  sessionData.explorationTime = elapsedBeforeStop;
}

function createDragItem(item, type) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "drag-item " + type;
  button.draggable = true;
  button.dataset.id = item.id;
  button.dataset.type = type;
  button.textContent = item.icon + " " + item.label;

  button.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({
      id: item.id,
      type,
      label: item.label,
      icon: item.icon
    }));
  });

  return button;
}

function renderDragPools() {
  const topsPool = byId("topsPool");
  const bottomsPool = byId("bottomsPool");
  topsPool.innerHTML = "";
  bottomsPool.innerHTML = "";

  ALL_TOPS.forEach((top) => topsPool.appendChild(createDragItem(top, "top")));
  ALL_BOTTOMS.forEach((bottom) => bottomsPool.appendChild(createDragItem(bottom, "bottom")));
}

function resetDropzones() {
  const topZone = byId("dropTop");
  const bottomZone = byId("dropBottom");

  topZone.textContent = "Suelta aqui la prenda de arriba";
  bottomZone.textContent = "Suelta aqui la prenda de abajo";
  topZone.classList.remove("filled");
  bottomZone.classList.remove("filled");

  selectedTop = null;
  selectedBottom = null;
}

function setupDropzones() {
  ["dropTop", "dropBottom"].forEach((zoneId) => {
    const zone = byId(zoneId);

    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("ready");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("ready");
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("ready");

      const payloadText = event.dataTransfer.getData("text/plain");
      if (!payloadText) {
        return;
      }

      const payload = JSON.parse(payloadText);
      const targetType = zoneId === "dropTop" ? "top" : "bottom";

      if (payload.type !== targetType) {
        setStatus("explorationFeedback", "Esa prenda va en la otra zona.", "bad");
        return;
      }

      zone.textContent = payload.icon + " " + payload.label;
      zone.classList.add("filled");

      if (targetType === "top") {
        selectedTop = { id: payload.id, label: payload.label, icon: payload.icon };
      } else {
        selectedBottom = { id: payload.id, label: payload.label, icon: payload.icon };
      }

      setStatus("explorationFeedback", "Buena eleccion. Ahora guarda la pinta.", "good");
    });
  });
}

function checkDuplicateOutfit(outfit) {
  return sessionData.savedOutfits.some((saved) => saved.top.id === outfit.top.id && saved.bottom.id === outfit.bottom.id);
}

function saveOutfit() {
  const attempt = {
    time: Date.now(),
    top: selectedTop ? selectedTop.id : null,
    bottom: selectedBottom ? selectedBottom.id : null,
    action: "save"
  };

  sessionData.attempts.push(attempt);

  if (!selectedTop || !selectedBottom) {
    setStatus("explorationFeedback", "Selecciona una prenda de arriba y una de abajo.", "bad");
    return;
  }

  const outfit = {
    top: selectedTop,
    bottom: selectedBottom
  };

  if (checkDuplicateOutfit(outfit)) {
    setStatus("explorationFeedback", "Esa pinta ya estaba guardada. Prueba otra.", "bad");
    return;
  }

  sessionData.savedOutfits.push(outfit);
  byId("outfitCounter").textContent = "Pintas encontradas: " + sessionData.savedOutfits.length;

  renderGallery("savedGallery");
  setStatus("explorationFeedback", "Pinta guardada en la galeria.", "good");

  // Marca automaticamente en la tabla de generalizacion las combinaciones ya encontradas.
  syncGeneralizacionChecks();
  resetDropzones();

  if (sessionData.savedOutfits.length >= 4) {
    stopTimer();
    showComponent("conjetura");
  }
}

function renderGallery(containerId) {
  const container = byId(containerId);
  container.innerHTML = "";

  if (sessionData.savedOutfits.length === 0) {
    const empty = document.createElement("p");
    empty.className = "status-line";
    empty.textContent = "Aun no hay pintas guardadas.";
    container.appendChild(empty);
    return;
  }

  sessionData.savedOutfits.forEach((outfit, index) => {
    const card = document.createElement("article");
    card.className = "outfit-card";
    card.innerHTML =
      "<p class=\"outfit-title\">Pinta " + (index + 1) + "</p>" +
      "<p class=\"outfit-lines\">" + outfit.top.icon + " " + outfit.top.label + "</p>" +
      "<p class=\"outfit-lines\">" + outfit.bottom.icon + " " + outfit.bottom.label + "</p>";
    container.appendChild(card);
  });
}

function setStatus(id, message, type = "") {
  const element = byId(id);
  element.textContent = message;
  element.classList.remove("good", "bad");
  if (type) {
    element.classList.add(type);
  }
}

function getAllOutfits() {
  const all = [];
  ALL_TOPS.forEach((top) => {
    ALL_BOTTOMS.forEach((bottom) => {
      all.push({ top, bottom });
    });
  });
  return all;
}

function syncGeneralizacionChecks() {
  const checkboxes = document.querySelectorAll("#generalizacionBody input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    const found = sessionData.savedOutfits.some((outfit) =>
      outfit.top.id === checkbox.dataset.top && outfit.bottom.id === checkbox.dataset.bottom
    );
    checkbox.checked = found || checkbox.checked;
  });
}

function captureGeneralizacionText() {
  const checks = Array.from(document.querySelectorAll("#generalizacionBody input[type='checkbox']"))
    .map((checkbox) => ({
      top: checkbox.dataset.top,
      bottom: checkbox.dataset.bottom,
      checked: checkbox.checked
    }));

  sessionData.writtenResponses.generalizacion = {
    pattern: byId("patternInput").value.trim(),
    withoutCounting: byId("withoutCountingInput").value.trim(),
    checks
  };
}

function renderValidezGallery() {
  renderGallery("validezGallery");
}

function renderMissingOutfits() {
  const list = byId("missingOutfitsList");
  list.innerHTML = "";

  const missing = getAllOutfits().filter((candidate) =>
    !sessionData.savedOutfits.some((saved) =>
      saved.top.id === candidate.top.id && saved.bottom.id === candidate.bottom.id
    )
  );

  if (missing.length === 0) {
    const done = document.createElement("button");
    done.type = "button";
    done.className = "missing-button completed";
    done.textContent = "Ya completaste todas las pintas.";
    done.disabled = true;
    list.appendChild(done);
    return;
  }

  missing.forEach((outfit) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "missing-button";
    button.textContent = outfit.top.icon + " " + outfit.top.label + " + " + outfit.bottom.icon + " " + outfit.bottom.label;

    button.addEventListener("click", () => {
      if (!checkDuplicateOutfit(outfit)) {
        sessionData.savedOutfits.push(outfit);
      }
      renderValidezGallery();
      renderMissingOutfits();
      syncGeneralizacionChecks();
    });

    list.appendChild(button);
  });
}

async function startRecording(audioKey, statusId) {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    setStatus(statusId, "Tu navegador no soporta grabacion de audio.", "bad");
    return;
  }

  if (recorderState.mediaRecorder) {
    setStatus(statusId, "Ya hay una grabacion en curso.", "bad");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    recorderState.currentKey = audioKey;
    recorderState.mediaRecorder = mediaRecorder;
    recorderState.stream = stream;
    recorderState.chunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        recorderState.chunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(recorderState.chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      sessionData.audios[audioKey] = {
        blob,
        url,
        createdAt: Date.now()
      };

      recorderState.stream.getTracks().forEach((track) => track.stop());
      recorderState.currentKey = null;
      recorderState.mediaRecorder = null;
      recorderState.stream = null;
      recorderState.chunks = [];

      setStatus(statusId, "Audio guardado.", "good");
    });

    mediaRecorder.start();
    setStatus(statusId, "Grabando...", "good");
  } catch (error) {
    setStatus(statusId, "No se pudo iniciar la grabacion.", "bad");
  }
}

function stopRecording(expectedKey, statusId) {
  if (!recorderState.mediaRecorder) {
    setStatus(statusId, "No hay grabacion activa.", "bad");
    return;
  }

  if (recorderState.currentKey !== expectedKey) {
    setStatus(statusId, "La grabacion activa corresponde a otra pregunta.", "bad");
    return;
  }

  recorderState.mediaRecorder.stop();
}

function renderSummary() {
  const summaryBox = byId("summaryBox");
  const explorationTimeText = sessionData.explorationTime !== null
    ? formatTime(sessionData.explorationTime)
    : "00:00";

  summaryBox.innerHTML =
    "<p>Tiempo exploracion: " + explorationTimeText + "</p>" +
    "<p>Numero de pintas guardadas: " + sessionData.savedOutfits.length + "</p>" +
    "<p>Intentos de guardado: " + sessionData.attempts.length + "</p>";
}

function clearSessionState() {
  sessionData.explorationTime = null;
  sessionData.savedOutfits = [];
  sessionData.attempts = [];
  sessionData.audios = {};
  sessionData.writtenResponses = {};
  sessionData.predictedTotal = null;
  sessionData.validationChecks = null;

  elapsedBeforeStop = 0;
  timerStart = null;
  clearInterval(timerInterval);

  byId("outfitCounter").textContent = "Pintas encontradas: 0";
  byId("timerDisplay").textContent = "Tiempo: 00:00";
  byId("predictedTotalInput").value = "";
  byId("conjeturaReasonInput").value = "";
  byId("patternInput").value = "";
  byId("withoutCountingInput").value = "";
  byId("allOutfitsCheck").value = "";
  byId("discoverInput").value = "";
  byId("allOutfitsIdeaInput").value = "";

  [
    "statusExploracion",
    "statusConjetura",
    "statusJustificacion",
    "statusValidez",
    "statusReflexion",
    "explorationFeedback"
  ].forEach((id) => setStatus(id, "", ""));

  document.querySelectorAll("#generalizacionBody input[type='checkbox']").forEach((checkbox) => {
    checkbox.checked = false;
  });

  resetDropzones();
  renderGallery("savedGallery");
  renderGallery("conjeturaGallery");
  renderValidezGallery();
  renderMissingOutfits();
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

function setupNavigationActions() {
  byId("startActivityBtn").addEventListener("click", () => {
    showComponent("exploracion");
    startTimer();
  });

  byId("saveOutfitBtn").addEventListener("click", saveOutfit);
  byId("resetSelectionBtn").addEventListener("click", () => {
    sessionData.attempts.push({
      time: Date.now(),
      top: selectedTop ? selectedTop.id : null,
      bottom: selectedBottom ? selectedBottom.id : null,
      action: "reset"
    });
    resetDropzones();
    setStatus("explorationFeedback", "Seleccion reiniciada.", "");
  });

  byId("goGeneralizacionBtn").addEventListener("click", () => {
    const predicted = Number(byId("predictedTotalInput").value);
    if (Number.isNaN(predicted) || predicted < 0) {
      setStatus("statusConjetura", "Escribe una prediccion numerica valida.", "bad");
      return;
    }

    sessionData.predictedTotal = predicted;
    sessionData.writtenResponses.conjetura = {
      reason: byId("conjeturaReasonInput").value.trim()
    };
    setStatus("statusConjetura", "Respuesta guardada.", "good");
    showComponent("generalizacion");
  });

  byId("goJustificacionBtn").addEventListener("click", () => {
    captureGeneralizacionText();
    showComponent("justificacion");
  });

  byId("goValidezBtn").addEventListener("click", () => {
    if (!sessionData.audios.justificacion) {
      setStatus("statusJustificacion", "Esta grabacion es obligatoria antes de continuar.", "bad");
      return;
    }
    showComponent("validez");
  });

  byId("goReflexionBtn").addEventListener("click", () => {
    sessionData.validationChecks = {
      allOutfitsCheck: byId("allOutfitsCheck").value,
      completedOutfits: sessionData.savedOutfits.length,
      hasAudio: Boolean(sessionData.audios.validez)
    };

    if (!sessionData.validationChecks.allOutfitsCheck) {
      setStatus("statusValidez", "Selecciona si estan todas o faltan pintas.", "bad");
      return;
    }

    showComponent("reflexion");
  });

  byId("restartBtn").addEventListener("click", () => {
    clearSessionState();
    showComponent("contexto");
  });
}

function setupAudioControls() {
  const controls = [
    ["recordExploracionBtn", "stopExploracionBtn", "exploracion", "statusExploracion"],
    ["recordConjeturaBtn", "stopConjeturaBtn", "conjetura", "statusConjetura"],
    ["recordJustificacionBtn", "stopJustificacionBtn", "justificacion", "statusJustificacion"],
    ["recordValidezBtn", "stopValidezBtn", "validez", "statusValidez"],
    ["recordReflexionBtn", "stopReflexionBtn", "reflexion", "statusReflexion"]
  ];

  controls.forEach(([recordId, stopId, key, statusId]) => {
    byId(recordId).addEventListener("click", () => startRecording(key, statusId));
    byId(stopId).addEventListener("click", () => stopRecording(key, statusId));
  });
}

function setupGeneralizacionChecks() {
  document.querySelectorAll("#generalizacionBody input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      captureGeneralizacionText();
    });
  });
}

function initActivity() {
  renderDragPools();
  setupDropzones();
  setupWelcomeFlow();
  setupNavigationActions();
  setupAudioControls();
  setupGeneralizacionChecks();
  resetDropzones();
  renderGallery("savedGallery");
}

document.addEventListener("DOMContentLoaded", initActivity);
