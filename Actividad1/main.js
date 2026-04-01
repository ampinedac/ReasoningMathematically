// main.js – Actividad1 · Lógica principal
// Punto de entrada: módulo ES, se carga con type="module"

import {
    db, storage,
    collection, addDoc, serverTimestamp,
    ref, uploadBytes, getDownloadURL
} from './firebase.js';

// ─────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────
let studentCode = null;
let studentInfo = null;

// Índice del spread visible (0-based, donde 0 = spread 1-2)
let currentSpread = 0;

// Submits completados (para habilitar "siguiente" en cada spread)
let m1q1Submitted = false;
let m1q2Submitted = false;
let m3q1Submitted = false;
let m3q2Submitted = false;

// Cocina completada
let cocinaCompleted = false;

// Ejercicios M4
let m4Lives = 3;
let m4Errors = 0;       // total de errores acumulados
let m4CurrentEx = 0;    // ejercicio actual (0-based)
let m4Exercises = [];   // array con los 5 ejercicios generados
let m4Finalized = false;
let m4AttemptsOnCurrent = 0; // intentos fallidos en el ejercicio actual

// Grabaciones de audio en vuelo
const audioState = {};  // key: tag →  { mediaRecorder, chunks, blob }

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initVisibility();
    initWelcome();
    initConfirmation();
    initPortada();
    initNavigation();
    initBoard();
    initAudioRecorder('M1Q1');
    initAudioRecorder('M1Q2');
    initAudioRecorder('M3Q1');
    initAudioRecorder('M3Q2');
    initRadioSpreads();
    initCocinaSystem();
    initM4();
    initEncuesta();
});

// ─────────────────────────────────────────────
// 1. VISIBILIDAD INICIAL
// ─────────────────────────────────────────────
function initVisibility() {
    hide('ContenedorConfirmacion');
    hide('ContenedorPortada');
    hide('ContenedorLibro');
    hide('ContenedorCocina');
    hide('prevBtn');
    hide('nextBtn');
    // La sección derecha del spread 13-14 inicia oculta
    const q2Right = document.getElementById('q2RightPage');
    if (q2Right) {
        // Ocultamos solo el contenido dinámico, no la imagen de portada
        const finalQ = document.getElementById('m1Q2FinalQuestion');
        if (finalQ) hide('m1Q2FinalQuestion');
    }
    // Ocultar sección de audio M3 (se activa con los radios)
    hide('promptSection1');
    hide('promptSection2');
    // Ocultar sección final M4
    hide('finalQuestionSection');
    hide('magicCanvas');
    hide('confettiCanvas');
}

function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}
function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
function setVisible(id, visible) {
    if (visible) show(id); else hide(id);
}

// ─────────────────────────────────────────────
// 2. BIENVENIDA – solo números en el input
// ─────────────────────────────────────────────
function initWelcome() {
    const input = document.getElementById('studentCodeInput');
    const btn   = document.getElementById('enterBtn');
    const err   = document.getElementById('welcomeError');

    if (!input || !btn) return;

    // Bloquear caracteres no numéricos
    input.addEventListener('keydown', e => {
        const allowed = [
            'Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'
        ];
        if (allowed.includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return; // Ctrl+A / Ctrl+C / etc.
        if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '');
    });

    input.addEventListener('keypress', e => { if (e.key === 'Enter') btn.click(); });

    btn.addEventListener('click', () => {
        const code = input.value.trim();
        if (!code) { showError(err, 'Por favor escribe tu código.'); return; }
        if (!/^\d+$/.test(code)) { showError(err, 'Solo se permiten números.'); return; }

        const estudiante = (window.estudiantesData || {})[code];
        if (!estudiante) { showError(err, 'Código no encontrado. Verifica que esté bien escrito.'); return; }

        err.textContent = '';
        studentCode = code;
        studentInfo = estudiante;

        // Rellenar pregunta de confirmación
        const q = document.getElementById('confirmationQuestion');
        if (q) {
            const nombre = toTitle(estudiante.nombre);
            const apellidos = toTitle(estudiante.apellidos || '');
            if (estudiante.curso === 'DOCENTE') {
                q.textContent = `¿Eres ${nombre} ${apellidos}?`;
            } else {
                q.textContent = `¿Eres ${nombre} ${apellidos} del curso ${estudiante.curso}?`;
            }
        }

        hide('ContenedorBienvenida');
        show('ContenedorConfirmacion');
    });
}

