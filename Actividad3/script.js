// ===============================
// MODAL MAGIC V GUARDADAS
// ===============================
function setupMagicVSavedModal() {
  const modal = document.getElementById("magicVSavedModal");
  const closeBtn = document.getElementById("closeMagicVSavedModal");
  const content = document.getElementById("magicVSavedModalContent");

  if (!modal || !closeBtn || !content) return;

  const btns = [
    document.getElementById("showMagicVSavedBtn"),
    document.getElementById("showMagicVSavedBtn2"),
    document.getElementById("showMagicVSavedBtn3"),
    document.getElementById("showMagicVSavedBtn4"),
    document.getElementById("showMagicVSavedBtn5")
  ].filter(Boolean);

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      content.innerHTML = '<p class="magicv-saved-item-label">Funcionalidad deshabilitada.</p>';
      modal.style.display = "block";
    });
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// ===============================
// SESSION DATA
// ===============================
function createEmptyMission1Assignment() {
  return {
    leftTop: null,
    rightTop: null,
    leftMid: null,
    rightMid: null,
    bottom: null
  };
}

function getInitialSessionData() {
  try {
    const saved = sessionStorage.getItem("actividad3_sessionData");
    if (saved) {
      const parsed = JSON.parse(saved);
      return Object.assign(
        {
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
        },
        parsed,
        {
          mission1: Object.assign(
            {
              current: createEmptyMission1Assignment(),
              saved: [],
              explorationUnlocked: false,
              audioSubmitted: false
            },
            parsed.mission1 || {}
          )
        }
      );
    }
  } catch (error) {
    console.warn("No se pudo leer sessionStorage:", error);
  }

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

function saveSessionProgress() {
  try {
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
  } catch (error) {
    console.warn("No se pudo guardar sessionStorage:", error);
  }
}

// ===============================
// CONSTANTES Y REFERENCIAS DOM
// ===============================
const TOTAL_MISSIONS = 5;

let studentCode = "";
let studentInfo = null;
let introCurrentStep = 0;
let mapVoronoiOwnerByPixel = null;
let mapResizeFrame = null;

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

const mapRevealProgress = Object.fromEntries(
  mapMissionAnchors.map((mission) => [mission.id, 0])
);

const mapAnimatingMissions = new Set();

// ===============================
// INIT
// ===============================
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
  setupBackToMapButtons();
  setupMagicVSavedModal();
}

// ===============================
// ENTRY FLOW
// ===============================
function setupEntryFlow() {
  if (!studentCodeInput || !enterBtn) return;

  studentCodeInput.addEventListener("keydown", (event) => {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End"
    ];

    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;

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

  confirmNoBtn?.addEventListener("click", () => {
    confirmContainer.style.display = "none";
    welcomeContainer.style.display = "flex";
    studentCodeInput.focus();
  });

  confirmYesBtn?.addEventListener("click", () => {
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
      setMessage(
        welcomeError,
        "Para continuar como invitado debes escribir tu nombre.",
        "bad"
      );
      return;
    }

    studentCode = code;
    studentInfo = {
      nombre: guestName,
      apellidos: "",
      curso: "INVITADO"
    };

    confirmationQuestion.textContent = `Eres ${toTitle(guestName)}?`;
    setMessage(welcomeError, "", "");
    welcomeContainer.style.display = "none";
    confirmContainer.style.display = "flex";
    return;
  }

  const estudiante = (window.estudiantesData || {})[code];

  if (!estudiante) {
    setMessage(
      welcomeError,
      "Codigo no encontrado. Verifica que este bien escrito.",
      "bad"
    );
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

// ===============================
// INTRODUCCIÓN
// ===============================
function setupIntroductionScreen() {
  setIntroStep(0);

  introNextStep1Btn?.addEventListener("click", () => setIntroStep(1));
  introNextStep2Btn?.addEventListener("click", () => setIntroStep(2));

  startIntroBtn?.addEventListener("click", () => {
    registerTimestamp("introductionViewed");
    showScreen("characterMissionScreen");
  });
}

function setIntroStep(stepIndex) {
  if (!introSteps.length) return;

  introCurrentStep = Math.max(0, Math.min(stepIndex, introSteps.length - 1));

  introSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === introCurrentStep);
  });
}

