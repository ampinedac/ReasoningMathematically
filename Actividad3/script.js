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
  setupBackToMapButtons();
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

// Eliminada la función setupGuideDragAndDrop y toda la lógica de drag & drop






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


  const board = document.querySelector(boardSelector);
  if (!board) return;



      mediaRecorder.onstop = () => {
        mission1AudioState.blob = new Blob(mission1AudioState.chunks, {
          type: mission1AudioState.chunks[0]?.type || "audio/webm"
        });



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
  if (typeof mission1ExploracionBlock !== 'undefined' && mission1ExploracionBlock && typeof mission1ExploracionBlock.classList !== 'undefined') {
    // Solo mostrar si hay 3 combinaciones y todas tienen suma mágica verificada, o si ya se envió el audio
    const allSumaVerificada = sessionData.mission1.saved.length === 3 && sessionData.mission1.saved.every(c => c.sumaMagica !== null);
    const shouldShow = sessionData.mission1.explorationUnlocked || allSumaVerificada || sessionData.mission1.audioSubmitted;
    sessionData.mission1.explorationUnlocked = shouldShow;
    mission1ExploracionBlock.classList.toggle("is-hidden", !shouldShow);
    syncMission1AudioButtons();
  }
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




