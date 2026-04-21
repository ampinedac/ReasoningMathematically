// --- Drag & Drop para Magic V (parteAm1) ---
let draggingBtn = null;
let dragGhost = null;
let dragOriginIdx = null;

function enableMagicVDragDrop() {
  // Botones arrastrables
  Array.from(magicVButtons.children).forEach((btn, idx) => {
    btn.setAttribute("draggable", "true");
    btn.addEventListener("dragstart", (e) => {
      draggingBtn = btn;
      dragOriginIdx = null;
      dragGhost = btn.cloneNode(true);
      dragGhost.style.position = "absolute";
      dragGhost.style.pointerEvents = "none";
      dragGhost.style.opacity = "0.7";
      dragGhost.style.zIndex = "9999";
      document.body.appendChild(dragGhost);
      document.body.style.userSelect = "none";
    });
    btn.addEventListener("dragend", (e) => {
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
      document.body.style.userSelect = "";
    });
    // Touch events
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      draggingBtn = btn;
      dragOriginIdx = null;
      dragGhost = btn.cloneNode(true);
      dragGhost.style.position = "absolute";
      dragGhost.style.pointerEvents = "none";
      dragGhost.style.opacity = "0.7";
      dragGhost.style.zIndex = "9999";
      document.body.appendChild(dragGhost);
    });
    btn.addEventListener("touchmove", (e) => {
      if (!dragGhost) return;
      const touch = e.touches[0];
      dragGhost.style.left = (touch.clientX - 32) + "px";
      dragGhost.style.top = (touch.clientY - 32) + "px";
    });
    btn.addEventListener("touchend", (e) => {
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    });
  });
  // Círculos de la V como drop targets
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`v-pos-${i+1}`);
    circle.addEventListener("dragover", (e) => {
      e.preventDefault();
      circle.setAttribute("stroke", "#1976d2");
    });
    circle.addEventListener("dragleave", (e) => {
      circle.setAttribute("stroke", "#6ec6ff");
    });
    circle.addEventListener("drop", (e) => {
      e.preventDefault();
      circle.setAttribute("stroke", "#6ec6ff");
      if (!draggingBtn) return;
      const num = Number(draggingBtn.dataset.num);
      if (magicVState.v[i] === null && magicVState.available.includes(num)) {
        magicVState.v[i] = num;
        magicVState.available = magicVState.available.filter(n => n !== num);
        renderMagicVBoard();
      }
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    });
    // Touch drop
    circle.addEventListener("touchmove", (e) => {
      if (!dragGhost) return;
      const touch = e.touches[0];
      dragGhost.style.left = (touch.clientX - 32) + "px";
      dragGhost.style.top = (touch.clientY - 32) + "px";
    });
    circle.addEventListener("touchend", (e) => {
      if (!draggingBtn) return;
      const num = Number(draggingBtn.dataset.num);
      if (magicVState.v[i] === null && magicVState.available.includes(num)) {
        magicVState.v[i] = num;
        magicVState.available = magicVState.available.filter(n => n !== num);
        renderMagicVBoard();
      }
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    });
  }
}


// --- Estado para la misión 1 (debe ir antes de cualquier uso)
let magicVState = {
  v: [null, null, null, null, null], // posiciones de la V
  available: [1, 2, 3, 4, 5],
  found: [], // lista de Magic V encontradas (array de arrays)
  fixedCore: null, // núcleo fijo para parte 2
  v2: [null, null, null, null, null], // para parte 2
  available2: [],
  found2: [] // para permutaciones
};

// --- Misión 1: Magic V ---
const parteAm1 = document.getElementById("parteAm1");
const parteBm1 = document.getElementById("parteBm1");
const magicVBoard = document.getElementById("magicVBoard");
const magicVButtons = document.getElementById("magicVButtons");
const magicVConfirmBtn = document.getElementById("magicVConfirmBtn");
const magicVResetBtn = document.getElementById("magicVResetBtn");
const magicVFeedback = document.getElementById("magicVFeedback");
const magicVTotalInput = document.getElementById("magicVTotalInput");
const magicVTotalCheckBtn = document.getElementById("magicVTotalCheckBtn");
const magicVTotalFeedback = document.getElementById("magicVTotalFeedback");
const magicVNextQ = document.getElementById("magicVNextQ");
const magicVBoard2 = document.getElementById("magicVBoard2");
const magicVButtons2 = document.getElementById("magicVButtons2");
const magicVActions2 = document.getElementById("magicVActions2");
const magicVSaveBtn = document.getElementById("magicVSaveBtn");
const magicVResetBtn2 = document.getElementById("magicVResetBtn2");
const magicVSaveFeedback = document.getElementById("magicVSaveFeedback");
const magicVFoundList = document.getElementById("magicVFoundList");

// Llamar a enableMagicVDragDrop después de renderizar los botones
if (parteAm1 && parteBm1) {
  renderMagicVBoard();
  enableMagicVDragDrop();
  // ...existing code...
}