// ===============================
// PERSONAJES
// ===============================
function setupCharacterMission() {
  if (!characterGrid) return;

  characterGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".character-card");
    if (!card) return;

    document
      .querySelectorAll(".character-card")
      .forEach((item) => item.classList.remove("selected"));

    card.classList.add("selected");

    sessionData.character = {
      id: card.dataset.character,
      name: card.dataset.name,
      image: card.dataset.image
    };

    saveSessionProgress();
    setMessage(
      characterStatus,
      `${sessionData.character.name} sera tu guia en Numetrix.`,
      "good"
    );

    if (confirmCharacterBtn) {
      confirmCharacterBtn.disabled = false;
    }
  });

  confirmCharacterBtn?.addEventListener("click", () => {
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

// ===============================
// MAPA
// ===============================
function setupMap() {
  missionNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const mission = Number(node.dataset.mission);
      const currentMission = getCurrentAvailableMission();

      if (mission === currentMission) {
        openMission(mission);
      } else if (sessionData.missionsCompleted.includes(mission)) {
        setMessage(mapHint, `La mision ${mission} ya fue completada.`, "good");
      } else {
        setMessage(
          mapHint,
          "Completa una mision para desbloquear la siguiente.",
          "bad"
        );
      }
    });
  });

  window.addEventListener("resize", queueMapFogResize);
}

function getCurrentAvailableMission() {
  const nextMission = sessionData.progress;

  if (!nextMission || nextMission > TOTAL_MISSIONS) return null;
  if (sessionData.missionsCompleted.includes(nextMission)) return null;

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
      if (stateSpan) {
        stateSpan.textContent = "⭐";
        stateSpan.setAttribute("aria-label", "Mision completada");
      }
      return;
    }

    if (mission === currentMission) {
      node.classList.add("available");
      if (stateSpan) {
        stateSpan.textContent = "⭐";
        stateSpan.setAttribute("aria-label", "Mision desbloqueada");
      }
      return;
    }

    node.classList.add("locked");
    if (stateSpan) {
      stateSpan.textContent = "🔒";
      stateSpan.setAttribute("aria-label", "Mision bloqueada");
    }
  });

  const done = sessionData.missionsCompleted.length;

  if (done === TOTAL_MISSIONS) {
    setMessage(
      mapHint,
      "Laboratorio reiniciado. Todas las misiones estan completadas.",
      "good"
    );
  } else {
    setMessage(
      mapHint,
      `Misiones completadas: ${done}/${TOTAL_MISSIONS}. Haz clic en la mision disponible para abrirla.`,
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
  if (!mapStage || !mapFogCanvas || !mapGlowCanvas) return false;

  const width = Math.round(mapStage.clientWidth);
  const height = Math.round(mapStage.clientHeight);

  if (!width || !height) return false;

  const needsResize =
    mapFogCanvas.width !== width || mapFogCanvas.height !== height;

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
  if (!ensureMapFogCanvases()) return;

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
  if (!ensureMapFogCanvases()) return;

  const width = mapGlowCanvas.width;
  const height = mapGlowCanvas.height;
  const context = mapGlowCanvas.getContext("2d");
  context.clearRect(0, 0, width, height);

  mapMissionAnchors.forEach((mission) => {
    const progress = mapRevealProgress[mission.id] || 0;
    if (progress <= 0) return;

    const centerX = (mission.left / 100) * width;
    const centerY = (mission.top / 100) * height;
    const radius = 72 + (progress * (width * 0.18));
    const alpha = progress * 0.24;
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );

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
  if (!ensureMapFogCanvases()) return;

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
    animateMapReveal(mission.id);
  });

  drawMapFog();
  drawMapGlow();
}

// ===============================
// UTILIDADES GENERALES
// ===============================
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
  sessionData.progress = Math.min(
    TOTAL_MISSIONS,
    Math.max(sessionData.progress, missionNumber + 1)
  );

  saveSessionProgress();
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

  if (id === "mapScreen") {
    window.requestAnimationFrame(() => {
      ensureMapFogCanvases();
      syncMapFogWithProgress();
    });
  }
}

function hydrateGuideBadges() {
  if (!sessionData.character) return;

  const mapGuideHtml = `
    <span>Guia: ${sessionData.character.name}</span>
  `;

  const inlineGuideHtml = `
    <img src="${sessionData.character.image}" alt="${sessionData.character.name}">
    <span>Guia: ${sessionData.character.name}</span>
  `;

  if (guideBadge) {
    guideBadge.innerHTML = mapGuideHtml;
  }

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
  saveSessionProgress();
}

function setMessage(target, text, mode) {
  if (!target) return;

  target.textContent = text;
  target.classList.remove("good", "bad");

  if (mode === "good") {
    target.classList.add("good");
  }

  if (mode === "bad") {
    target.classList.add("bad");
  }
}

