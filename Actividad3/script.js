// === Audio misión 1: grabar/detener/enviar ===
const recordBtnA3M1Final = document.getElementById("recordBtnA3M1Final");
const submitBtnA3M1Final = document.getElementById("submitA3M1Final");
const statusA3M1Final = document.getElementById("statusA3M1Final");
const preguntasM1 = document.getElementById("preguntas");
const preguntaTextoM1 = document.getElementById("preguntaTexto");
const preguntaRespondidaBtnM1 = document.getElementById("preguntaRespondidaBtn");
const audioFinalBlockM1 = document.getElementById("audioFinalBlock");
const mission2FromM1Table = document.getElementById("mission2FromM1Table");
const mission2CoreValue = document.getElementById("mission2CoreValue");
const mission2CoreValueAudio = document.getElementById("mission2CoreValueAudio");
const mission2QuestionText = document.getElementById("mission2QuestionText");
const mission2QuestionNextBtn = document.getElementById("mission2QuestionNextBtn");
const mission2AudioBlock = document.getElementById("mission2AudioBlock");
const recordBtnA3M2Final = document.getElementById("recordBtnA3M2Final");
const submitBtnA3M2Final = document.getElementById("submitA3M2Final");
const statusA3M2Final = document.getElementById("statusA3M2Final");
const m2ExploreCuadernoDoneBtn = document.getElementById("m2ExploreCuadernoDoneBtn");
const m2Explore2CuadernoDoneBtn = document.getElementById("m2Explore2CuadernoDoneBtn");
const recordBtnA3M2Regla = document.getElementById("recordBtnA3M2Regla");
const submitBtnA3M2Regla = document.getElementById("submitA3M2Regla");
const statusA3M2Regla = document.getElementById("statusA3M2Regla");
let mediaRecorderA3M1 = null;
let audioChunksA3M1 = [];
let audioBlobA3M1 = null;
let isRecordingA3M1 = false;
let isSubmittingA3M1 = false;

const mission2FinalAudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  isRecording: false,
  isSubmitting: false,
};

const mission2ReglaAudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  isRecording: false,
  isSubmitting: false,
};

const mission2Questions = [
  "Mira la tabla que construiste en la misión pasada: ¿cómo sabes que las V que están ahí son diferentes entre sí?",
  "Si intentas hacer una nueva V, ¿cómo puedes saber si ya estaba en la tabla?",
  "Intenta construir una V mágica nueva que no esté en la tabla. ¿Qué pasa?"
];
const mission1Questions = [
  "¿Qué otra cosa tienen en común?",
  "¿Crees que el núcleo es especial? ¿Por qué?",
  "En la tabla, las V mágicas se organizaron de una forma particular ¿cuál es?"
];

function ensureMission1QuestionState() {
  if (!sessionData?.mission1) return;
  if (typeof sessionData.mission1.questionStep !== "number") {
    sessionData.mission1.questionStep = 0;
  }
  if (typeof sessionData.mission1.questionsCompleted !== "boolean") {
    sessionData.mission1.questionsCompleted = false;
  }
}

function renderMission1QuestionFlow() {
  if (!preguntasM1 || !preguntaTextoM1 || !preguntaRespondidaBtnM1 || !audioFinalBlockM1) return;
  ensureMission1QuestionState();
  preguntasM1.style.display = "block";
  if (sessionData?.mission1?.questionsCompleted) {
    preguntaTextoM1.innerHTML = mission1Questions
      .map((question, index) => `${index + 1}. ${question}`)
      .join("<br>");
    preguntaRespondidaBtnM1.style.display = "none";
    audioFinalBlockM1.style.display = "block";
    return;
  }
  const idx = Math.max(0, Math.min(sessionData?.mission1?.questionStep ?? 0, mission1Questions.length - 1));
  const visibleQuestions = mission1Questions.slice(0, idx + 1);
  preguntaTextoM1.innerHTML = visibleQuestions
    .map((question, index) => `${index + 1}. ${question}`)
    .join("<br>");
  preguntaRespondidaBtnM1.style.display = "inline-flex";
  audioFinalBlockM1.style.display = "none";
}

function handleMission1QuestionAnswered() {
  ensureMission1QuestionState();
  if (!sessionData?.mission1 || sessionData.mission1.questionsCompleted) return;
  if (sessionData.mission1.questionStep < mission1Questions.length - 1) {
    sessionData.mission1.questionStep += 1;
  } else {
    sessionData.mission1.questionsCompleted = true;
    setMessage(statusA3M1Final, "Ahora graba y envía tu audio.", "");
  }
  saveSessionProgress();
  saveProgressToFirestore();
  renderMission1QuestionFlow();
}

if (preguntaRespondidaBtnM1) {
  preguntaRespondidaBtnM1.addEventListener("click", handleMission1QuestionAnswered);
}

function getMission1CoreValue() {
  if (typeof magicVState?.fixedCore === "number") return magicVState.fixedCore;
  if (Array.isArray(magicVState?.found?.[0])) return magicVState.found[0][0];
  return "?";
}

function buildMission1ExactTableElement() {
  const table = document.createElement("table");
  table.className = "magicv-table-grid";

  if (!magicVState.found[0]) {
    for (let row = 0; row < 4; row++) {
      const tr = document.createElement("tr");
      for (let col = 0; col < 2; col++) {
        const td = document.createElement("td");
        td.className = "magicv-table-cell";
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }

  const expectedOrder = getExpectedMagicVTableOrder(magicVState.fixedCore);
  const foundVs = [magicVState.found[0], ...magicVState.found2];
  let idx = 0;

  for (let row = 0; row < 4; row++) {
    const tr = document.createElement("tr");
    for (let col = 0; col < 2; col++) {
      const td = document.createElement("td");
      td.className = "magicv-table-cell";
      if (idx < expectedOrder.length) {
        const v = expectedOrder[idx];
        const found = foundVs.find(arr => arr && arr.join("-") === v.join("-"));
        if (found) {
          td.appendChild(renderMagicVSVG(found));
        }
      }
      tr.appendChild(td);
      idx++;
    }
    table.appendChild(tr);
  }

  return table;
}

function renderMission2CoreScreen() {
  if (mission2FromM1Table) {
    mission2FromM1Table.innerHTML = "";
    mission2FromM1Table.appendChild(buildMission1ExactTableElement());
  }
  const coreValue = getMission1CoreValue();
  if (mission2CoreValue) mission2CoreValue.textContent = String(coreValue);
  if (mission2CoreValueAudio) mission2CoreValueAudio.textContent = String(coreValue);
  renderMission2QuestionFlow();
  const exploreBlock = document.getElementById("mission2ExploreBlock");
  if (exploreBlock) {
    if (sessionData?.mission2New?.audioSubmitted) {
      exploreBlock.style.display = "block";
      if (sessionData.mission2New.exploreConfirmed && Array.isArray(sessionData.mission2New.exploreV)) {
        magicVM2Explore.v = sessionData.mission2New.exploreV.slice();
        magicVM2Explore.available = [1, 2, 3, 4, 5].filter(n => !sessionData.mission2New.exploreV.includes(n));
      }
      renderM2ExploreBoard();
      const fb = document.getElementById("m2ExploreFeedback");
      if (fb && sessionData.mission2New.exploreConfirmed) {
        setMessage(fb, "¡Encontraste una V mágica con un núcleo diferente! 🎉", "good");
      }
      // Restaurar bloque de suma
      const sumBlock = document.getElementById("m2ExploreSumBlock");
      if (sumBlock && sessionData.mission2New.exploreConfirmed) {
        sumBlock.style.display = "block";
        const sumInput = document.getElementById("m2ExploreSumInput");
        const sumBtn = document.getElementById("m2ExploreSumCheckBtn");
        const sumFb = document.getElementById("m2ExploreSumFeedback");
        if (sessionData.mission2New.exploreSumCorrect) {
          const total = calcMagicVTotal(sessionData.mission2New.exploreV);
          if (sumInput) { sumInput.value = String(total); sumInput.disabled = true; }
          if (sumBtn) sumBtn.disabled = true;
          if (sumFb) setMessage(sumFb, "¡Correcto!", "good");
        }
      }
      const cuadernoBlock = document.getElementById("m2ExploreCuadernoBlock");
      if (cuadernoBlock && sessionData.mission2New.exploreSumCorrect) {
        cuadernoBlock.style.display = "block";
        const doneBtn = document.getElementById("m2ExploreCuadernoDoneBtn");
        if (doneBtn && sessionData.mission2New.cuadernoAnsweredAfterSum) doneBtn.disabled = true;
      }
      // Restaurar segundo tablero
      const block2 = document.getElementById("m2Explore2Block");
      if (block2 && sessionData.mission2New.cuadernoAnsweredAfterSum) {
        block2.style.display = "block";
        if (sessionData.mission2New.explore2Confirmed && Array.isArray(sessionData.mission2New.explore2V)) {
          magicVM2Explore2.v = sessionData.mission2New.explore2V.slice();
          magicVM2Explore2.available = [1, 2, 3, 4, 5].filter(n => !sessionData.mission2New.explore2V.includes(n));
        }
        setupM2Explore2Interaction();
        renderM2Explore2Board();
        const fb2 = document.getElementById("m2Explore2Feedback");
        if (fb2 && sessionData.mission2New.explore2Confirmed) {
          setMessage(fb2, "¡Excelente! Encontraste otra V mágica con un núcleo distinto. 🎉", "good");
        }
      }
      // Restaurar segundo cuaderno después de segunda V
      const cuadernoBlock2 = document.getElementById("m2Explore2CuadernoBlock");
      if (cuadernoBlock2 && sessionData.mission2New.explore2Confirmed) {
        cuadernoBlock2.style.display = "block";
        const doneBtn2 = document.getElementById("m2Explore2CuadernoDoneBtn");
        if (doneBtn2 && sessionData.mission2New.cuadernoAnsweredAfterExplore2) doneBtn2.disabled = true;
      }
      // Restaurar bloque final (audio y segunda pregunta)
      const finalBlock = document.getElementById("m2ExploreFinalBlock");
      if (finalBlock) {
        finalBlock.style.display = sessionData.mission2New.cuadernoAnsweredAfterExplore2 ? "block" : "none";
        if (sessionData.mission2New.cuadernoAnsweredAfterExplore2) {
          syncMission2ReglaAudioButtons();
        }
      }
      if (statusA3M2Regla && sessionData.mission2New.finalAudioSubmitted) {
        setMessage(statusA3M2Regla, "✅ Audio enviado correctamente.", "good");
      }
    } else {
      exploreBlock.style.display = "none";
    }
  }
  const finBtn = document.getElementById("finmision2");
  if (finBtn) {
    finBtn.style.display = sessionData?.mission2New?.finalAudioSubmitted ? "block" : "none";
    if (sessionData?.mission2New?.finalAudioSubmitted) setupFinMisionBtn(2);
  }
  if (statusA3M2Final && sessionData?.mission2New?.audioSubmitted) {
    setMessage(statusA3M2Final, "✅ Audio enviado correctamente.", "good");
  }
}

function ensureMission2QuestionState() {
  if (!sessionData?.mission2New) return;
  if (typeof sessionData.mission2New.questionStep !== "number") {
    sessionData.mission2New.questionStep = 0;
  }
  if (typeof sessionData.mission2New.questionsCompleted !== "boolean") {
    sessionData.mission2New.questionsCompleted = false;
  }
}

function renderMission2QuestionFlow() {
  if (!mission2QuestionText || !mission2QuestionNextBtn || !mission2AudioBlock) return;
  ensureMission2QuestionState();
  const submitted = Boolean(sessionData?.mission2New?.audioSubmitted);
  if (submitted) {
    mission2QuestionText.innerHTML = mission2Questions.map((q, i) => `${i + 1}. ${q}`).join("<br>");
    mission2QuestionNextBtn.style.display = "none";
    mission2AudioBlock.style.display = "grid";
    return;
  }
  const step = Math.max(0, Math.min(sessionData?.mission2New?.questionStep ?? 0, mission2Questions.length - 1));
  mission2QuestionText.innerHTML = mission2Questions.slice(0, step + 1).map((q, i) => `${i + 1}. ${q}`).join("<br>");
  if (sessionData?.mission2New?.questionsCompleted) {
    mission2QuestionNextBtn.style.display = "none";
    mission2AudioBlock.style.display = "grid";
  } else {
    mission2QuestionNextBtn.style.display = "inline-flex";
    mission2AudioBlock.style.display = "none";
  }
}

function handleMission2QuestionNext() {
  ensureMission2QuestionState();
  if (!sessionData?.mission2New || sessionData.mission2New.audioSubmitted) return;
  if (sessionData.mission2New.questionStep < mission2Questions.length - 1) {
    sessionData.mission2New.questionStep += 1;
  } else {
    sessionData.mission2New.questionsCompleted = true;
    if (statusA3M2Final) setMessage(statusA3M2Final, "Ahora graba y envía tu audio.", "");
  }
  saveSessionProgress();
  saveProgressToFirestore();
  renderMission2QuestionFlow();
}

if (mission2QuestionNextBtn) {
  mission2QuestionNextBtn.addEventListener("click", handleMission2QuestionNext);
}

// === Misión 2: Exploración nueva V con núcleo diferente ===
const magicVM2Explore = { v: [null, null, null, null, null], available: [1, 2, 3, 4, 5] };

function renderM2ExploreBoard() {
  const board = document.getElementById("magicVBoardM2");
  const btns = document.getElementById("magicVBtnsM2");
  if (!board) return;
  const svg = board.querySelector("svg");
  svg.querySelectorAll("text.magicv-num").forEach(t => t.remove());
  const coords = [
    {x: 210, y: 250}, {x: 90, y: 70}, {x: 150, y: 160}, {x: 270, y: 160}, {x: 330, y: 70}
  ];
  const locked = Boolean(sessionData?.mission2New?.exploreConfirmed);
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`m2v-pos-${i + 1}`);
    if (!circle) continue;
    circle.setAttribute("data-index", i);
    circle.style.cursor = (magicVM2Explore.v[i] !== null && !locked) ? "pointer" : "default";
    if (magicVM2Explore.v[i] !== null) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", coords[i].x);
      t.setAttribute("y", coords[i].y + 8);
      t.setAttribute("class", "magicv-num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "13");
      t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
      t.textContent = magicVM2Explore.v[i];
      svg.appendChild(t);
    }
  }
  if (btns) {
    Array.from(btns.children).forEach((btn, idx) => {
      btn.disabled = locked || !magicVM2Explore.available.includes(idx + 1);
    });
  }
  const confirmBtn = document.getElementById("m2ExploreConfirmBtn");
  const resetBtn = document.getElementById("m2ExploreResetBtn");
  if (confirmBtn) confirmBtn.disabled = locked;
  if (resetBtn) resetBtn.disabled = locked;
}

function calcMagicVTotal(arr) {
  // Left arm: arr[0] + arr[2] + arr[1]
  return arr[0] + arr[2] + arr[1];
}

function handleM2ExploreConfirm() {
  if (sessionData?.mission2New?.exploreConfirmed) return;
  const fb = document.getElementById("m2ExploreFeedback");
  if (magicVM2Explore.v.some(x => x === null)) {
    setMessage(fb, "Completa toda la V antes de confirmar.", "bad");
    return;
  }
  if (!isMagicV(magicVM2Explore.v)) {
    setMessage(fb, "Esta no es una V mágica, sigue intentando.", "bad");
    return;
  }
  const m1Core = getMission1CoreValue();
  if (magicVM2Explore.v[0] === m1Core) {
    setMessage(fb, `El núcleo de esta V es ${m1Core}, el mismo de la misión 1. Intenta con un núcleo diferente.`, "bad");
    return;
  }
  if (!sessionData.mission2New) sessionData.mission2New = {};
  sessionData.mission2New.exploreConfirmed = true;
  sessionData.mission2New.exploreV = magicVM2Explore.v.slice();
  setMessage(fb, "¡Encontraste una V mágica con un núcleo diferente! 🎉", "good");
  renderM2ExploreBoard();
  // Mostrar bloque de suma mágica
  const sumBlock = document.getElementById("m2ExploreSumBlock");
  if (sumBlock) sumBlock.style.display = "block";
  saveSessionProgress();
  saveProgressToFirestore();
}

function handleM2ExploreSumCheck() {
  const input = document.getElementById("m2ExploreSumInput");
  const fb = document.getElementById("m2ExploreSumFeedback");
  if (!input || !fb) return;
  const val = Number(input.value);
  const v = sessionData?.mission2New?.exploreV;
  if (!Array.isArray(v)) return;
  const correct = calcMagicVTotal(v);
  if (val === correct) {
    setMessage(fb, "¡Correcto!", "good");
    input.disabled = true;
    const checkBtn = document.getElementById("m2ExploreSumCheckBtn");
    if (checkBtn) checkBtn.disabled = true;
    sessionData.mission2New.exploreSumCorrect = true;
    saveSessionProgress();
    saveProgressToFirestore();
    const cuadernoBlock = document.getElementById("m2ExploreCuadernoBlock");
    if (cuadernoBlock && !sessionData.mission2New.cuadernoAnsweredAfterSum) {
      cuadernoBlock.style.display = "block";
    }
    if (sessionData.mission2New.cuadernoAnsweredAfterSum) {
      const block2 = document.getElementById("m2Explore2Block");
      if (block2) {
        block2.style.display = "block";
        setupM2Explore2Interaction();
        renderM2Explore2Board();
      }
    }
  } else {
    setMessage(fb, "Intenta de nuevo.", "bad");
  }
}

function handleM2ExploreCuadernoDone() {
  if (!sessionData?.mission2New || !sessionData.mission2New.exploreSumCorrect) return;
  sessionData.mission2New.cuadernoAnsweredAfterSum = true;
  const doneBtn = document.getElementById("m2ExploreCuadernoDoneBtn");
  if (doneBtn) doneBtn.disabled = true;
  const block2 = document.getElementById("m2Explore2Block");
  if (block2) {
    block2.style.display = "block";
    setupM2Explore2Interaction();
    renderM2Explore2Board();
  }
  saveSessionProgress();
  saveProgressToFirestore();
}

function handleM2Explore2CuadernoDone() {
  if (!sessionData?.mission2New || !sessionData.mission2New.explore2Confirmed) return;
  sessionData.mission2New.cuadernoAnsweredAfterExplore2 = true;
  const doneBtn2 = document.getElementById("m2Explore2CuadernoDoneBtn");
  if (doneBtn2) doneBtn2.disabled = true;
  const finalBlock = document.getElementById("m2ExploreFinalBlock");
  if (finalBlock) {
    finalBlock.style.display = "block";
    syncMission2ReglaAudioButtons();
  }
  saveSessionProgress();
  saveProgressToFirestore();
}

// === Misión 2: Segundo tablero de exploración ===
const magicVM2Explore2 = { v: [null, null, null, null, null], available: [1, 2, 3, 4, 5] };

function renderM2Explore2Board() {
  const board = document.getElementById("magicVBoardM2B");
  const btns = document.getElementById("magicVBtnsM2B");
  if (!board) return;
  const svg = board.querySelector("svg");
  svg.querySelectorAll("text.magicv-num").forEach(t => t.remove());
  const coords = [
    {x: 210, y: 250}, {x: 90, y: 70}, {x: 150, y: 160}, {x: 270, y: 160}, {x: 330, y: 70}
  ];
  const locked = Boolean(sessionData?.mission2New?.explore2Confirmed);
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`m2bv-pos-${i + 1}`);
    if (!circle) continue;
    circle.setAttribute("data-index2b", i);
    circle.style.cursor = (magicVM2Explore2.v[i] !== null && !locked) ? "pointer" : "default";
    if (magicVM2Explore2.v[i] !== null) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", coords[i].x);
      t.setAttribute("y", coords[i].y + 8);
      t.setAttribute("class", "magicv-num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "13");
      t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
      t.textContent = magicVM2Explore2.v[i];
      svg.appendChild(t);
    }
  }
  if (btns) {
    Array.from(btns.children).forEach((btn, idx) => {
      btn.disabled = locked || !magicVM2Explore2.available.includes(idx + 1);
    });
  }
  const confirmBtn = document.getElementById("m2Explore2ConfirmBtn");
  const resetBtn = document.getElementById("m2Explore2ResetBtn");
  if (confirmBtn) confirmBtn.disabled = locked;
  if (resetBtn) resetBtn.disabled = locked;
}