function renderMagicVBoard() {
  // Renderiza los números en los círculos de la V usando SVG <text>
  const svg = magicVBoard.querySelector('svg');
  // Elimina textos previos
  svg.querySelectorAll('text.magicv-num').forEach(t => t.remove());
  // Coordenadas de los círculos
  const coords = [
    {x:210, y:250}, // v-pos-1
    {x:90,  y:70},  // v-pos-2
    {x:150, y:160}, // v-pos-3
    {x:270, y:160}, // v-pos-4
    {x:330, y:70}   // v-pos-5
  ];
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`v-pos-${i+1}`);
    circle.setAttribute("data-index", i);
    circle.style.cursor = magicVState.v[i] !== null ? "pointer" : "default";
    // Si hay número, dibuja el texto SVG
    if (magicVState.v[i] !== null) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', coords[i].x);
      t.setAttribute('y', coords[i].y + 8); // ajuste visual vertical
      t.setAttribute('class', 'magicv-num');
      t.textContent = magicVState.v[i];
      svg.appendChild(t);
    }
  }
  // Renderiza los botones disponibles
  Array.from(magicVButtons.children).forEach((btn, idx) => {
    const num = idx + 1;
    btn.disabled = !magicVState.available.includes(num);
  });
}

function resetMagicVBoard() {
  magicVState.v = [null, null, null, null, null];
  magicVState.available = [1,2,3,4,5];
  renderMagicVBoard();
  setMessage(magicVFeedback, "", "");
}

function handleMagicVButtonClick(e) {
  const num = Number(e.target.dataset.num);
  const emptyIdx = magicVState.v.findIndex(x => x === null);
  if (emptyIdx !== -1 && magicVState.available.includes(num)) {
    magicVState.v[emptyIdx] = num;
    magicVState.available = magicVState.available.filter(n => n !== num);
    renderMagicVBoard();
  }
}

function handleMagicVCircleClick(e) {
  const idx = Number(e.target.getAttribute("data-index"));
  const val = magicVState.v[idx];
  if (val !== null) {
    magicVState.v[idx] = null;
    magicVState.available.push(val);
    magicVState.available.sort((a,b)=>a-b);
    renderMagicVBoard();
  }
}

function isMagicV(arr) {
  // arr: [n1, n2, n3, n4, n5] en posiciones de la V
  // Brazos: [0,2,1] y [0,3,4]
  if (arr.some(x => x === null)) return false;
  const left = arr[0] + arr[2] + arr[1];
  const right = arr[0] + arr[3] + arr[4];
  return left === right;
}

function handleMagicVConfirm() {
  if (magicVState.v.some(x => x === null)) {
    setMessage(magicVFeedback, "Completa toda la V antes de confirmar.", "bad");
    return;
  }
  if (isMagicV(magicVState.v)) {
    setMessage(magicVFeedback, "¡Encontraste una Magic V!", "good");
    // Guardar y pasar a parteBm1
    magicVState.found = [magicVState.v.slice()];
    magicVState.fixedCore = magicVState.v[0];
    // Mostrar parte B inmediatamente
    parteAm1.style.display = "none";
    parteBm1.style.display = "block";
    setupMagicVPart2();
  } else {
    setMessage(magicVFeedback, "¿La suma de los brazos es igual?", "bad");
  }
}

// --- Parte 2: total mágico y permutaciones ---
function setupMagicVPart2() {
  magicVTotalInput.value = "";
  magicVTotalFeedback.textContent = "";
  magicVNextQ.style.display = "none";
  magicVBoard2.style.display = "none";
  magicVButtons2.style.display = "none";
  magicVActions2.style.display = "none";
  magicVFoundList.style.display = "none";
  magicVState.v2 = magicVState.found[0].slice();
  magicVState.available2 = [1,2,3,4,5].filter(n => n !== magicVState.fixedCore);
  renderMagicVBoard2();
  renderMagicVButtons2();
  renderMagicVFoundList();
}

function handleMagicVTotalCheck() {
  const val = Number(magicVTotalInput.value);
  const arr = magicVState.found[0];
  const total = arr[0] + arr[2] + arr[1];
  if (val === total) {
    setMessage(magicVTotalFeedback, "¡Correcto!", "good");
    magicVNextQ.style.display = "block";
    magicVBoard2.style.display = "block";
    magicVButtons2.style.display = "block";
    magicVActions2.style.display = "block";
    magicVFoundList.style.display = "block";
  } else {
    setMessage(magicVTotalFeedback, "Intenta de nuevo.", "bad");
  }
}

function renderMagicVBoard2() {
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`v2-pos-${i+1}`);
    circle.textContent = magicVState.v2[i] !== null ? magicVState.v2[i] : "";
    circle.setAttribute("data-index2", i);
    if (i === 0) {
      circle.style.fill = "#ffe680";
      circle.style.cursor = "not-allowed";
    } else {
      circle.style.fill = "#fff";
      circle.style.cursor = magicVState.v2[i] !== null ? "pointer" : "default";
    }
  }
}