function toTitle(text) {
  return String(text || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ===============================
// MISIÓN 1 COMPLETA (NUEVA)
// ===============================

function setupMission1() {

  // ===== ELEMENTOS =====
  const momentoA = document.getElementById("m1-momentoA");
  const momentoB = document.getElementById("m1-momentoB");
  const momentoC = document.getElementById("m1-momentoC");

  // A
  const boardA = document.getElementById("magicvBoardA");
  const trayA = document.getElementById("mission1ChipTrayA");
  const checkA = document.getElementById("checkMagicVBtnA");
  const resetA = document.getElementById("resetMagicVBtnA");
  const feedbackA = document.getElementById("magicVFeedbackA");

  // B
  const boardB = document.getElementById("magicvBoardB");
  const inputTotal = document.getElementById("magicVTotalInput");
  const feedbackB = document.getElementById("magicVTotalFeedback");

  // C
  const boardC = document.getElementById("magicvBoardC");
  const trayC = document.getElementById("mission1ChipTrayC");
  const checkC = document.getElementById("checkMagicVBtnC");
  const resetC = document.getElementById("resetMagicVBtnC");
  const feedbackC = document.getElementById("magicVFeedbackC");

  const savedList = document.getElementById("mission1SavedListC");
  const savedCount = document.getElementById("mission1SavedCountC");
  const finalBlock = document.getElementById("magicVFinalBlock");

  // AUDIO
  const recordBtn = document.getElementById("recordBtnA3M1Exploracion");
  const stopBtn = document.getElementById("stopBtnA3M1Exploracion");
  const submitBtn = document.getElementById("submitA3M1Exploracion");
  const status = document.getElementById("statusA3M1Exploracion");

  // ===== ESTADO =====
  let V_inicial = null;
  let nucleo = null;
  let totalMagico = null;

  let soluciones = [];
  let serials = new Set();

  const slots = ["leftTop","rightTop","leftMid","rightMid","bottom"];

  // ===============================
  // UTILIDADES
  // ===============================

  function getValues(board) {
    const vals = {};
    slots.forEach(s => {
      const el = board.querySelector(`[data-slot="${s}"]`);
      vals[s] = el && el.textContent ? Number(el.textContent) : null;
    });
    return vals;
  }

  function setBoard(board, vals, lockNucleo=false) {
    slots.forEach(s => {
      const el = board.querySelector(`[data-slot="${s}"]`);
      if (!el) return;

      if (lockNucleo && s==="bottom") {
        el.textContent = vals[s];
        el.classList.add("nucleo-fijo");
      } else {
        el.textContent = vals[s] ?? "";
        el.classList.remove("nucleo-fijo");
      }
    });
  }

  function clearBoard(board, lock=false) {
    slots.forEach(s => {
      const el = board.querySelector(`[data-slot="${s}"]`);
      if (!el) return;

      if (lock && s==="bottom") return;
      el.textContent = "";
    });
  }

  function setTray(tray, nums) {
    tray.innerHTML = "";
    nums.forEach(n=>{
      const b = document.createElement("button");
      b.className="magicv-chip";
      b.textContent=n;
      b.dataset.value=n;
      tray.appendChild(b);
    });
  }

  function isMagicV(v){
    if(slots.some(s=>v[s]==null)) return false;
    return (v.leftTop+v.leftMid+v.bottom) === (v.rightTop+v.rightMid+v.bottom);
  }

  function serial(v){
    return slots.map(s=>v[s]).join("-");
  }

  function total(v){
    return v.leftTop+v.leftMid+v.bottom;
  }

  // ===============================
  // MOMENTO A
  // ===============================

  function initA(){
    clearBoard(boardA);
    setTray(trayA,[1,2,3,4,5]);
    feedbackA.textContent="";

    trayA.onclick=e=>{
      if(!e.target.classList.contains("magicv-chip")) return;
      for(const s of slots){
        const el=boardA.querySelector(`[data-slot="${s}"]`);
        if(!el.textContent){
          el.textContent=e.target.textContent;
          e.target.remove();
          break;
        }
      }
    };

    boardA.onclick=e=>{
      if(!e.target.textContent) return;
      const val=e.target.textContent;
      e.target.textContent="";
      setTray(trayA,[...getTrayVals(trayA),Number(val)]);
    };

    checkA.onclick=()=>{
      const v=getValues(boardA);

      if(!isMagicV(v)){
        feedbackA.textContent="No es Magic V";
        return;
      }

      V_inicial={...v};
      nucleo=v.bottom;
      totalMagico=total(v);

      feedbackA.textContent="✔ Correcto";

      setTimeout(()=>{
        momentoA.style.display="none";
        initB();
        momentoB.style.display="block";
      },800);
    };

    resetA.onclick=initA;
  }

  function getTrayVals(tray){
    return [...tray.querySelectorAll(".magicv-chip")].map(b=>Number(b.dataset.value));
  }

  // ===============================
  // MOMENTO B
  // ===============================

  function initB(){
    setBoard(boardB,V_inicial);

    inputTotal.value="";
    feedbackB.textContent="";

    inputTotal.oninput=()=>{
      const val=Number(inputTotal.value);

      if(val===totalMagico){
        feedbackB.textContent="✔ Correcto";

        setTimeout(()=>{
          momentoB.style.display="none";
          initC();
          momentoC.style.display="block";
        },800);
      }else{
        feedbackB.textContent="Revisa";
      }
    };
  }

  // ===============================
  // MOMENTO C
  // ===============================

  function initC(){

    // tablero
    setBoard(boardC,{bottom:nucleo},true);

    // fichas
    const restantes=[1,2,3,4,5].filter(n=>n!==nucleo);
    setTray(trayC,restantes);

    soluciones=[];
    serials=new Set();

    updateSaved();

    trayC.onclick=e=>{
      if(!e.target.classList.contains("magicv-chip")) return;

      for(const s of slots){
        if(s==="bottom") continue;
        const el=boardC.querySelector(`[data-slot="${s}"]`);
        if(!el.textContent){
          el.textContent=e.target.textContent;
          e.target.remove();
          break;
        }
      }
    };

    boardC.onclick=e=>{
      if(!e.target.textContent || e.target.dataset.slot==="bottom") return;

      const val=e.target.textContent;
      e.target.textContent="";
      setTray(trayC,[...getTrayVals(trayC),Number(val)]);
    };

    checkC.onclick=()=>{
      const v=getValues(boardC);

      if(!isMagicV(v)){
        feedbackC.textContent="No válida";
        return;
      }

      const s=serial(v);

      if(serials.has(s)){
        feedbackC.textContent="Repetida";
        return;
      }

      soluciones.push(v);
      serials.add(s);

      feedbackC.textContent="✔ Guardada";

      updateSaved();

      if(soluciones.length===8){
        finalBlock.style.display="block";
      }
    };

    resetC.onclick=()=>initC();
  }

  function updateSaved(){
    savedCount.textContent=`${soluciones.length}/8`;

    savedList.innerHTML=soluciones.map(v=>
      `<div class="miniV">${serial(v)}</div>`
    ).join("");
  }

  // ===============================
  // AUDIO
  // ===============================

  let recorder, chunks=[];

  recordBtn.onclick=async()=>{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    recorder=new MediaRecorder(stream);

    recorder.ondataavailable=e=>chunks.push(e.data);

    recorder.onstop=()=>{
      const blob=new Blob(chunks,{type:"audio/webm"});
      submitBtn.disabled=false;
      status.textContent="Listo";
      chunks=[];
    };

    recorder.start();
    recordBtn.disabled=true;
    stopBtn.disabled=false;
    status.textContent="Grabando...";
  };

  stopBtn.onclick=()=>{
    recorder.stop();
    recordBtn.disabled=false;
    stopBtn.disabled=true;
  };

  submitBtn.onclick=()=>{
    status.textContent="Enviado ✔";
    completeMission(1);
  };

  // ===============================
  // INICIO
  // ===============================
  initA();
  momentoA.style.display="block";
  momentoB.style.display="none";
  momentoC.style.display="none";
  finalBlock.style.display="none";
}

// activar automáticamente
document.addEventListener("DOMContentLoaded",()=>{
  if(document.getElementById("mission1Screen")){
    setupMission1();
  }
});


// ===============================
// MISIÓN 2 (ANTIGUA MISIÓN 1)
// ===============================

function setupMission2() {

  const slots = ["leftTop","rightTop","leftMid","rightMid","bottom"];

  const tray = document.getElementById("mission2ChipTray");
  const drops = Array.from(document.querySelectorAll("#mission2Screen .magicv-drop"));

  const checkBtn = document.getElementById("checkMagicVBtnM2");
  const resetBtn = document.getElementById("resetMagicVBtnM2");

  const savedList = document.getElementById("mission2SavedList");
  const savedCount = document.getElementById("mission2SavedCount");

  const feedback = document.getElementById("magicVFeedbackM2");

  const recordBtn = document.getElementById("recordBtnA3M2Exploracion");
  const stopBtn = document.getElementById("stopBtnA3M2Exploracion");
  const submitBtn = document.getElementById("submitA3M2Exploracion");
  const status = document.getElementById("statusA3M2Exploracion");

  // ===== SESSION =====
  if (!sessionData.mission2) {
    sessionData.mission2 = {
      current: createEmptyAssignment(),
      saved: [],
      explorationUnlocked: false,
      audioSubmitted: false
    };
  }

  // ===== UTILS =====
  function createEmptyAssignment() {
    return {
      leftTop:null,
      rightTop:null,
      leftMid:null,
      rightMid:null,
      bottom:null
    };
  }

  function isMagicV(v){
    return (v.leftTop+v.leftMid) === (v.rightTop+v.rightMid);
  }

  function serial(v){
    return slots.map(s=>v[s]).join("-");
  }

  function getValues(){
    const vals = {};
    slots.forEach(s=>{
      const el = document.querySelector(`#mission2Screen [data-slot="${s}"]`);
      vals[s] = el && el.textContent ? Number(el.textContent) : null;
    });
    return vals;
  }

  function clearBoard(){
    drops.forEach(d=>{
      d.textContent="";
      d.classList.remove("filled");
    });

    tray.innerHTML="";
    [1,2,3,4,5].forEach(n=>{
      const b=document.createElement("button");
      b.className="magicv-chip";
      b.textContent=n;
      b.dataset.value=n;
      tray.appendChild(b);
    });

    sessionData.mission2.current = createEmptyAssignment();
  }

  // ===== DRAG SIMPLE =====
  tray.onclick = e=>{
    if(!e.target.classList.contains("magicv-chip")) return;

    for(const d of drops){
      if(!d.textContent){
        d.textContent = e.target.textContent;
        sessionData.mission2.current[d.dataset.slot]=Number(e.target.textContent);
        d.classList.add("filled");
        e.target.remove();
        break;
      }
    }
  };

  drops.forEach(d=>{
    d.onclick = ()=>{
      if(!d.textContent) return;

      const val = d.textContent;
      d.textContent="";
      d.classList.remove("filled");

      sessionData.mission2.current[d.dataset.slot]=null;

      const b=document.createElement("button");
      b.className="magicv-chip";
      b.textContent=val;
      b.dataset.value=val;
      tray.appendChild(b);
    };
  });

  // ===== CHECK =====
  checkBtn.onclick = ()=>{
    const v = getValues();

    if(Object.values(v).includes(null)){
      feedback.textContent="Completa la V";
      return;
    }

    if(!isMagicV(v)){
      feedback.textContent="No es Magic V";
      return;
    }

    const s = serial(v);

    if(sessionData.mission2.saved.includes(s)){
      feedback.textContent="Repetida";
      return;
    }

    sessionData.mission2.saved.push(s);
    updateSaved();

    feedback.textContent="✔ Guardada";

    if(sessionData.mission2.saved.length===3){
      sessionData.mission2.explorationUnlocked=true;
      enableAudio();
    }

    clearBoard();
  };

  resetBtn.onclick = clearBoard;

  // ===== SAVE LIST =====
  function updateSaved(){
    savedCount.textContent = `${sessionData.mission2.saved.length}/3`;

    savedList.innerHTML = sessionData.mission2.saved.map(v=>
      `<div class="miniV">${v}</div>`
    ).join("");
  }

  // ===== AUDIO =====
  let recorder, chunks=[];

  function enableAudio(){
    status.textContent="Graba tu explicación";
    recordBtn.disabled=false;
  }

  recordBtn.onclick = async ()=>{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e=>chunks.push(e.data);

    recorder.onstop = ()=>{
      submitBtn.disabled=false;
      status.textContent="Audio listo";
    };

    recorder.start();
    recordBtn.disabled=true;
    stopBtn.disabled=false;
  };

  stopBtn.onclick = ()=>{
    recorder.stop();
    stopBtn.disabled=true;
  };

  submitBtn.onclick = ()=>{
    sessionData.mission2.audioSubmitted=true;
    completeMission(2);
  };

  // ===== INIT =====
  clearBoard();
  updateSaved();
}

// AUTO
document.addEventListener("DOMContentLoaded",()=>{
  if(document.getElementById("mission2Screen")){
    setupMission2();
  }
});