function handleM2Explore2Confirm() {
  if (sessionData?.mission2New?.explore2Confirmed) return;
  const fb = document.getElementById("m2Explore2Feedback");
  if (magicVM2Explore2.v.some(x => x === null)) {
    setMessage(fb, "Completa toda la V antes de confirmar.", "bad");
    return;
  }
  if (!isMagicV(magicVM2Explore2.v)) {
    setMessage(fb, "Esta no es una V mágica, sigue intentando.", "bad");
    return;
  }
  const m1Core = getMission1CoreValue();
  const firstExploreCore = sessionData?.mission2New?.exploreV?.[0];
  if (magicVM2Explore2.v[0] === m1Core) {
    setMessage(fb, `El núcleo ${m1Core} es el mismo de la misión 1. Intenta con uno diferente.`, "bad");
    return;
  }
  if (magicVM2Explore2.v[0] === firstExploreCore) {
    setMessage(fb, `El núcleo ${firstExploreCore} es el mismo de la V anterior. Intenta con uno diferente.`, "bad");
    return;
  }
  sessionData.mission2New.explore2Confirmed = true;
  sessionData.mission2New.explore2V = magicVM2Explore2.v.slice();
  setMessage(fb, "¡Excelente! Encontraste otra V mágica con un núcleo distinto. 🎉", "good");
  renderM2Explore2Board();
  const cuadernoBlock2 = document.getElementById("m2Explore2CuadernoBlock");
  if (cuadernoBlock2) {
    cuadernoBlock2.style.display = "block";
  }
  saveSessionProgress();
  saveProgressToFirestore();
}

function setupM2Explore2Interaction() {
  const board = document.getElementById("magicVBoardM2B");
  const btns = document.getElementById("magicVBtnsM2B");
  if (!board) return;
  if (btns && !btns.dataset.bound) {
    btns.dataset.bound = "1";
    btns.addEventListener("click", e => {
      if (sessionData?.mission2New?.explore2Confirmed) return;
      const btn = e.target.closest(".v-num-btn");
      if (!btn) return;
      const num = Number(btn.dataset.num);
      const emptyIdx = magicVM2Explore2.v.findIndex(x => x === null);
      if (emptyIdx !== -1 && magicVM2Explore2.available.includes(num)) {
        magicVM2Explore2.v[emptyIdx] = num;
        magicVM2Explore2.available = magicVM2Explore2.available.filter(n => n !== num);
        renderM2Explore2Board();
      }
    });
  }
  const svg = board.querySelector("svg");
  if (svg && !svg.dataset.bound) {
    svg.dataset.bound = "1";
    svg.addEventListener("click", e => {
      if (sessionData?.mission2New?.explore2Confirmed) return;
      const circle = e.target.closest("circle");
      if (!circle) return;
      const idx = Number(circle.getAttribute("data-index2b"));
      const val = magicVM2Explore2.v[idx];
      if (val !== null) {
        magicVM2Explore2.v[idx] = null;
        magicVM2Explore2.available.push(val);
        magicVM2Explore2.available.sort((a, b) => a - b);
        renderM2Explore2Board();
      }
    });
  }
  const confirmBtn = document.getElementById("m2Explore2ConfirmBtn");
  if (confirmBtn && !confirmBtn.dataset.bound) {
    confirmBtn.dataset.bound = "1";
    confirmBtn.addEventListener("click", handleM2Explore2Confirm);
  }
  const resetBtn = document.getElementById("m2Explore2ResetBtn");
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", () => {
      if (sessionData?.mission2New?.explore2Confirmed) return;
      magicVM2Explore2.v = [null, null, null, null, null];
      magicVM2Explore2.available = [1, 2, 3, 4, 5];
      renderM2Explore2Board();
      const fb = document.getElementById("m2Explore2Feedback");
      if (fb) setMessage(fb, "", "");
    });
  }
  // Suma mágica del primer tablero de exploración
  const sumCheckBtn = document.getElementById("m2ExploreSumCheckBtn");
  if (sumCheckBtn && !sumCheckBtn.dataset.bound) {
    sumCheckBtn.dataset.bound = "1";
    sumCheckBtn.addEventListener("click", handleM2ExploreSumCheck);
  }
  if (m2ExploreCuadernoDoneBtn && !m2ExploreCuadernoDoneBtn.dataset.bound) {
    m2ExploreCuadernoDoneBtn.dataset.bound = "1";
    m2ExploreCuadernoDoneBtn.addEventListener("click", handleM2ExploreCuadernoDone);
  }
  if (m2Explore2CuadernoDoneBtn && !m2Explore2CuadernoDoneBtn.dataset.bound) {
    m2Explore2CuadernoDoneBtn.dataset.bound = "1";
    m2Explore2CuadernoDoneBtn.addEventListener("click", handleM2Explore2CuadernoDone);
  }
}

function setupM2ExploreInteraction() {
  const board = document.getElementById("magicVBoardM2");
  const btns = document.getElementById("magicVBtnsM2");
  if (!board) return;
  if (btns && !btns.dataset.bound) {
    btns.dataset.bound = "1";
    btns.addEventListener("click", e => {
      if (sessionData?.mission2New?.exploreConfirmed) return;
      const btn = e.target.closest(".v-num-btn");
      if (!btn) return;
      const num = Number(btn.dataset.num);
      const emptyIdx = magicVM2Explore.v.findIndex(x => x === null);
      if (emptyIdx !== -1 && magicVM2Explore.available.includes(num)) {
        magicVM2Explore.v[emptyIdx] = num;
        magicVM2Explore.available = magicVM2Explore.available.filter(n => n !== num);
        renderM2ExploreBoard();
      }
    });
  }
  const svg = board.querySelector("svg");
  if (svg && !svg.dataset.bound) {
    svg.dataset.bound = "1";
    svg.addEventListener("click", e => {
      if (sessionData?.mission2New?.exploreConfirmed) return;
      const circle = e.target.closest("circle");
      if (!circle) return;
      const idx = Number(circle.getAttribute("data-index"));
      const val = magicVM2Explore.v[idx];
      if (val !== null) {
        magicVM2Explore.v[idx] = null;
        magicVM2Explore.available.push(val);
        magicVM2Explore.available.sort((a, b) => a - b);
        renderM2ExploreBoard();
      }
    });
  }
  const confirmBtn = document.getElementById("m2ExploreConfirmBtn");
  if (confirmBtn && !confirmBtn.dataset.bound) {
    confirmBtn.dataset.bound = "1";
    confirmBtn.addEventListener("click", handleM2ExploreConfirm);
  }
  const resetBtn = document.getElementById("m2ExploreResetBtn");
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", () => {
      if (sessionData?.mission2New?.exploreConfirmed) return;
      magicVM2Explore.v = [null, null, null, null, null];
      magicVM2Explore.available = [1, 2, 3, 4, 5];
      renderM2ExploreBoard();
      const fb = document.getElementById("m2ExploreFeedback");
      if (fb) setMessage(fb, "", "");
    });
  }
  // Suma mágica del primer tablero de exploración
  const sumCheckBtn = document.getElementById("m2ExploreSumCheckBtn");
  if (sumCheckBtn && !sumCheckBtn.dataset.bound) {
    sumCheckBtn.dataset.bound = "1";
    sumCheckBtn.addEventListener("click", handleM2ExploreSumCheck);
  }
  if (m2ExploreCuadernoDoneBtn && !m2ExploreCuadernoDoneBtn.dataset.bound) {
    m2ExploreCuadernoDoneBtn.dataset.bound = "1";
    m2ExploreCuadernoDoneBtn.addEventListener("click", handleM2ExploreCuadernoDone);
  }
  if (m2Explore2CuadernoDoneBtn && !m2Explore2CuadernoDoneBtn.dataset.bound) {
    m2Explore2CuadernoDoneBtn.dataset.bound = "1";
    m2Explore2CuadernoDoneBtn.addEventListener("click", handleM2Explore2CuadernoDone);
  }
}

function syncMission2ReglaAudioButtons() {
  if (!recordBtnA3M2Regla || !submitBtnA3M2Regla) return;
  if (mission2ReglaAudioState.isRecording) {
    recordBtnA3M2Regla.querySelector("img").src = "../Actividad3/assets/images/boton-detener.png";
    submitBtnA3M2Regla.style.display = "none";
    return;
  }
  recordBtnA3M2Regla.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
  submitBtnA3M2Regla.style.display = mission2ReglaAudioState.blob ? "inline-flex" : "none";
  submitBtnA3M2Regla.disabled = mission2ReglaAudioState.isSubmitting || sessionData?.mission2New?.finalAudioSubmitted;
  recordBtnA3M2Regla.disabled = mission2ReglaAudioState.isSubmitting || sessionData?.mission2New?.finalAudioSubmitted;
}

function setupMission2ReglaAudio() {
  if (!recordBtnA3M2Regla || !submitBtnA3M2Regla || !statusA3M2Regla) return;
  syncMission2ReglaAudioButtons();
  recordBtnA3M2Regla.addEventListener("click", async () => {
    if (!sessionData?.mission2New?.explore2Confirmed || sessionData?.mission2New?.finalAudioSubmitted || mission2ReglaAudioState.isSubmitting) return;
    if (mission2ReglaAudioState.isRecording) {
      try { mission2ReglaAudioState.mediaRecorder.stop(); } catch (e) {}
      mission2ReglaAudioState.isRecording = false;
      syncMission2ReglaAudioButtons();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mission2ReglaAudioState.stream = stream;
      mission2ReglaAudioState.mediaRecorder = new MediaRecorder(stream);
      mission2ReglaAudioState.chunks = [];
      mission2ReglaAudioState.blob = null;
      mission2ReglaAudioState.isRecording = true;
      setMessage(statusA3M2Regla, "Grabando...", "");
      mission2ReglaAudioState.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) mission2ReglaAudioState.chunks.push(e.data);
      };
      mission2ReglaAudioState.mediaRecorder.onstop = () => {
        mission2ReglaAudioState.blob = new Blob(mission2ReglaAudioState.chunks, {
          type: mission2ReglaAudioState.chunks[0]?.type || "audio/webm"
        });
        if (mission2ReglaAudioState.stream) {
          mission2ReglaAudioState.stream.getTracks().forEach((track) => track.stop());
          mission2ReglaAudioState.stream = null;
        }
        setMessage(statusA3M2Regla, "Audio listo para enviar.", "good");
        syncMission2ReglaAudioButtons();
      };
      mission2ReglaAudioState.mediaRecorder.start();
      syncMission2ReglaAudioButtons();
    } catch (error) {
      mission2ReglaAudioState.isRecording = false;
      setMessage(statusA3M2Regla, "No se pudo acceder al micrófono.", "bad");
      syncMission2ReglaAudioButtons();
    }
  });

  submitBtnA3M2Regla.addEventListener("click", async () => {
    if (!mission2ReglaAudioState.blob || mission2ReglaAudioState.isSubmitting || sessionData?.mission2New?.finalAudioSubmitted) return;
    const firebaseServices = window.firebaseServices;
    if (!firebaseServices?.storage || !firebaseServices?.db) {
      setMessage(statusA3M2Regla, "Firebase no está disponible.", "bad");
      return;
    }
    mission2ReglaAudioState.isSubmitting = true;
    syncMission2ReglaAudioButtons();
    setMessage(statusA3M2Regla, "Subiendo audio...", "");
    try {
      const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
      const basePath = "Actividad3/2ReglaGeneral";
      const fileName = (studentCode === "0000"
        ? `${normalizeStorageSegment(studentInfo?.nombre || "invitado")}_reglageneral`
        : `${studentCode}_${normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"))}_reglageneral`);
      const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
      await uploadBytes(storageRef, mission2ReglaAudioState.blob, { contentType: mission2ReglaAudioState.blob.type || "audio/webm" });
      const audioURL = await getDownloadURL(storageRef);
      await addDoc(collection(db, "Actividad3"), {
        studentCode,
        curso: studentInfo?.curso || "",
        isGuest: studentCode === "0000",
        tag: "A3M2ReglaGeneral",
        componente: "2ReglaGeneral",
        storageBasePath: basePath,
        fileName: `${fileName}.webm`,
        audioURL,
      });
      if (!sessionData.mission2New) sessionData.mission2New = {};
      sessionData.mission2New.finalAudioSubmitted = true;
      sessionData.mission2New.finalAudioURL = audioURL;
      sessionData.progress = Math.max(sessionData.progress || 1, 3);
      setMessage(statusA3M2Regla, "✅ Audio enviado correctamente.", "good");
      const finBtn = document.getElementById("finmision2");
      if (finBtn) {
        finBtn.style.display = "block";
        setupFinMisionBtn(2);
      }
      saveSessionProgress();
      saveProgressToFirestore();
      mission2ReglaAudioState.blob = null;
    } catch (error) {
      setMessage(statusA3M2Regla, "Error al guardar el audio.", "bad");
    } finally {
      mission2ReglaAudioState.isSubmitting = false;
      syncMission2ReglaAudioButtons();
    }
  });
}

function syncMission2FinalAudioButtons() {
  if (!recordBtnA3M2Final || !submitBtnA3M2Final) return;
  if (mission2FinalAudioState.isRecording) {
    recordBtnA3M2Final.querySelector("img").src = "../Actividad3/assets/images/boton-detener.png";
    submitBtnA3M2Final.style.display = "none";
    return;
  }
  recordBtnA3M2Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
  submitBtnA3M2Final.style.display = mission2FinalAudioState.blob ? "inline-flex" : "none";
  submitBtnA3M2Final.disabled = mission2FinalAudioState.isSubmitting || sessionData?.mission2New?.audioSubmitted;
  recordBtnA3M2Final.disabled = mission2FinalAudioState.isSubmitting || sessionData?.mission2New?.audioSubmitted;
}

function setupMission2FinalAudio() {
  if (!recordBtnA3M2Final || !submitBtnA3M2Final || !statusA3M2Final) return;
  syncMission2FinalAudioButtons();
  recordBtnA3M2Final.addEventListener("click", async () => {
    if (sessionData?.mission2New?.audioSubmitted || mission2FinalAudioState.isSubmitting) return;
    if (mission2FinalAudioState.isRecording) {
      try { mission2FinalAudioState.mediaRecorder.stop(); } catch (e) {}
      mission2FinalAudioState.isRecording = false;
      syncMission2FinalAudioButtons();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mission2FinalAudioState.stream = stream;
      mission2FinalAudioState.mediaRecorder = new MediaRecorder(stream);
      mission2FinalAudioState.chunks = [];
      mission2FinalAudioState.blob = null;
      mission2FinalAudioState.isRecording = true;
      setMessage(statusA3M2Final, "Grabando...", "");
      mission2FinalAudioState.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) mission2FinalAudioState.chunks.push(e.data);
      };
      mission2FinalAudioState.mediaRecorder.onstop = () => {
        mission2FinalAudioState.blob = new Blob(mission2FinalAudioState.chunks, {
          type: mission2FinalAudioState.chunks[0]?.type || "audio/webm"
        });
        if (mission2FinalAudioState.stream) {
          mission2FinalAudioState.stream.getTracks().forEach((track) => track.stop());
          mission2FinalAudioState.stream = null;
        }
        setMessage(statusA3M2Final, "Audio listo para enviar.", "good");
        syncMission2FinalAudioButtons();
      };
      mission2FinalAudioState.mediaRecorder.start();
      syncMission2FinalAudioButtons();
    } catch (error) {
      mission2FinalAudioState.isRecording = false;
      setMessage(statusA3M2Final, "No se pudo acceder al micrófono.", "bad");
      syncMission2FinalAudioButtons();
    }
  });

  submitBtnA3M2Final.addEventListener("click", async () => {
    if (!mission2FinalAudioState.blob || mission2FinalAudioState.isSubmitting || sessionData?.mission2New?.audioSubmitted) return;
    const firebaseServices = window.firebaseServices;
    if (!firebaseServices?.storage || !firebaseServices?.db) {
      setMessage(statusA3M2Final, "Firebase no está disponible.", "bad");
      return;
    }
    mission2FinalAudioState.isSubmitting = true;
    syncMission2FinalAudioButtons();
    setMessage(statusA3M2Final, "Subiendo audio...", "");
    try {
      const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
      const basePath = "Actividad3/1Exploracion";
      const fileName = (studentCode === "0000"
        ? `${normalizeStorageSegment(studentInfo?.nombre || "invitado")}_justificacionexploracion`
        : `${studentCode}_${normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"))}_justificacionexploracion`);
      const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
      await uploadBytes(storageRef, mission2FinalAudioState.blob, { contentType: mission2FinalAudioState.blob.type || "audio/webm" });
      const audioURL = await getDownloadURL(storageRef);
      await addDoc(collection(db, "Actividad3"), {
        studentCode,
        curso: studentInfo?.curso || "",
        isGuest: studentCode === "0000",
        tag: "A3M2JustificacionExploracion",
        componente: "1Exploracion",
        storageBasePath: basePath,
        fileName: `${fileName}.webm`,
        audioURL,
      });
      if (!sessionData.mission2New) sessionData.mission2New = {};
      sessionData.mission2New.audioSubmitted = true;
      sessionData.mission2New.audioURL = audioURL;
      sessionData.mission2New.questionsCompleted = true;
      sessionData.mission2New.questionStep = 2;
      sessionData.progress = Math.max(sessionData.progress || 1, 3);
      setMessage(statusA3M2Final, "✅ Audio enviado correctamente.", "good");
      const exploreBlock = document.getElementById("mission2ExploreBlock");
      if (exploreBlock) exploreBlock.style.display = "block";
      setupM2ExploreInteraction();
      renderM2ExploreBoard();
      saveSessionProgress();
      saveProgressToFirestore();
      mission2FinalAudioState.blob = null;
    } catch (error) {
      setMessage(statusA3M2Final, "Error al guardar el audio.", "bad");
    } finally {
      mission2FinalAudioState.isSubmitting = false;
      syncMission2FinalAudioButtons();
    }
  });
}

function handleFinMisionClick(missionId) {
  // En modo revisión (misión ya completada) ir directo al mapa sin animación
  if (sessionData.missionsCompleted.includes(missionId)) {
    showScreen("mapScreen");
    return;
  }
  const bubble = document.getElementById("felicitacionMisionGlobal");
  const bubbleText = document.getElementById("felicitacionMisionTexto");
  if (bubble) {
    if (bubbleText) {
      bubbleText.textContent = `¡Felicidades! Has completado la misión ${missionId}`;
    }
    bubble.style.display = "block";
    bubble.classList.add("show");
    setTimeout(() => {
      bubble.classList.remove("show");
      bubble.style.display = "none";
      if (!sessionData.missionsCompleted.includes(missionId)) {
        sessionData.missionsCompleted.push(missionId);
      }
      sessionData.progress = Math.max(sessionData.progress || 1, missionId + 1);
      if (typeof syncMapFogWithProgress === "function") syncMapFogWithProgress();
      if (typeof animateMapReveal === "function") animateMapReveal(missionId);
      saveProgressToFirestore();
      if (missionId === 5) {
        showNumetrixRescueScene(() => showScreen("mapScreen"));
      } else {
        showScreen("mapScreen");
      }
    }, 2200);
    return;
  }
  showScreen("mapScreen");
}

function showNumetrixRescueScene(onDone) {
  const scene = document.getElementById("numetrixRescueScene");
  if (!scene) {
    if (typeof onDone === "function") onDone();
    return;
  }
  scene.style.display = "flex";
  scene.classList.remove("show");
  void scene.offsetWidth;
  scene.classList.add("show");
  setTimeout(() => {
    scene.classList.remove("show");
    scene.style.display = "none";
    if (typeof onDone === "function") onDone();
  }, 3200);
}