function renderMagicVButtons2() {
  magicVButtons2.innerHTML = "";
  magicVState.available2.forEach(num => {
    const btn = document.createElement("button");
    btn.className = "v-num-btn2";
    btn.textContent = num;
    btn.dataset.num2 = num;
    btn.disabled = false;
    magicVButtons2.appendChild(btn);
  });
}

function handleMagicVButton2Click(e) {
  const num = Number(e.target.dataset.num2);
  const emptyIdx = magicVState.v2.findIndex((x,idx) => x === null && idx !== 0);
  if (emptyIdx !== -1 && magicVState.available2.includes(num)) {
    magicVState.v2[emptyIdx] = num;
    magicVState.available2 = magicVState.available2.filter(n => n !== num);
    renderMagicVBoard2();
    renderMagicVButtons2();
  }
}

function handleMagicVCircle2Click(e) {
  const idx = Number(e.target.getAttribute("data-index2"));
  if (idx === 0) return; // núcleo fijo
  const val = magicVState.v2[idx];
  if (val !== null) {
    magicVState.v2[idx] = null;
    magicVState.available2.push(val);
    magicVState.available2.sort((a,b)=>a-b);
    renderMagicVBoard2();
    renderMagicVButtons2();
  }
}

function isMagicV2(arr) {
  if (arr.some(x => x === null)) return false;
  const left = arr[0] + arr[2] + arr[1];
  const right = arr[0] + arr[3] + arr[4];
  return left === right;
}

function handleMagicVSave() {
  if (magicVState.v2.some(x => x === null)) {
    setMessage(magicVSaveFeedback, "Completa toda la V antes de guardar.", "bad");
    return;
  }
  if (!isMagicV2(magicVState.v2)) {
    setMessage(magicVSaveFeedback, "No es una Magic V.", "bad");
    return;
  }
  // Revisar si ya existe
  const exists = magicVState.found2.some(v => v.join('-') === magicVState.v2.join('-'));
  if (exists) {
    setMessage(magicVSaveFeedback, "Ya encontraste esta Magic V.", "bad");
    highlightFoundV(magicVState.v2);
    return;
  }
  magicVState.found2.push(magicVState.v2.slice());
  renderMagicVFoundList();
  setMessage(magicVSaveFeedback, "Magic V guardada.", "good");
  if (magicVState.found2.length >= 8) {
    setMessage(magicVSaveFeedback, "¡Has encontrado todas las permutaciones!", "good");
  }
}

function handleMagicVReset2() {
  magicVState.v2 = [magicVState.fixedCore, null, null, null, null];
  magicVState.available2 = [1,2,3,4,5].filter(n => n !== magicVState.fixedCore);
  renderMagicVBoard2();
  renderMagicVButtons2();
  setMessage(magicVSaveFeedback, "", "");
}

function renderMagicVFoundList() {
  magicVFoundList.innerHTML = "";
  magicVState.found2.forEach((v, idx) => {
    const mini = document.createElement("div");
    mini.className = "magicv-mini-v";
    mini.innerHTML = v.map((n,i) => `<span class='mini-v-num mini-v-num${i}'>${n}</span>`).join("");
    magicVFoundList.appendChild(mini);
  });
}

function highlightFoundV(arr) {
  // Ilumina la miniatura correspondiente
  const idx = magicVState.found2.findIndex(v => v.join('-') === arr.join('-'));
  if (idx !== -1) {
    const mini = magicVFoundList.children[idx];
    if (mini) {
      mini.style.background = "yellow";
      setTimeout(()=>{ mini.style.background = ""; }, 1000);
    }
  }
}