function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
}

function toTitle(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─────────────────────────────────────────────
// 3. CONFIRMACIÓN
// ─────────────────────────────────────────────
function initConfirmation() {
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn  = document.getElementById('confirmNoBtn');

    yesBtn?.addEventListener('click', () => {
        // Mostrar código en el spread del libro
        document.querySelectorAll('#studentCodeM1').forEach(el => {
            el.textContent = studentCode ? `Código: ${studentCode}` : '';
        });
        hide('ContenedorConfirmacion');
        show('ContenedorPortada');
    });

    noBtn?.addEventListener('click', () => {
        studentCode = null;
        studentInfo = null;
        document.getElementById('studentCodeInput').value = '';
        document.getElementById('welcomeError').textContent = '';
        hide('ContenedorConfirmacion');
        show('ContenedorBienvenida');
    });
}

// ─────────────────────────────────────────────
// 4. PORTADA
// ─────────────────────────────────────────────
function initPortada() {
    const btn = document.getElementById('btnContinuarPortada');
    btn?.addEventListener('click', () => {
        hide('ContenedorPortada');
        show('ContenedorLibro');
        show('prevBtn');
        show('nextBtn');
        goToSpread(0);
    });
}

// ─────────────────────────────────────────────
// 5. SPREADS – navegación
// ─────────────────────────────────────────────
function getSpreads() {
    return Array.from(document.querySelectorAll('#ContenedorLibro .page.q1-book-spread'));
}

function goToSpread(index) {
    const spreads = getSpreads();
    spreads.forEach((s, i) => {
        s.style.display = (i === index) ? '' : 'none';
    });
    currentSpread = index;
    updateNavButtons();
}

function updateNavButtons() {
    const spreads = getSpreads();
    const total = spreads.length;
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');

    if (prev) {
        const canGoBack = currentSpread > 0;
        prev.disabled = !canGoBack;
        prev.style.opacity = canGoBack ? '1' : '0.3';
        prev.style.cursor  = canGoBack ? 'pointer' : 'not-allowed';
    }

    if (next) {
        const canGoNext = canAdvance();
        next.disabled = !canGoNext;
        next.style.opacity = canGoNext ? '1' : '0.3';
        next.style.cursor  = canGoNext ? 'pointer' : 'not-allowed';
    }
}

// Regla de qué spreads requieren submit para avanzar (índices 0-based):
// spread 5 = páginas 11-12 → requiere m1q1Submitted
// spread 6 = páginas 13-14 → requiere m1q2Submitted
// spread 7 = páginas 15-16 → requiere m3q1Submitted
// spread 8 = páginas 17-18 → requiere m3q2Submitted
function canAdvance() {
    const spreads = getSpreads();
    if (currentSpread >= spreads.length - 1) {
        // Último spread: requiere al menos 1 opción de reflexión marcada
        const checked = document.querySelectorAll('input[name="m4Reflection"]:checked');
        return checked.length >= 1;
    }

    if (currentSpread === 5) return m1q1Submitted;
    if (currentSpread === 6) return m1q2Submitted;
    if (currentSpread === 7) return m3q1Submitted;
    if (currentSpread === 8) return m3q2Submitted;
    return true;
}

function initNavigation() {
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (currentSpread > 0) goToSpread(currentSpread - 1);
    });
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (canAdvance()) goToSpread(currentSpread + 1);
    });
}