function setupFinMisionBtn(missionId) {
  const finBtn = document.getElementById(`finmision${missionId}`);
  if (!finBtn) return;
  if (finBtn.dataset.boundClick === "true") return;
  finBtn.addEventListener("click", () => handleFinMisionClick(missionId));
  finBtn.dataset.boundClick = "true";
}

function syncFinalAudioButtons() {
  if (!recordBtnA3M1Final || !submitBtnA3M1Final) return;
  if (isRecordingA3M1) {
    // Cambia ícono a detener
    recordBtnA3M1Final.querySelector('img').src = "../Actividad3/assets/images/boton-detener.png";
    recordBtnA3M1Final.disabled = false;
    submitBtnA3M1Final.style.display = "none";
  } else if (audioBlobA3M1) {
    // Mostrar enviar
    recordBtnA3M1Final.querySelector('img').src = "../Actividad3/assets/images/grabadora-de-voz.png";
    recordBtnA3M1Final.disabled = false;
    submitBtnA3M1Final.style.display = "inline-flex";
    submitBtnA3M1Final.disabled = isSubmittingA3M1;
  } else {
    // Estado inicial
    recordBtnA3M1Final.querySelector('img').src = "../Actividad3/assets/images/grabadora-de-voz.png";
    recordBtnA3M1Final.disabled = false;
    submitBtnA3M1Final.style.display = "none";
  }
}

if (recordBtnA3M1Final && submitBtnA3M1Final) {
  syncFinalAudioButtons();
  recordBtnA3M1Final.addEventListener("click", async () => {
    if (isRecordingA3M1) {
      // Detener grabación
      mediaRecorderA3M1.stop();
      isRecordingA3M1 = false;
      syncFinalAudioButtons();
      return;
    }
    // Iniciar grabación
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderA3M1 = new MediaRecorder(stream);
      audioChunksA3M1 = [];
      audioBlobA3M1 = null;
      isRecordingA3M1 = true;
      setMessage(statusA3M1Final, "Grabando...", "");
      syncFinalAudioButtons();
      mediaRecorderA3M1.ondataavailable = (e) => { if (e.data.size > 0) audioChunksA3M1.push(e.data); };
      mediaRecorderA3M1.onstop = () => {
        audioBlobA3M1 = new Blob(audioChunksA3M1, { type: audioChunksA3M1[0]?.type || "audio/webm" });
        setMessage(statusA3M1Final, "Audio listo para enviar.", "good");
        syncFinalAudioButtons();
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderA3M1.start();
    } catch (err) {
      setMessage(statusA3M1Final, "No se pudo acceder al micrófono.", "bad");
      isRecordingA3M1 = false;
      syncFinalAudioButtons();
    }
  });
  submitBtnA3M1Final.addEventListener("click", async () => {
    if (!audioBlobA3M1 || isSubmittingA3M1) return;
    isSubmittingA3M1 = true;
    syncFinalAudioButtons();
    setMessage(statusA3M1Final, "Subiendo audio...", "");
    try {
      const firebaseServices = window.firebaseServices;
      if (!firebaseServices?.storage || !firebaseServices?.db) throw new Error("Firebase no disponible");
      const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
      const basePath = "Actividad3/1Exploracion";
      const fileName = (studentCode === "0000"
        ? `${normalizeStorageSegment(studentInfo?.nombre || "invitado")}_exploracion`
        : `${studentCode}_${normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"))}_exploracion`
      );
      const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
      await uploadBytes(storageRef, audioBlobA3M1, { contentType: audioBlobA3M1.type || "audio/webm" });
      const audioURL = await getDownloadURL(storageRef);
      await addDoc(collection(db, "Actividad3"), {
        studentCode,
        curso: studentInfo?.curso || "",
        isGuest: studentCode === "0000",
        tag: "A3M1Exploracion",
        componente: "1Exploracion",
        storageBasePath: basePath,
        fileName: `${fileName}.webm`,
        audioURL,
      });
      setMessage(statusA3M1Final, "✅ Audio enviado correctamente.", "good");
      if (sessionData.mission1) {
        sessionData.mission1.audioURL = audioURL;
        sessionData.mission1.audioSubmitted = true;
      }
      // Mostrar botón de fin de misión
      const finBtn = document.getElementById("finmision1");
      if (finBtn) finBtn.style.display = "block";
      setupFinMisionBtn(1);
      // Reset visual
      audioBlobA3M1 = null;
      isSubmittingA3M1 = false;
      syncFinalAudioButtons();
    } catch (err) {
      setMessage(statusA3M1Final, "Error al guardar el audio.", "bad");
      isSubmittingA3M1 = false;
      syncFinalAudioButtons();
    }
  });
}
// Devuelve todas las permutaciones de Magic V para un núcleo dado (posición 0)
function getExpectedMagicVTableOrder(core) {
  // Números del 1 al 5, núcleo fijo en posición 0
  const nums = [1,2,3,4,5].filter(n => n !== core);
  // Todas las permutaciones de los otros 4 números
  function permute(arr) {
    if (arr.length === 0) return [[]];
    return arr.flatMap((n, i) => permute(arr.slice(0, i).concat(arr.slice(i+1))).map(p => [n, ...p]));
  }
  const perms = permute(nums);
  // Solo las que son Magic V válidas
  function isMagicV(arr) {
    // arr: [core, a, b, c, d] en posiciones de la V
    // Brazos: [0,2,1] y [0,3,4]
    return (core + arr[2] + arr[1]) === (core + arr[3] + arr[4]);
  }
  const allVs = perms.map(p => [core, ...p]).filter(isMagicV);
  // Orden pedagógico: referencia primero, luego las que mantienen el mismo brazo izquierdo
  if (!magicVState.found[0]) return allVs;
  const ref = magicVState.found[0];
  // Brazo izquierdo: [core, ref[2], ref[1]]
  const leftArm = [core, ref[2], ref[1]];
  // Agrupar: primero las que tienen el mismo brazo izquierdo (sin contar la referencia), luego el resto
  const sameLeft = allVs.filter(v => v[0] === leftArm[0] && v[2] === leftArm[1] && v[1] === leftArm[2] && v.join('-') !== ref.join('-'));
  const rest = allVs.filter(v => v.join('-') !== ref.join('-') && !sameLeft.includes(v));
  return [ref, ...sameLeft, ...rest];
}

// Renderiza la tabla 4x2 de Magic V guardadas, alineada y robusta, mostrando huecos
function renderMagicVTable() {
  const boardRowF = document.getElementById("magicVBoardRowF");
  if (!boardRowF) return;
  // Elimina todo menos la V editable y la referencia
  while (boardRowF.children.length > 2) {
    boardRowF.removeChild(boardRowF.lastChild);
  }
  // Crea tabla 4x2
  let table = document.getElementById("magicVTable");
  if (table) table.remove();
  table = document.createElement("table");
  table.id = "magicVTable";
  table.className = "magicv-table-grid";
  // Si no hay referencia, tabla vacía
  if (!magicVState.found[0]) {
    for (let row = 0; row < 4; row++) {
      const tr = document.createElement("tr");
      for (let col = 0; col < 2; col++) {
        const td = document.createElement("td");
        td.className = "magicv-table-cell";
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    boardRowF.appendChild(table);
    return;
  }
  // Orden esperado: referencia, luego variantes pedagógicas
  const expectedOrder = getExpectedMagicVTableOrder(magicVState.fixedCore);
  // Buscar las Magic V encontradas (incluida la referencia)
  const foundVs = [magicVState.found[0], ...magicVState.found2];
  // Para cada celda, buscar si la combinación está encontrada
  let idx = 0;
  for (let row = 0; row < 4; row++) {
    const tr = document.createElement("tr");
    for (let col = 0; col < 2; col++) {
      const td = document.createElement("td");
      td.className = "magicv-table-cell";
      if (idx < expectedOrder.length) {
        const v = expectedOrder[idx];
        // Buscar si está encontrada
        const found = foundVs.find(arr => arr && arr.join('-') === v.join('-'));
        if (found) {
          td.appendChild(renderMagicVSVG(found));
        }
      }
      tr.appendChild(td);
      idx++;
    }
    table.appendChild(tr);
  }
  boardRowF.appendChild(table);

  // Mostrar/ocultar bloque de pregunta y audio según si la tabla está completa
  const finalBlock = document.getElementById("magicVTableFinalBlock");
  if (finalBlock) {
    if (foundVs.length === 8) {
      finalBlock.style.display = "block";
      renderMission1QuestionFlow();
    } else {
      finalBlock.style.display = "none";
      if (preguntasM1) preguntasM1.style.display = "none";
      if (audioFinalBlockM1) audioFinalBlockM1.style.display = "none";
    }
  }
}

// Renderiza una miniatura SVG de Magic V
function renderMagicVSVG(arr) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "95");
  svg.setAttribute("viewBox", "0 0 120 95");
  // Proporciones similares a la V editable grande (420x320)
  // Núcleo (abajo centro), brazos inclinados, nodos bien distribuidos
  const cx = 60, cy = 78; // núcleo
  const r = 15;
  const ax1 = 25, ay1 = 25; // extremo izquierdo
  const ax2 = 95, ay2 = 25; // extremo derecho
  const mx1 = 42, my1 = 52; // medio izquierdo
  const mx2 = 78, my2 = 52; // medio derecho
  // Brazos
  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", cx);
  line1.setAttribute("y1", cy);
  line1.setAttribute("x2", ax1);
  line1.setAttribute("y2", ay1);
  line1.setAttribute("stroke", "#b3b3ff");
  line1.setAttribute("stroke-width", "7");
  svg.appendChild(line1);
  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", cx);
  line2.setAttribute("y1", cy);
  line2.setAttribute("x2", ax2);
  line2.setAttribute("y2", ay2);
  line2.setAttribute("stroke", "#b3b3ff");
  line2.setAttribute("stroke-width", "7");
  svg.appendChild(line2);
  // Círculos y números
  const coords = [
    {x: cx, y: cy},    // núcleo
    {x: ax1, y: ay1},  // izq arriba
    {x: mx1, y: my1},  // izq medio
    {x: mx2, y: my2},  // der medio
    {x: ax2, y: ay2}   // der arriba
  ];
  coords.forEach((c, k) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", c.x);
    circle.setAttribute("cy", c.y);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", k === 0 ? "#ffe680" : "#fff");
    circle.setAttribute("stroke", "#1976d2");
    circle.setAttribute("stroke-width", "2.5");
    svg.appendChild(circle);
    if (arr && arr[k] !== null && arr[k] !== undefined) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", c.x);
      t.setAttribute("y", c.y + 6);
      t.setAttribute("class", "magicv-num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "1.25rem");
      t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
      t.textContent = arr[k];
      svg.appendChild(t);
    }
  });
  return svg;
}
// Reinicia la V editable en parte B
function handleMagicVReset2() {
  magicVState.v2 = [magicVState.fixedCore, null, null, null, null];
  magicVState.available2 = [1,2,3,4,5].filter(n => n !== magicVState.fixedCore);
  setMessage(magicVSaveFeedback, "", "");
  renderMagicVBoard2();
  renderMagicVButtons2();
  enableMagicVDragDrop2();
}
// --- Drag & Drop para Magic V (parte B) ---
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
    }, { passive: false });
    btn.addEventListener("touchmove", (e) => {
      if (!dragGhost) return;
      const touch = e.touches[0];
      dragGhost.style.left = (touch.clientX - 32) + "px";
      dragGhost.style.top = (touch.clientY - 32) + "px";
    }, { passive: false });
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
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '13');
      t.setAttribute('font-family', 'Lobster Two, Rancho, sans-serif');
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
  const isValid = isMagicV(magicVState.v);
  if (isValid) {
    // Verifica si ya existe esta V
    const vStr = magicVState.v.join("-");
    const exists = magicVState.found.some(arr => arr.join("-") === vStr);
    if (exists) {
      setMessage(magicVFeedback, "Ya guardaste esta V mágica.", "bad");
      return;
    }
    setMessage(magicVFeedback, "¡Encontraste una V mágica!", "good");
    magicVState.found.push(magicVState.v.slice());
    // Si es la primera, fija el núcleo
    if (magicVState.found.length === 1) {
      magicVState.fixedCore = magicVState.v[0];
      // Ocultar Reiniciar para que found[0] y la V visible sean siempre la misma
      magicVResetBtn.style.display = "none";
    }
    renderMagicVFoundListA();
    // Ya no se resetea la V automáticamente, solo se guarda y se muestra la mini V
    // Si es la primera, mostrar parte B
    if (magicVState.found.length === 1) {
      parteBm1.style.display = "block";
      setupMagicVPart2();
    }
  } else {
    setMessage(magicVFeedback, "¿La suma de los brazos es igual?", "bad");
  }
}

// Renderiza la lista de Magic V encontradas en parte A como mini V
function renderMagicVFoundListA() {
  const foundListA = document.getElementById("magicVFoundListA");
  if (!foundListA) return;
  foundListA.innerHTML = "";
  magicVState.found.forEach((arr, idx) => {
    const div = document.createElement("div");
    div.className = "magicv-found-item";
    // Mini V SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "70");
    svg.setAttribute("height", "70");
    svg.setAttribute("viewBox", "0 0 120 90");
    // Círculos
    const coords = [
      {x:55, y:65},   // núcleo
      {x:20, y:20},   // izq arriba
      {x:35, y:42},   // izq medio
      {x:75, y:42},   // der medio
      {x:90, y:20}    // der arriba
    ];
    coords.forEach((c, i) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", c.x);
      circle.setAttribute("cy", c.y);
      circle.setAttribute("r", "10");
      circle.setAttribute("fill", i === 0 ? "#ffe680" : "#fff");
      circle.setAttribute("stroke", "#1976d2");
      svg.appendChild(circle);
      if (arr[i] !== null && arr[i] !== undefined) {
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", c.x);
        t.setAttribute("y", c.y + 4);
        t.setAttribute("class", "magicv-num");
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("font-size", "13");
        t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
        t.textContent = arr[i];
        svg.appendChild(t);
      }
    });
    div.appendChild(svg);
    foundListA.appendChild(div);
  });
}

// --- Parte 2: total mágico y permutaciones ---
function setupMagicVPart2() {
  // Mostrar la Magic V encontrada en la parte A como referencia
  renderMagicVReference();
  magicVTotalInput.value = "";
  magicVTotalFeedback.textContent = "";
  magicVNextQ.style.display = "none";
  magicVBoard2.style.display = "none";
  magicVButtons2.style.display = "none";
  magicVActions2.style.display = "none";
  magicVFoundList.style.display = "none";
  // Ocultar la tabla y el contenedor al iniciar parte B
  const boardRowF = document.getElementById("magicVBoardRowF");
  if (boardRowF) boardRowF.style.display = "none";
  // El núcleo fijo debe estar en la posición 0
  magicVState.v2 = [magicVState.fixedCore, null, null, null, null];
  magicVState.available2 = [1,2,3,4,5].filter(n => n !== magicVState.fixedCore);
  renderMagicVBoard2();
  renderMagicVButtons2();
  renderMagicVTable();
  // ...código original de setupMagicVPart2...
  // Círculos de la V como drop targets
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`v2-pos-${i+1}`);
    circle.ondragover = (e) => {
      e.preventDefault();
      circle.setAttribute("stroke", "#1976d2");
    };
    circle.ondragleave = (e) => {
      circle.setAttribute("stroke", "#6ec6ff");
    };
    circle.ondrop = (e) => {
      e.preventDefault();
      circle.setAttribute("stroke", "#6ec6ff");
      if (!draggingBtn) return;
      const num = Number(draggingBtn.dataset.num2);
      if (i !== 0 && magicVState.v2[i] === null && magicVState.available2.includes(num)) {
        magicVState.v2[i] = num;
        magicVState.available2 = magicVState.available2.filter(n => n !== num);
        renderMagicVBoard2();
        renderMagicVButtons2();
        enableMagicVDragDrop2();
      }
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    };
    // Touch drop
    circle.ontouchmove = (e) => {
      if (!dragGhost) return;
      const touch = e.touches[0];
      dragGhost.style.left = (touch.clientX - 32) + "px";
      dragGhost.style.top = (touch.clientY - 32) + "px";
    };
    circle.ontouchend = (e) => {
      if (!draggingBtn) return;
      const num = Number(draggingBtn.dataset.num2);
      if (i !== 0 && magicVState.v2[i] === null && magicVState.available2.includes(num)) {
        magicVState.v2[i] = num;
        magicVState.available2 = magicVState.available2.filter(n => n !== num);
        renderMagicVBoard2();
        renderMagicVButtons2();
        enableMagicVDragDrop2();
      }
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    };
  }
}


// Renderiza los números en el SVG de referencia de la V encontrada
function renderMagicVReference() {
  const refDiv = document.getElementById("magicVReference");
  if (!refDiv) return;
  const svg = refDiv.querySelector("svg");
  if (!svg) return;
  // Elimina textos previos
  svg.querySelectorAll('text.magicv-num').forEach(t => t.remove());
  // Coordenadas de los círculos en el SVG de referencia
  const coords = [
    {x:55, y:65},   // ref-pos-1 (núcleo)
    {x:20, y:20},   // ref-pos-2
    {x:35, y:42},   // ref-pos-3
    {x:75, y:42},   // ref-pos-4
    {x:90, y:20}    // ref-pos-5
  ];
  // Números de la V encontrada
  const v = magicVState.found[0] || [null,null,null,null,null];
  for (let i = 0; i < 5; i++) {
    if (v[i] !== null && v[i] !== undefined) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', coords[i].x);
      t.setAttribute('y', coords[i].y + 4);
      t.setAttribute('class', 'magicv-num');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '13');
      t.setAttribute('font-family', 'Lobster Two, Rancho, sans-serif');
      t.textContent = v[i];
      svg.appendChild(t);
    }
  }
  refDiv.style.display = "block";
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
    // Mostrar la tabla y el contenedor solo cuando la suma es correcta
    const boardRowF = document.getElementById("magicVBoardRowF");
    if (boardRowF) boardRowF.style.display = "flex";
  } else {
    setMessage(magicVTotalFeedback, "Intenta de nuevo.", "bad");
  }
}

function renderMagicVBoard2() {
  // Limpiar textos previos
  const svg = magicVBoard2.querySelector('svg');
  svg.querySelectorAll('text.magicv-num').forEach(t => t.remove());
  // Coordenadas de los círculos
  const coords = [
    {x:210, y:250}, // v2-pos-1
    {x:90,  y:70},  // v2-pos-2
    {x:150, y:160}, // v2-pos-3
    {x:270, y:160}, // v2-pos-4
    {x:330, y:70}   // v2-pos-5
  ];
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`v2-pos-${i+1}`);
    circle.setAttribute("data-index2", i);
    if (i === 0) {
      circle.style.fill = "#ffe680";
      circle.style.cursor = "not-allowed";
    } else {
      circle.style.fill = "#fff";
      circle.style.cursor = magicVState.v2[i] !== null ? "pointer" : "default";
      // Evento para devolver el número al botón disponible
      circle.onclick = function() {
        if (magicVState.v2[i] !== null) {
          const val = magicVState.v2[i];
          magicVState.v2[i] = null;
          magicVState.available2.push(val);
          magicVState.available2.sort((a,b)=>a-b);
          renderMagicVBoard2();
          renderMagicVButtons2();
        }
      };
    }
    // Si hay número, dibuja el texto SVG
    if (magicVState.v2[i] !== null) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', coords[i].x);
      t.setAttribute('y', coords[i].y + 8); // ajuste visual vertical
      t.setAttribute('class', 'magicv-num');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '2.2rem');
      t.setAttribute('font-family', 'Lobster Two, Rancho, sans-serif');
      t.textContent = magicVState.v2[i];
      svg.appendChild(t);
    }
  }
}