// --- Eventos ---
if (parteAm1 && parteBm1) {
  // Mostrar parteAm1 al abrir misión 1
  const mission1Screen = document.getElementById("mission1Screen");
  if (mission1Screen) {
    mission1Screen.addEventListener("show", () => {
      parteAm1.style.display = "block";
      parteBm1.style.display = "none";
      resetMagicVBoard();
    });
  }
  renderMagicVBoard();
  magicVButtons.addEventListener("click", function(e){
    if (e.target.classList.contains("v-num-btn")) handleMagicVButtonClick(e);
  });
  magicVBoard.addEventListener("click", function(e){
    if (e.target.tagName === "circle" && e.target.hasAttribute("data-index")) handleMagicVCircleClick(e);
  });
  magicVConfirmBtn.addEventListener("click", handleMagicVConfirm);
  magicVResetBtn.addEventListener("click", resetMagicVBoard);
  magicVTotalCheckBtn.addEventListener("click", handleMagicVTotalCheck);
  magicVButtons2.addEventListener("click", function(e){
    if (e.target.classList.contains("v-num-btn2")) handleMagicVButton2Click(e);
  });
  magicVBoard2.addEventListener("click", function(e){
    if (e.target.tagName === "circle" && e.target.hasAttribute("data-index2")) handleMagicVCircle2Click(e);
  });
  magicVSaveBtn.addEventListener("click", handleMagicVSave);
  magicVResetBtn2.addEventListener("click", handleMagicVReset2);
}
// Muestra solo la sección con el id dado y oculta las demás secciones principales
function showScreen(screenId) {
  const screens = document.querySelectorAll('.app-screen');
  screens.forEach(s => s.style.display = 'none');
  const target = document.getElementById(screenId);
  if (target) target.style.display = 'block';
  // Si se muestra el mapa, renderizar y sincronizar fog
  if (screenId === "mapScreen") {
    renderMap();
  }
}
// Convierte una cadena a formato título (primera letra de cada palabra en mayúscula)
function toTitle(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
// --- Inicialización simple de sessionData ---
function getInitialSessionData() {
  return {
    character: null,
    mission2: {
      current: {},
      saved: [],
      explorationUnlocked: false,
      audioSubmitted: false
    }
  };
}


let sessionData = getInitialSessionData();
// Parche defensivo: asegurar que missionsCompleted existe y es un array
if (!Array.isArray(sessionData.missionsCompleted)) {
  sessionData.missionsCompleted = [];
}

// Parche defensivo: asegurar que mission2 existe y tiene audioSubmitted
if (typeof sessionData.mission2 === 'undefined') {
  sessionData.mission2 = {
    current: {},
    saved: [],
    explorationUnlocked: false,
    audioSubmitted: false
  };
} 

// --- Misión 2: Audio y exploración ---
const mission2ExploracionBlock = document.getElementById("mission2ExploracionBlock");
const mission2AudioRecordBtn = document.getElementById("recordBtnA3M2Exploracion");
const mission2AudioStopBtn = document.getElementById("stopBtnA3M2Exploracion");
const mission2AudioSubmitBtn = document.getElementById("submitA3M2Exploracion");
const mission2AudioStatus = document.getElementById("statusA3M2Exploracion");

const mission2AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  submitting: false
};

function syncMission2AudioButtons() {
  if (!mission2AudioRecordBtn || !mission2AudioStopBtn || !mission2AudioSubmitBtn) return;
  const isRecording = Boolean(mission2AudioState.mediaRecorder && mission2AudioState.mediaRecorder.state === "recording");
  const hasAudio = Boolean(mission2AudioState.blob && mission2AudioState.blob.size > 0);
  const isLocked = sessionData.mission2.audioSubmitted || mission2AudioState.submitting;
  mission2AudioRecordBtn.style.display = isRecording ? "none" : "inline-flex";
  mission2AudioStopBtn.style.display = isRecording ? "inline-flex" : "none";
  mission2AudioRecordBtn.disabled = isLocked;
  mission2AudioStopBtn.disabled = !isRecording || isLocked;
  mission2AudioSubmitBtn.disabled = !hasAudio || isLocked;
}

function setupMission2AudioRecorder() {
  if (!mission2AudioRecordBtn || !mission2AudioStopBtn || !mission2AudioSubmitBtn || !mission2AudioStatus) return;
  syncMission2AudioButtons();
  mission2AudioRecordBtn.addEventListener("click", async () => {
    if (sessionData.mission2.audioSubmitted || mission2AudioState.submitting) return;
    try {
      const stream = await requestMission2AudioStream();
      const mediaRecorder = new MediaRecorder(stream);
      mission2AudioState.mediaRecorder = mediaRecorder;
      mission2AudioState.stream = stream;
      mission2AudioState.chunks = [];
      mission2AudioState.blob = null;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) mission2AudioState.chunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        mission2AudioState.blob = new Blob(mission2AudioState.chunks, {
          type: mission2AudioState.chunks[0]?.type || "audio/webm"
        });
        if (mission2AudioState.stream) mission2AudioState.stream.getTracks().forEach((track) => track.stop());
        mission2AudioState.stream = null;
        setMessage(mission2AudioStatus, "Audio listo para enviar.", "good");
        syncMission2AudioButtons();
      };
      mediaRecorder.start(250);
      setMessage(mission2AudioStatus, "Grabando...", "");
      syncMission2AudioButtons();
    } catch (error) {
      setMessage(mission2AudioStatus, "No se pudo acceder al micrófono. Revisa permisos e intenta de nuevo.", "bad");
      syncMission2AudioButtons();
    }
  });
  mission2AudioStopBtn.addEventListener("click", () => {
    const mediaRecorder = mission2AudioState.mediaRecorder;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try { mediaRecorder.requestData(); } catch (error) {}
      mediaRecorder.stop();
    }
  });
  mission2AudioSubmitBtn.addEventListener("click", () => { handleMission2AudioSubmit(); });
}