// ─────────────────────────────────────────────
// 6. SPREAD 11-12 – CANVAS (tablero de dibujo)
// ─────────────────────────────────────────────
function initBoard() {
    const canvas = document.getElementById('boardCanvasM1Q1');
    if (!canvas) return;

    // Ajustar tamaño al contenedor
    const wrapper = canvas.parentElement;
    const resize  = () => {
        canvas.width  = wrapper.offsetWidth  || 400;
        canvas.height = wrapper.offsetHeight || 300;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    let drawing = false;
    let tool = 'black'; // herramienta activa

    // Miniatura (thumbnail) → un canvas más pequeño aparte
    const thumb = document.createElement('canvas');
    thumb.id = 'boardThumbM1Q1';
    thumb.className = 'board-thumbnail';
    thumb.width  = 120;
    thumb.height = 80;
    canvas.parentElement.insertAdjacentElement('afterend', thumb);

    const syncThumb = () => {
        const tctx = thumb.getContext('2d');
        tctx.clearRect(0, 0, thumb.width, thumb.height);
        tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    };

    const getPos = e => {
        const rect = canvas.getBoundingClientRect();
        const src  = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    const startDraw = e => {
        e.preventDefault();
        drawing = true;
        const {x, y} = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        applyToolStyle(ctx, tool);
    };

    const draw = e => {
        if (!drawing) return;
        e.preventDefault();
        const {x, y} = getPos(e);
        if (tool === 'eraser') {
            ctx.clearRect(x - 12, y - 12, 24, 24);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        syncThumb();
    };

    const endDraw = e => { drawing = false; syncThumb(); };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup',   endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove',  draw,       { passive: false });
    canvas.addEventListener('touchend',   endDraw);

    // Botones de herramienta
    document.querySelectorAll('.board-tools .tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tool = btn.dataset.tool;
            if (tool === 'clear') {
                if (confirm('¿Estás segur@ de que quieres limpiar todo el tablero?')) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    syncThumb();
                }
                tool = 'black'; // volver al lápiz negro después de limpiar
            }
        });
    });
}

function applyToolStyle(ctx, tool) {
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    if (tool === 'black') {
        ctx.globalAlpha     = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle     = '#000000';
        ctx.lineWidth       = 3;
    } else if (tool === 'red') {
        ctx.globalAlpha     = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle     = '#e53e3e';
        ctx.lineWidth       = 3;
    } else if (tool === 'yellow') {
        ctx.globalAlpha     = 0.5;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle     = '#f6e05e';
        ctx.lineWidth       = 14;
    }
}

// Canvas → Blob (para subir a Firebase Storage)
function canvasToBlob(canvasId) {
    return new Promise(resolve => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) { resolve(null); return; }
        canvas.toBlob(blob => resolve(blob), 'image/png');
    });
}

// ─────────────────────────────────────────────
// 7. GRABACIÓN DE AUDIO (genérica por tag)
// ─────────────────────────────────────────────
// tag: 'M1Q1' | 'M1Q2' | 'M3Q1' | 'M3Q2'
function initAudioRecorder(tag) {
    const recordBtn = document.getElementById(`recordBtn${tag}`);
    const stopBtn   = document.getElementById(`stopBtn${tag}`);
    const statusEl  = document.getElementById(`audioStatus${tag}`);
    if (!recordBtn || !stopBtn) return;

    audioState[tag] = { mediaRecorder: null, chunks: [], blob: null };

    // Estado inicial: stopBtn oculto
    stopBtn.style.display = 'none';

    recordBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            audioState[tag].mediaRecorder = mr;
            audioState[tag].chunks = [];
            audioState[tag].blob   = null;

            mr.ondataavailable = e => { if (e.data.size > 0) audioState[tag].chunks.push(e.data); };
            mr.onstop = () => {
                audioState[tag].blob = new Blob(audioState[tag].chunks, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                if (statusEl) statusEl.textContent = '✅ Audio listo para enviar';
                // Habilitar botón de envío
                const submitBtn = document.getElementById(`submit${tag}`);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor  = 'pointer';
                }
                // Volver a mostrar grabar, ocultar detener
                recordBtn.style.display = '';
                stopBtn.style.display   = 'none';
                recordBtn.disabled = true; // ya grabó, no graba otra vez
                recordBtn.style.opacity = '0.4';
            };

            mr.start();
            recordBtn.style.display = 'none';
            stopBtn.style.display   = '';
            if (statusEl) statusEl.textContent = '🔴 Grabando...';
        } catch (err) {
            console.error('❌ Error al acceder al micrófono:', err);
            if (statusEl) statusEl.textContent = 'No se pudo acceder al micrófono.';
        }
    });

    stopBtn.addEventListener('click', () => {
        const mr = audioState[tag].mediaRecorder;
        if (mr && mr.state === 'recording') mr.stop();
    });

    // Submit de audio (+ imagen de canvas si aplica)
    const submitBtn = document.getElementById(`submit${tag}`);
    submitBtn?.addEventListener('click', () => handleSubmit(tag));
}

