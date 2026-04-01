// main.js – Actividad1 · Lógica principal
// Punto de entrada: módulo ES, se carga con type="module"

let firebaseServices = null;

async function initFirebaseServices() {
    try {
        firebaseServices = await import('./firebase.js');
        console.log('✅ Firebase listo');
    } catch (error) {
        firebaseServices = null;
        console.warn('⚠️ Firebase no disponible, el flujo UI seguirá funcionando:', error);
    }
}

// ─────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────
let studentCode = null;
let studentInfo = null;

// Índice del spread visible (0-based, donde 0 = spread 1-2)
let currentSpread = 0;

// Bloqueo durante animación de paso de página
let isFlipping = false;

// Submits completados (para habilitar "siguiente" en cada spread)
let m1q1Submitted = false;
let m1q2Submitted = false;
let m3q1Submitted = false;
let m3q2Submitted = false;

// Cocina completada
let cocinaCompleted = false;

// Ejercicios M4
let m4Lives = 3;
let m4Submitted = false; // habilita siguiente solo cuando termina el reto final
let m4Errors = 0;       // total de errores acumulados
let m4CurrentEx = 0;    // ejercicio actual (0-based)
let m4Exercises = [];   // array con los 5 ejercicios generados
let m4Patterns = [];    // patrón de posición de la caja por ejercicio
let m4Finalized = false;
let m4AttemptsOnCurrent = 0; // intentos fallidos en el ejercicio actual

// Grabaciones de audio en vuelo
const audioState = {};  // key: tag →  { mediaRecorder, chunks, blob }

function updateM4ReflectionSubmitState() {
    const submitBtn = document.getElementById('submitM4Reflection');
    if (!submitBtn) return;

    const hasAudio = !!(audioState['M4Reflection']?.blob && audioState['M4Reflection'].blob.size > 0);
    const checkedCount = document.querySelectorAll('input[name="m4Reflection"]:checked').length;
    const canSubmit = hasAudio && checkedCount >= 1;

    submitBtn.disabled = !canSubmit;
    submitBtn.style.opacity = canSubmit ? '1' : '0.5';
    submitBtn.style.cursor = canSubmit ? 'pointer' : 'not-allowed';
}

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initFirebaseServices();
    normalizeNavigationLabels();
    initStudentCodeDisplays();
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
    initAudioRecorder('M4Reflection');
    initRadioSpreads();
    initCocinaSystem();
    initM4();
    initEncuesta();
});

// ─────────────────────────────────────────────
// 1. VISIBILIDAD INICIAL
// ─────────────────────────────────────────────
function initVisibility() {
    show('ContenedorBienvenida');
    hide('ContenedorConfirmacion');
    hide('ContenedorPortada');
    hide('ContenedorLibro');
    hide('ContenedorCocina');
    hide('prevBtn');
    hide('nextBtn');
    // La sección derecha del spread 13-14 inicia oculta
    const q2Right = document.getElementById('q2RightPage');
    if (q2Right) {
        const traysImage = document.getElementById('bandejasFotoM1Q2');
        if (traysImage) traysImage.style.display = 'none';
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

function normalizeNavigationLabels() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.textContent = '\u2190';
        prevBtn.setAttribute('aria-label', 'Pagina anterior');
    }

    if (nextBtn) {
        nextBtn.textContent = '\u2192';
        nextBtn.setAttribute('aria-label', 'Pagina siguiente');
    }
}

function show(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const displayById = {
        ContenedorBienvenida: 'flex',
        ContenedorConfirmacion: 'flex',
        ContenedorPortada: 'flex',
        ContenedorLibro: 'flex',
        ContenedorCocina: 'block',
        prevBtn: 'flex',
        nextBtn: 'flex',
        m1Q2FinalQuestion: 'block',
        promptSection1: 'block',
        promptSection2: 'block',
        finalQuestionSection: 'block',
        magicCanvas: 'block',
        confettiCanvas: 'block'
    };

    el.style.display = displayById[id] || 'block';
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

        if (code === '0000') {
            const providedName = window.prompt('Escribe tu nombre para ingresar como invitado');
            const guestName = (providedName || '').trim();

            if (!guestName) {
                showError(err, 'Para ingresar con 0000 debes escribir tu nombre.');
                return;
            }

            err.textContent = '';
            studentCode = code;
            studentInfo = {
                nombre: guestName,
                apellidos: '',
                curso: 'INVITADO'
            };

            const q = document.getElementById('confirmationQuestion');
            if (q) {
                q.textContent = `\u00BFEres ${toTitle(guestName)}?`;
            }

            hide('ContenedorBienvenida');
            show('ContenedorConfirmacion');
            return;
        }

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
    return str
        .toLocaleLowerCase('es-CO')
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toLocaleUpperCase('es-CO') + word.slice(1))
        .join(' ');
}