async function requestMission2AudioStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("getUserMedia no está disponible en este navegador");
  const preferredConstraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } };
  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints);
  } catch (error) {
    if (error?.name === "NotAllowedError") throw error;
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

async function handleMission2AudioSubmit() {
  if (sessionData.mission2.audioSubmitted || mission2AudioState.submitting) return;
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
    const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
    const basePath = buildMission2ExplorationStorageBasePath();
    const fileName = buildMission2ExplorationFileName();
    const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
    await uploadBytes(storageRef, mission2AudioState.blob, { contentType: mission2AudioState.blob.type || "audio/webm" });
    const audioURL = await getDownloadURL(storageRef);
    await addDoc(collection(db, "Actividad3"), {
      studentCode,
      // studentName eliminado,
      curso: studentInfo?.curso || "",
      isGuest: studentCode === "0000",
      tag: "A3M2Exploracion",
      componente: "2Exploración",
      storageBasePath: basePath,
      fileName: `${fileName}.webm`,
      audioURL,
    });
    sessionData.mission2.audioSubmitted = true;
    setMessage(mission2AudioStatus, "✅ Audio enviado correctamente.", "good");
    setMessage(magicVFeedback2, "Respuesta enviada. La misión 2 quedó completada.", "good");
    syncMission2AudioButtons();
    // completeMission eliminado
  } catch (error) {
    setMessage(mission2AudioStatus, "Error al guardar el audio. Revisa tu conexión e intenta de nuevo.", "bad");
  } finally {
    mission2AudioState.submitting = false;
    syncMission2AudioButtons();
  }
}

function unlockMission2Exploration() {
  sessionData.mission2.explorationUnlocked = true;
  syncMission2ExplorationState();
  if (!sessionData.mission2.audioSubmitted && !mission2AudioState.blob) {
    setMessage(mission2AudioStatus, "Cuando estés lista, graba tu respuesta y envíala.", "");
  }
}

function syncMission2ExplorationState() {
  if (!mission2ExploracionBlock) return;
  const allSumaVerificada = sessionData.mission2.saved.length === 3 && sessionData.mission2.saved.every(c => c.sumaMagica !== null);
  const shouldShow = sessionData.mission2.explorationUnlocked || allSumaVerificada || sessionData.mission2.audioSubmitted;
  sessionData.mission2.explorationUnlocked = shouldShow;
  mission2ExploracionBlock.classList.toggle("is-hidden", !shouldShow);
  syncMission2AudioButtons();
}

function buildMission2ExplorationStorageBasePath() {
  return "Actividad3/2ReglaGeneral";
}

function buildMission2ExplorationFileName() {
  if (studentCode === "0000") {
    // Invitado: nombre_2reglageneral
    const nombre = normalizeStorageSegment(studentInfo?.nombre || "invitado");
    return `${nombre}_2reglageneral`;
  } else {
    // Estudiante: código_curso_2reglageneral
    const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"));
    return `${studentCode}_${curso}_2reglageneral`;
  }
}

// Inicialización de eventos de exploración y audio para misión 2
if (mission2AudioRecordBtn && mission2AudioStopBtn && mission2AudioSubmitBtn) {
  setupMission2AudioRecorder();
}
if (mission2ExploracionBlock) {
  syncMission2ExplorationState();
}
// --- Misión 2: Chips, guardado y validación ---
const mission2SlotOrder = ["leftTop2", "rightTop2", "leftMid2", "rightMid2", "bottom2"];
const mission2ChipTray = document.getElementById("mission2ChipTray");
const mission2Drops = Array.from(document.querySelectorAll('.magicv-drop[data-slot$="2"]'));
const mission2SavedCount = document.getElementById("mission2SavedCount");
const mission2SavedList = document.getElementById("mission2SavedList");
const magicVFeedback2 = document.getElementById("magicVFeedback2");
const checkMagicVBtn2 = document.getElementById("checkMagicVBtn2");
const resetMagicVBtn2 = document.getElementById("resetMagicVBtn2");

if (!sessionData.mission2) {
  sessionData.mission2 = {
    current: createEmptyMission2Assignment(),
    saved: [],
    explorationUnlocked: false,
    audioSubmitted: false
  };
}

function createEmptyMission2Assignment() {
  return {
    leftTop2: null,
    rightTop2: null,
    leftMid2: null,
    rightMid2: null,
    bottom2: null
  };
}

function clearMission2Board(resetMessage) {
  mission2SlotOrder.forEach((slot) => {
    sessionData.mission2.current[slot] = null;
    const drop = mission2Drops.find((item) => item.dataset.slot === slot);
    if (drop) {
      drop.classList.remove("filled", "drop-target");
    }
  });
  const chips = Array.from(mission2ChipTray.querySelectorAll(".magicv-chip"));
  chips.forEach((chip) => {
    chip.dataset.slot = "";
    mission2ChipTray.appendChild(chip);
  });
  orderMission2TrayChips();
  saveSessionProgress();
  if (resetMessage) {
    setMessage(magicVFeedback2, "Tablero reiniciado.", "");
  }
}

function orderMission2TrayChips() {
  const chips = Array.from(mission2ChipTray.querySelectorAll(".magicv-chip"));
  chips.sort((a, b) => Number(a.dataset.value) - Number(b.dataset.value)).forEach((chip) => mission2ChipTray.appendChild(chip));
}