// ─────────────────────────────────────────────
// 8. ENVÍO A FIREBASE
// ─────────────────────────────────────────────
async function handleSubmit(tag) {
    const submitBtn = document.getElementById(`submit${tag}`);
    const statusEl  = document.getElementById(`status${tag}`);
    const audioBlob = audioState[tag]?.blob;

    if (!audioBlob) return;

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.4';
    if (statusEl) { statusEl.textContent = 'Subiendo...'; statusEl.style.color = '#555'; }

    try {
        const basePath = `Actividad1/${studentCode}/${tag}`;
        const timestamp = Date.now();

        // Subir audio
        const audioRef = ref(storage, `${basePath}/audio_${timestamp}.webm`);
        await uploadBytes(audioRef, audioBlob);
        const audioURL = await getDownloadURL(audioRef);

        let imageURL = null;

        // Si es M1Q1 también subir imagen del canvas
        if (tag === 'M1Q1') {
            const canvasBlob = await canvasToBlob('boardCanvasM1Q1');
            if (canvasBlob) {
                const imgRef = ref(storage, `${basePath}/canvas_${timestamp}.png`);
                await uploadBytes(imgRef, canvasBlob);
                imageURL = await getDownloadURL(imgRef);
            }
        }

        // Guardar registro en Firestore
        await addDoc(collection(db, 'Actividad1'), {
            studentCode,
            studentName: studentInfo ? `${studentInfo.nombre} ${studentInfo.apellidos || ''}`.trim() : '',
            curso: studentInfo?.curso || '',
            tag,
            audioURL,
            imageURL: imageURL || null,
            timestamp: serverTimestamp()
        });

        if (statusEl) {
            statusEl.textContent = '✅ Guardado. Ya puedes pasar a la siguiente página.';
            statusEl.style.color = '#16a34a';
        }

        // Marcar como enviado y desbloquear navegación
        markSubmitted(tag);

    } catch (error) {
        console.error(`❌ Error al enviar ${tag}:`, error);
        if (statusEl) {
            statusEl.textContent = 'Error al guardar. Revisa tu conexión e intenta de nuevo.';
            statusEl.style.color = '#dc2626';
        }
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
}

function markSubmitted(tag) {
    if (tag === 'M1Q1') m1q1Submitted = true;
    if (tag === 'M1Q2') m1q2Submitted = true;
    if (tag === 'M3Q1') m3q1Submitted = true;
    if (tag === 'M3Q2') m3q2Submitted = true;
    updateNavButtons();
}

// ─────────────────────────────────────────────
// 9. SPREAD 13-14 – COCINA DE BANDEJAS
// ─────────────────────────────────────────────
function initCocinaSystem() {
    const gotoBtn    = document.getElementById('goToCocinaBtn');
    const verifyBtn  = document.getElementById('verifyTraysBtnM1Q2');
    const feedbackEl = document.getElementById('traysFeedbackM1Q2');

    let traysSystem = null;

    gotoBtn?.addEventListener('click', () => {
        // Inicializar sistema de bandejas si no existe
        if (!traysSystem) {
            traysSystem = createTraysSystem('traysAreaM1Q2');
        }
        hide('ContenedorLibro');
        hide('prevBtn');
        hide('nextBtn');
        show('ContenedorCocina');
    });

    verifyBtn?.addEventListener('click', () => {
        if (!traysSystem) return;
        const results = traysSystem.validatePairings();
        const allCorrect = results.length === 4 && results.every(r => r.isCorrect);
        const totalPaired = results.length;

        if (allCorrect) {
            if (feedbackEl) {
                feedbackEl.textContent = '✅ ¡Perfecto! Todas las bandejas están bien emparejadas.';
                feedbackEl.style.color = '#16a34a';
            }
            setTimeout(() => {
                hide('ContenedorCocina');
                show('ContenedorLibro');
                show('prevBtn');
                show('nextBtn');
                show('m1Q2FinalQuestion');
                cocinaCompleted = true;
                goToSpread(6); // Spread 13-14
                // Iniciar grabador M1Q2
                const recordBtn = document.getElementById('recordBtnM1Q2');
                if (recordBtn) recordBtn.disabled = false;
            }, 1000);
        } else {
            const wrongCount = results.filter(r => !r.isCorrect).length;
            const unpairedCount = 8 - totalPaired * 2;
            let msg = '';
            if (wrongCount > 0) msg += `${wrongCount} par(es) incorrecto(s). `;
            if (unpairedCount > 0) msg += `Faltan ${unpairedCount} bandeja(s) por emparejar.`;
            if (feedbackEl) {
                feedbackEl.textContent = msg || 'Revisa los emparejamientos.';
                feedbackEl.style.color = '#dc2626';
            }
        }
    });
}

// ─── Sistema de bandejas (simplificado, autocontenido) ───
function createTraysSystem(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const BASE_TRAYS = [
        { id: 'trayA1', rows: 3, cols: 5, total: 15 },
        { id: 'trayA2', rows: 5, cols: 3, total: 15 },
        { id: 'trayA3', rows: 2, cols: 4, total: 8  },
        { id: 'trayA4', rows: 4, cols: 2, total: 8  },
        { id: 'trayA5', rows: 6, cols: 5, total: 30 },
        { id: 'trayA6', rows: 5, cols: 6, total: 30 },
        { id: 'trayA7', rows: 6, cols: 4, total: 24 },
        { id: 'trayA8', rows: 4, cols: 6, total: 24 }
    ];

    const PAIR_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    let pairings = new Map();
    let selected = null;
    let pairCount = 0;
    const pairColors = new Map();

    function getColor(key) {
        if (!pairColors.has(key)) { pairColors.set(key, PAIR_COLORS[pairCount++ % PAIR_COLORS.length]); }
        return pairColors.get(key);
    }

    function render() {
        container.innerHTML = '';
        const shuffled = [...BASE_TRAYS].sort(() => Math.random() - 0.5);
        shuffled.forEach(data => {
            const card = document.createElement('div');
            card.className = 'tray-card';
            card.id = data.id;
            card.dataset.total = data.total;

            const grid = document.createElement('div');
            grid.className = 'tray-grid-inner';
            grid.style.cssText = `display:grid;grid-template-columns:repeat(${data.cols},1fr);gap:2px;padding:4px;`;

            for (let i = 0; i < data.total; i++) {
                const cell = document.createElement('span');
                cell.textContent = '🫓';
                cell.style.fontSize = data.total >= 24 ? '0.7em' : data.total >= 15 ? '0.85em' : '1em';
                grid.appendChild(cell);
            }

            const label = document.createElement('div');
            label.className = 'tray-label';
            label.textContent = `${data.rows} × ${data.cols} = ${data.total}`;
            label.style.cssText = 'text-align:center;font-size:0.8em;margin-top:4px;';

            card.appendChild(grid);
            card.appendChild(label);
            container.appendChild(card);
        });

        container.addEventListener('click', handleClick);
    }

    function handleClick(e) {
        const card = e.target.closest('.tray-card');
        if (!card) return;

        if (!selected) {
            selected = card;
            card.classList.add('selected');
            card.style.outline = '3px solid #f59e0b';
        } else if (selected === card) {
            card.classList.remove('selected');
            card.style.outline = '';
            selected = null;
        } else {
            togglePair(selected.id, card.id);
            selected.classList.remove('selected');
            selected.style.outline = '';
            selected = null;
        }
    }

    function togglePair(id1, id2) {
        if (pairings.get(id1) === id2) {
            unpair(id1, id2);
        } else {
            if (pairings.has(id1)) unpair(id1, pairings.get(id1));
            if (pairings.has(id2)) unpair(id2, pairings.get(id2));
            pair(id1, id2);
        }
    }

    function pair(id1, id2) {
        pairings.set(id1, id2);
        pairings.set(id2, id1);
        const key   = [id1, id2].sort().join('-');
        const color = getColor(key);
        [id1, id2].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.borderColor = color; el.classList.add('paired'); }
        });
    }

    function unpair(id1, id2) {
        pairings.delete(id1);
        pairings.delete(id2);
        [id1, id2].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.borderColor = ''; el.classList.remove('paired'); }
        });
    }

    function getPairings() {
        const seen = new Set();
        const result = [];
        for (const [a, b] of pairings) {
            const key = [a, b].sort().join('-');
            if (!seen.has(key)) { seen.add(key); result.push([a, b]); }
        }
        return result;
    }

    function validatePairings() {
        return getPairings().map(([id1, id2]) => {
            const t1 = BASE_TRAYS.find(t => t.id === id1);
            const t2 = BASE_TRAYS.find(t => t.id === id2);
            return { pair: [id1, id2], total1: t1?.total, total2: t2?.total, isCorrect: t1?.total === t2?.total };
        });
    }

    render();
    return { validatePairings, getPairings };
}