function initStudentCodeDisplays() {
    getSpreads().forEach(spread => {
        const legacyDisplay = spread.querySelector('.q1-left-page > .student-code-display');
        if (legacyDisplay) legacyDisplay.remove();

        const hasDisplay = Array.from(spread.children).some(child =>
            child.classList && child.classList.contains('spread-student-code')
        );

        if (!hasDisplay) {
            const display = document.createElement('span');
            display.className = 'spread-student-code';
            spread.prepend(display);
        }
    });

    updateStudentCodeDisplays();
}

function updateStudentCodeDisplays() {
    document.querySelectorAll('.spread-student-code').forEach(el => {
        el.textContent = studentCode ? `Código: ${studentCode}` : '';
    });
}

// ─────────────────────────────────────────────
// 3. CONFIRMACIÓN
// ─────────────────────────────────────────────
function initConfirmation() {
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn  = document.getElementById('confirmNoBtn');

    yesBtn?.addEventListener('click', () => {
        updateStudentCodeDisplays();
        hide('ContenedorConfirmacion');
        show('ContenedorPortada');
    });

    noBtn?.addEventListener('click', () => {
        studentCode = null;
        studentInfo = null;
        updateStudentCodeDisplays();
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

    // Llamada de inicialización (mismo índice) o retorno desde cocina: mostrar sin animación
    if (index === currentSpread) {
        spreads.forEach((s, i) => {
            s.style.display = (i === index) ? 'flex' : 'none';
        });
        updateNavButtons();
        return;
    }

    if (isFlipping || index < 0 || index >= spreads.length) return;

    const direction = index > currentSpread ? 'forward' : 'backward';
    const oldSpread = spreads[currentSpread];

    // La página que se pliega hacia el lomo (sale)
    const foldOutPage = direction === 'forward'
        ? oldSpread.querySelector('.q1-right-page')
        : oldSpread.querySelector('.q1-left-page');

    isFlipping = true;

    // Fase 1: la página sale rotando hasta 90° (queda de canto, invisible)
    foldOutPage.classList.add('anim-flip-out');

    setTimeout(() => {
        foldOutPage.classList.remove('anim-flip-out');

        // Intercambio de spreads justo cuando la página está de canto (invisible)
        spreads.forEach((s, i) => {
            s.style.display = (i === index) ? 'flex' : 'none';
        });
        currentSpread = index;
        updateNavButtons();

        // Fase 2: la nueva página entra rotando desde 90° hasta 0°
        const newSpread = spreads[index];
        const foldInPage = direction === 'forward'
            ? newSpread.querySelector('.q1-left-page')
            : newSpread.querySelector('.q1-right-page');

        foldInPage.classList.add('anim-flip-in');

        setTimeout(() => {
            foldInPage.classList.remove('anim-flip-in');
            isFlipping = false;
        }, 320);

    }, 320);
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

        // En el último spread, el envío se hace con el botón de audio, no con flecha
        if (currentSpread === total - 1) {
            next.style.display = 'none';
        } else {
            next.style.display = 'flex';
        }
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
    if (currentSpread === 9) return m4Submitted;
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

    const wrapper = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    let boardWidth = 1;
    let boardHeight = 1;

    const resize = () => {
        const rect = wrapper.getBoundingClientRect();
        const width = Math.max(Math.floor(rect.width), 1);
        const height = Math.max(Math.floor(rect.height), 1);
        const dpr = Math.max(window.devicePixelRatio || 1, 1);

        if (canvas.width === Math.floor(width * dpr) && canvas.height === Math.floor(height * dpr)) return;

        const snapshot = document.createElement('canvas');
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;

        if (snapshot.width > 0 && snapshot.height > 0) {
            snapshot.getContext('2d').drawImage(canvas, 0, 0);
        }

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        boardWidth = width;
        boardHeight = height;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (snapshot.width > 0 && snapshot.height > 0) {
            ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);
        }
    };

    // Ajustar tamano al contenedor cuando el spread se vuelve visible o cambia
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    requestAnimationFrame(resize);
    setTimeout(resize, 0);
    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(() => resize());
        observer.observe(wrapper);
    }

    let drawing = false;
    let tool = 'black'; // herramienta activa
    setBoardCursor(canvas, tool);

    const getPos = e => {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    const startDraw = e => {
        e.preventDefault();
        drawing = true;
        const { x, y } = getPos(e);
        applyToolStyle(ctx, tool);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const draw = e => {
        if (!drawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => {
        if (!drawing) return;
        drawing = false;
        ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    // Botones de herramienta
    document.querySelectorAll('.board-tools .tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tool = btn.dataset.tool;
            setBoardCursor(canvas, tool);
            if (tool === 'clear') {
                if (confirm('Estas segur@ de que quieres limpiar todo el tablero?')) {
                    ctx.clearRect(0, 0, boardWidth, boardHeight);
                }
                tool = 'black';
                setBoardCursor(canvas, tool);
            }
        });
    });
}

function setBoardCursor(canvas, tool) {
    const cursors = {
        black: "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M4 24l5-1 12-12-4-4L5 19z' fill='%23222'/><path d='M17 7l4 4 2-2-4-4z' fill='%23666'/></svg>",
        red: "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M4 24l5-1 12-12-4-4L5 19z' fill='%23d33'/><path d='M17 7l4 4 2-2-4-4z' fill='%23822'/></svg>",
        yellow: "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><rect x='8' y='2' width='8' height='18' rx='2' fill='%23f6e05e'/><rect x='8' y='18' width='8' height='8' fill='%23c99a00'/></svg>",
        eraser: "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><rect x='6' y='9' width='16' height='10' rx='2' fill='%23f5f5f5' stroke='%23999' stroke-width='1.5'/></svg>"
    };

    if (tool === 'clear' || !cursors[tool]) {
        canvas.style.cursor = 'crosshair';
        return;
    }

    canvas.style.cursor = `url("data:image/svg+xml;utf8,${cursors[tool]}") 4 24, crosshair`;
}

function applyToolStyle(ctx, tool) {
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    ctx.imageSmoothingEnabled = true;
    if (tool === 'black') {
        ctx.globalAlpha     = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle     = '#000000';
        ctx.lineWidth       = 4;
    } else if (tool === 'red') {
        ctx.globalAlpha     = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle     = '#e53e3e';
        ctx.lineWidth       = 4;
    } else if (tool === 'yellow') {
        ctx.globalAlpha     = 0.5;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle     = '#f6e05e';
        ctx.lineWidth       = 14;
    } else if (tool === 'eraser') {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.lineWidth = 18;
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
// tag: 'M1Q1' | 'M1Q2' | 'M3Q1' | 'M3Q2' | 'M4Reflection'
function initAudioRecorder(tag) {
    const recordBtn = document.getElementById(`recordBtn${tag}`);
    const stopBtn   = document.getElementById(`stopBtn${tag}`);
    const statusEl  = document.getElementById(`status${tag}`);
    const submitBtn = document.getElementById(`submit${tag}`);
    if (!recordBtn || !stopBtn) return;

    audioState[tag] = { mediaRecorder: null, chunks: [], blob: null };

    // Estado inicial: stop oculto, submit deshabilitado hasta tener audio listo
    stopBtn.style.display = 'none';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
    if (tag === 'M4Reflection') updateM4ReflectionSubmitState();

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
                if (statusEl) statusEl.textContent = 'Audio listo para enviar';

                if (tag === 'M4Reflection') {
                    updateM4ReflectionSubmitState();
                } else if (submitBtn && audioState[tag].blob && audioState[tag].blob.size > 0) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor  = 'pointer';
                }

                // Volver a mostrar grabar, ocultar detener
                recordBtn.style.display = '';
                stopBtn.style.display   = 'none';
                recordBtn.disabled = true; // ya grabo, no graba otra vez
                recordBtn.style.opacity = '0.4';
            };

            mr.start();
            recordBtn.style.display = 'none';
            stopBtn.style.display   = '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
            if (tag === 'M4Reflection') updateM4ReflectionSubmitState();
            if (statusEl) statusEl.textContent = 'Grabando...';
        } catch (err) {
            console.error('Error al acceder al microfono:', err);
            if (statusEl) statusEl.textContent = 'No se pudo acceder al microfono.';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
            if (tag === 'M4Reflection') updateM4ReflectionSubmitState();
        }
    });

    stopBtn.addEventListener('click', () => {
        const mr = audioState[tag].mediaRecorder;
        if (mr && mr.state === 'recording') mr.stop();
    });

    // Submit de audio (+ imagen de canvas si aplica)
    submitBtn?.addEventListener('click', () => handleSubmit(tag));
}