function renderMagicVButtons2() {
  magicVButtons2.innerHTML = "";
  for (let num = 1; num <= 5; num++) {
    if (num === magicVState.fixedCore) continue; // No mostrar el núcleo
    const btn = document.createElement("button");
    btn.className = "v-num-btn";
    btn.textContent = num;
    btn.dataset.num2 = num;
    btn.disabled = !magicVState.available2.includes(num);
    btn.addEventListener("click", handleMagicVButton2Click);
    magicVButtons2.appendChild(btn);
  }
  enableMagicVDragDrop2();
}

function handleMagicVButton2Click(e) {
  const num = Number(e.target.dataset.num2);
  const emptyIdx = magicVState.v2.findIndex((x, idx) => x === null && idx !== 0);
  if (emptyIdx !== -1 && magicVState.available2.includes(num)) {
    magicVState.v2[emptyIdx] = num;
    magicVState.available2 = magicVState.available2.filter(n => n !== num);
    renderMagicVBoard2();
    renderMagicVButtons2();
    enableMagicVDragDrop2();
  }
}

function enableMagicVDragDrop2() {
  // Botones arrastrables
  Array.from(magicVButtons2.children).forEach((btn, idx) => {
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
    }, { passive: false });
    btn.addEventListener("touchmove", (e) => {
      if (!dragGhost) return;
      const touch = e.touches[0];
      dragGhost.style.left = (touch.clientX - 32) + "px";
      dragGhost.style.top = (touch.clientY - 32) + "px";
    }, { passive: false });
    btn.addEventListener("touchend", (e) => {
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    });
  });
  // Círculos de la V como drop targets
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`v2-pos-${i+1}`);
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
      const num = Number(draggingBtn.dataset.num2);
      if (i !== 0 && magicVState.v2[i] === null && magicVState.available2.includes(num)) {
        magicVState.v2[i] = num;
        magicVState.available2 = magicVState.available2.filter(n => n !== num);
        renderMagicVBoard2();
        renderMagicVButtons2();
        enableMagicVDragDrop2();
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
      const num = Number(draggingBtn.dataset.num2);
      if (i !== 0 && magicVState.v2[i] === null && magicVState.available2.includes(num)) {
        magicVState.v2[i] = num;
        magicVState.available2 = magicVState.available2.filter(n => n !== num);
        renderMagicVBoard2();
        renderMagicVButtons2();
        enableMagicVDragDrop2();
      }
      if (dragGhost) dragGhost.remove();
      dragGhost = null;
      draggingBtn = null;
      dragOriginIdx = null;
    });
  }
}

// --- Al renderizar los botones de la parte B, asignar eventos igual que en la parte A ---
function renderMagicVButtons2() {
  magicVButtons2.innerHTML = "";
  for (let num = 1; num <= 5; num++) {
    if (num === magicVState.fixedCore) continue; // No mostrar el núcleo
    const btn = document.createElement("button");
    btn.className = "v-num-btn";
    btn.textContent = num;
    btn.dataset.num2 = num;
    btn.disabled = !magicVState.available2.includes(num);
    btn.addEventListener("click", handleMagicVButton2Click);
    magicVButtons2.appendChild(btn);
  }
  enableMagicVDragDrop2();
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
  // Eliminar listeners que referencian a handleMagicVCircle2Click y v-num-btn2
  // El clic en los círculos ya se maneja directamente en renderMagicVBoard2
  magicVSaveBtn.addEventListener("click", handleMagicVSave);
  magicVResetBtn2.addEventListener("click", handleMagicVReset2);
}
// Guarda la V actual en parte B (permite guardar permutaciones)
function handleMagicVSave() {
  // Solo guardar si la V está completa (sin nulls excepto núcleo fijo)
  if (magicVState.v2.slice(1).some(x => x === null)) {
    setMessage(magicVSaveFeedback, "Completa toda la V antes de guardar.", "bad");
    return;
  }

  // VALIDAR QUE SEA UNA MAGIC V: ambos brazos deben sumar igual
  // v2[0]=núcleo, v2[1]=arriba-izq, v2[2]=medio-izq, v2[3]=medio-der, v2[4]=arriba-der
  const sumBrazoIzq = magicVState.v2[0] + magicVState.v2[1] + magicVState.v2[2];
  const sumBrazoDer = magicVState.v2[0] + magicVState.v2[4] + magicVState.v2[3];
  if (sumBrazoIzq !== sumBrazoDer) {
    setMessage(magicVSaveFeedback, `Esa V, no es una V mágica. Recuerda: ambos brazos deben sumar igual.`, "bad");
    return;
  }

  // Verifica si ya existe esta permutación (encontrada o guardada)
  const v2str = magicVState.v2.join("-");
  // No permitir guardar la V inicial (la morada de referencia)
  const initialVStr = magicVState.found.length > 0 ? magicVState.found[0].join("-") : "";
  if (v2str === initialVStr) {
    setMessage(magicVSaveFeedback, "Esta V mágica ya es la inicial, busca otra diferente.", "bad");
    return;
  }
  // No permitir guardar permutaciones repetidas
  const exists = magicVState.found2.some(arr => arr.join("-") === v2str);
  if (exists) {
    setMessage(magicVSaveFeedback, "Ya guardaste esta V mágica.", "bad");
    return;
  }
  magicVState.found2.push(magicVState.v2.slice());
  setMessage(magicVSaveFeedback, "¡V mágica guardada!", "good");
  renderMagicVTable();
  // Resetear la V editable para buscar otra
  magicVState.v2 = [magicVState.fixedCore, null, null, null, null];
  magicVState.available2 = [1,2,3,4,5].filter(n => n !== magicVState.fixedCore);
  renderMagicVBoard2();
  renderMagicVButtons2();
  enableMagicVDragDrop2();
}

// Eliminar función duplicada renderMagicVFoundList (ahora solo se usa renderMagicVTable para la parte B)

// Muestra solo la sección con el id dado y oculta las demás secciones principales
function showScreen(screenId) {
  if (screenId !== "mission3Screen") {
    stopMission3TimerTicker();
  }
  const screens = document.querySelectorAll('.app-screen');
  screens.forEach(s => s.style.display = 'none');
  const target = document.getElementById(screenId);
  if (target) target.style.display = 'flex';
  // Si se muestra el mapa, renderizar y sincronizar fog
  if (screenId === "mapScreen") {
    renderMap();
    setupDevMissionControls();
  }
}

// Mostrar controles de misión solo para código 98100
function setupDevMissionControls() {
  const controls = document.getElementById("devMissionControls");
  if (!controls) return;
  // Mostrar solo si el código es 98100
  if (studentCode === "98100") {
    controls.style.display = "block";
  } else {
    controls.style.display = "none";
    return;
  }
  controls.querySelectorAll(".dev-mission-btn").forEach(btn => {
    btn.onclick = () => {
      const m = btn.dataset.m;
      if (m === "reset") {
        // Resetear progreso de misiones
        sessionData.missionsCompleted = [];
        sessionData.progress = 1;
        Object.keys(mapRevealProgress).forEach(k => mapRevealProgress[k] = 0);
        renderMap();
        syncMapFogWithProgress();
        setMessage(mapHint, "Progreso de misiones reiniciado.", "good");
      } else {
        const missionNum = Number(m);
        if (!sessionData.missionsCompleted.includes(missionNum)) {
          sessionData.missionsCompleted.push(missionNum);
          sessionData.progress = Math.max(sessionData.progress, missionNum + 1);
          renderMap();
          animateMapReveal(missionNum);
          setMessage(mapHint, `Misión ${missionNum} simulada como completada.`, "good");
        }
      }
    };
  });
}
// Convierte una cadena a formato título (primera letra de cada palabra en mayúscula)
function toTitle(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
// --- Inicialización simple de sessionData ---
function getInitialSessionData() {
  return {
    character: null,
    mission1: {
      current: {},
      saved: [],
      explorationUnlocked: false,
      audioSubmitted: false,
      questionStep: 0,
      questionsCompleted: false
    },
    mission2: {
      current: {},
      saved: [],
      explorationUnlocked: false,
      audioSubmitted: false
    },
    mission2New: {
      audioSubmitted: false,
      audioURL: null,
      questionStep: 0,
      questionsCompleted: false,
      exploreConfirmed: false,
      exploreV: null,
      exploreSumCorrect: false,
      explore2Confirmed: false,
      explore2V: null,
      cuadernoAnsweredAfterSum: false,
      cuadernoAnsweredAfterExplore2: false,
      finalAudioSubmitted: false,
      finalAudioURL: null
    },
    mission3Lab: {
      currentV: [null, null, null, null, null],
      available: [1, 2, 3, 4, 5],
      attempts: [],
      timerStartedAt: null,
      timerFinished: false,
      cuadernoStep: 0,
      finalAudioSubmitted: false,
      finalAudioURL: null,
    },
    mission4Lab: {
      currentV: [null, null, null, null, null],
      available: [2, 3, 4, 5, 6],
      savedByCore: { 2: [], 4: [], 6: [] },
      cuadernoStep: 0,
      finalAudioSubmitted: false,
      finalAudioURL: null,
    },
    mission5Lab: {
      selectedSet: null,
      currentV: [null, null, null, null, null],
      available: [],
      solved: false,
      cuadernoStep: 0,
      finalAudioSubmitted: false,
      finalAudioURL: null,
    }
  };
}


let sessionData = getInitialSessionData();
// Parche defensivo: asegurar que missionsCompleted existe y es un array
if (!Array.isArray(sessionData.missionsCompleted)) {
  sessionData.missionsCompleted = [];
}

// Parche defensivo: asegurar que mission1 existe y tiene la estructura correcta
if (typeof sessionData.mission1 === 'undefined') {
  sessionData.mission1 = {
    current: {},
    saved: [],
    explorationUnlocked: false,
    audioSubmitted: false,
    questionStep: 0,
    questionsCompleted: false
  };
}

if (typeof sessionData.mission1.questionStep !== 'number') {
  sessionData.mission1.questionStep = 0;
}

if (typeof sessionData.mission1.questionsCompleted !== 'boolean') {
  sessionData.mission1.questionsCompleted = false;
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

if (typeof sessionData.mission2New === 'undefined') {
  sessionData.mission2New = {
    audioSubmitted: false,
    audioURL: null,
    questionStep: 0,
    questionsCompleted: false,
    exploreConfirmed: false,
    exploreV: null,
    exploreSumCorrect: false,
    explore2Confirmed: false,
    explore2V: null,
    cuadernoAnsweredAfterSum: false,
    cuadernoAnsweredAfterExplore2: false,
    finalAudioSubmitted: false,
    finalAudioURL: null
  };
}

if (typeof sessionData.mission3Lab === 'undefined') {
  sessionData.mission3Lab = {
    currentV: [null, null, null, null, null],
    available: [1, 2, 3, 4, 5],
    attempts: [],
    timerStartedAt: null,
    timerFinished: false,
    cuadernoStep: 0,
    finalAudioSubmitted: false,
    finalAudioURL: null,
  };
}

if (typeof sessionData.mission4Lab === 'undefined') {
  sessionData.mission4Lab = {
    currentV: [null, null, null, null, null],
    available: [2, 3, 4, 5, 6],
    savedByCore: { 2: [], 4: [], 6: [] },
    cuadernoStep: 0,
    finalAudioSubmitted: false,
    finalAudioURL: null,
  };
}

if (typeof sessionData.mission5Lab === 'undefined') {
  sessionData.mission5Lab = {
    selectedSet: null,
    currentV: [null, null, null, null, null],
    available: [],
    solved: false,
    finalAudioSubmitted: false,
    finalAudioURL: null,
  };
}

if (typeof sessionData.mission2New.questionStep !== 'number') {
  sessionData.mission2New.questionStep = 0;
}

if (typeof sessionData.mission2New.questionsCompleted !== 'boolean') {
  sessionData.mission2New.questionsCompleted = false;
}

if (typeof sessionData.mission2New.exploreConfirmed !== 'boolean') {
  sessionData.mission2New.exploreConfirmed = false;
}

if (!Array.isArray(sessionData.mission2New.exploreV) && sessionData.mission2New.exploreV !== null) {
  sessionData.mission2New.exploreV = null;
}

if (typeof sessionData.mission2New.exploreSumCorrect !== 'boolean') {
  sessionData.mission2New.exploreSumCorrect = false;
}

if (typeof sessionData.mission2New.explore2Confirmed !== 'boolean') {
  sessionData.mission2New.explore2Confirmed = false;
}

if (!Array.isArray(sessionData.mission2New.explore2V) && sessionData.mission2New.explore2V !== null) {
  sessionData.mission2New.explore2V = null;
}

if (typeof sessionData.mission2New.cuadernoAnsweredAfterSum !== 'boolean') {
  sessionData.mission2New.cuadernoAnsweredAfterSum = false;
}

if (typeof sessionData.mission2New.finalAudioSubmitted !== 'boolean') {
  sessionData.mission2New.finalAudioSubmitted = false;
}

if (typeof sessionData.mission2New.finalAudioURL !== 'string' && sessionData.mission2New.finalAudioURL !== null) {
  sessionData.mission2New.finalAudioURL = null;
}

// --- Misión 3: verificación de núcleos 2 y 4 ---
const mission3HeaderVs = document.getElementById("mission3HeaderVs");
const m3MagicVBoard = document.getElementById("m3MagicVBoard");
const m3MagicVBtns = document.getElementById("m3MagicVBtns");
const m3ConfirmBtn = document.getElementById("m3ConfirmBtn");
const m3ResetBtn = document.getElementById("m3ResetBtn");
const m3DevEndTimerBtn = document.getElementById("m3DevEndTimerBtn");
const m3Feedback = document.getElementById("m3Feedback");
const m3HourglassTop = document.getElementById("m3HourglassTop");
const m3HourglassBottom = document.getElementById("m3HourglassBottom");
const m3TimerText = document.getElementById("m3TimerText");
const m3CuadernoBlock = document.getElementById("m3CuadernoBlock");
const m3CuadernoNextBtn = document.getElementById("m3CuadernoNextBtn");
const m3CuadernoQWrap1 = document.getElementById("m3CuadernoQWrap1");
const m3CuadernoQWrap2 = document.getElementById("m3CuadernoQWrap2");
const m3CuadernoQWrap3 = document.getElementById("m3CuadernoQWrap3");
const m3AudioFinalBlock = document.getElementById("m3AudioFinalBlock");
const recordBtnA3M3Final = document.getElementById("recordBtnA3M3Final");
const submitBtnA3M3Final = document.getElementById("submitA3M3Final");
const statusA3M3Final = document.getElementById("statusA3M3Final");

const M3_TIMER_SECONDS = 10 * 60;
const M3_TOTAL_GRAINS = 24;
let mission3TimerIntervalId = null;

const mission3AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  isRecording: false,
  isSubmitting: false,
};

function ensureMission3LabState() {
  if (!sessionData.mission3Lab) {
    sessionData.mission3Lab = {
      currentV: [null, null, null, null, null],
      available: [1, 2, 3, 4, 5],
      attempts: [],
      timerStartedAt: null,
      timerFinished: false,
      cuadernoStep: 0,
      finalAudioSubmitted: false,
      finalAudioURL: null,
    };
  }
  if (!Array.isArray(sessionData.mission3Lab.currentV) || sessionData.mission3Lab.currentV.length !== 5) {
    sessionData.mission3Lab.currentV = [null, null, null, null, null];
  }
  if (!Array.isArray(sessionData.mission3Lab.available)) {
    sessionData.mission3Lab.available = [1, 2, 3, 4, 5];
  }
  if (!Array.isArray(sessionData.mission3Lab.attempts)) {
    sessionData.mission3Lab.attempts = [];
  }
  if (typeof sessionData.mission3Lab.cuadernoStep !== "number") {
    sessionData.mission3Lab.cuadernoStep = 0;
  }
  if (typeof sessionData.mission3Lab.timerFinished !== "boolean") {
    sessionData.mission3Lab.timerFinished = false;
  }
  if (typeof sessionData.mission3Lab.finalAudioSubmitted !== "boolean") {
    sessionData.mission3Lab.finalAudioSubmitted = false;
  }
}

function getMission3HeaderVs() {
  const candidates = [];
  if (Array.isArray(magicVState?.found?.[0]) && magicVState.found[0].length === 5) candidates.push(magicVState.found[0]);
  if (Array.isArray(sessionData?.mission2New?.exploreV) && sessionData.mission2New.exploreV.length === 5) candidates.push(sessionData.mission2New.exploreV);
  if (Array.isArray(sessionData?.mission2New?.explore2V) && sessionData.mission2New.explore2V.length === 5) candidates.push(sessionData.mission2New.explore2V);
  if (Array.isArray(magicVState?.found2)) {
    magicVState.found2.forEach((arr) => {
      if (Array.isArray(arr) && arr.length === 5) candidates.push(arr);
    });
  }
  const byCore = new Map();
  candidates.forEach((arr) => {
    const core = arr[0];
    if (typeof core === "number" && !byCore.has(core)) byCore.set(core, arr.slice());
  });
  return Array.from(byCore.values()).slice(0, 3);
}

function renderMission3HeaderMagicVs() {
  if (!mission3HeaderVs) return;
  const vs = getMission3HeaderVs();
  mission3HeaderVs.innerHTML = "";
  if (vs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "magicv-saved-item-label";
    empty.textContent = "Aún no hay V mágicas guardadas para mostrar aquí.";
    mission3HeaderVs.appendChild(empty);
    return;
  }
  vs.forEach((arr) => {
    const card = document.createElement("div");
    card.className = "mission3-mini-v-card";
    const mini = renderMagicVSVG(arr);
    mini.classList.add("mission3-mini-v-svg");
    card.appendChild(mini);
    const caption = document.createElement("p");
    caption.className = "mission3-mini-v-caption";
    caption.textContent = `Núcleo ${arr[0]}`;
    card.appendChild(caption);
    mission3HeaderVs.appendChild(card);
  });
}

function renderMission3Board() {
  if (!m3MagicVBoard) return;
  const svg = m3MagicVBoard.querySelector("svg");
  if (!svg) return;
  ensureMission3LabState();
  svg.querySelectorAll("text.m3v-num").forEach((textNode) => textNode.remove());
  const coords = [
    { x: 210, y: 250 },
    { x: 90, y: 70 },
    { x: 150, y: 160 },
    { x: 270, y: 160 },
    { x: 330, y: 70 },
  ];
  const locked = sessionData.mission3Lab.timerFinished;
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`m3v-pos-${i + 1}`);
    if (!circle) continue;
    circle.setAttribute("data-index", String(i));
    circle.style.cursor = locked ? "not-allowed" : (sessionData.mission3Lab.currentV[i] !== null ? "pointer" : "default");
    if (sessionData.mission3Lab.currentV[i] !== null) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", String(coords[i].x));
      t.setAttribute("y", String(coords[i].y + 8));
      t.setAttribute("class", "m3v-num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "13");
      t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
      t.textContent = String(sessionData.mission3Lab.currentV[i]);
      svg.appendChild(t);
    }
  }
  if (m3MagicVBtns) {
    Array.from(m3MagicVBtns.querySelectorAll(".v-num-btn")).forEach((btn) => {
      const num = Number(btn.dataset.num);
      btn.disabled = locked || !sessionData.mission3Lab.available.includes(num);
    });
  }
  if (m3ConfirmBtn) m3ConfirmBtn.disabled = locked;
  if (m3ResetBtn) m3ResetBtn.disabled = locked;
}

function handleMission3ButtonNumberClick(event) {
  ensureMission3LabState();
  if (sessionData.mission3Lab.timerFinished) return;
  const btn = event.target.closest(".v-num-btn");
  if (!btn) return;
  const num = Number(btn.dataset.num);
  const emptyIdx = sessionData.mission3Lab.currentV.findIndex((x) => x === null);
  if (emptyIdx === -1 || !sessionData.mission3Lab.available.includes(num)) return;
  sessionData.mission3Lab.currentV[emptyIdx] = num;
  sessionData.mission3Lab.available = sessionData.mission3Lab.available.filter((n) => n !== num);
  renderMission3Board();
  saveSessionProgress();
}