// ─────────────────────────────────────────────
// 10. SPREADS 15-16 y 17-18 – RADIOS + PLACEHOLDER
// ─────────────────────────────────────────────
function initRadioSpreads() {
    setupRadioSpread(
        'truthQ1',
        'promptSection1', 'm3Q1Placeholder', 'promptText1'
    );
    setupRadioSpread(
        'truthQ2',
        'promptSection2', 'm3Q2Placeholder', 'promptText2'
    );
}

const PROMPTS = {
    yes:    '¿Por qué crees que es verdadera? Explica.',
    no:     '¿Por qué crees que es falsa? ¿Tienes un ejemplo? Explica.',
    unsure: '¿Qué te hace dudar? Explica.'
};

function setupRadioSpread(radioName, sectionId, placeholderId, textId) {
    document.querySelectorAll(`input[name="${radioName}"]`).forEach(radio => {
        radio.addEventListener('change', () => {
            const text = document.getElementById(textId);
            if (text) text.textContent = PROMPTS[radio.value] || '';
            show(sectionId);
            hide(placeholderId);
        });
    });
}

// ─────────────────────────────────────────────
// 11. SPREAD 19-20 – EJERCICIOS DE CONMUTATIVIDAD
// ─────────────────────────────────────────────
function initM4() {
    m4Exercises = generateExercises(5);
    renderExercise(m4CurrentEx);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateExercises(n) {
    const exercises = [];
    for (let i = 0; i < n; i++) {
        let a = randInt(5, 50);
        let b;
        do { b = randInt(5, 50); } while (b === a);
        exercises.push({ a, b });
    }
    return exercises;
}

function renderExercise(index) {
    const wrapper = document.getElementById('itemsWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    if (index >= m4Exercises.length) {
        finalizeM4();
        return;
    }

    m4AttemptsOnCurrent = 0; // resetear intentos del nuevo ejercicio

    const { a, b } = m4Exercises[index];
    // a × b = [input] × a
    const container = document.createElement('div');
    container.className = 'magic-equation';
    container.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:1.5rem;flex-wrap:wrap;justify-content:center;';

    container.innerHTML = `
        <span class="magic-num">${a}</span>
        <span class="magic-op">×</span>
        <span class="magic-num">${b}</span>
        <span class="magic-op">=</span>
        <input id="m4Input" type="number" min="1" max="50"
            class="magic-input"
            style="width:70px;font-size:1.4rem;text-align:center;border:2px solid #8b5cf6;border-radius:8px;padding:4px;"
        >
        <span class="magic-op">×</span>
        <span class="magic-num">${a}</span>
    `;

    const checkBtn = document.createElement('button');
    checkBtn.textContent = '✔ Verificar';
    checkBtn.className = 'btn btn-primary';
    checkBtn.style.cssText = 'margin-left:12px;font-size:1rem;';
    checkBtn.addEventListener('click', () => checkAnswer(b));

    container.appendChild(checkBtn);
    wrapper.appendChild(container);

    const input = document.getElementById('m4Input');
    if (input) {
        input.focus();
        input.addEventListener('keypress', e => { if (e.key === 'Enter') checkAnswer(b); });
    }

    // Actualizar estado de vidas
    renderLives();
}

function renderLives() {
    const livesEl = document.getElementById('magicLives');
    if (!livesEl) return;
    livesEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('span');
        heart.className = 'magic-heart';
        heart.textContent = i < m4Lives ? '❤️' : '🖤';
        livesEl.appendChild(heart);
    }
}