// _____________________________________________________________________________________
// 8. ENVIO A FIREBASE
// --------------------------------------------------------------------------------------
async function handleSubmit(tag) {
    const submitBtn = document.getElementById(`submit${tag}`);
    const statusEl  = document.getElementById(`status${tag}`);
    const audioBlob = audioState[tag]?.blob;

    if (!audioBlob) return;

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.4';
    if (statusEl) { statusEl.textContent = 'Subiendo...'; statusEl.style.color = '#555'; }

    try {
        if (!firebaseServices?.storage || !firebaseServices?.db) {
            throw new Error('Firebase no disponible');
        }

        const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc, serverTimestamp } = firebaseServices;
        const basePath = `Actividad1/${studentCode}/${tag}`;
        const timestamp = Date.now();

        // Para M3Q1 / M3Q2: leer la respuesta del radio y añadirla al nombre del archivo
        let audioFileName = `audio_${timestamp}`;
        let m3q1Answer = null;
        let m3q2Answer = null;
        if (tag === 'M3Q1') {
            const checked = document.querySelector('input[name="truthQ1"]:checked');
            const labelMap = { yes: 'si', no: 'no', unsure: 'nose' };
            m3q1Answer = checked ? (labelMap[checked.value] ?? checked.value) : 'sinrespuesta';
            audioFileName = `audio_${timestamp}_${m3q1Answer}`;
        }
        if (tag === 'M3Q2') {
            const checked = document.querySelector('input[name="truthQ2"]:checked');
            const labelMap = { yes: 'si', no: 'no', unsure: 'nose' };
            m3q2Answer = checked ? (labelMap[checked.value] ?? checked.value) : 'sinrespuesta';
            audioFileName = `audio_${timestamp}_${m3q2Answer}`;
        }

        // Subir audio
        const audioRef = ref(storage, `${basePath}/${audioFileName}.webm`);
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
            ...(m3q1Answer !== null && { m3q1Answer }),
            ...(m3q2Answer !== null && { m3q2Answer }),
            timestamp: serverTimestamp()
        });

        if (statusEl) {
            statusEl.textContent = tag === 'M4Reflection'
                ? '✅ Audio enviado. Finalizando actividad...'
                : '✅ Guardado. Ya puedes pasar a la siguiente página.';
            statusEl.style.color = '#16a34a';
        }

        // En el último spread, el envío del audio final dispara el formulario de cierre.
        if (tag === 'M4Reflection') {
            const checked = document.querySelectorAll('input[name="m4Reflection"]:checked');
            if (checked.length === 0) {
                if (statusEl) {
                    statusEl.textContent = 'Selecciona al menos una opción antes de enviar.';
                    statusEl.style.color = '#dc2626';
                }
                updateM4ReflectionSubmitState();
                return;
            }

            if (statusEl) {
                statusEl.textContent = 'Enviando respuestas finales...';
                statusEl.style.color = '#555';
            }
            submitEncuesta(checked);
            return;
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
    const traysImage = document.getElementById('bandejasFotoM1Q2');

    let traysSystem = null;

    gotoBtn?.addEventListener('click', () => {
        // Inicializar sistema de bandejas si no existe
        if (!traysSystem) {
            traysSystem = createTraysSystem('traysAreaM1Q2');
        }
        if (traysImage) traysImage.style.display = 'none';
        hide('ContenedorLibro');
        hide('prevBtn');
        hide('nextBtn');
        show('ContenedorCocina');
    });

    verifyBtn?.addEventListener('click', () => {
        if (!traysSystem) return;
        const validation = traysSystem.validatePairings();
        const results = validation.pairResults;
        const allCorrect = results.length === 3 && results.every(r => r.isCorrect) && validation.hasExpectedSingles;
        const totalPaired = results.length;

        if (allCorrect) {
            if (feedbackEl) {
                feedbackEl.textContent = '✅ ¡Perfecto! Emparejaste las bandejas correctas y dejaste sin pareja las que no la tienen.';
                feedbackEl.style.color = '#16a34a';
            }
            setTimeout(() => {
                hide('ContenedorCocina');
                show('ContenedorLibro');
                show('prevBtn');
                show('nextBtn');
                if (traysImage) traysImage.style.display = 'block';
                show('m1Q2FinalQuestion');
                cocinaCompleted = true;
                goToSpread(6); // Spread 13-14
                // Iniciar grabador M1Q2
                const recordBtn = document.getElementById('recordBtnM1Q2');
                if (recordBtn) recordBtn.disabled = false;
            }, 1000);
        } else {
            const wrongCount = results.filter(r => !r.isCorrect).length;
            const missingPairs = Math.max(0, 3 - totalPaired);
            let msg = '';

            if (wrongCount > 0) {
                msg += `Tienes ${wrongCount} emparejamiento(s) incorrecto(s). Revisa las parejas que no corresponden. `;
            }

            if (missingPairs > 0) {
                msg += `Aún faltan ${missingPairs} pareja(s) por formar.`;
            } else if (wrongCount === 0 && !validation.hasExpectedSingles) {
                msg += 'Recuerda que hay dos bandejas que deben quedar sin pareja.';
            }

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
        { id: 'trayA1', rows: 3, cols: 4, total: 12 },
        { id: 'trayA2', rows: 4, cols: 3, total: 12 },
        { id: 'trayA3', rows: 2, cols: 6, total: 12 },
        { id: 'trayA4', rows: 6, cols: 2, total: 12 },
        { id: 'trayA5', rows: 5, cols: 3, total: 15 },
        { id: 'trayA6', rows: 3, cols: 5, total: 15 },
        { id: 'trayA7', rows: 4, cols: 5, total: 20 },
        { id: 'trayA8', rows: 2, cols: 7, total: 14 }
    ];

    const EXPECTED_UNPAIRED_TOTALS = new Set([14, 20]);

    const PAIR_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    let pairings = new Map();
    let selected = null;
    let pairCount = 0;
    const pairColors = new Map();

    function getColor(key) {
        if (!pairColors.has(key)) { pairColors.set(key, PAIR_COLORS[pairCount++ % PAIR_COLORS.length]); }
        return pairColors.get(key);
    }

    function shuffleArray(items) {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function getGridColumns() {
        const tpl = getComputedStyle(container).gridTemplateColumns || '';
        const repeatMatch = tpl.match(/repeat\((\d+),/);
        if (repeatMatch) return Math.max(parseInt(repeatMatch[1], 10), 1);
        const count = tpl.split(' ').filter(Boolean).length;
        return Math.max(count, 1);
    }

    function hasSameTotalAdjacency(order, cols) {
        for (let i = 0; i < order.length; i++) {
            const right = (i % cols !== cols - 1) ? i + 1 : -1;
            const down = i + cols < order.length ? i + cols : -1;

            if (right !== -1 && order[i].total === order[right].total) return true;
            if (down !== -1 && order[i].total === order[down].total) return true;
        }
        return false;
    }

    function getSeparatedOrder() {
        const cols = getGridColumns();
        let fallback = shuffleArray(BASE_TRAYS);

        for (let attempt = 0; attempt < 240; attempt++) {
            const candidate = shuffleArray(BASE_TRAYS);
            if (!hasSameTotalAdjacency(candidate, cols)) {
                return candidate;
            }
            fallback = candidate;
        }

        return fallback;
    }

    function render() {
        container.innerHTML = '';
        const shuffled = getSeparatedOrder();
        shuffled.forEach(data => {
            const card = document.createElement('div');
            card.className = 'tray-card';
            card.id = data.id;
            card.dataset.total = data.total;

            const grid = document.createElement('div');
            grid.className = 'tray-grid tray-grid-inner';
            grid.style.gridTemplateColumns = `repeat(${data.cols}, minmax(0, 1fr))`;
            grid.style.gap = data.total >= 24 ? '5px' : data.total >= 15 ? '6px' : '7px';

            const bunSize = data.total >= 24 ? 18 : data.total >= 15 ? 22 : 26;

            for (let i = 0; i < data.total; i++) {
                const cell = document.createElement('span');
                cell.className = 'tray-item';
                cell.style.width = `${bunSize}px`;
                cell.style.height = `${bunSize}px`;

                const bun = document.createElement('img');
                bun.className = 'tray-item-image';
                bun.src = 'assets/images/pandebono.png';
                bun.alt = '';
                bun.draggable = false;

                cell.appendChild(bun);
                grid.appendChild(cell);
            }

            card.appendChild(grid);
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
        const pairResults = getPairings().map(([id1, id2]) => {
            const t1 = BASE_TRAYS.find(t => t.id === id1);
            const t2 = BASE_TRAYS.find(t => t.id === id2);
            return { pair: [id1, id2], total1: t1?.total, total2: t2?.total, isCorrect: t1?.total === t2?.total };
        });

        const pairedIds = new Set(pairResults.flatMap(result => result.pair));
        const unpairedTrays = BASE_TRAYS.filter(tray => !pairedIds.has(tray.id));

        return {
            pairResults,
            unpairedTrays,
            hasExpectedSingles:
                unpairedTrays.length === 2 &&
                unpairedTrays.every(tray => EXPECTED_UNPAIRED_TOTALS.has(tray.total))
        };
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
    m4Submitted = false;
    m4Exercises = generateExercises(5);
    m4Patterns = generateM4Patterns(5);
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

function shuffleArray(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generateM4Patterns(n) {
    // Posiciones posibles de la caja en: a × b = b × a
    // 0: [ ] × b = b × a
    // 1: a × [ ] = b × a
    // 2: a × b = [ ] × a
    // 3: a × b = b × [ ]
    const base = shuffleArray([0, 1, 2, 3]);
    const patterns = [];

    while (patterns.length < n) {
        if (patterns.length < 4) {
            patterns.push(base[patterns.length]);
        } else {
            patterns.push(base[Math.floor(Math.random() * base.length)]);
        }
    }

    return patterns;
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
    const pattern = m4Patterns[index] ?? 1;

    let equationHTML = '';
    let correctValue = b;

    if (pattern === 0) {
        equationHTML = `
            <input id="m4Input" type="number" min="1" max="50"
                class="magic-input"
                style="width:70px;font-size:1.4rem;text-align:center;border:2px solid #8b5cf6;border-radius:8px;padding:4px;"
            >
            <span class="magic-op">×</span>
            <span class="magic-num">${b}</span>
            <span class="magic-op">=</span>
            <span class="magic-num">${b}</span>
            <span class="magic-op">×</span>
            <span class="magic-num">${a}</span>
        `;
        correctValue = a;
    } else if (pattern === 1) {
        equationHTML = `
            <span class="magic-num">${a}</span>
            <span class="magic-op">×</span>
            <input id="m4Input" type="number" min="1" max="50"
                class="magic-input"
                style="width:70px;font-size:1.4rem;text-align:center;border:2px solid #8b5cf6;border-radius:8px;padding:4px;"
            >
            <span class="magic-op">=</span>
            <span class="magic-num">${b}</span>
            <span class="magic-op">×</span>
            <span class="magic-num">${a}</span>
        `;
        correctValue = b;
    } else if (pattern === 2) {
        equationHTML = `
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
        correctValue = b;
    } else {
        equationHTML = `
            <span class="magic-num">${a}</span>
            <span class="magic-op">×</span>
            <span class="magic-num">${b}</span>
            <span class="magic-op">=</span>
            <span class="magic-num">${b}</span>
            <span class="magic-op">×</span>
            <input id="m4Input" type="number" min="1" max="50"
                class="magic-input"
                style="width:70px;font-size:1.4rem;text-align:center;border:2px solid #8b5cf6;border-radius:8px;padding:4px;"
            >
        `;
        correctValue = a;
    }

    const container = document.createElement('div');
    container.className = 'magic-equation';
    const equationRow = document.createElement('div');
    equationRow.className = 'magic-equation-row';
    equationRow.innerHTML = equationHTML;

    const checkBtn = document.createElement('button');
    checkBtn.textContent = '✔ Verificar';
    checkBtn.className = 'btn btn-primary';
    checkBtn.style.cssText = "font-family:'Rancho',cursive;";
    checkBtn.addEventListener('click', () => checkAnswer(correctValue));

    container.appendChild(equationRow);
    container.appendChild(checkBtn);
    wrapper.appendChild(container);

    const input = document.getElementById('m4Input');
    if (input) {
        input.focus();
        input.addEventListener('keypress', e => { if (e.key === 'Enter') checkAnswer(correctValue); });
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
        // Respuesta no válida
        m4Errors++;
        m4AttemptsOnCurrent++;

        // Perder una vida
        if (m4Lives > 0) m4Lives--;
        renderLives();

        if (m4AttemptsOnCurrent >= 2) {
            // Segundo error en este ejercicio → pasar al siguiente
            if (statusEl) {
                statusEl.textContent = `Vamos a cambiar de pregunta`;
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
                statusEl.textContent = ` ¿Estás segur@? Intenta de nuevo.`;
                statusEl.style.color = '#dc2626';
            }
        }
    }
}

async function finalizeM4() {
    if (m4Finalized) return;
    m4Finalized = true;
    m4Submitted = true;
    updateNavButtons();

    const points = m4Lives; // Puntos = vidas que quedan
    const finalSection = document.getElementById('finalQuestionSection');
    const finalTitleEl = finalSection?.querySelector('h3');
    const finalQuestionEl = finalSection?.querySelector('.final-question');
    const thankYouEl = finalSection?.querySelector('.thank-you');
    const thankYouSubEl = finalSection?.querySelector('.thank-you-sub');
    const totalPointsEl = document.getElementById('totalPoints');
    const pointsStatus  = document.getElementById('pointsStatus');

    if (totalPointsEl) totalPointsEl.textContent = points;
    if (finalSection)  finalSection.style.display = '';

    if (points > 0) {
        if (finalTitleEl) finalTitleEl.textContent = '¡Felicitaciones! 🎉';
        if (finalQuestionEl) {
            finalQuestionEl.innerHTML = `Ganaste <strong id="totalPoints">${points}</strong> puntos positivos`;
        }
        if (thankYouEl) thankYouEl.textContent = '¡Gracias por participar!';
    } else {
        if (finalTitleEl) finalTitleEl.textContent = '¡Felicitaciones!';
        if (finalQuestionEl) finalQuestionEl.textContent = 'Llegaste al final de la Actividad 1.';
        if (thankYouEl) thankYouEl.textContent = '¡Gracias por participar!';
    }

    if (thankYouSubEl) thankYouSubEl.style.display = 'none';
    if (pointsStatus) pointsStatus.textContent = '';

    // Enviar resultado a Firebase
    try {
        if (!firebaseServices?.db) {
            throw new Error('Firebase no disponible');
        }

        const { db, collection, addDoc, serverTimestamp } = firebaseServices;
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
            updateM4ReflectionSubmitState(); // submit final requiere check + audio
        });
    });

    // El envío del formulario final se ejecuta desde initNavigation
    // cuando el usuario está en el último spread y pulsa "siguiente".
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