function handleMission3CircleClick(event) {
  ensureMission3LabState();
  if (sessionData.mission3Lab.timerFinished) return;
  const circle = event.target.closest("circle");
  if (!circle) return;
  const idx = Number(circle.getAttribute("data-index"));
  if (Number.isNaN(idx)) return;
  const val = sessionData.mission3Lab.currentV[idx];
  if (val === null) return;
  sessionData.mission3Lab.currentV[idx] = null;
  sessionData.mission3Lab.available.push(val);
  sessionData.mission3Lab.available.sort((a, b) => a - b);
  renderMission3Board();
  saveSessionProgress();
}

function resetMission3Board() {
  ensureMission3LabState();
  sessionData.mission3Lab.currentV = [null, null, null, null, null];
  sessionData.mission3Lab.available = [1, 2, 3, 4, 5];
  renderMission3Board();
  setMessage(m3Feedback, "Tablero reiniciado.", "");
  saveSessionProgress();
}

function handleMission3Check() {
  ensureMission3LabState();
  if (sessionData.mission3Lab.timerFinished) return;
  const arr = sessionData.mission3Lab.currentV;
  if (arr.some((x) => x === null)) {
    setMessage(m3Feedback, "Completa toda la V antes de comprobar.", "bad");
    return;
  }
  const core = arr[0];
  if (core !== 2 && core !== 4) {
    setMessage(m3Feedback, "En esta misión debes probar con núcleo 2 o 4.", "bad");
    return;
  }
  const left = arr[0] + arr[1] + arr[2];
  const right = arr[0] + arr[3] + arr[4];
  const valid = left === right;
  sessionData.mission3Lab.attempts.push({
    v: arr.slice(),
    left,
    right,
    valid,
    ts: Date.now(),
  });
  if (valid) {
    setMessage(m3Feedback, `Encontraste una V mágica con núcleo ${core}. Verifica tus cuentas y sigue explorando hasta que termine el tiempo.`, "good");
  } else {
    setMessage(m3Feedback, `Brazo izquierdo: ${left} | Brazo derecho: ${right}. No se equilibran.`, "bad");
  }
  saveSessionProgress();
}

function ensureMission3HourglassGrains() {
  if (!m3HourglassTop || !m3HourglassBottom) return;
  if (m3HourglassTop.children.length === M3_TOTAL_GRAINS && m3HourglassBottom.children.length === M3_TOTAL_GRAINS) return;
  m3HourglassTop.innerHTML = "";
  m3HourglassBottom.innerHTML = "";
  for (let i = 0; i < M3_TOTAL_GRAINS; i++) {
    const grainTop = document.createElement("span");
    grainTop.className = "mission3-grain";
    m3HourglassTop.appendChild(grainTop);
    const grainBottom = document.createElement("span");
    grainBottom.className = "mission3-grain";
    m3HourglassBottom.appendChild(grainBottom);
  }
}

function getMission3RemainingSeconds() {
  ensureMission3LabState();
  if (!sessionData.mission3Lab.timerStartedAt) return M3_TIMER_SECONDS;
  const elapsed = Math.floor((Date.now() - sessionData.mission3Lab.timerStartedAt) / 1000);
  return Math.max(0, M3_TIMER_SECONDS - elapsed);
}

function updateMission3TimerUI(remainingSeconds) {
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");
  if (m3TimerText) m3TimerText.textContent = `${mm}:${ss}`;

  const sandTop = document.getElementById("m3SandTop");
  const sandBottom = document.getElementById("m3SandBottom");
  const sandDrop = document.getElementById("m3SandDrop");

  const ratio = Math.max(0, Math.min(1, remainingSeconds / M3_TIMER_SECONDS));
  const TOP_H = 64;      // altura del bulbo superior en el SVG
  const BOTTOM_H = 68;   // altura del bulbo inferior (152-84)
  const BOTTOM_Y_END = 152;

  const topHeight = TOP_H * ratio;
  const bottomHeight = BOTTOM_H * (1 - ratio);

  if (sandTop) {
    // Anclar la arena en el cuello (y=72) y mover el borde superior hacia abajo
    // → el vaciado ocurre desde la parte ancha (arriba) hacia la punta (abajo)
    sandTop.setAttribute("y", String(Math.round(72 - topHeight)));
    sandTop.setAttribute("height", String(Math.round(topHeight)));
  }
  if (sandBottom) {
    sandBottom.setAttribute("y", String(Math.round(BOTTOM_Y_END - bottomHeight)));
    sandBottom.setAttribute("height", String(Math.round(bottomHeight)));
  }
  if (sandDrop) {
    sandDrop.style.visibility = remainingSeconds > 0 ? "visible" : "hidden";
  }
}

function stopMission3TimerTicker() {
  if (mission3TimerIntervalId) {
    clearInterval(mission3TimerIntervalId);
    mission3TimerIntervalId = null;
  }
}

function handleMission3TimerEnd() {
  ensureMission3LabState();
  if (sessionData.mission3Lab.timerFinished) return;
  sessionData.mission3Lab.timerFinished = true;
  if (sessionData.mission3Lab.cuadernoStep < 1) {
    sessionData.mission3Lab.cuadernoStep = 1;
  }
  setMessage(m3Feedback, "Tiempo finalizado. Ahora responde las preguntas en tu cuaderno.", "good");
  renderMission3Board();
  renderMission3CuadernoFlow();
  saveSessionProgress();
  saveProgressToFirestore();
}

function handleMission3DevForceTimerEnd() {
  stopMission3TimerTicker();
  updateMission3TimerUI(0);
  handleMission3TimerEnd();
}

function startMission3TimerIfNeeded() {
  ensureMission3LabState();
  if (!sessionData.mission3Lab.timerStartedAt) {
    sessionData.mission3Lab.timerStartedAt = Date.now();
    saveSessionProgress();
    saveProgressToFirestore();
  }
  if (sessionData.mission3Lab.timerFinished) {
    updateMission3TimerUI(0);
    stopMission3TimerTicker();
    return;
  }
  const remainingNow = getMission3RemainingSeconds();
  updateMission3TimerUI(remainingNow);
  if (remainingNow <= 0) {
    handleMission3TimerEnd();
    stopMission3TimerTicker();
    return;
  }
  stopMission3TimerTicker();
  mission3TimerIntervalId = setInterval(() => {
    const remaining = getMission3RemainingSeconds();
    updateMission3TimerUI(remaining);
    if (remaining <= 0) {
      stopMission3TimerTicker();
      handleMission3TimerEnd();
    }
  }, 1000);
}

function renderMission3CuadernoFlow() {
  ensureMission3LabState();
  if (!m3CuadernoBlock || !m3CuadernoQWrap1 || !m3CuadernoQWrap2 || !m3CuadernoQWrap3 || !m3CuadernoNextBtn || !m3AudioFinalBlock) return;
  if (!sessionData.mission3Lab.timerFinished) {
    m3CuadernoBlock.style.display = "none";
    m3AudioFinalBlock.style.display = "none";
    return;
  }
  m3CuadernoBlock.style.display = "block";
  let step = sessionData.mission3Lab.cuadernoStep;
  if (step < 1) step = 1;
  if (step > 4) step = 4;
  sessionData.mission3Lab.cuadernoStep = step;

  m3CuadernoQWrap1.style.display = step >= 1 ? "block" : "none";
  m3CuadernoQWrap2.style.display = step >= 2 ? "block" : "none";
  m3CuadernoQWrap3.style.display = step >= 3 ? "block" : "none";

  if (step <= 3) {
    m3CuadernoNextBtn.style.display = "inline-flex";
    m3CuadernoNextBtn.textContent = step === 3 ? "Ya terminé" : "Ya respondí";
    const parentWrap = step === 1 ? m3CuadernoQWrap1 : (step === 2 ? m3CuadernoQWrap2 : m3CuadernoQWrap3);
    if (parentWrap && m3CuadernoNextBtn.parentElement !== parentWrap) {
      parentWrap.appendChild(m3CuadernoNextBtn);
    }
    m3AudioFinalBlock.style.display = "none";
  } else {
    m3CuadernoNextBtn.style.display = "none";
    m3AudioFinalBlock.style.display = "grid";
    syncMission3AudioButtons();
  }
}

function handleMission3CuadernoNext() {
  ensureMission3LabState();
  if (!sessionData.mission3Lab.timerFinished) return;
  if (sessionData.mission3Lab.cuadernoStep < 4) {
    sessionData.mission3Lab.cuadernoStep += 1;
  }
  saveSessionProgress();
  saveProgressToFirestore();
  renderMission3CuadernoFlow();
}

function syncMission3AudioButtons() {
  if (!recordBtnA3M3Final || !submitBtnA3M3Final) return;
  const locked = Boolean(sessionData?.mission3Lab?.finalAudioSubmitted || mission3AudioState.isSubmitting);
  if (mission3AudioState.isRecording) {
    recordBtnA3M3Final.querySelector("img").src = "../Actividad3/assets/images/boton-detener.png";
    submitBtnA3M3Final.style.display = "none";
  } else if (mission3AudioState.blob) {
    recordBtnA3M3Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
    submitBtnA3M3Final.style.display = "inline-flex";
  } else {
    recordBtnA3M3Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
    submitBtnA3M3Final.style.display = "none";
  }
  recordBtnA3M3Final.disabled = locked;
  submitBtnA3M3Final.disabled = locked || !mission3AudioState.blob;
}

function stopMission3RecordingStream() {
  if (mission3AudioState.stream) {
    mission3AudioState.stream.getTracks().forEach((track) => track.stop());
  }
  mission3AudioState.stream = null;
}

async function toggleMission3Recording() {
  ensureMission3LabState();
  if (sessionData.mission3Lab.finalAudioSubmitted || mission3AudioState.isSubmitting) return;
  if (mission3AudioState.isRecording && mission3AudioState.mediaRecorder) {
    try { mission3AudioState.mediaRecorder.requestData(); } catch (error) {}
    mission3AudioState.mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mission3AudioState.mediaRecorder = recorder;
    mission3AudioState.stream = stream;
    mission3AudioState.chunks = [];
    mission3AudioState.blob = null;
    mission3AudioState.isRecording = true;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) mission3AudioState.chunks.push(event.data);
    };
    recorder.onstop = () => {
      mission3AudioState.isRecording = false;
      mission3AudioState.blob = new Blob(mission3AudioState.chunks, {
        type: mission3AudioState.chunks[0]?.type || "audio/webm",
      });
      stopMission3RecordingStream();
      setMessage(statusA3M3Final, "Audio listo para enviar.", "good");
      syncMission3AudioButtons();
    };
    recorder.start(250);
    setMessage(statusA3M3Final, "Grabando...", "");
    syncMission3AudioButtons();
  } catch (error) {
    setMessage(statusA3M3Final, "No se pudo acceder al micrófono.", "bad");
    mission3AudioState.isRecording = false;
    stopMission3RecordingStream();
    syncMission3AudioButtons();
  }
}

function buildMission3AudioStorageBasePath() {
  return "Actividad3/3Justificacion";
}

function buildMission3AudioFileName() {
  if (studentCode === "0000") {
    const nombre = normalizeStorageSegment(studentInfo?.nombre || "invitado");
    return `${nombre}_3sintesisfinal`;
  }
  const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"));
  return `${studentCode}_${curso}_3sintesisfinal`;
}

async function submitMission3FinalAudio() {
  ensureMission3LabState();
  if (sessionData.mission3Lab.finalAudioSubmitted || mission3AudioState.isSubmitting) return;
  if (!mission3AudioState.blob || mission3AudioState.blob.size === 0) {
    setMessage(statusA3M3Final, "Primero graba una respuesta.", "bad");
    return;
  }
  const firebaseServices = window.firebaseServices;
  if (!firebaseServices?.storage || !firebaseServices?.db) {
    setMessage(statusA3M3Final, "Firebase no está disponible en este momento.", "bad");
    return;
  }
  mission3AudioState.isSubmitting = true;
  syncMission3AudioButtons();
  setMessage(statusA3M3Final, "Subiendo audio...", "");
  try {
    const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
    const basePath = buildMission3AudioStorageBasePath();
    const fileName = buildMission3AudioFileName();
    const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
    await uploadBytes(storageRef, mission3AudioState.blob, { contentType: mission3AudioState.blob.type || "audio/webm" });
    const audioURL = await getDownloadURL(storageRef);
    await addDoc(collection(db, "Actividad3"), {
      studentCode,
      curso: studentInfo?.curso || "",
      isGuest: studentCode === "0000",
      tag: "A3M3SintesisFinal",
      componente: "3SintesisFinal",
      storageBasePath: basePath,
      fileName: `${fileName}.webm`,
      audioURL,
    });
    sessionData.mission3Lab.finalAudioSubmitted = true;
    sessionData.mission3Lab.finalAudioURL = audioURL;
    setMessage(statusA3M3Final, "✅ Audio enviado correctamente.", "good");
    const finBtn = document.getElementById("finmision3");
    if (finBtn) {
      finBtn.style.display = "block";
      setupFinMisionBtn(3);
    }
    mission3AudioState.blob = null;
    saveSessionProgress();
    saveProgressToFirestore();
    syncMission3AudioButtons();
  } catch (error) {
    setMessage(statusA3M3Final, "Error al guardar el audio.", "bad");
  } finally {
    mission3AudioState.isSubmitting = false;
    syncMission3AudioButtons();
  }
}

function setupMission3Interactions() {
  if (m3MagicVBtns && !m3MagicVBtns.dataset.bound) {
    m3MagicVBtns.dataset.bound = "1";
    m3MagicVBtns.addEventListener("click", handleMission3ButtonNumberClick);
  }
  if (m3MagicVBoard && !m3MagicVBoard.dataset.bound) {
    m3MagicVBoard.dataset.bound = "1";
    m3MagicVBoard.addEventListener("click", handleMission3CircleClick);
  }
  if (m3ConfirmBtn && !m3ConfirmBtn.dataset.bound) {
    m3ConfirmBtn.dataset.bound = "1";
    m3ConfirmBtn.addEventListener("click", handleMission3Check);
  }
  if (m3ResetBtn && !m3ResetBtn.dataset.bound) {
    m3ResetBtn.dataset.bound = "1";
    m3ResetBtn.addEventListener("click", resetMission3Board);
  }
  if (m3DevEndTimerBtn && !m3DevEndTimerBtn.dataset.bound) {
    m3DevEndTimerBtn.dataset.bound = "1";
    m3DevEndTimerBtn.addEventListener("click", handleMission3DevForceTimerEnd);
  }
  if (m3CuadernoNextBtn && !m3CuadernoNextBtn.dataset.bound) {
    m3CuadernoNextBtn.dataset.bound = "1";
    m3CuadernoNextBtn.addEventListener("click", handleMission3CuadernoNext);
  }
  if (recordBtnA3M3Final && !recordBtnA3M3Final.dataset.bound) {
    recordBtnA3M3Final.dataset.bound = "1";
    recordBtnA3M3Final.addEventListener("click", toggleMission3Recording);
  }
  if (submitBtnA3M3Final && !submitBtnA3M3Final.dataset.bound) {
    submitBtnA3M3Final.dataset.bound = "1";
    submitBtnA3M3Final.addEventListener("click", submitMission3FinalAudio);
  }
}

function renderMission3Screen() {
  ensureMission3LabState();
  renderMission3HeaderMagicVs();
  renderMission3Board();
  renderMission3CuadernoFlow();
  if (statusA3M3Final && sessionData.mission3Lab.finalAudioSubmitted) {
    setMessage(statusA3M3Final, "✅ Audio enviado correctamente.", "good");
  }
  const finBtn = document.getElementById("finmision3");
  if (finBtn) {
    finBtn.style.display = sessionData.mission3Lab.finalAudioSubmitted ? "block" : "none";
    if (sessionData.mission3Lab.finalAudioSubmitted) setupFinMisionBtn(3);
  }
  if (m3DevEndTimerBtn) {
    m3DevEndTimerBtn.style.display = studentCode === "98100" ? "inline-flex" : "none";
  }
  setupMission3Interactions();
  startMission3TimerIfNeeded();
}

// --- Misión 4: Probando con otros números (2,3,4,5,6) ---
const m4MagicVBoard = document.getElementById("m4MagicVBoard");
const m4MagicVBtns = document.getElementById("m4MagicVBtns");
const m4ConfirmBtn = document.getElementById("m4ConfirmBtn");
const m4ResetBtn = document.getElementById("m4ResetBtn");
const m4Feedback = document.getElementById("m4Feedback");
const m4ColCore2 = document.getElementById("m4ColCore2");
const m4ColCore4 = document.getElementById("m4ColCore4");
const m4ColCore6 = document.getElementById("m4ColCore6");
const m4CuadernoBlock = document.getElementById("m4CuadernoBlock");
const m4CuadernoQWrap1 = document.getElementById("m4CuadernoQWrap1");
const m4CuadernoQWrap2 = document.getElementById("m4CuadernoQWrap2");
const m4CuadernoQWrap3 = document.getElementById("m4CuadernoQWrap3");
const m4CuadernoNextBtn = document.getElementById("m4CuadernoNextBtn");
const m4AudioFinalBlock = document.getElementById("m4AudioFinalBlock");
const recordBtnA3M4Final = document.getElementById("recordBtnA3M4Final");
const submitBtnA3M4Final = document.getElementById("submitA3M4Final");
const statusA3M4Final = document.getElementById("statusA3M4Final");

const mission4AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  isRecording: false,
  isSubmitting: false,
};

function ensureMission4LabState() {
  if (!sessionData.mission4Lab) {
    sessionData.mission4Lab = {
      currentV: [null, null, null, null, null],
      available: [2, 3, 4, 5, 6],
      savedByCore: { 2: [], 4: [], 6: [] },
      cuadernoStep: 0,
      finalAudioSubmitted: false,
      finalAudioURL: null,
    };
  }
  if (!Array.isArray(sessionData.mission4Lab.currentV) || sessionData.mission4Lab.currentV.length !== 5) {
    sessionData.mission4Lab.currentV = [null, null, null, null, null];
  }
  if (!Array.isArray(sessionData.mission4Lab.available)) {
    sessionData.mission4Lab.available = [2, 3, 4, 5, 6];
  }
  if (!sessionData.mission4Lab.savedByCore || typeof sessionData.mission4Lab.savedByCore !== "object") {
    sessionData.mission4Lab.savedByCore = { 2: [], 4: [], 6: [] };
  }
  [2, 4, 6].forEach((core) => {
    if (!Array.isArray(sessionData.mission4Lab.savedByCore[core])) {
      sessionData.mission4Lab.savedByCore[core] = [];
    }
  });
  if (typeof sessionData.mission4Lab.cuadernoStep !== "number") {
    sessionData.mission4Lab.cuadernoStep = 0;
  }
  if (typeof sessionData.mission4Lab.finalAudioSubmitted !== "boolean") {
    sessionData.mission4Lab.finalAudioSubmitted = false;
  }
}

function renderMission4Board() {
  if (!m4MagicVBoard) return;
  ensureMission4LabState();
  const svg = m4MagicVBoard.querySelector("svg");
  if (!svg) return;
  svg.querySelectorAll("text.m4v-num").forEach((textNode) => textNode.remove());
  const coords = [
    { x: 210, y: 250 },
    { x: 90, y: 70 },
    { x: 150, y: 160 },
    { x: 270, y: 160 },
    { x: 330, y: 70 },
  ];
  const locked = sessionData.mission4Lab.finalAudioSubmitted;
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`m4v-pos-${i + 1}`);
    if (!circle) continue;
    circle.setAttribute("data-index", String(i));
    circle.style.cursor = locked ? "not-allowed" : (sessionData.mission4Lab.currentV[i] !== null ? "pointer" : "default");
    if (sessionData.mission4Lab.currentV[i] !== null) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", String(coords[i].x));
      t.setAttribute("y", String(coords[i].y + 8));
      t.setAttribute("class", "m4v-num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "13");
      t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
      t.textContent = String(sessionData.mission4Lab.currentV[i]);
      svg.appendChild(t);
    }
  }
  if (m4MagicVBtns) {
    Array.from(m4MagicVBtns.querySelectorAll(".v-num-btn")).forEach((btn) => {
      const num = Number(btn.dataset.num);
      btn.disabled = locked || !sessionData.mission4Lab.available.includes(num);
    });
  }
  if (m4ConfirmBtn) m4ConfirmBtn.disabled = locked;
  if (m4ResetBtn) m4ResetBtn.disabled = locked;
}