function checkAnswer(correctValue) {
    if (m4Finalized) return;
    const input = document.getElementById('m4Input');
    if (!input) return;
    const value = parseInt(input.value, 10);
    const statusEl = document.getElementById('moment4Status');

    if (value === correctValue) {
        // Correcto → avanzar al siguiente ejercicio
        if (statusEl) { statusEl.textContent = '✅ ¡Correcto!'; statusEl.style.color = '#16a34a'; }
        m4CurrentEx++;
        setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
            renderExercise(m4CurrentEx);
        }, 800);
    } else {
        // Incorrecto
        m4Errors++;
        m4AttemptsOnCurrent++;

        // Perder una vida
        if (m4Lives > 0) m4Lives--;
        renderLives();

        // ¿Quedó sin vidas?
        if (m4Lives === 0) {
            if (statusEl) {
                statusEl.textContent = '💔 ¡Se acabaron las vidas mágicas! Sigue adelante con valentía.';
                statusEl.style.color = '#dc2626';
            }
            m4CurrentEx++;
            setTimeout(() => {
                if (statusEl) statusEl.textContent = '';
                renderExercise(m4CurrentEx);
            }, 1200);
            return;
        }

        if (m4AttemptsOnCurrent >= 2) {
            // Segundo error en este ejercicio → pasar al siguiente
            if (statusEl) {
                statusEl.textContent = `❌ Dos errores en este ejercicio. ¡Sigamos!`;
                statusEl.style.color = '#dc2626';
            }
            m4CurrentEx++;
            const input = document.getElementById('m4Input');
            if (input) input.disabled = true;
            setTimeout(() => {
                if (statusEl) statusEl.textContent = '';
                renderExercise(m4CurrentEx);
            }, 1000);
        } else {
            // Primer error → advertencia
            if (statusEl) {
                statusEl.textContent = `❌ Incorrecto. ¿Estás segura? Intenta de nuevo.`;
                statusEl.style.color = '#dc2626';
            }
            const input = document.getElementById('m4Input');
            if (input) input.value = '';
        }
    }
}

