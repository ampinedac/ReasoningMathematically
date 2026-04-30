// === Audio misión 1: grabar/detener/enviar ===
const recordBtnA3M1Final = document.getElementById("recordBtnA3M1Final");
const submitBtnA3M1Final = document.getElementById("submitA3M1Final");
const statusA3M1Final = document.getElementById("statusA3M1Final");
let mediaRecorderA3M1 = null;
let audioChunksA3M1 = [];
let audioBlobA3M1 = null;
let isRecordingA3M1 = false;
let isSubmittingA3M1 = false;

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
      const basePath = "Actividad3/1Exploración";
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
        componente: "1Exploración",
        storageBasePath: basePath,
        fileName: `${fileName}.webm`,
        audioURL,
      });
      setMessage(statusA3M1Final, "✅ Audio enviado correctamente.", "good");
      // Mostrar botón de fin de misión
      const finBtn = document.getElementById("finmision1");
      if (finBtn) finBtn.style.display = "inline-block";
      // Reset visual
      audioBlobA3M1 = null;
      isSubmittingA3M1 = false;
      syncFinalAudioButtons();
    // Lógica para botón finmision1: animación y redirección al mapa
    (function() {
      function setupFinMisionBtn(missionId) {
        const finBtn = document.getElementById(`finmision${missionId}`);
        if (finBtn) {
          finBtn.addEventListener("click", () => {
            // Mostrar burbuja de felicitación y animación de mapa
            const bubble = document.getElementById(`felicitacionMision${missionId}`);
            if (bubble) {
              bubble.style.display = "block";
              bubble.classList.add("show");
              setTimeout(() => {
                bubble.classList.remove("show");
                bubble.style.display = "none";
                // Sincronizar fog y glow del mapa igual que los botones de desarrollo
                if (typeof syncMapFogWithProgress === "function") syncMapFogWithProgress();
                // Animar la zona rescatada de la misión correspondiente
                if (typeof animateMapReveal === "function") animateMapReveal(missionId);
                // Desbloquear misión 2 si se completa la misión 1
                if (missionId === 1 && typeof unlockMission2Exploration === "function") {
                  unlockMission2Exploration();
                }
                // Ir al mapa
                showScreen("mapScreen");
              }, 2200);
            } else {
              // Fallback: solo ir al mapa
              showScreen("mapScreen");
            }
          });
        }
      }
      // Configurar para misión 1 (puedes llamar para otras misiones si existen)
      setupFinMisionBtn(1);
    })();
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
    } else {
      finalBlock.style.display = "none";
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
      audioSubmitted: false
    },
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

// Parche defensivo: asegurar que mission1 existe y tiene la estructura correcta
if (typeof sessionData.mission1 === 'undefined') {
  sessionData.mission1 = {
    current: {},
    saved: [],
    explorationUnlocked: false,
    audioSubmitted: false
  };
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
  // Avanzar el progreso a misión 2 si corresponde
  if (typeof sessionData.progress === "number" && sessionData.progress < 2) {
    sessionData.progress = 2;
  }
  syncMission2ExplorationState();
  if (typeof renderMap === "function") renderMap();
  // Sincronizar botones de desarrollo si existen
  if (typeof syncDevMissionBtns === "function") syncDevMissionBtns();
  if (!sessionData.mission2.audioSubmitted && !mission2AudioState.blob) {
    setMessage(mission2AudioStatus, "Cuando estés lista, graba tu respuesta y envíala.", "");
  }
}

// Sincroniza el estado visual de los botones de desarrollo (dev-mission-btn) con el progreso actual
function syncDevMissionBtns() {
  const devBtns = document.querySelectorAll('.dev-mission-btn');
  devBtns.forEach(btn => {
    const missionNum = Number(btn.dataset.mission);
    if (!missionNum) return;
    if (missionNum === sessionData.progress) {
      btn.classList.add('btn-primary');
      btn.disabled = false;
    } else if (sessionData.missionsCompleted.includes(missionNum)) {
      btn.classList.remove('btn-primary');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-primary');
      btn.disabled = true;
    }
  });
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
        setMessage(magicVFeedback2, "Esta V mágica ya está registrada.", "bad");
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
        setMessage(magicVFeedback2, `Esta V mágica es equivalente a la registrada con núcleo ${nucleo} porque la suma mágica es la misma.`, "good");
        renderMission2SavedCombinations();
        clearMission2Board(false);
        return;
      }
      setMessage(magicVFeedback2, "Esta V mágica ya tiene ese núcleo pero no es una permutación válida.", "bad");
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
if (typeof hydrateGuideBadges === 'function') {
  const originalHydrateGuideBadges = hydrateGuideBadges;
  hydrateGuideBadges = function() {
    originalHydrateGuideBadges();
    renderGuideBadgeInMissions();
  };
}