function renderMission4Columns() {
  ensureMission4LabState();
  const colMap = {
    2: m4ColCore2,
    4: m4ColCore4,
    6: m4ColCore6,
  };
  [2, 4, 6].forEach((core) => {
    const col = colMap[core];
    if (!col) return;
    col.innerHTML = "";

    const list = sessionData.mission4Lab.savedByCore[core];

    const coreBadge = document.createElement("div");
    coreBadge.className = "mission4-core-badge";
    coreBadge.textContent = String(core);
    coreBadge.style.visibility = list.length ? "visible" : "hidden";
    col.appendChild(coreBadge);

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "mission4-empty-col";
      col.appendChild(empty);
      return;
    }
    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "mission4-mini-v-wrap";
      card.appendChild(renderMagicVSVG(item.v));
      const sum = document.createElement("p");
      sum.className = "mission4-sum-caption";
      sum.textContent = String(item.sum);
      card.appendChild(sum);
      col.appendChild(card);
    });
  });
}

function resetMission4Board() {
  ensureMission4LabState();
  sessionData.mission4Lab.currentV = [null, null, null, null, null];
  sessionData.mission4Lab.available = [2, 3, 4, 5, 6];
  renderMission4Board();
  setMessage(m4Feedback, "Tablero reiniciado.", "");
  saveSessionProgress();
}

function handleMission4BtnNumberClick(event) {
  ensureMission4LabState();
  if (sessionData.mission4Lab.finalAudioSubmitted) return;
  const btn = event.target.closest(".v-num-btn");
  if (!btn) return;
  const num = Number(btn.dataset.num);
  const emptyIdx = sessionData.mission4Lab.currentV.findIndex((x) => x === null);
  if (emptyIdx === -1 || !sessionData.mission4Lab.available.includes(num)) return;
  sessionData.mission4Lab.currentV[emptyIdx] = num;
  sessionData.mission4Lab.available = sessionData.mission4Lab.available.filter((n) => n !== num);
  renderMission4Board();
  saveSessionProgress();
}

function handleMission4BoardCircleClick(event) {
  ensureMission4LabState();
  if (sessionData.mission4Lab.finalAudioSubmitted) return;
  const circle = event.target.closest("circle");
  if (!circle) return;
  const idx = Number(circle.getAttribute("data-index"));
  if (Number.isNaN(idx)) return;
  const val = sessionData.mission4Lab.currentV[idx];
  if (val === null) return;
  sessionData.mission4Lab.currentV[idx] = null;
  sessionData.mission4Lab.available.push(val);
  sessionData.mission4Lab.available.sort((a, b) => a - b);
  renderMission4Board();
  saveSessionProgress();
}

function hasMission4MinimumColumns() {
  ensureMission4LabState();
  return [2, 4, 6].every((core) => sessionData.mission4Lab.savedByCore[core].length > 0);
}

function handleMission4Check() {
  ensureMission4LabState();
  if (sessionData.mission4Lab.finalAudioSubmitted) return;
  const arr = sessionData.mission4Lab.currentV;
  if (arr.some((x) => x === null)) {
    setMessage(m4Feedback, "Completa toda la V antes de comprobar.", "bad");
    return;
  }
  const core = arr[0];
  if (![2, 4, 6].includes(core)) {
    setMessage(m4Feedback, "En esta misión solo se guardan V con núcleo 2, 4 o 6.", "bad");
    return;
  }
  const left = arr[0] + arr[1] + arr[2];
  const right = arr[0] + arr[3] + arr[4];
  if (left !== right) {
    setMessage(m4Feedback, `Brazo izquierdo: ${left} | Brazo derecho: ${right}.`, "bad");
    return;
  }
  const sum = left;
  const list = sessionData.mission4Lab.savedByCore[core];
  const key = arr.join("-");
  if (list.some((item) => item.v.join("-") === key)) {
    setMessage(m4Feedback, "Esta permutación exacta ya está registrada en esa columna.", "bad");
    return;
  }
  list.push({ v: arr.slice(), sum });
  setMessage(m4Feedback, `V mágica guardada en la columna del núcleo ${core}.`, "good");
  resetMission4Board();
  renderMission4Columns();

  if (hasMission4MinimumColumns() && sessionData.mission4Lab.cuadernoStep < 1) {
    sessionData.mission4Lab.cuadernoStep = 1;
  }
  renderMission4CuadernoFlow();
  saveSessionProgress();
  saveProgressToFirestore();
}

function renderMission4CuadernoFlow() {
  ensureMission4LabState();
  if (!m4CuadernoBlock || !m4CuadernoQWrap1 || !m4CuadernoQWrap2 || !m4CuadernoQWrap3 || !m4CuadernoNextBtn || !m4AudioFinalBlock) return;
  const unlocked = hasMission4MinimumColumns();
  if (!unlocked) {
    m4CuadernoBlock.style.display = "none";
    m4AudioFinalBlock.style.display = "none";
    return;
  }
  m4CuadernoBlock.style.display = "block";
  let step = sessionData.mission4Lab.cuadernoStep;
  if (step < 1) step = 1;
  if (step > 4) step = 4;
  sessionData.mission4Lab.cuadernoStep = step;

  m4CuadernoQWrap1.style.display = step >= 1 ? "block" : "none";
  m4CuadernoQWrap2.style.display = step >= 2 ? "block" : "none";
  m4CuadernoQWrap3.style.display = step >= 3 ? "block" : "none";

  if (step <= 3) {
    m4CuadernoNextBtn.style.display = "inline-flex";
    m4CuadernoNextBtn.textContent = step === 3 ? "Ya terminé" : "Ya respondí";
    const parentWrap = step === 1 ? m4CuadernoQWrap1 : (step === 2 ? m4CuadernoQWrap2 : m4CuadernoQWrap3);
    if (parentWrap && m4CuadernoNextBtn.parentElement !== parentWrap) {
      parentWrap.appendChild(m4CuadernoNextBtn);
    }
    m4AudioFinalBlock.style.display = "none";
  } else {
    m4CuadernoNextBtn.style.display = "none";
    m4AudioFinalBlock.style.display = "grid";
    syncMission4AudioButtons();
  }
}

function handleMission4CuadernoNext() {
  ensureMission4LabState();
  if (!hasMission4MinimumColumns()) return;
  if (sessionData.mission4Lab.cuadernoStep < 4) {
    sessionData.mission4Lab.cuadernoStep += 1;
  }
  saveSessionProgress();
  saveProgressToFirestore();
  renderMission4CuadernoFlow();
}

function syncMission4AudioButtons() {
  if (!recordBtnA3M4Final || !submitBtnA3M4Final) return;
  const locked = Boolean(sessionData?.mission4Lab?.finalAudioSubmitted || mission4AudioState.isSubmitting);
  if (mission4AudioState.isRecording) {
    recordBtnA3M4Final.querySelector("img").src = "../Actividad3/assets/images/boton-detener.png";
    submitBtnA3M4Final.style.display = "none";
  } else if (mission4AudioState.blob) {
    recordBtnA3M4Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
    submitBtnA3M4Final.style.display = "inline-flex";
  } else {
    recordBtnA3M4Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
    submitBtnA3M4Final.style.display = "none";
  }
  recordBtnA3M4Final.disabled = locked;
  submitBtnA3M4Final.disabled = locked || !mission4AudioState.blob;
}

function stopMission4RecordingStream() {
  if (mission4AudioState.stream) {
    mission4AudioState.stream.getTracks().forEach((track) => track.stop());
  }
  mission4AudioState.stream = null;
}

async function toggleMission4Recording() {
  ensureMission4LabState();
  if (sessionData.mission4Lab.finalAudioSubmitted || mission4AudioState.isSubmitting) return;
  if (mission4AudioState.isRecording && mission4AudioState.mediaRecorder) {
    try { mission4AudioState.mediaRecorder.requestData(); } catch (error) {}
    mission4AudioState.mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mission4AudioState.mediaRecorder = recorder;
    mission4AudioState.stream = stream;
    mission4AudioState.chunks = [];
    mission4AudioState.blob = null;
    mission4AudioState.isRecording = true;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) mission4AudioState.chunks.push(event.data);
    };
    recorder.onstop = () => {
      mission4AudioState.isRecording = false;
      mission4AudioState.blob = new Blob(mission4AudioState.chunks, {
        type: mission4AudioState.chunks[0]?.type || "audio/webm",
      });
      stopMission4RecordingStream();
      setMessage(statusA3M4Final, "Audio listo para enviar.", "good");
      syncMission4AudioButtons();
    };
    recorder.start(250);
    setMessage(statusA3M4Final, "Grabando...", "");
    syncMission4AudioButtons();
  } catch (error) {
    setMessage(statusA3M4Final, "No se pudo acceder al micrófono.", "bad");
    mission4AudioState.isRecording = false;
    stopMission4RecordingStream();
    syncMission4AudioButtons();
  }
}

function buildMission4AudioStorageBasePath() {
  return "Actividad3/4Reflexion";
}

function buildMission4AudioFileName() {
  if (studentCode === "0000") {
    const nombre = normalizeStorageSegment(studentInfo?.nombre || "invitado");
    return `${nombre}_4reflexion`;
  }
  const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"));
  return `${studentCode}_${curso}_4reflexion`;
}

async function submitMission4FinalAudio() {
  ensureMission4LabState();
  if (sessionData.mission4Lab.finalAudioSubmitted || mission4AudioState.isSubmitting) return;
  if (!mission4AudioState.blob || mission4AudioState.blob.size === 0) {
    setMessage(statusA3M4Final, "Primero graba una respuesta.", "bad");
    return;
  }
  const firebaseServices = window.firebaseServices;
  if (!firebaseServices?.storage || !firebaseServices?.db) {
    setMessage(statusA3M4Final, "Firebase no está disponible en este momento.", "bad");
    return;
  }
  mission4AudioState.isSubmitting = true;
  syncMission4AudioButtons();
  setMessage(statusA3M4Final, "Subiendo audio...", "");
  try {
    const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
    const basePath = buildMission4AudioStorageBasePath();
    const fileName = buildMission4AudioFileName();
    const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
    await uploadBytes(storageRef, mission4AudioState.blob, { contentType: mission4AudioState.blob.type || "audio/webm" });
    const audioURL = await getDownloadURL(storageRef);
    await addDoc(collection(db, "Actividad3"), {
      studentCode,
      curso: studentInfo?.curso || "",
      isGuest: studentCode === "0000",
      tag: "A3M4Reflexion",
      componente: "4Reflexion",
      storageBasePath: basePath,
      fileName: `${fileName}.webm`,
      audioURL,
    });
    sessionData.mission4Lab.finalAudioSubmitted = true;
    sessionData.mission4Lab.finalAudioURL = audioURL;
    setMessage(statusA3M4Final, "✅ Audio enviado correctamente.", "good");
    const finBtn = document.getElementById("finmision4");
    if (finBtn) {
      finBtn.style.display = "block";
      setupFinMisionBtn(4);
    }
    mission4AudioState.blob = null;
    saveSessionProgress();
    saveProgressToFirestore();
    syncMission4AudioButtons();
  } catch (error) {
    setMessage(statusA3M4Final, "Error al guardar el audio.", "bad");
  } finally {
    mission4AudioState.isSubmitting = false;
    syncMission4AudioButtons();
  }
}

function setupMission4Interactions() {
  if (m4MagicVBtns && !m4MagicVBtns.dataset.bound) {
    m4MagicVBtns.dataset.bound = "1";
    m4MagicVBtns.addEventListener("click", handleMission4BtnNumberClick);
  }
  if (m4MagicVBoard && !m4MagicVBoard.dataset.bound) {
    m4MagicVBoard.dataset.bound = "1";
    m4MagicVBoard.addEventListener("click", handleMission4BoardCircleClick);
  }
  if (m4ConfirmBtn && !m4ConfirmBtn.dataset.bound) {
    m4ConfirmBtn.dataset.bound = "1";
    m4ConfirmBtn.addEventListener("click", handleMission4Check);
  }
  if (m4ResetBtn && !m4ResetBtn.dataset.bound) {
    m4ResetBtn.dataset.bound = "1";
    m4ResetBtn.addEventListener("click", resetMission4Board);
  }
  if (m4CuadernoNextBtn && !m4CuadernoNextBtn.dataset.bound) {
    m4CuadernoNextBtn.dataset.bound = "1";
    m4CuadernoNextBtn.addEventListener("click", handleMission4CuadernoNext);
  }
  if (recordBtnA3M4Final && !recordBtnA3M4Final.dataset.bound) {
    recordBtnA3M4Final.dataset.bound = "1";
    recordBtnA3M4Final.addEventListener("click", toggleMission4Recording);
  }
  if (submitBtnA3M4Final && !submitBtnA3M4Final.dataset.bound) {
    submitBtnA3M4Final.dataset.bound = "1";
    submitBtnA3M4Final.addEventListener("click", submitMission4FinalAudio);
  }
}

function renderMission4Screen() {
  ensureMission4LabState();
  renderMission4Board();
  renderMission4Columns();
  renderMission4CuadernoFlow();
  if (statusA3M4Final && sessionData.mission4Lab.finalAudioSubmitted) {
    setMessage(statusA3M4Final, "✅ Audio enviado correctamente.", "good");
  }
  const finBtn = document.getElementById("finmision4");
  if (finBtn) {
    finBtn.style.display = sessionData.mission4Lab.finalAudioSubmitted ? "block" : "none";
    if (sessionData.mission4Lab.finalAudioSubmitted) setupFinMisionBtn(4);
  }
  setupMission4Interactions();
}

// --- Misión 5: El reto final (cambio de conjuntos) ---
const m5SetList = document.getElementById("m5SetList");
const m5BoardBlock = document.getElementById("m5BoardBlock");
const m5MagicVBoard = document.getElementById("m5MagicVBoard");
const m5MagicVBtns = document.getElementById("m5MagicVBtns");
const m5ConfirmBtn = document.getElementById("m5ConfirmBtn");
const m5ResetBtn = document.getElementById("m5ResetBtn");
const m5Feedback = document.getElementById("m5Feedback");
const m5ReflectionBlock = document.getElementById("m5ReflectionBlock");
const m5CuadernoBlock = document.getElementById("m5CuadernoBlock");
const m5AudioFinalBlock = document.getElementById("m5AudioFinalBlock");
const recordBtnA3M5Final = document.getElementById("recordBtnA3M5Final");
const submitBtnA3M5Final = document.getElementById("submitA3M5Final");
const statusA3M5Final = document.getElementById("statusA3M5Final");

const mission5AudioState = {
  mediaRecorder: null,
  chunks: [],
  blob: null,
  stream: null,
  isRecording: false,
  isSubmitting: false,
};

function ensureMission5LabState() {
  if (!sessionData.mission5Lab) {
    sessionData.mission5Lab = {
      selectedSet: null,
      currentV: [null, null, null, null, null],
      available: [],
      solved: false,
      cuadernoStep: 0,
      finalAudioSubmitted: false,
      finalAudioURL: null,
    };
  }
  if (typeof sessionData.mission5Lab.cuadernoStep !== "number") {
    sessionData.mission5Lab.cuadernoStep = 0;
  }
  if (!Array.isArray(sessionData.mission5Lab.currentV) || sessionData.mission5Lab.currentV.length !== 5) {
    sessionData.mission5Lab.currentV = [null, null, null, null, null];
  }
  if (!Array.isArray(sessionData.mission5Lab.available)) {
    sessionData.mission5Lab.available = [];
  }
  if (typeof sessionData.mission5Lab.solved !== "boolean") {
    sessionData.mission5Lab.solved = false;
  }
  if (typeof sessionData.mission5Lab.finalAudioSubmitted !== "boolean") {
    sessionData.mission5Lab.finalAudioSubmitted = false;
  }
  if (typeof sessionData.mission5Lab.finalAudioURL !== "string" && sessionData.mission5Lab.finalAudioURL !== null) {
    sessionData.mission5Lab.finalAudioURL = null;
  }
}

function getMission5SetNumbers() {
  ensureMission5LabState();
  if (!sessionData.mission5Lab.selectedSet) return [];
  return sessionData.mission5Lab.selectedSet.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
}

function selectMission5Set(setStr) {
  ensureMission5LabState();
  const numbers = setStr.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
  if (numbers.length !== 5) return;
  sessionData.mission5Lab.selectedSet = setStr;
  sessionData.mission5Lab.currentV = [null, null, null, null, null];
  sessionData.mission5Lab.available = numbers.slice();
  sessionData.mission5Lab.solved = false;
  sessionData.mission5Lab.finalAudioSubmitted = false;
  sessionData.mission5Lab.finalAudioURL = null;
  mission5AudioState.blob = null;
  mission5AudioState.isRecording = false;
  mission5AudioState.isSubmitting = false;
  if (m5BoardBlock) m5BoardBlock.style.display = "block";
  renderMission5SetButtons();
  renderMission5Board();
  setMessage(m5Feedback, "Conjunto seleccionado. Construye una V mágica.", "");
  if (statusA3M5Final) setMessage(statusA3M5Final, "", "");
  saveSessionProgress();
  saveProgressToFirestore();
}

function renderMission5SetButtons() {
  if (!m5SetList) return;
  ensureMission5LabState();
  const selected = sessionData.mission5Lab.selectedSet;
  m5SetList.querySelectorAll(".mission5-set-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.set === selected);
  });
}

function renderMission5Board() {
  if (!m5MagicVBoard || !m5MagicVBtns) return;
  ensureMission5LabState();
  const svg = m5MagicVBoard.querySelector("svg");
  if (!svg) return;
  svg.querySelectorAll("text.m5v-num").forEach((node) => node.remove());

  const coords = [
    { x: 210, y: 250 },
    { x: 90, y: 70 },
    { x: 150, y: 160 },
    { x: 270, y: 160 },
    { x: 330, y: 70 },
  ];
  const locked = sessionData.mission5Lab.solved;
  for (let i = 0; i < 5; i++) {
    const circle = document.getElementById(`m5v-pos-${i + 1}`);
    if (!circle) continue;
    circle.setAttribute("data-index", String(i));
    circle.style.cursor = locked ? "not-allowed" : (sessionData.mission5Lab.currentV[i] !== null ? "pointer" : "default");
    if (sessionData.mission5Lab.currentV[i] !== null) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", String(coords[i].x));
      t.setAttribute("y", String(coords[i].y + 8));
      t.setAttribute("class", "m5v-num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "13");
      t.setAttribute("font-family", "Lobster Two, Rancho, sans-serif");
      t.textContent = String(sessionData.mission5Lab.currentV[i]);
      svg.appendChild(t);
    }
  }

  const setNums = getMission5SetNumbers();
  m5MagicVBtns.innerHTML = "";
  setNums.forEach((num) => {
    const btn = document.createElement("button");
    btn.className = "v-num-btn";
    btn.dataset.num = String(num);
    btn.textContent = String(num);
    btn.disabled = locked || !sessionData.mission5Lab.available.includes(num);
    m5MagicVBtns.appendChild(btn);
  });
  if (m5ConfirmBtn) m5ConfirmBtn.disabled = locked;
  if (m5ResetBtn) m5ResetBtn.disabled = locked;
}

function handleMission5NumberClick(event) {
  ensureMission5LabState();
  if (sessionData.mission5Lab.solved) return;
  const btn = event.target.closest(".v-num-btn");
  if (!btn) return;
  const num = Number(btn.dataset.num);
  const emptyIdx = sessionData.mission5Lab.currentV.findIndex((x) => x === null);
  if (emptyIdx === -1 || !sessionData.mission5Lab.available.includes(num)) return;
  sessionData.mission5Lab.currentV[emptyIdx] = num;
  sessionData.mission5Lab.available = sessionData.mission5Lab.available.filter((n) => n !== num);
  renderMission5Board();
  saveSessionProgress();
}