async function finalizeM4() {
    if (m4Finalized) return;
    m4Finalized = true;

    const points = m4Lives; // Puntos = vidas que quedan
    const finalSection = document.getElementById('finalQuestionSection');
    const totalPointsEl = document.getElementById('totalPoints');
    const pointsStatus  = document.getElementById('pointsStatus');

    if (totalPointsEl) totalPointsEl.textContent = points;
    if (finalSection)  finalSection.style.display = '';

    if (pointsStatus) {
        if (points > 0) {
            pointsStatus.textContent = `🌟 ¡Ganaste ${points} punto${points > 1 ? 's' : ''} de ClassDojo!`;
            pointsStatus.style.color = '#f59e0b';
        } else {
            pointsStatus.textContent = 'Sigue practicando, ¡lo harás mejor la próxima vez!';
            pointsStatus.style.color = '#6b7280';
        }
    }

    // Enviar resultado a Firebase
    try {
        await addDoc(collection(db, 'Actividad1'), {
            studentCode,
            studentName: studentInfo ? `${studentInfo.nombre} ${studentInfo.apellidos || ''}`.trim() : '',
            curso: studentInfo?.curso || '',
            tag: 'M4_resultado',
            points,
            errorsTotal: m4Errors,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error('❌ Error al guardar resultado M4:', err);
    }

    // Habilitar botón siguiente
    updateNavButtons();
}

// ─────────────────────────────────────────────
// 12. SPREAD 21-22 – ENCUESTA (Google Forms)
// ─────────────────────────────────────────────
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc30-KG8YdvHtJ_JFrn385BtNNLcaGsjvzxz2d5m5xKQYe0Gg/viewform';
const GOOGLE_FORM_RESPONSE_URL = GOOGLE_FORM_URL.replace('/viewform', '/formResponse');
const FORM_ENTRY_CODIGO = 'entry.975342770';
// Campo detectado en tu Form actual: "Esta actividad fue"
const FORM_ENTRY_RESPUESTA = 'entry.637654905';

function initEncuesta() {
    // Límite máximo de 2 checkboxes
    const checkboxes = document.querySelectorAll('input[name="m4Reflection"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = document.querySelectorAll('input[name="m4Reflection"]:checked');
            if (checked.length > 2) cb.checked = false;
            updateNavButtons(); // actualizar estado del botón siguiente
        });
    });

    // Botón de envío final (siguiente en el último spread)
    // Se dispara cuando el usuario llega al spread 21-22 y hace click en "siguiente"
    // pero también al detectar que ya respondió al menos 1 opción.
    // Usamos el nextBtn del último spread como trigger de envío + redirect.
    const nextBtn = document.getElementById('nextBtn');
    if (!nextBtn) return;

    // Reemplazamos el listener del nextBtn para el último spread
    // La lógica de reinicialización ocurre en updateNavButtons, aquí solo capturamos el caso especial.
    document.addEventListener('click', e => {
        if (e.target.id !== 'nextBtn' && !e.target.closest('#nextBtn')) return;
        const spreads = getSpreads();
        if (currentSpread !== spreads.length - 1) return; // Solo actuar en el último spread

        const checked = document.querySelectorAll('input[name="m4Reflection"]:checked');
        if (checked.length === 0) {
            alert('Por favor selecciona al menos una opción antes de continuar.');
            return;
        }

        submitEncuesta(checked);
    });
}