function renderMission2SavedCombinations() {
  mission2SavedCount.textContent = `${sessionData.mission2.saved.length}/3`;
  if (sessionData.mission2.saved.length === 0) {
    mission2SavedList.innerHTML = '<p class="magicv-saved-item-label">Aun no tienes combinaciones guardadas.</p>';
    return;
  }
  const rows = sessionData.mission2.saved.map((comb, index) => {
    const sumaCorrecta = comb.leftTop2 + comb.leftMid2 + comb.bottom2;
    const sumaCell = comb.sumaMagica !== null
      ? `<span class="magicv-suma-confirmed">✔ ${comb.sumaMagica}</span>`
      : `<div class="magicv-suma-input-group">
           <input class="magicv-suma-input" type="number" min="1" max="99" data-index="${index}" aria-label="Ingresa la suma mágica de la combinación ${index + 1}">
           <button class="magicv-suma-check btn btn-primary" data-index="${index}" type="button">Verificar</button>
           <span class="magicv-suma-error" id="sumaMagicaError2${index}"></span>
         </div>`;
    let permutacionesHtml = "";
    if (comb.permutaciones && comb.permutaciones.length > 0) {
      permutacionesHtml = `<div class="magicv-permutaciones-list">` +
        comb.permutaciones.map((perm) => `
          <div class="magicv-mini-board magicv-mini-board-permutacion">
            <span class="magicv-mini-dot" data-slot="leftTop2">${perm.leftTop2}</span>
            <span class="magicv-mini-dot" data-slot="rightTop2">${perm.rightTop2}</span>
            <span class="magicv-mini-dot" data-slot="leftMid2">${perm.leftMid2}</span>
            <span class="magicv-mini-dot" data-slot="rightMid2">${perm.rightMid2}</span>
            <span class="magicv-mini-dot" data-slot="bottom2">${perm.bottom2}</span>
          </div>`).join("") + `</div>`;
    }
    return `<tr>
      <td>
        <div class="magicv-saved-item-label">V válida ${index + 1}</div>
        <div class="magicv-v-group">
          <div class="magicv-mini-board">
            <span class="magicv-mini-dot" data-slot="leftTop2">${comb.leftTop2}</span>
            <span class="magicv-mini-dot" data-slot="rightTop2">${comb.rightTop2}</span>
            <span class="magicv-mini-dot" data-slot="leftMid2">${comb.leftMid2}</span>
            <span class="magicv-mini-dot" data-slot="rightMid2">${comb.rightMid2}</span>
            <span class="magicv-mini-dot" data-slot="bottom2">${comb.bottom2}</span>
          </div>
          ${permutacionesHtml}
        </div>
      </td>
      <td class="magicv-suma-cell">${sumaCell}</td>
    </tr>`;
  }).join("");
  mission2SavedList.innerHTML = `
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

function verificarSumaMagica2(index) {
  const comb = sessionData.mission2.saved[index];
  if (!comb || comb.sumaMagica !== null) return;
  const input = mission2SavedList.querySelector(`.magicv-suma-input[data-index="${index}"]`);
  const errorSpan = document.getElementById(`sumaMagicaError2${index}`);
  const ingresado = parseInt(input.value, 10);
  if (isNaN(ingresado) || input.value.trim() === "") {
    errorSpan.textContent = "Ingresa un número.";
    return;
  }
  const sumaCorrecta = comb.leftTop2 + comb.leftMid2 + comb.bottom2;
  if (ingresado === sumaCorrecta) {
    comb.sumaMagica = ingresado;
    saveSessionProgress();
    renderMission2SavedCombinations();
  } else {
    errorSpan.textContent = "Verifica tu respuesta.";
    input.value = "";
    input.focus();
  }
}

function startMission2ChipDrag(event) {
  const chip = event.target.closest(".magicv-chip");
  if (!chip) return;
  event.preventDefault();
  mission2DragState.active = true;
  mission2DragState.pointerId = event.pointerId;
  mission2DragState.chip = chip;
  mission2DragState.originSlot = chip.dataset.slot || null;
  mission2DragState.hoverDrop = null;
  mission2DragState.hoverTray = false;
  chip.classList.add("dragging");
  const ghost = document.createElement("div");
  ghost.className = "magicv-chip-ghost";
  ghost.textContent = chip.dataset.value;
  document.body.appendChild(ghost);
  mission2DragState.ghost = ghost;
  moveMission2ChipGhost(event.clientX, event.clientY);
}

function moveMission2ChipGhost(clientX, clientY) {
  if (!mission2DragState.ghost) return;
  mission2DragState.ghost.style.left = `${clientX}px`;
  mission2DragState.ghost.style.top = `${clientY}px`;
}

function handleMission2ChipMove(event) {
  if (!mission2DragState.active || event.pointerId !== mission2DragState.pointerId) return;
  event.preventDefault();
  moveMission2ChipGhost(event.clientX, event.clientY);
  updateMission2DropHover(event.clientX, event.clientY);
}

function updateMission2DropHover(clientX, clientY) {
  const targetDrop = document.elementFromPoint(clientX, clientY)?.closest('.magicv-drop[data-slot$="2"]');
  const hoverTray = Boolean(document.elementFromPoint(clientX, clientY)?.closest("#mission2ChipTray"));
  mission2Drops.forEach((drop) => drop.classList.remove("drop-target"));
  mission2ChipTray.classList.remove("tray-target");
  mission2DragState.hoverDrop = targetDrop;
  mission2DragState.hoverTray = hoverTray;
  if (targetDrop) targetDrop.classList.add("drop-target");
  if (hoverTray) mission2ChipTray.classList.add("tray-target");
}

function handleMission2ChipDrop(event) {
  if (!mission2DragState.active || event.pointerId !== mission2DragState.pointerId) return;
  event.preventDefault();
  const chip = mission2DragState.chip;
  const targetDrop = document.elementFromPoint(event.clientX, event.clientY)?.closest('.magicv-drop[data-slot$="2"]');
  const droppedInTray = Boolean(document.elementFromPoint(event.clientX, event.clientY)?.closest("#mission2ChipTray"));
  if (targetDrop) {
    assignChipToDrop2(chip, targetDrop);
  } else if (droppedInTray) {
    sendChipToTray2(chip);
  }
  cleanupMission2Drag();
}

function assignChipToDrop2(chip, targetDrop) {
  const targetSlot = targetDrop.dataset.slot;
  const currentSlot = chip.dataset.slot || null;
  if (currentSlot && currentSlot !== targetSlot) clearMission2Slot(currentSlot);
  const existingChip = targetDrop.querySelector(".magicv-chip");
  if (existingChip && existingChip !== chip) sendChipToTray2(existingChip);
  targetDrop.appendChild(chip);
  chip.dataset.slot = targetSlot;
  sessionData.mission2.current[targetSlot] = Number(chip.dataset.value);
  targetDrop.classList.add("filled");
}

function sendChipToTray2(chip) {
  const currentSlot = chip.dataset.slot || null;
  if (currentSlot) clearMission2Slot(currentSlot);
  chip.dataset.slot = "";
  mission2ChipTray.appendChild(chip);
  orderMission2TrayChips();
}

function clearMission2Slot(slot) {
  const drop = mission2Drops.find((item) => item.dataset.slot === slot);
  if (!drop) return;
  sessionData.mission2.current[slot] = null;
  drop.classList.remove("filled");
}

function cleanupMission2Drag() {
  if (mission2DragState.chip) mission2DragState.chip.classList.remove("dragging");
  if (mission2DragState.ghost) mission2DragState.ghost.remove();
  mission2Drops.forEach((drop) => drop.classList.remove("drop-target"));
  mission2ChipTray.classList.remove("tray-target");
  mission2DragState.active = false;
  mission2DragState.pointerId = null;
  mission2DragState.chip = null;
  mission2DragState.originSlot = null;
  mission2DragState.ghost = null;
  mission2DragState.hoverDrop = null;
  mission2DragState.hoverTray = false;
}

// Inicialización de eventos para misión 2
const mission2DragState = {
  active: false,
  pointerId: null,
  chip: null,
  originSlot: null,
  ghost: null,
  hoverDrop: null,
  hoverTray: false
};

if (mission2ChipTray && checkMagicVBtn2 && resetMagicVBtn2) {
  mission2ChipTray.addEventListener("pointerdown", startMission2ChipDrag);
  mission2Drops.forEach((drop) => {
    drop.addEventListener("pointerdown", startMission2ChipDrag);
  });
  window.addEventListener("pointermove", handleMission2ChipMove, { passive: false });
  window.addEventListener("pointerup", handleMission2ChipDrop);
  checkMagicVBtn2.addEventListener("click", () => {
    const current = sessionData.mission2.current;
    const hasMissing = mission2SlotOrder.some((slot) => current[slot] === null);
    if (hasMissing) {
      setMessage(magicVFeedback2, "Completa toda la V antes de comprobar.", "bad");
      return;
    }
    const leftArm = current.leftTop2 + current.leftMid2;
    const rightArm = current.rightTop2 + current.rightMid2;
    const valid = leftArm === rightArm;
    if (!valid) {
      setMessage(magicVFeedback2, "Verifica si la suma de los brazos es igual.", "bad");
      return;
    }
    const nucleo = current.bottom2;
    const brazos = [current.leftTop2, current.rightTop2, current.leftMid2, current.rightMid2];
    const sumaMagica = current.leftTop2 + current.leftMid2 + current.bottom2;
    let existente = sessionData.mission2.saved.find(item => item.nucleo === nucleo);
    if (existente) {
      const esExacta = existente.leftTop2 === current.leftTop2 && existente.rightTop2 === current.rightTop2 &&
        existente.leftMid2 === current.leftMid2 && existente.rightMid2 === current.rightMid2;
      if (esExacta) {
        setMessage(magicVFeedback2, "Esta Magic V ya está registrada.", "bad");
        return;
      }
      const brazosExistente = [existente.leftTop2, existente.rightTop2, existente.leftMid2, existente.rightMid2];
      const esPermutacion =
        brazos.slice().sort((a,b)=>a-b).join('-') === brazosExistente.slice().sort((a,b)=>a-b).join('-') &&
        sumaMagica === (existente.leftTop2 + existente.leftMid2 + existente.bottom2);
      if (esPermutacion) {
        if (!existente.permutaciones) existente.permutaciones = [];
        existente.permutaciones.push({ ...current });
        saveSessionProgress();
        setMessage(magicVFeedback2, `Esta Magic V es equivalente a la registrada con núcleo ${nucleo} porque la suma mágica es la misma.`, "good");
        renderMission2SavedCombinations();
        clearMission2Board(false);
        return;
      }
      setMessage(magicVFeedback2, "Esta Magic V ya tiene ese núcleo pero no es una permutación válida.", "bad");
      return;
    }
    if (sessionData.mission2.saved.length >= 3) {
      setMessage(magicVFeedback2, "Ya registraste las 3 combinaciones validas. Responde la pregunta por audio para cerrar la misión.", "good");
      return;
    }
    sessionData.mission2.saved.push({ ...current, sumaMagica: null, nucleo, permutaciones: [] });
    saveSessionProgress();
    renderMission2SavedCombinations();
    clearMission2Board(false);
    if (sessionData.mission2.saved.length === 3) {
      setMessage(magicVFeedback2, "Excelente. Ya encontraste 3 combinaciones válidas distintas. Ahora responde la pregunta por audio.", "good");
      return;
    }
    const missing = 3 - sessionData.mission2.saved.length;
    setMessage(magicVFeedback2, `Combinacion guardada. Te faltan ${missing} combinaciones validas.`, "good");
  });
  resetMagicVBtn2.addEventListener("click", () => {
    clearMission2Board(false);
    setMessage(magicVFeedback2, "Tablero reiniciado. Tus combinaciones guardadas siguen intactas.", "");
  });
  mission2SavedList.addEventListener("click", (e) => {
    const btn = e.target.closest(".magicv-suma-check");
    if (!btn) return;
    verificarSumaMagica2(Number(btn.dataset.index));
  });
  mission2SavedList.addEventListener("keydown", (e) => {
    const input = e.target.closest(".magicv-suma-input");
    if (!input || e.key !== "Enter") return;
    verificarSumaMagica2(Number(input.dataset.index));
  });
  renderMission2SavedCombinations();
  clearMission2Board(false);
}
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


init();

function init() {
  setupEntryFlow();
  setupIntroductionScreen();
  setupCharacterMission();
  setupMap();
  setupGuideDragAndDrop();
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
    showScreen("introductionScreen");
  });

// Botón para continuar desde la leyenda a la selección de animal guía
const continueToCharacterBtn = document.getElementById("continueToCharacterBtn");
if (continueToCharacterBtn) {
  continueToCharacterBtn.addEventListener("click", () => {
    showScreen("characterMissionScreen");
  });
}
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
    // Oculta toda la caja de la introducción
    const introScreen = document.getElementById("introductionScreen");
    if (introScreen) {
      introScreen.style.display = "none";
    }
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
    hydrateGuideBadges();
    renderMap();
    // Oculta la pantalla de selección de personaje
    const characterScreen = document.getElementById("characterMissionScreen");
    if (characterScreen) {
      characterScreen.style.display = "none";
    }
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
  // Oculta el mapa antes de mostrar la misión
  const mapScreen = document.getElementById("mapScreen");
  if (mapScreen) mapScreen.style.display = "none";
  showScreen(`mission${mission}Screen`);
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

// Muestra el animal guía seleccionado en el badge del mapa
function hydrateGuideBadges() {
  if (!guideBadge || !sessionData.character) {
    guideBadge.innerHTML = "";
    return;
  }
  guideBadge.innerHTML = `
    <div class="guide-dragger" title="${sessionData.character.name}">
      <img src="${sessionData.character.image}" alt="${sessionData.character.name}" class="guide-badge-img">
    </div>
    <span class="guide-badge-name">${sessionData.character.name}</span>
  `;
}

// Renderiza el badge del guía en todos los contenedores de misión
function renderGuideBadgeInMissions() {
  const badgeHtml = sessionData.character ? `
    <div class="guide-dragger" title="${sessionData.character.name}">
      <img src="${sessionData.character.image}" alt="${sessionData.character.name}" class="guide-badge-img">
    </div>
    <span class="guide-badge-name">${sessionData.character.name}</span>
  ` : "";
  for (let i = 1; i <= 5; i++) {
    const inline = document.getElementById(`guideInlineMission${i}`);
    if (inline) inline.innerHTML = badgeHtml;
  }
}

// Modificar hydrateGuideBadges para que también actualice en misiones
const originalHydrateGuideBadges = hydrateGuideBadges;
hydrateGuideBadges = function() {
  originalHydrateGuideBadges();
  renderGuideBadgeInMissions();
};