function handleMission5CircleClick(event) {
  ensureMission5LabState();
  if (sessionData.mission5Lab.solved) return;
  const circle = event.target.closest("circle");
  if (!circle) return;
  const idx = Number(circle.getAttribute("data-index"));
  if (Number.isNaN(idx)) return;
  const val = sessionData.mission5Lab.currentV[idx];
  if (val === null) return;
  sessionData.mission5Lab.currentV[idx] = null;
  sessionData.mission5Lab.available.push(val);
  sessionData.mission5Lab.available.sort((a, b) => a - b);
  renderMission5Board();
  saveSessionProgress();
}

function resetMission5Board() {
  ensureMission5LabState();
  if (sessionData.mission5Lab.finalAudioSubmitted) return;
  const nums = getMission5SetNumbers();
  if (!nums.length) return;
  sessionData.mission5Lab.currentV = [null, null, null, null, null];
  sessionData.mission5Lab.available = nums.slice();
  sessionData.mission5Lab.solved = false;
  mission5AudioState.blob = null;
  renderMission5Board();
  setMessage(m5Feedback, "Tablero reiniciado.", "");
  if (statusA3M5Final) setMessage(statusA3M5Final, "", "");
  saveSessionProgress();
}

function checkMission5MagicV() {
  ensureMission5LabState();
  if (!sessionData.mission5Lab.selectedSet) {
    setMessage(m5Feedback, "Primero selecciona un conjunto de números.", "bad");
    return;
  }
  const arr = sessionData.mission5Lab.currentV;
  if (arr.some((x) => x === null)) {
    setMessage(m5Feedback, "Completa toda la V antes de comprobar.", "bad");
    return;
  }
  const left = arr[0] + arr[1] + arr[2];
  const right = arr[0] + arr[3] + arr[4];
  if (left === right) {
    sessionData.mission5Lab.solved = true;
    setMessage(m5Feedback, `¡Correcto! Sí es una V mágica. Ambos brazos suman ${left}.`, "good");
  } else {
    setMessage(m5Feedback, `No es V mágica: brazo izquierdo ${left}, brazo derecho ${right}.`, "bad");
  }
  renderMission5Screen();
  saveSessionProgress();
  saveProgressToFirestore();
}

function syncMission5AudioButtons() {
  if (!recordBtnA3M5Final || !submitBtnA3M5Final) return;
  const locked = Boolean(sessionData?.mission5Lab?.finalAudioSubmitted || mission5AudioState.isSubmitting || !sessionData?.mission5Lab?.solved);
  if (mission5AudioState.isRecording) {
    recordBtnA3M5Final.querySelector("img").src = "../Actividad3/assets/images/boton-detener.png";
    submitBtnA3M5Final.style.display = "none";
  } else if (mission5AudioState.blob) {
    recordBtnA3M5Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
    submitBtnA3M5Final.style.display = "inline-flex";
  } else {
    recordBtnA3M5Final.querySelector("img").src = "../Actividad3/assets/images/grabadora-de-voz.png";
    submitBtnA3M5Final.style.display = "none";
  }
  recordBtnA3M5Final.disabled = locked;
  submitBtnA3M5Final.disabled = locked || !mission5AudioState.blob;
}

function stopMission5RecordingStream() {
  if (mission5AudioState.stream) {
    mission5AudioState.stream.getTracks().forEach((track) => track.stop());
  }
  mission5AudioState.stream = null;
}

async function toggleMission5Recording() {
  ensureMission5LabState();
  if (sessionData.mission5Lab.finalAudioSubmitted || mission5AudioState.isSubmitting || !sessionData.mission5Lab.solved) return;
  if (mission5AudioState.isRecording && mission5AudioState.mediaRecorder) {
    try { mission5AudioState.mediaRecorder.requestData(); } catch (error) {}
    mission5AudioState.mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mission5AudioState.mediaRecorder = recorder;
    mission5AudioState.stream = stream;
    mission5AudioState.chunks = [];
    mission5AudioState.blob = null;
    mission5AudioState.isRecording = true;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) mission5AudioState.chunks.push(event.data);
    };
    recorder.onstop = () => {
      mission5AudioState.isRecording = false;
      mission5AudioState.blob = new Blob(mission5AudioState.chunks, {
        type: mission5AudioState.chunks[0]?.type || "audio/webm",
      });
      stopMission5RecordingStream();
      setMessage(statusA3M5Final, "Audio listo para enviar.", "good");
      syncMission5AudioButtons();
    };
    recorder.start(250);
    setMessage(statusA3M5Final, "Grabando...", "");
    syncMission5AudioButtons();
  } catch (error) {
    setMessage(statusA3M5Final, "No se pudo acceder al micrófono.", "bad");
    mission5AudioState.isRecording = false;
    stopMission5RecordingStream();
    syncMission5AudioButtons();
  }
}

function buildMission5AudioStorageBasePath() {
  return "Actividad3/5Cierre";
}

function buildMission5AudioFileName() {
  if (studentCode === "0000") {
    const nombre = normalizeStorageSegment(studentInfo?.nombre || "invitado");
    return `${nombre}_5cierre`;
  }
  const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"));
  return `${studentCode}_${curso}_5cierre`;
}

async function submitMission5FinalAudio() {
  ensureMission5LabState();
  if (sessionData.mission5Lab.finalAudioSubmitted || mission5AudioState.isSubmitting || !sessionData.mission5Lab.solved) return;
  if (!mission5AudioState.blob || mission5AudioState.blob.size === 0) {
    setMessage(statusA3M5Final, "Primero graba una respuesta.", "bad");
    return;
  }
  const firebaseServices = window.firebaseServices;
  if (!firebaseServices?.storage || !firebaseServices?.db) {
    setMessage(statusA3M5Final, "Firebase no está disponible en este momento.", "bad");
    return;
  }
  mission5AudioState.isSubmitting = true;
  syncMission5AudioButtons();
  setMessage(statusA3M5Final, "Subiendo audio...", "");
  try {
    const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc } = firebaseServices;
    const basePath = buildMission5AudioStorageBasePath();
    const fileName = buildMission5AudioFileName();
    const storageRef = ref(storage, `${basePath}/${fileName}.webm`);
    await uploadBytes(storageRef, mission5AudioState.blob, { contentType: mission5AudioState.blob.type || "audio/webm" });
    const audioURL = await getDownloadURL(storageRef);
    await addDoc(collection(db, "Actividad3"), {
      studentCode,
      curso: studentInfo?.curso || "",
      isGuest: studentCode === "0000",
      tag: "A3M5Cierre",
      componente: "5Cierre",
      storageBasePath: basePath,
      fileName: `${fileName}.webm`,
      audioURL,
    });
    sessionData.mission5Lab.finalAudioSubmitted = true;
    sessionData.mission5Lab.finalAudioURL = audioURL;
    setMessage(statusA3M5Final, "✅ Audio enviado correctamente.", "good");
    const finBtn = document.getElementById("finmision5");
    if (finBtn) {
      finBtn.style.display = "block";
      setupFinMisionBtn(5);
    }
    mission5AudioState.blob = null;
    saveSessionProgress();
    saveProgressToFirestore();
    syncMission5AudioButtons();
  } catch (error) {
    setMessage(statusA3M5Final, "Error al guardar el audio.", "bad");
  } finally {
    mission5AudioState.isSubmitting = false;
    syncMission5AudioButtons();
  }
}

function setupMission5Interactions() {
  if (m5SetList && !m5SetList.dataset.bound) {
    m5SetList.dataset.bound = "1";
    m5SetList.addEventListener("click", (event) => {
      const btn = event.target.closest(".mission5-set-btn");
      if (!btn) return;
      selectMission5Set(btn.dataset.set || "");
    });
  }
  if (m5MagicVBtns && !m5MagicVBtns.dataset.bound) {
    m5MagicVBtns.dataset.bound = "1";
    m5MagicVBtns.addEventListener("click", handleMission5NumberClick);
  }
  if (m5MagicVBoard && !m5MagicVBoard.dataset.bound) {
    m5MagicVBoard.dataset.bound = "1";
    m5MagicVBoard.addEventListener("click", handleMission5CircleClick);
  }
  if (m5ConfirmBtn && !m5ConfirmBtn.dataset.bound) {
    m5ConfirmBtn.dataset.bound = "1";
    m5ConfirmBtn.addEventListener("click", checkMission5MagicV);
  }
  if (m5ResetBtn && !m5ResetBtn.dataset.bound) {
    m5ResetBtn.dataset.bound = "1";
    m5ResetBtn.addEventListener("click", resetMission5Board);
  }
  if (recordBtnA3M5Final && !recordBtnA3M5Final.dataset.bound) {
    recordBtnA3M5Final.dataset.bound = "1";
    recordBtnA3M5Final.addEventListener("click", toggleMission5Recording);
  }
  if (submitBtnA3M5Final && !submitBtnA3M5Final.dataset.bound) {
    submitBtnA3M5Final.dataset.bound = "1";
    submitBtnA3M5Final.addEventListener("click", submitMission5FinalAudio);
  }
  const m5CuadernoNextBtn = document.getElementById("m5CuadernoNextBtn");
  if (m5CuadernoNextBtn && !m5CuadernoNextBtn.dataset.bound) {
    m5CuadernoNextBtn.dataset.bound = "1";
    m5CuadernoNextBtn.addEventListener("click", () => {
      ensureMission5LabState();
      if (sessionData.mission5Lab.finalAudioSubmitted) return;
      const step = sessionData.mission5Lab.cuadernoStep;
      if (step <= 3) {
        sessionData.mission5Lab.cuadernoStep = step + 1;
        saveSessionProgress();
        renderMission5CuadernoFlow();
      }
    });
  }
}

function renderMission5CuadernoFlow() {
  ensureMission5LabState();
  const wrap1 = document.getElementById("m5CuadernoQWrap1");
  const wrap2 = document.getElementById("m5CuadernoQWrap2");
  const wrap3 = document.getElementById("m5CuadernoQWrap3");
  const nextBtn = document.getElementById("m5CuadernoNextBtn");
  if (!m5CuadernoBlock || !wrap1 || !wrap2 || !wrap3 || !nextBtn) return;

  const solved = Boolean(sessionData.mission5Lab.solved);
  if (!solved) {
    m5CuadernoBlock.style.display = "none";
    if (m5AudioFinalBlock) m5AudioFinalBlock.style.display = "none";
    return;
  }

  m5CuadernoBlock.style.display = "block";
  let step = sessionData.mission5Lab.cuadernoStep;
  if (step < 1) step = 1;
  sessionData.mission5Lab.cuadernoStep = step;

  wrap1.style.display = step >= 1 ? "block" : "none";
  wrap2.style.display = step >= 2 ? "block" : "none";
  wrap3.style.display = step >= 3 ? "block" : "none";

  const audioVisible = sessionData.mission5Lab.finalAudioSubmitted || step > 3;
  if (m5AudioFinalBlock) m5AudioFinalBlock.style.display = audioVisible ? "grid" : "none";

  if (sessionData.mission5Lab.finalAudioSubmitted) {
    nextBtn.style.display = "none";
  } else if (step <= 3) {
    nextBtn.style.display = "inline-block";
  } else {
    nextBtn.style.display = "none";
  }
}