async function submitEncuesta(checkedBoxes) {
    const reflectionLabelMap = {
        facil: 'Fácil',
        interesante: 'Interesante',
        dificil: 'Difícil',
        'pensar-mucho': 'Me hizo pensar mucho',
        confusa: 'Confusa'
    };
    const valores = Array.from(checkedBoxes)
        .map(cb => reflectionLabelMap[cb.value] || cb.value);

    const payload = new URLSearchParams();
    if (FORM_ENTRY_CODIGO) {
        payload.append(FORM_ENTRY_CODIGO, studentCode || '');
    }
    valores.forEach(v => payload.append(FORM_ENTRY_RESPUESTA, v));

    // Mostrar mensaje de agradecimiento
    const spreads = getSpreads();
    const lastSpread = spreads[spreads.length - 1];
    if (lastSpread) {
        lastSpread.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                        height:100%;width:100%;text-align:center;padding:40px;gap:20px;">
                <h2 style="font-family:'Lobster Two',cursive;color:#8000ff;font-size:2.5rem;">
                    ¡Muchas gracias! 🎉
                </h2>
                <p style="font-size:1.4rem;color:#333;">
                    Tus respuestas han sido enviadas. En 3 segundos regresas al inicio.
                </p>
            </div>
        `;
    }

    // Envío silencioso al formulario (sin pedir correo ni abrir pestaña)
    try {
        await fetch(GOOGLE_FORM_RESPONSE_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: payload.toString()
        });
    } catch (error) {
        console.error('No se pudo enviar al Google Form:', error);
    }

    // Redirigir al index después de 3 segundos
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 3000);
}

// Fin de main.js