function renderMission5Screen() {
  ensureMission5LabState();
  renderMission5SetButtons();
  if (m5BoardBlock) {
    m5BoardBlock.style.display = sessionData.mission5Lab.selectedSet ? "block" : "none";
  }
  if (sessionData.mission5Lab.selectedSet) {
    renderMission5Board();
  }
  const solved = Boolean(sessionData.mission5Lab.solved);
  if (m5ReflectionBlock) m5ReflectionBlock.style.display = solved ? "block" : "none";
  renderMission5CuadernoFlow();
  if (statusA3M5Final && sessionData.mission5Lab.finalAudioSubmitted) {
    setMessage(statusA3M5Final, "✅ Audio enviado correctamente.", "good");
  }
  const finBtn = document.getElementById("finmision5");
  if (finBtn) {
    finBtn.style.display = sessionData.mission5Lab.finalAudioSubmitted ? "block" : "none";
    if (sessionData.mission5Lab.finalAudioSubmitted) setupFinMisionBtn(5);
  }
  syncMission5AudioButtons();
  setupMission5Interactions();
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
    document.getElementById("showMagicVSavedBtn3")
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


// Devuelve el HTML de la tabla de Magic V guardadas
function renderMagicVSavedTable() {
  // Mostrar todas las Magic V encontradas (referencia + variantes)
  const allFound = [magicVState.found[0], ...magicVState.found2].filter(Boolean);
  
  if (!allFound.length) {
    return '<p class="magicv-saved-item-label">Aún no tienes combinaciones guardadas.</p>';
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">';
  
  allFound.forEach((magicV, index) => {
    if (!Array.isArray(magicV) || magicV.length !== 5) return;
    
    const suma = magicV[1] + magicV[2] + magicV[3];
    html += `
      <div style="border: 2px solid #6ec6ff; border-radius: 12px; padding: 12px; text-align: center;">
        <div style="font-size: 0.9rem; margin-bottom: 8px; color: #555;">Magic V ${index + 1}</div>
        <svg width="120" height="100" style="display: block; margin: 0 auto;">
          <line x1="60" y1="80" x2="20" y2="20" stroke="#b3b3ff" stroke-width="3" />
          <line x1="60" y1="80" x2="100" y2="20" stroke="#b3b3ff" stroke-width="3" />
          <circle cx="60" cy="80" r="16" fill="#fff" stroke="#6ec6ff" stroke-width="2" />
          <text x="60" y="85" text-anchor="middle" font-size="12">${magicV[0]}</text>
          <circle cx="20" cy="20" r="16" fill="#fff" stroke="#6ec6ff" stroke-width="2" />
          <text x="20" y="25" text-anchor="middle" font-size="12">${magicV[1]}</text>
          <circle cx="100" cy="20" r="16" fill="#fff" stroke="#6ec6ff" stroke-width="2" />
          <text x="100" y="25" text-anchor="middle" font-size="12">${magicV[2]}</text>
          <circle cx="40" cy="50" r="16" fill="#fff" stroke="#6ec6ff" stroke-width="2" />
          <text x="40" y="55" text-anchor="middle" font-size="12">${magicV[3]}</text>
          <circle cx="80" cy="50" r="16" fill="#fff" stroke="#6ec6ff" stroke-width="2" />
          <text x="80" y="55" text-anchor="middle" font-size="12">${magicV[4]}</text>
        </svg>
        <div style="font-size: 0.85rem; color: #1976d2; margin-top: 8px;">Suma: ${suma}</div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
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
        audioSubmitted: sessionData.mission1.audioSubmitted,
        questionStep: sessionData.mission1.questionStep,
        questionsCompleted: sessionData.mission1.questionsCompleted
      },
      mission2New: {
        audioSubmitted: sessionData.mission2New?.audioSubmitted || false,
        audioURL: sessionData.mission2New?.audioURL || null,
        questionStep: sessionData.mission2New?.questionStep || 0,
        questionsCompleted: sessionData.mission2New?.questionsCompleted || false,
        exploreConfirmed: sessionData.mission2New?.exploreConfirmed || false,
        exploreV: sessionData.mission2New?.exploreV || null,
        exploreSumCorrect: sessionData.mission2New?.exploreSumCorrect || false,
        explore2Confirmed: sessionData.mission2New?.explore2Confirmed || false,
        explore2V: sessionData.mission2New?.explore2V || null,
        cuadernoAnsweredAfterSum: sessionData.mission2New?.cuadernoAnsweredAfterSum || false,
        cuadernoAnsweredAfterExplore2: sessionData.mission2New?.cuadernoAnsweredAfterExplore2 || false,
        finalAudioSubmitted: sessionData.mission2New?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission2New?.finalAudioURL || null
      },
      mission3Lab: {
        currentV: Array.isArray(sessionData.mission3Lab?.currentV) ? sessionData.mission3Lab.currentV : [null, null, null, null, null],
        available: Array.isArray(sessionData.mission3Lab?.available) ? sessionData.mission3Lab.available : [1, 2, 3, 4, 5],
        attempts: Array.isArray(sessionData.mission3Lab?.attempts) ? sessionData.mission3Lab.attempts : [],
        timerStartedAt: sessionData.mission3Lab?.timerStartedAt || null,
        timerFinished: sessionData.mission3Lab?.timerFinished || false,
        cuadernoStep: sessionData.mission3Lab?.cuadernoStep || 0,
        finalAudioSubmitted: sessionData.mission3Lab?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission3Lab?.finalAudioURL || null,
      },
      mission4Lab: {
        currentV: Array.isArray(sessionData.mission4Lab?.currentV) ? sessionData.mission4Lab.currentV : [null, null, null, null, null],
        available: Array.isArray(sessionData.mission4Lab?.available) ? sessionData.mission4Lab.available : [2, 3, 4, 5, 6],
        savedByCore: sessionData.mission4Lab?.savedByCore || { 2: [], 4: [], 6: [] },
        cuadernoStep: sessionData.mission4Lab?.cuadernoStep || 0,
        finalAudioSubmitted: sessionData.mission4Lab?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission4Lab?.finalAudioURL || null,
      },
      mission5Lab: {
        selectedSet: sessionData.mission5Lab?.selectedSet || null,
        currentV: Array.isArray(sessionData.mission5Lab?.currentV) ? sessionData.mission5Lab.currentV : [null, null, null, null, null],
        available: Array.isArray(sessionData.mission5Lab?.available) ? sessionData.mission5Lab.available : [],
        solved: sessionData.mission5Lab?.solved || false,
        cuadernoStep: sessionData.mission5Lab?.cuadernoStep || 0,
        finalAudioSubmitted: sessionData.mission5Lab?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission5Lab?.finalAudioURL || null,
      }
    };
    sessionStorage.setItem("actividad3_sessionData", JSON.stringify(toSave));
  } catch (e) {}
}

// === PERSISTENCIA EN FIRESTORE ===
function buildProgressDocId() {
  if (studentCode === "0000") {
    return `invitado_${normalizeStorageSegment(studentInfo?.nombre || "invitado")}`;
  }
  const curso = normalizeStorageSegment(String(studentInfo?.curso || "sin-curso"));
  return `${studentCode}_${curso}`;
}

async function saveProgressToFirestore() {
  const fs = window.firebaseServices;
  if (!fs?.db || !fs?.setDoc || !fs?.doc) return;
  try {
    const docId = buildProgressDocId();
    const data = {
      character: sessionData.character || null,
      progress: sessionData.progress || 1,
      missionsCompleted: sessionData.missionsCompleted || [],
      updatedAt: fs.serverTimestamp(),
      mission1: {
        magicVFound: (magicVState.found || []).map(arr => arr.join(",")),
        magicVFound2: (magicVState.found2 || []).map(arr => arr.join(",")),
        fixedCore: magicVState.fixedCore ?? null,
        audioSubmitted: sessionData.mission1?.audioSubmitted || false,
        audioURL: sessionData.mission1?.audioURL || null,
        questionStep: sessionData.mission1?.questionStep || 0,
        questionsCompleted: sessionData.mission1?.questionsCompleted || false,
      },
      mission2: {
        saved: sessionData.mission2?.saved || [],
        audioSubmitted: sessionData.mission2?.audioSubmitted || false,
        audioURL: sessionData.mission2?.audioURL || null,
      },
      mission2New: {
        audioSubmitted: sessionData.mission2New?.audioSubmitted || false,
        audioURL: sessionData.mission2New?.audioURL || null,
        questionStep: sessionData.mission2New?.questionStep || 0,
        questionsCompleted: sessionData.mission2New?.questionsCompleted || false,
        exploreConfirmed: sessionData.mission2New?.exploreConfirmed || false,
        exploreV: sessionData.mission2New?.exploreV || null,
        exploreSumCorrect: sessionData.mission2New?.exploreSumCorrect || false,
        explore2Confirmed: sessionData.mission2New?.explore2Confirmed || false,
        explore2V: sessionData.mission2New?.explore2V || null,
        cuadernoAnsweredAfterSum: sessionData.mission2New?.cuadernoAnsweredAfterSum || false,
        cuadernoAnsweredAfterExplore2: sessionData.mission2New?.cuadernoAnsweredAfterExplore2 || false,
        finalAudioSubmitted: sessionData.mission2New?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission2New?.finalAudioURL || null,
      },
      mission3Lab: {
        currentV: Array.isArray(sessionData.mission3Lab?.currentV) ? sessionData.mission3Lab.currentV : [null, null, null, null, null],
        available: Array.isArray(sessionData.mission3Lab?.available) ? sessionData.mission3Lab.available : [1, 2, 3, 4, 5],
        attempts: Array.isArray(sessionData.mission3Lab?.attempts) ? sessionData.mission3Lab.attempts : [],
        timerStartedAt: sessionData.mission3Lab?.timerStartedAt || null,
        timerFinished: sessionData.mission3Lab?.timerFinished || false,
        cuadernoStep: sessionData.mission3Lab?.cuadernoStep || 0,
        finalAudioSubmitted: sessionData.mission3Lab?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission3Lab?.finalAudioURL || null,
      },
      mission4Lab: {
        currentV: Array.isArray(sessionData.mission4Lab?.currentV) ? sessionData.mission4Lab.currentV : [null, null, null, null, null],
        available: Array.isArray(sessionData.mission4Lab?.available) ? sessionData.mission4Lab.available : [2, 3, 4, 5, 6],
        savedByCore: sessionData.mission4Lab?.savedByCore || { 2: [], 4: [], 6: [] },
        cuadernoStep: sessionData.mission4Lab?.cuadernoStep || 0,
        finalAudioSubmitted: sessionData.mission4Lab?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission4Lab?.finalAudioURL || null,
      },
      mission5Lab: {
        selectedSet: sessionData.mission5Lab?.selectedSet || null,
        currentV: Array.isArray(sessionData.mission5Lab?.currentV) ? sessionData.mission5Lab.currentV : [null, null, null, null, null],
        available: Array.isArray(sessionData.mission5Lab?.available) ? sessionData.mission5Lab.available : [],
        solved: sessionData.mission5Lab?.solved || false,
        cuadernoStep: sessionData.mission5Lab?.cuadernoStep || 0,
        finalAudioSubmitted: sessionData.mission5Lab?.finalAudioSubmitted || false,
        finalAudioURL: sessionData.mission5Lab?.finalAudioURL || null,
      },
      mission3: sessionData.mission3 || { respuesta: "", completada: false },
      mission4: sessionData.mission4 || { respuesta: "", completada: false },
      mission5: sessionData.mission5 || { respuesta: "", completada: false },
    };
    await fs.setDoc(fs.doc(fs.db, "actividad3_progreso", docId), data, { merge: true });
  } catch (e) {
    console.warn("No se pudo guardar progreso en Firestore:", e);
  }
}

async function loadProgressFromFirestore() {
  const fs = window.firebaseServices;
  if (!fs?.db || !fs?.getDoc || !fs?.doc) return null;
  try {
    const docId = buildProgressDocId();
    const snap = await fs.getDoc(fs.doc(fs.db, "actividad3_progreso", docId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("No se pudo cargar progreso de Firestore:", e);
    return null;
  }
}

function restoreProgressFromData(data) {
  if (!data) return;
  if (data.character) sessionData.character = data.character;
  if (typeof data.progress === "number") sessionData.progress = data.progress;
  if (Array.isArray(data.missionsCompleted)) sessionData.missionsCompleted = data.missionsCompleted;
  if (data.mission1) {
    if (Array.isArray(data.mission1.magicVFound)) {
      magicVState.found = data.mission1.magicVFound
        .filter(s => s)
        .map(s => s.split(",").map(Number));
    }
    if (Array.isArray(data.mission1.magicVFound2)) {
      magicVState.found2 = data.mission1.magicVFound2
        .filter(s => s)
        .map(s => s.split(",").map(Number));
    }
    if (data.mission1.fixedCore !== null && data.mission1.fixedCore !== undefined) {
      magicVState.fixedCore = data.mission1.fixedCore;
    }
    if (sessionData.mission1) {
      sessionData.mission1.audioSubmitted = data.mission1.audioSubmitted || false;
      sessionData.mission1.audioURL = data.mission1.audioURL || null;
      sessionData.mission1.questionStep = typeof data.mission1.questionStep === "number" ? data.mission1.questionStep : 0;
      sessionData.mission1.questionsCompleted = data.mission1.questionsCompleted || false;
    }
  }
  if (data.mission2) {
    if (Array.isArray(data.mission2.saved)) sessionData.mission2.saved = data.mission2.saved;
    sessionData.mission2.audioSubmitted = data.mission2.audioSubmitted || false;
    sessionData.mission2.audioURL = data.mission2.audioURL || null;
    if (sessionData.mission2.audioSubmitted) sessionData.mission2.explorationUnlocked = true;
  }
  if (data.mission2New) {
    sessionData.mission2New.audioSubmitted = data.mission2New.audioSubmitted || false;
    sessionData.mission2New.audioURL = data.mission2New.audioURL || null;
    sessionData.mission2New.questionStep = typeof data.mission2New.questionStep === "number" ? data.mission2New.questionStep : 0;
    sessionData.mission2New.questionsCompleted = data.mission2New.questionsCompleted || false;
    sessionData.mission2New.exploreConfirmed = data.mission2New.exploreConfirmed || false;
    sessionData.mission2New.exploreV = Array.isArray(data.mission2New.exploreV) ? data.mission2New.exploreV : null;
    sessionData.mission2New.exploreSumCorrect = data.mission2New.exploreSumCorrect || false;
    sessionData.mission2New.explore2Confirmed = data.mission2New.explore2Confirmed || false;
    sessionData.mission2New.explore2V = Array.isArray(data.mission2New.explore2V) ? data.mission2New.explore2V : null;
    sessionData.mission2New.cuadernoAnsweredAfterSum = data.mission2New.cuadernoAnsweredAfterSum || false;
    sessionData.mission2New.cuadernoAnsweredAfterExplore2 = data.mission2New.cuadernoAnsweredAfterExplore2 || false;
    sessionData.mission2New.finalAudioSubmitted = data.mission2New.finalAudioSubmitted || false;
    sessionData.mission2New.finalAudioURL = data.mission2New.finalAudioURL || null;
  }
  if (data.mission3Lab) {
    sessionData.mission3Lab.currentV = Array.isArray(data.mission3Lab.currentV) ? data.mission3Lab.currentV : [null, null, null, null, null];
    sessionData.mission3Lab.available = Array.isArray(data.mission3Lab.available) ? data.mission3Lab.available : [1, 2, 3, 4, 5];
    sessionData.mission3Lab.attempts = Array.isArray(data.mission3Lab.attempts) ? data.mission3Lab.attempts : [];
    sessionData.mission3Lab.timerStartedAt = data.mission3Lab.timerStartedAt || null;
    sessionData.mission3Lab.timerFinished = Boolean(data.mission3Lab.timerFinished);
    sessionData.mission3Lab.cuadernoStep = typeof data.mission3Lab.cuadernoStep === "number" ? data.mission3Lab.cuadernoStep : 0;
    sessionData.mission3Lab.finalAudioSubmitted = Boolean(data.mission3Lab.finalAudioSubmitted);
    sessionData.mission3Lab.finalAudioURL = data.mission3Lab.finalAudioURL || null;
  }
  if (data.mission4Lab) {
    sessionData.mission4Lab.currentV = Array.isArray(data.mission4Lab.currentV) ? data.mission4Lab.currentV : [null, null, null, null, null];
    sessionData.mission4Lab.available = Array.isArray(data.mission4Lab.available) ? data.mission4Lab.available : [2, 3, 4, 5, 6];
    sessionData.mission4Lab.savedByCore = data.mission4Lab.savedByCore || { 2: [], 4: [], 6: [] };
    sessionData.mission4Lab.cuadernoStep = typeof data.mission4Lab.cuadernoStep === "number" ? data.mission4Lab.cuadernoStep : 0;
    sessionData.mission4Lab.finalAudioSubmitted = Boolean(data.mission4Lab.finalAudioSubmitted);
    sessionData.mission4Lab.finalAudioURL = data.mission4Lab.finalAudioURL || null;
  }
  if (data.mission5Lab) {
    sessionData.mission5Lab.selectedSet = data.mission5Lab.selectedSet || null;
    sessionData.mission5Lab.currentV = Array.isArray(data.mission5Lab.currentV) ? data.mission5Lab.currentV : [null, null, null, null, null];
    sessionData.mission5Lab.available = Array.isArray(data.mission5Lab.available) ? data.mission5Lab.available : [];
    sessionData.mission5Lab.solved = Boolean(data.mission5Lab.solved);
    sessionData.mission5Lab.cuadernoStep = typeof data.mission5Lab.cuadernoStep === "number" ? data.mission5Lab.cuadernoStep : 0;
    sessionData.mission5Lab.finalAudioSubmitted = Boolean(data.mission5Lab.finalAudioSubmitted);
    sessionData.mission5Lab.finalAudioURL = data.mission5Lab.finalAudioURL || null;
  }
  if (data.mission3) sessionData.mission3 = data.mission3;
  if (data.mission4) sessionData.mission4 = data.mission4;
  if (data.mission5) sessionData.mission5 = data.mission5;
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
  setupMissions345();
  setupMission2FinalAudio();
  setupMission2ReglaAudio();
  setupM2ExploreInteraction();
}

function setupMissions345() {
  // Completar misiones 3, 4 y 5
  [3, 4, 5].forEach(n => {
    const btn = document.getElementById(`completeMission${n}Btn`);
    const ta = document.getElementById(`m${n}Input`);
    if (!btn || !ta) return;
    btn.addEventListener("click", () => {
      const text = ta.value.trim();
      if (!text) {
        const orig = btn.textContent;
        btn.textContent = "⚠ Escribe algo primero";
        setTimeout(() => { btn.textContent = orig; }, 2000);
        ta.focus();
        return;
      }
      sessionData[`mission${n}`] = { respuesta: text, completada: true };
      if (!sessionData.missionsCompleted.includes(n)) {
        sessionData.missionsCompleted.push(n);
        sessionData.progress = Math.max(sessionData.progress || 1, n + 1);
      }
      saveSessionProgress();
      saveProgressToFirestore();
      renderMap();
      animateMapReveal(n);
      showScreen("mapScreen");
    });
  });
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

  confirmYesBtn.addEventListener("click", async () => {
    confirmContainer.style.display = "none";
    activityApp.style.display = "block";
    const saved = await loadProgressFromFirestore();
    if (saved && saved.character && typeof saved.progress === "number" && saved.progress >= 1) {
      restoreProgressFromData(saved);
      hydrateGuideBadges();
      renderMission3Screen();
      showScreen("mapScreen");
    } else {
      showScreen("introductionScreen");
    }
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
  const isValidHover = hoveredMission && (
    (currentMission && hoveredMission === currentMission) ||
    sessionData.missionsCompleted.includes(hoveredMission)
  );

  missionNodes.forEach((node) => {
    node.classList.remove("drop-hover");
  });

  if (isValidHover && hoveredNode) {
    hoveredNode.classList.add("drop-hover");
    dragState.hoverMission = hoveredMission;
    const label = sessionData.missionsCompleted.includes(hoveredMission)
      ? `Suelta para revisar la mision ${hoveredMission}.`
      : `Suelta para entrar a la mision ${hoveredMission}.`;
    setMessage(mapHint, label, "good");
    return;
  }

  dragState.hoverMission = null;
  setMessage(mapHint, "Suelta sobre el marcador activo para abrir la siguiente mision.", "");
}

function finishGuideDrag(clientX, clientY) {
  const currentMission = getCurrentAvailableMission();
  const droppedNode = document.elementFromPoint(clientX, clientY)?.closest(".mission-node");
  const droppedMission = droppedNode ? Number(droppedNode.dataset.mission) : null;
  const isValidDrop = droppedMission && (
    (currentMission && droppedMission === currentMission) ||
    sessionData.missionsCompleted.includes(droppedMission)
  );

  if (isValidDrop) {
    openMission(droppedMission);
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
  if (mission === 2) {
    renderMission2CoreScreen();
  }
  if (mission === 3) {
    renderMission3Screen();
  }
  if (mission === 4) {
    renderMission4Screen();
  }
  if (mission === 5) {
    renderMission5Screen();
  }
  if (sessionData.missionsCompleted.includes(mission)) {
    applyReviewMode(mission);
  }
}

function applyReviewMode(missionNum) {
  const screen = document.getElementById(`mission${missionNum}Screen`);
  if (!screen) return;
  // Banner de revisión
  let banner = screen.querySelector(".review-mode-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "review-mode-banner";
    banner.innerHTML = "📖 <strong>Modo revisión</strong> — Solo lectura";
    banner.style.cssText = "background:#1976d2;color:#fff;padding:8px 16px;border-radius:8px;margin:8px 0 16px;text-align:center;font-family:Rancho,sans-serif;font-size:1.1rem;display:block;";
    const container = screen.querySelector(".mission-visual-container");
    if (container) container.insertBefore(banner, container.firstChild);
  }
  banner.style.display = "block";
  if (missionNum === 1) {
    if (magicVState.found.length > 0) {
      magicVState.v = magicVState.found[0].slice();
      renderMagicVBoard();
      renderMagicVFoundListA();
    }
    if (parteBm1) {
      parteBm1.style.display = "block";
      if (magicVNextQ) magicVNextQ.style.display = "block";
      if (magicVTotalInput) {
        const reviewMagicV = magicVState.found[0];
        if (Array.isArray(reviewMagicV) && reviewMagicV.length === 5) {
          const reviewTotal = reviewMagicV[0] + reviewMagicV[2] + reviewMagicV[1];
          magicVTotalInput.value = String(reviewTotal);
        }
        magicVTotalInput.disabled = true;
        magicVTotalInput.readOnly = true;
      }
      if (magicVTotalCheckBtn) magicVTotalCheckBtn.disabled = true;
      const boardRowF = document.getElementById("magicVBoardRowF");
      if (boardRowF) boardRowF.style.display = "flex";
      renderMagicVTable();
      const finalBlock = document.getElementById("magicVTableFinalBlock");
      if (finalBlock) finalBlock.style.display = "block";
      if (sessionData?.mission1) {
        sessionData.mission1.questionsCompleted = true;
        sessionData.mission1.questionStep = 2;
      }
      renderMission1QuestionFlow();
      const finBtnReview = document.getElementById("finmision1");
      if (finBtnReview) {
        finBtnReview.style.display = "block";
        finBtnReview.disabled = false;
      }
      setupFinMisionBtn(1);
    }
    if (statusA3M1Final && sessionData.mission1?.audioSubmitted) {
      setMessage(statusA3M1Final, "✅ Audio enviado anteriormente.", "good");
    }
    // Bloquea drag/drop y clics de las V en modo lectura
    if (magicVBoard) magicVBoard.style.pointerEvents = "none";
    if (magicVButtons) magicVButtons.style.pointerEvents = "none";
    if (magicVBoard2) magicVBoard2.style.pointerEvents = "none";
    if (magicVButtons2) magicVButtons2.style.pointerEvents = "none";
    if (magicVActions2) magicVActions2.style.pointerEvents = "none";
  }
  if (missionNum === 2) {
    renderMission2CoreScreen();
    if (statusA3M2Final && sessionData.mission2New?.audioSubmitted) {
      setMessage(statusA3M2Final, "✅ Audio enviado anteriormente.", "good");
    }
    // En revisión: mostrar todos los bloques que el estudiante completó
    const blocksToShow = [
      "mission2ExploreBlock",
      "m2ExploreSumBlock",
      "m2ExploreCuadernoBlock",
      "m2Explore2Block",
      "m2Explore2CuadernoBlock",
      "m2ExploreFinalBlock"
    ];
    blocksToShow.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "block";
    });
    // Mostrar el botón fin misión 2
    const finBtnReview2 = document.getElementById("finmision2");
    if (finBtnReview2) {
      finBtnReview2.style.display = "block";
      finBtnReview2.disabled = false;
      setupFinMisionBtn(2);
    }
  }
  if (missionNum === 3) {
    ensureMission3LabState();
    sessionData.mission3Lab.timerFinished = true;
    if (sessionData.mission3Lab.cuadernoStep < 4) {
      sessionData.mission3Lab.cuadernoStep = 4;
    }
    renderMission3Screen();
    if (statusA3M3Final && sessionData.mission3Lab?.finalAudioSubmitted) {
      setMessage(statusA3M3Final, "✅ Audio enviado anteriormente.", "good");
    }
    const finBtnReview3 = document.getElementById("finmision3");
    if (finBtnReview3 && sessionData.mission3Lab?.finalAudioSubmitted) {
      finBtnReview3.style.display = "block";
      finBtnReview3.disabled = false;
      setupFinMisionBtn(3);
    }
  }
  if (missionNum === 4) {
    ensureMission4LabState();
    if (sessionData.mission4Lab.cuadernoStep < 4) {
      sessionData.mission4Lab.cuadernoStep = 4;
    }
    renderMission4Screen();
    if (statusA3M4Final && sessionData.mission4Lab?.finalAudioSubmitted) {
      setMessage(statusA3M4Final, "✅ Audio enviado anteriormente.", "good");
    }
    const finBtnReview4 = document.getElementById("finmision4");
    if (finBtnReview4 && sessionData.mission4Lab?.finalAudioSubmitted) {
      finBtnReview4.style.display = "block";
      finBtnReview4.disabled = false;
      setupFinMisionBtn(4);
    }
  }
  if (missionNum === 5) {
    ensureMission5LabState();
    sessionData.mission5Lab.solved = true;
    renderMission5Screen();
    if (statusA3M5Final && sessionData.mission5Lab?.finalAudioSubmitted) {
      setMessage(statusA3M5Final, "✅ Audio enviado anteriormente.", "good");
    }
    const finBtnReview5 = document.getElementById("finmision5");
    if (finBtnReview5 && sessionData.mission5Lab?.finalAudioSubmitted) {
      finBtnReview5.style.display = "block";
      finBtnReview5.disabled = false;
      setupFinMisionBtn(5);
    }
    if (m5SetList) m5SetList.querySelectorAll("button").forEach((btn) => { btn.disabled = true; });
    if (m5ConfirmBtn) m5ConfirmBtn.disabled = true;
    if (m5ResetBtn) m5ResetBtn.disabled = true;
  }
  // Deshabilitar todos los botones, excepto navegación y (en misión 1) activar sistema
  screen.querySelectorAll("button").forEach((btn) => {
    const isInfoBtn = btn.classList.contains("btn-info");
    const isMission1ActivateSystem = missionNum === 1 && btn.id === "finmision1";
    const isMission2ActivateSystem = missionNum === 2 && btn.id === "finmision2";
    const isMission3ActivateSystem = missionNum === 3 && btn.id === "finmision3";
    const isMission4ActivateSystem = missionNum === 4 && btn.id === "finmision4";
    const isMission5ActivateSystem = missionNum === 5 && btn.id === "finmision5";
    if (isInfoBtn || isMission1ActivateSystem || isMission2ActivateSystem || isMission3ActivateSystem || isMission4ActivateSystem || isMission5ActivateSystem) {
      btn.disabled = false;
      return;
    }
    btn.disabled = true;
  });
  screen.querySelectorAll("textarea").forEach(ta => { ta.disabled = true; });
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
      stateSpan.textContent = "🔓";
      stateSpan.setAttribute("aria-label", "Mision disponible");
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
if (typeof hydrateGuideBadges === 'function') {
  const originalHydrateGuideBadges = hydrateGuideBadges;
  hydrateGuideBadges = function() {
    originalHydrateGuideBadges();
    renderGuideBadgeInMissions();
  };
}