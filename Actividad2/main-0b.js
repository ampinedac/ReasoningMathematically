// main-0b.js – Actividad2 · Lógica principal
// Punto de entrada: módulo ES, se carga con type="module"

let firebaseServices = null;

async function initFirebaseServices() {
    try {
        firebaseServices = await import('./firebase2.js');
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
let m1q0Submitted = false;
let m1q1Submitted = false;
let m1q2Submitted = false;
let m3q1Submitted = false;
let m3q2Submitted = false;
let m3q3Submitted = false;

// Mente de Andres completada
let menteAndresCompleted = false;
let menteAndresM0Completed = false;
let matchingCompleted = false;
let spread13TableCompleted = false;
let matchingDrawLines = null; // callback para redibujar lazos al volver al spread

// Ejercicios M4
let m4Lives = 3;
let m4Submitted = false; // habilita siguiente solo cuando termina el reto final
let m4Errors = 0;       // total de errores acumulados
let m4CurrentEx = 0;    // ejercicio actual (0-based)
let m4Exercises = [];   // array con los 5 ejercicios generados
let m4Patterns = [];    // patrón de posición de la caja por ejercicio
let m4Finalized = false;
let m4AttemptsOnCurrent = 0; // intentos fallidos en el ejercicio actual
let m4RedirectTimer = null;
let m4StoryCountdownStarted = false;

// Grabaciones de audio en vuelo
const audioState = {};  // key: tag →  { mediaRecorder, chunks, blob }

function updateM4ReflectionSubmitState() {
    const submitBtn = document.getElementById('submitM4Reflection');
    if (!submitBtn) return;

    const hasAudio = !!(audioState['M4Reflection']?.blob && audioState['M4Reflection'].blob.size > 0);
    const canSubmit = hasAudio;

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
    initTableM1Q0();
    initSpread13Table();
    initAudioRecorder('M1Q1');
    initAudioRecorder('M1Q2');
    initAudioRecorder('M3Q1');
    initAudioRecorder('M3Q2');
    initAudioRecorder('M3Q3');
    initAudioRecorder('M4Q1');
    initAudioRecorder('M4Q2');
    initAudioRecorder('M4Reflection');
    initM3DualStepFlow();
    initMatchingActivity();
    initM1Q2ThinkFlow();
    initM1Q2EquationForm();
    initMenteAndresSystem();
    initM4ReflectionFlow();
    initEncuesta();
});
// ─────────────────────────────────────────────
// FLUJO DE REFLEXIÓN, FELICITACIÓN Y CIERRE FINAL
// ─────────────────────────────────────────────
function initM4ReflectionFlow() {
    // Interceptar envío de audio reflexión
    const submitBtn = document.getElementById('submitM4Reflection');
    if (submitBtn) {
        const origHandler = submitBtn.onclick;
        submitBtn.onclick = function(e) {
            if (typeof origHandler === 'function') origHandler(e);
            // Ya no se avanza automáticamente, solo se habilita la flecha
        };
    }
}



    // Oculta todo, muestra solapa final
    const spreads = document.querySelectorAll('.page.q1-book-spread');
    spreads.forEach(s => s.style.display = 'none');
    const finalCover = document.getElementById('m4FinalCoverSpread');
    if (finalCover) finalCover.style.display = 'flex';
    currentSpread = -2;
    updateNavButtons();

    // Mostrar confeti
    showConfettiFinal();

function showConfettiFinal() {
    const confettiDiv = document.getElementById('confettiFinal');
    if (!confettiDiv) return;
    confettiDiv.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
        confetti.style.position = 'absolute';
        confetti.style.animation = `fall ${2 + Math.random() * 2}s linear forwards`;
        confettiDiv.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

function ensureM3SpreadStructure() {
    const spread = document.getElementById('m3FlowSpread');
    const content = document.getElementById('m3q3StepContent');
    if (!spread || !content) return;
}

// ─────────────────────────────────────────────
// 1. VISIBILIDAD INICIAL
// ─────────────────────────────────────────────
function initVisibility() {
    show('ContenedorBienvenida');
    hide('ContenedorConfirmacion');
    hide('ContenedorPortada');
    hide('ContenedorLibro');
    hide('ContenedorMenteAndres');
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
    setM3Step16Visible(true);
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
        ContenedorMenteAndres: 'block',
        prevBtn: 'flex',
        nextBtn: 'flex',
        m1Q2FinalQuestion: 'flex',
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

function normalizeStorageSegment(value) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
}

// Mapeo de tags a componentes pedagógicos
function getComponentFromTag(tag) {
    const componentMap = {
        'M1Q0': '1Contexto',
        'M1Q1': '1Contexto',
        'M3Q1': '2Exploración',
        'M1Q2': '3Conjetura',
        'M3Q2': '4Generalización',
        'M3Q3': '5Justificación',
        'M4Q1': '6Validez',
        'M4Q2': '7Reflexión',
        'M4Reflection': null // Reflexión final, no tiene componente pedagógico
    };
    return componentMap[tag] || null;
}

function buildStorageBasePath(tag) {
    const isGuest = studentCode === '0000';
    const guestFolder = normalizeStorageSegment(studentInfo?.nombre || 'invitado');
    const safeGuestFolder = guestFolder || 'invitado';
    
    const component = getComponentFromTag(tag);
    
    if (isGuest) {
        return component ? `Actividad2/${safeGuestFolder}/${component}` : `Actividad2/${safeGuestFolder}`;
    }

    return component ? `Actividad2/${studentCode}/${component}` : `Actividad2/${studentCode}`;
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
        if (!studentCode) {
            el.textContent = '';
            return;
        }
        
        const displayText = studentInfo?.curso ? studentInfo.curso : 'profe';
        el.textContent = `Código: ${displayText}`;
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

    // Llamada de inicializacion (mismo indice) o retorno desde Mente de Andres: mostrar sin animacion
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
            if (index === 5 && typeof matchingDrawLines === 'function') matchingDrawLines();
            if (index === 9) maybeStartM4StoryFinalFlow();
        }, 320);

    }, 320);
}

function maybeStartM4StoryFinalFlow() {
    const spread = document.getElementById('m4StorySpread');
    if (!spread) return;

    const hasM4Q2 = !!document.getElementById('m4Q2Block');
    if (hasM4Q2) return;

    m4Submitted = true;
    showM4FinalAndRedirect();
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

        // En el último spread, el envío se hace con el botón de audio, no con flecha
        if (currentSpread === total - 1) {
            next.style.display = 'none';
        } else {
            next.style.display = 'flex';
        }
    }
}

// Regla de qué spreads requieren submit para avanzar (índices 0-based):
// spread 3 = página 7-8 → requiere m1q0Submitted
// spread 5 = actividad de emparejamiento (11-12) → requiere matchingCompleted
// spread 6 = nueva tabla (13-14) → requiere spread13TableCompleted
// spread 7 = segunda actividad (15-16) → requiere m1q2Submitted
// spread 8 = momentos 17-18 → requiere m3q3Submitted
// spread 9 = reto final (19-20) → requiere m4Submitted
function canAdvance() {
    const spreads = getSpreads();
    if (currentSpread >= spreads.length - 1) {
        // Último spread: requiere al menos 1 opción de reflexión marcada
        const checked = document.querySelectorAll('input[name="m4Reflection"]:checked');
        return checked.length >= 1;
    }

    if (currentSpread === 3) return m1q0Submitted;
    if (currentSpread === 4) return menteAndresM0Completed;
    if (currentSpread === 5) return matchingCompleted;
    if (currentSpread === 6) return spread13TableCompleted && m3q1Submitted;
    if (currentSpread === 7) return m1q2Submitted;
    if (currentSpread === 8) return m3q3Submitted;
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
    initBoardCanvas('boardCanvasM1Q1');
    initBoardCanvas('boardCanvasM1Q2');
    initBoardCanvas('boardCanvasM3Q1');
    initBoardCanvas('boardCanvasM3Q2');
    initBoardCanvas('boardCanvasM3Q3');
}

function initBoardCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
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
    const boardContainer = canvas.closest('.board-container');
    const toolButtons = boardContainer
        ? boardContainer.querySelectorAll('.board-tools .tool-btn')
        : [];

    toolButtons.forEach(btn => {
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

function isCanvasBlank(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
    }
    return true;
}

// ─────────────────────────────────────────────
// 7. GRABACIÓN DE AUDIO (genérica por tag)
// ─────────────────────────────────────────────
// tag: 'M1Q1' | 'M1Q2' | 'M3Q1' | 'M3Q2' | 'M3Q3' | 'M4Reflection'
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
                recordBtn.disabled = false;
                recordBtn.style.opacity = '1';
            };

            // timeslice corto para evitar blobs vacíos en grabaciones breves
            mr.start(250);
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
        if (mr && mr.state === 'recording') {
            try { mr.requestData(); } catch (_) {}
            mr.stop();
        }
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

    if (tag === 'M1Q2' && isCanvasBlank('boardCanvasM1Q2')) {
        if (statusEl) {
            statusEl.textContent = 'Escribe el ejemplo en el tablero para continuar.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.4';
    if (statusEl) { statusEl.textContent = 'Subiendo...'; statusEl.style.color = '#555'; }


    try {
        if (!firebaseServices?.storage || !firebaseServices?.db) {
            throw new Error('Firebase no disponible');
        }

        const { storage, db, ref, uploadBytes, getDownloadURL, collection, addDoc, serverTimestamp } = firebaseServices;
        const component = getComponentFromTag(tag);

        // --- Lógica de rutas y nombres ---
        let carpeta = '';
        let nombreArchivo = '';
        let carpetaImg = '';
        let nombreCanvas = '';
        const esEstudiante = studentInfo && studentInfo.curso && studentCode !== '0000' && studentInfo.curso !== 'INVITADO' && !studentInfo.curso.toLowerCase().includes('docente');
        const esInvitado = studentCode === '0000' || (studentInfo && studentInfo.curso === 'INVITADO');
        const esDocente = studentInfo && studentInfo.curso && studentInfo.curso.toLowerCase().includes('docente');
        const curso = esEstudiante ? studentInfo.curso : '';
        const nombreBase = esEstudiante
            ? `${studentCode}_${curso}`
            : esInvitado
                ? `${studentInfo.nombre.trim().replace(/\s+/g, '_')}`
                : esDocente
                    ? `${studentCode}_docente`
                    : 'desconocido';

        if (tag === 'M3Q1') {
            carpeta = 'Actividad2/1Exploración';
            nombreArchivo = `${nombreBase}_exploracion`;
        } else if (tag === 'M3Q3') {
            carpeta = 'Actividad2/2_3ReglageneralJustificacion/Audio';
            nombreArchivo = `${nombreBase}_ReglaJustif`;
            carpetaImg = 'Actividad2/2_3ReglageneralJustificacion/Img';
            nombreCanvas = `${nombreBase}_ReglaJustif`;
        } else if (tag === 'M4Reflection') {
            carpeta = 'Actividad2/Reflexion';
            nombreArchivo = `${nombreBase}_reflexion`;
        } else {
            // Por defecto, mantener la lógica anterior
            carpeta = buildStorageBasePath(tag);
            nombreArchivo = studentCode;
        }

        // Subir audio
        const audioRef = ref(storage, `${carpeta}/${nombreArchivo}.webm`);
        await uploadBytes(audioRef, audioBlob);
        const audioURL = await getDownloadURL(audioRef);

        let imageURL = null;

        // Guardar canvas solo para M3Q3 (regla general y justificación)
        if (tag === 'M3Q3') {
            const canvasId = 'boardCanvasM3Q3';
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                // Guardar como JPEG
                const canvasBlob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92));
                if (canvasBlob) {
                    const imgRef = ref(storage, `${carpetaImg}/${nombreCanvas}.jpg`);
                    await uploadBytes(imgRef, canvasBlob);
                    imageURL = await getDownloadURL(imgRef);
                }
            }
        }

        // Guardar registro en Firestore
        const firestoreDoc = {
            studentCode,
            studentName: studentInfo ? `${studentInfo.nombre} ${studentInfo.apellidos || ''}`.trim() : '',
            curso: studentInfo?.curso || '',
            tag,
            componente: component,
            storagePath: `${carpeta}/${nombreArchivo}.webm`,
            audioURL,
            imageURL: imageURL || null,
            timestamp: serverTimestamp()
        };
        await addDoc(collection(db, 'Actividad2'), firestoreDoc);

        if (statusEl) {
            statusEl.textContent = tag === 'M4Reflection'
                ? '✅ Audio enviado. Finalizando actividad...'
                : '✅ Guardado. Ya puedes pasar a la siguiente página.';
            statusEl.style.color = '#16a34a';
        }

        // En el último spread, el envío del audio final dispara el formulario de cierre.
        if (tag === 'M4Reflection') {
            if (statusEl) {
                statusEl.textContent = 'Enviando respuestas finales...';
                statusEl.style.color = '#555';
            }
            submitEncuesta([]);
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

async function submitM1Q2Equation() {
    const leftInput = document.getElementById('m1q2LeftInput');
    const rightInput = document.getElementById('m1q2RightInput');
    const submitBtn = document.getElementById('submitM1Q2Equation');
    const statusEl = document.getElementById('statusM1Q2');

    if (!leftInput || !rightInput || !submitBtn) return;

    const leftRaw = leftInput.value.trim();
    const rightRaw = rightInput.value.trim();

    if (leftRaw === '' || rightRaw === '') {
        if (statusEl) {
            statusEl.textContent = 'Completa ambas sumas para continuar.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    // --- Validación de suma mágica ---
    // Lista de sumas mágicas ya vistas (izquierda = derecha, sin espacios)
    const SUMAS_PROHIBIDAS = [
        // Ejemplos del cuento y tabla
        '7+7+7=3+3+3+3+3+3+3',
        '3+3+3+3+3+3+3=7+7+7',
        '5+5+5=3+3+3+3+3',
        '3+3+3+3+3=5+5+5',
        '2+2+2+2=4+4',
        '4+4=2+2+2+2',
        '6+6+6+6+6=5+5+5+5+5+5',
        '5+5+5+5+5+5=6+6+6+6+6',
        // Tabla spread 13-14
        '2+2+2+2+2+2+2+2+2+2+2+2+2+2+2=15+15',
        '15+15=2+2+2+2+2+2+2+2+2+2+2+2+2+2+2',
        '4+4+4=3+3+3+3',
        '3+3+3+3=4+4+4',
        '6+6+6=3+3+3+3+3+3',
        '3+3+3+3+3+3=6+6+6',
        '8+8=2+2+2+2+2+2+2+2',
        '2+2+2+2+2+2+2+2=8+8'
    ];

    // Normaliza y quita espacios
    const normalizeExpression = (value) => value.replace(/\s+/g, '').trim();
    const leftExpr = normalizeExpression(leftRaw);
    const rightExpr = normalizeExpression(rightRaw);

    // Verifica que solo haya números y +
    const isValidExpression = (value) => /\d/.test(value) && /^[\d+]+$/.test(value);
    if (!isValidExpression(leftExpr) || !isValidExpression(rightExpr)) {
        if (statusEl) {
            statusEl.textContent = 'Usa solo números y el signo + en cada caja.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    // Parsea sumandos
    function parseSum(str) {
        return str.split('+').map(Number).filter(n => !isNaN(n));
    }
    const leftArr = parseSum(leftExpr);
    const rightArr = parseSum(rightExpr);

    // Suma total
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    if (sum(leftArr) !== sum(rightArr)) {
        if (statusEl) {
            statusEl.textContent = 'La suma de ambos lados debe ser igual.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    // Ambos lados deben ser sumandos iguales
    const allEqual = arr => arr.every(n => n === arr[0]);
    if (!allEqual(leftArr) || !allEqual(rightArr)) {
        if (statusEl) {
            statusEl.textContent = 'Cada lado debe tener sumandos iguales.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    // Conmutatividad: n sumandos de a = a sumandos de n
    const a = leftArr[0], n = leftArr.length;
    const b = rightArr[0], m = rightArr.length;
    const isMagica = (n === b && m === a) && (a !== b || n !== m);
    if (!isMagica) {
        if (statusEl) {
            statusEl.textContent = 'Esa suma no es mágica. Debe cumplir la conmutatividad: a veces b = b veces a, y ser diferente.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    // Chequeo de suma repetida (en cualquier orden)
    const eqNorm1 = `${leftArr.join('+')}=${rightArr.join('+')}`;
    const eqNorm2 = `${rightArr.join('+')}=${leftArr.join('+')}`;
    if (SUMAS_PROHIBIDAS.includes(eqNorm1) || SUMAS_PROHIBIDAS.includes(eqNorm2)) {
        if (statusEl) {
            statusEl.textContent = 'Esa suma mágica ya la dijo Andrés.';
            statusEl.style.color = '#dc2626';
        }
        return;
    }

    // Ya no se pregunta confirmación, se guarda directamente y se muestra mensaje de éxito

    const izquierda = leftArr.join(' + ');
    const derecha = rightArr.join(' + ');
    const equationText = `${izquierda} = ${derecha}`;

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    if (statusEl) {
        statusEl.textContent = 'Guardando...';
        statusEl.style.color = '#555';
    }

    try {
        if (!firebaseServices?.db) throw new Error('Firebase no disponible');

        const { db, collection, addDoc, serverTimestamp } = firebaseServices;
        const basePath = buildStorageBasePath('M1Q2');
        const component = getComponentFromTag('M1Q2');

        await addDoc(collection(db, 'Actividad2'), {
            studentCode,
            studentName: studentInfo ? `${studentInfo.nombre} ${studentInfo.apellidos || ''}`.trim() : '',
            curso: studentInfo?.curso || '',
            tag: 'M1Q2',
            componente: component,
            storageBasePath: basePath,
            audioURL: null,
            imageURL: null,
            izquierda,
            derecha,
            equationText,
            timestamp: serverTimestamp()
        });

        markSubmitted('M1Q2');
    } catch (error) {
        console.error('❌ Error al guardar M1Q2:', error);
        if (statusEl) {
            statusEl.textContent = 'Error al guardar. Revisa tu conexión e intenta de nuevo.';
            statusEl.style.color = '#dc2626';
        }
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
}

function initM1Q2EquationForm() {
    const leftInput = document.getElementById('m1q2LeftInput');
    const rightInput = document.getElementById('m1q2RightInput');
    const submitBtn = document.getElementById('submitM1Q2Equation');
    const statusEl = document.getElementById('statusM1Q2');

    if (!leftInput || !rightInput || !submitBtn) return;

    const autoResize = (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(textarea.scrollHeight, 52)}px`;
    };

    const updateSubmitState = () => {
        const ready = leftInput.value.trim() !== '' && rightInput.value.trim() !== '';
        submitBtn.disabled = !ready;
        submitBtn.style.opacity = ready ? '1' : '0.5';
        submitBtn.style.cursor = ready ? 'pointer' : 'not-allowed';
    };

    leftInput.addEventListener('input', () => {
        if (statusEl) statusEl.textContent = '';
        autoResize(leftInput);
        updateSubmitState();
    });

    rightInput.addEventListener('input', () => {
        if (statusEl) statusEl.textContent = '';
        autoResize(rightInput);
        updateSubmitState();
    });

    submitBtn.addEventListener('click', submitM1Q2Equation);
    autoResize(leftInput);
    autoResize(rightInput);
    updateSubmitState();
}

function initTableM1Q0() {
    const btn = document.getElementById('checkTableBtn');
    const statusEl = document.getElementById('statusTableM1Q0');
    if (!btn || !statusEl) return;

    const ANSWERS = {
        auroraTotal: 21,
        andresTotal: 21
    };
    const ids = [
        't_aurora_total',
        't_andres_total'
    ];

    btn.addEventListener('click', function () {
        const inputs = ids.map(id => document.getElementById(id));
        const values = inputs.map(el => el ? el.value.trim() : '');

        // Verificar que todos estén llenos
        if (values.some(v => v === '')) {
            statusEl.textContent = 'Falta algo por llenar.';
            statusEl.style.color = '#b45309';
            return;
        }

        const auroraTotal = Number(values[0]);
        const andresTotal = Number(values[1]);

        const auroraOk = auroraTotal === ANSWERS.auroraTotal;
        const andresOk = andresTotal === ANSWERS.andresTotal;

        // Marcar visual por campo
        inputs.forEach((el, i) => {
            if (!el) return;
            const expected = i === 0 ? ANSWERS.auroraTotal : ANSWERS.andresTotal;
            el.classList.toggle('correct', Number(el.value) === expected);
            el.classList.toggle('incorrect', Number(el.value) !== expected);
        });

        if (auroraOk && andresOk) {
            m1q0Submitted = true;
            statusEl.textContent = '¡Correcto! Puedes continuar.';
            statusEl.style.color = '#16a34a';
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            updateNavButtons();
        } else {
            statusEl.textContent = 'Revisa los valores incorrectos e intenta de nuevo.';
            statusEl.style.color = '#dc2626';
        }
    });
}

function initSpread13Table() {
    const bank = document.getElementById('sumTokensBank');
    const statusEl = document.getElementById('statusSpread13Table');
    const audioBlock = document.getElementById('spread13AudioBlock');
    const dropzones = Array.from(document.querySelectorAll('#spread13Table .sum-dropzone'));
    if (!bank || !statusEl || dropzones.length === 0) return;

    const TOKENS = [
        { id: 't30a', text: '2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2', total: 30 },
        { id: 't30b', text: '15 + 15', total: 30 },
        { id: 't12a', text: '4 + 4 + 4', total: 12 },
        { id: 't18a', text: '6 + 6 + 6', total: 18 },
        { id: 't16a', text: '8 + 8', total: 16 },
        { id: 't12b', text: '3 + 3 + 3 + 3', total: 12 },
        { id: 't18b', text: '3 + 3 + 3 + 3 + 3 + 3', total: 18 },
        { id: 't16b', text: '2 + 2 + 2 + 2 + 2 + 2 + 2 + 2', total: 16 }
    ];

    const placed = new Map();
    let successMessageTimer = null;
    let tableLocked = false;

    const shuffled = [...TOKENS];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    bank.innerHTML = '';
    shuffled.forEach(tokenData => {
        const token = document.createElement('div');
        token.className = 'sum-token-chip';
        token.id = tokenData.id;
        token.draggable = true;
        token.textContent = tokenData.text;
        token.dataset.total = String(tokenData.total);
        token.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('text/plain', tokenData.id);
            token.classList.add('dragging');
        });
        token.addEventListener('dragend', () => token.classList.remove('dragging'));

        // Si la ficha ya está colocada y se hace clic, vuelve al banco.
        token.addEventListener('click', () => {
            if (tableLocked) return;

            const parentZone = token.parentElement;
            if (!parentZone || !parentZone.classList.contains('sum-dropzone')) return;

            parentZone.dataset.filled = '0';
            placed.delete(token.id);

            token.classList.remove('placed');
            token.draggable = true;
            bank.appendChild(token);

            spread13TableCompleted = false;
            m3q1Submitted = false;
            if (audioBlock) audioBlock.classList.add('think-hidden');
            if (successMessageTimer) {
                clearTimeout(successMessageTimer);
                successMessageTimer = null;
            }
            statusEl.textContent = 'Ficha regresada. Ubícala de nuevo en el espacio correcto.';
            statusEl.style.color = '#1d4ed8';
            updateNavButtons();
        });

        bank.appendChild(token);
    });

    function evaluateCompletion() {
        const done = placed.size === TOKENS.length;
        spread13TableCompleted = done;

        if (successMessageTimer) {
            clearTimeout(successMessageTimer);
            successMessageTimer = null;
        }

        if (done) {
            tableLocked = true;
            bank.style.display = 'none';
            statusEl.textContent = '✅ ¡Excelente! Ubicaste correctamente todas las sumas.';
            statusEl.style.color = '#16a34a';
            if (audioBlock) audioBlock.classList.remove('think-hidden');
            successMessageTimer = setTimeout(() => {
                if (spread13TableCompleted) {
                    statusEl.textContent = '';
                }
            }, 3000);
        } else {
            m3q1Submitted = false;
            if (audioBlock) audioBlock.classList.add('think-hidden');
        }
        updateNavButtons();
    }

    dropzones.forEach(zone => {
        zone.dataset.filled = '0';
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('is-over');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('is-over');

            if (tableLocked) return;

            if (zone.dataset.filled === '1') return;
            const tokenId = e.dataTransfer?.getData('text/plain');
            if (!tokenId) return;

            const token = document.getElementById(tokenId);
            if (!token) return;

            const totalOk = Number(token.dataset.total) === Number(zone.dataset.total);

            if (!totalOk) {
                token.classList.add('wrong-drop');
                setTimeout(() => token.classList.remove('wrong-drop'), 260);
                statusEl.textContent = 'Esa ficha no corresponde a ese espacio.';
                statusEl.style.color = '#dc2626';
                return;
            }

            zone.dataset.filled = '1';
            zone.appendChild(token);
            token.draggable = false;
            token.classList.add('placed');
            placed.set(token.id, zone.id);

            statusEl.textContent = 'Muy bien. Sigue ubicando las fichas restantes.';
            statusEl.style.color = '#1d4ed8';
            evaluateCompletion();
        });
    });
}

function markSubmitted(tag) {
    if (tag === 'M1Q0') m1q0Submitted = true;
    if (tag === 'M1Q1') m1q1Submitted = true;
    if (tag === 'M1Q2') {
        m1q2Submitted = true;

        const responseBlock = document.getElementById('m1q2ResponseBlock');
        const audioBox = document.getElementById('m1Q2FinalQuestion');
        const statusEl = document.getElementById('statusM1Q2');

        if (responseBlock) responseBlock.classList.remove('think-hidden');
        if (audioBox) audioBox.style.display = 'flex';
        if (statusEl) {
            statusEl.textContent = '✅ Guardado. Ya puedes pasar a la siguiente página.';
            statusEl.style.color = '#16a34a';
        }
    }
    if (tag === 'M3Q1') m3q1Submitted = true;
    if (tag === 'M3Q2') {
        m3q2Submitted = true;
        setM3Step16Visible(true);
    }
    if (tag === 'M3Q3') m3q3Submitted = true;

    if (tag === 'M4Q1') {
        setM4Step2Visible(true);
        const statusQ1 = document.getElementById('statusM4Q1');
        if (statusQ1) {
            statusQ1.textContent = '✅ Audio enviado. Ahora completa el segundo audio.';
            statusQ1.style.color = '#16a34a';
        }
    }

    if (tag === 'M4Q2') {
        m4Submitted = true;
        showM4FinalAndRedirect();
    }

    updateNavButtons();
}

function initM4StoryFlow() {
    const hasM4Q1 = !!document.getElementById('recordBtnM4Q1');
    setM4Step2Visible(!hasM4Q1);
    const finalSection = document.getElementById('m4StoryFinalSection');
    if (finalSection) finalSection.classList.add('think-hidden');
}

function setM4Step2Visible(visible) {
    const q2Block = document.getElementById('m4Q2Block');
    const recordBtnQ2 = document.getElementById('recordBtnM4Q2');
    if (!q2Block) return;

    if (visible) {
        q2Block.classList.remove('think-hidden');
        if (recordBtnQ2) recordBtnQ2.disabled = false;
    } else {
        q2Block.classList.add('think-hidden');
        if (recordBtnQ2) recordBtnQ2.disabled = true;
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3500);
    }
}

function showM4FinalAndRedirect() {
    const finalSection = document.getElementById('m4StoryFinalSection');
    const q2Block = document.getElementById('m4Q2Block');
    const countdownEl = document.getElementById('m4RedirectCountdown');
    if (!finalSection || !countdownEl) return;

    if (q2Block) q2Block.classList.add('think-hidden');
    finalSection.classList.remove('think-hidden');

    if (m4StoryCountdownStarted) return;
    m4StoryCountdownStarted = true;

    createConfetti();

    if (m4RedirectTimer) {
        clearInterval(m4RedirectTimer);
        m4RedirectTimer = null;
    }

    let seconds = 10;
    countdownEl.textContent = String(seconds);

    m4RedirectTimer = setInterval(() => {
        seconds -= 1;
        countdownEl.textContent = String(Math.max(0, seconds));

        if (seconds <= 0) {
            clearInterval(m4RedirectTimer);
            m4RedirectTimer = null;
            window.location.replace(new URL('../index.html', window.location.href).href);
        }
    }, 1000);
}

function setM3Step16Visible(visible) {
    const step16 = document.getElementById('m3q3StepContent');
    if (!step16) return;
    if (visible) {
        step16.classList.remove('think-hidden');
    } else {
        step16.classList.add('think-hidden');
    }
}

function initM3DualStepFlow() {
    setM3Step16Visible(true);
}

// ─────────────────────────────────────────────
// 9. SPREAD 13-14 – MOMENTO PARA PENSAR Y SOCIALIZAR
// ─────────────────────────────────────────────
function initM1Q2ThinkFlow() {
    const thinkStartBtn = document.getElementById('thinkStartBtn');
    const forceShowRightBtn = document.getElementById('forceShowRightBtn');
    const thinkTimerDisplay = document.getElementById('thinkTimerDisplay');
    const thinkStatus = document.getElementById('thinkStatusM1Q2');

    const rightContent = document.getElementById('m1q2RightContent');
    const step2VerifyBlock = document.getElementById('step2VerifyBlock');
    const step2ConversationBlock = document.getElementById('step2ConversationBlock');
    const socialReadyBtn = document.getElementById('socialReadyBtn');
    const socialStartBtn = document.getElementById('socialStartBtn');
    const forceFinishSocialBtn = document.getElementById('forceFinishSocialBtn');
    const socialTimerDisplay = document.getElementById('socialTimerDisplay');
    const socialStatus = document.getElementById('socialStatusM1Q2');

    const responseBlock = document.getElementById('m1q2ResponseBlock');
    const audioBox = document.getElementById('m1Q2FinalQuestion');

    if (!thinkStartBtn || !thinkTimerDisplay || !rightContent || !step2VerifyBlock || !step2ConversationBlock || !socialReadyBtn || !socialStartBtn || !socialTimerDisplay || !responseBlock || !audioBox) {
        return;
    }

    const THINK_TOTAL_SECONDS = 180;
    const SOCIAL_TOTAL_SECONDS = 300;
    let thinkSeconds = THINK_TOTAL_SECONDS;
    let socialSeconds = SOCIAL_TOTAL_SECONDS;
    let thinkInterval = null;
    let socialInterval = null;

    const formatTime = (totalSeconds) => {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const stopInterval = (ref) => {
        if (ref) {
            clearInterval(ref);
        }
    };

    const enhanceCandleTimer = (timerEl) => {
        if (!timerEl || timerEl.dataset.candleReady === '1') return;
        const initial = (timerEl.textContent || '05:00').trim();
        const waxId = `candleWaxGradient-${timerEl.id || Math.random().toString(36).slice(2)}`;
        const flameId = `candleFlameGradient-${timerEl.id || Math.random().toString(36).slice(2)}`;
        timerEl.classList.add('candle-timer');
        timerEl.innerHTML = `
            <svg class="candle-timer-svg" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient id="${waxId}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#fff7d6"></stop>
                        <stop offset="58%" stop-color="#ffe08a"></stop>
                        <stop offset="100%" stop-color="#f5b942"></stop>
                    </linearGradient>
                    <radialGradient id="${flameId}" cx="50%" cy="35%" r="65%">
                        <stop offset="0%" stop-color="#fff7a8"></stop>
                        <stop offset="52%" stop-color="#fbbf24"></stop>
                        <stop offset="100%" stop-color="#f97316"></stop>
                    </radialGradient>
                </defs>
                <ellipse class="candle-shadow" cx="52" cy="112" rx="25" ry="7"></ellipse>
                <rect class="candle-plate" x="23" y="103" width="58" height="9" rx="4"></rect>
                <path class="candle-drips" d="M39 38 C39 47, 34 49, 35 56 C36 63, 41 62, 42 55 C43 49, 48 48, 48 55 C48 61, 52 62, 53 56 C54 49, 59 48, 60 55 C61 62, 66 63, 68 56 C69 49, 65 45, 65 38 Z"></path>
                <rect class="candle-wax" x="38" y="38" width="28" height="58" rx="8" style="fill:url(#${waxId})"></rect>
                <ellipse class="candle-top" cx="52" cy="38" rx="14" ry="4.5"></ellipse>
                <line class="candle-wick" x1="52" y1="27" x2="52" y2="39"></line>
                <g class="candle-flame-group">
                    <path class="candle-flame-outer" d="M52 8 C60 16, 61 24, 52 30 C43 24, 44 16, 52 8 Z" style="fill:url(#${flameId})"></path>
                    <path class="candle-flame-inner" d="M52 13 C57 18, 57 23, 52 27 C47 23, 47 18, 52 13 Z"></path>
                </g>
                <g class="candle-smoke">
                    <path d="M46 18 C40 12, 42 6, 48 4"></path>
                    <path d="M52 15 C48 10, 50 5, 55 2"></path>
                    <path d="M58 18 C55 13, 58 8, 63 6"></path>
                </g>
            </svg>
            <span class="timer-text">${initial}</span>
        `;
        timerEl.dataset.candleReady = '1';
    };

    const renderTimer = (timerEl, secondsLeft, totalSeconds) => {
        if (!timerEl) return;
        const txt = timerEl.querySelector('.timer-text');
        if (txt) {
            txt.textContent = formatTime(secondsLeft);
        } else {
            timerEl.textContent = formatTime(secondsLeft);
        }

        const meltProgress = Math.min(1, Math.max(0, 1 - (secondsLeft / totalSeconds)));
        timerEl.style.setProperty('--melt-progress', meltProgress.toString());

        const svg = timerEl.querySelector('.candle-timer-svg');
        if (svg) {
            const wax = svg.querySelector('.candle-wax');
            const top = svg.querySelector('.candle-top');
            const drips = svg.querySelector('.candle-drips');
            const wick = svg.querySelector('.candle-wick');
            const flame = svg.querySelector('.candle-flame-group');
            const smoke = svg.querySelector('.candle-smoke');

            const minHeight = 6;
            const fullHeight = 90;
            const waxHeight = minHeight + ((1 - meltProgress) * (fullHeight - minHeight));
            const waxTopY = 96 - waxHeight;
            const topCy = waxTopY;
            const wickTopY = Math.max(6, waxTopY - 9);

            if (wax) {
                wax.setAttribute('y', waxTopY.toFixed(2));
                wax.setAttribute('height', waxHeight.toFixed(2));
            }

            if (top) {
                top.setAttribute('cy', topCy.toFixed(2));
            }

            if (drips) {
                drips.setAttribute(
                    'd',
                    `M39 ${topCy.toFixed(2)} C39 ${(topCy + 9).toFixed(2)}, 34 ${(topCy + 11).toFixed(2)}, 35 ${(topCy + 18).toFixed(2)} C36 ${(topCy + 25).toFixed(2)}, 41 ${(topCy + 24).toFixed(2)}, 42 ${(topCy + 17).toFixed(2)} C43 ${(topCy + 11).toFixed(2)}, 48 ${(topCy + 10).toFixed(2)}, 48 ${(topCy + 17).toFixed(2)} C48 ${(topCy + 23).toFixed(2)}, 52 ${(topCy + 24).toFixed(2)}, 53 ${(topCy + 18).toFixed(2)} C54 ${(topCy + 11).toFixed(2)}, 59 ${(topCy + 10).toFixed(2)}, 60 ${(topCy + 17).toFixed(2)} C61 ${(topCy + 24).toFixed(2)}, 66 ${(topCy + 25).toFixed(2)}, 68 ${(topCy + 18).toFixed(2)} C69 ${(topCy + 11).toFixed(2)}, 65 ${(topCy + 7).toFixed(2)}, 65 ${topCy.toFixed(2)} Z`
                );
            }

            if (wick) {
                wick.setAttribute('y1', wickTopY.toFixed(2));
                wick.setAttribute('y2', (topCy + 1.5).toFixed(2));
            }

            if (flame) {
                const flameBaseY = wickTopY + 1;
                const translateY = flameBaseY - 30;
                const flameScale = Math.max(0.72, 1 - (meltProgress * 0.22));
                flame.setAttribute('transform', `translate(0 ${translateY.toFixed(2)}) scale(${flameScale.toFixed(3)})`);
            }

            if (smoke) {
                smoke.style.opacity = secondsLeft === 0 ? '1' : '0';
            }
        }

        if (secondsLeft === 0 && timerEl.dataset.extinguished !== '1') {
            timerEl.dataset.extinguished = '1';
            timerEl.classList.add('is-extinguished');
        }
    };

    const showStep2Right = () => {
        rightContent.classList.remove('think-hidden');
        step2VerifyBlock.classList.remove('think-hidden');
        step2ConversationBlock.classList.add('think-hidden');
        responseBlock.classList.add('think-hidden');
        audioBox.style.display = 'none';
    };

    const finishThinkStep = () => {
        stopInterval(thinkInterval);
        thinkInterval = null;
        thinkStartBtn.disabled = true;
        thinkStartBtn.style.opacity = '0.6';
        thinkStartBtn.style.cursor = 'not-allowed';
        renderTimer(thinkTimerDisplay, thinkSeconds, THINK_TOTAL_SECONDS);

        if (thinkStatus) {
            thinkStatus.textContent = 'Se completaron los 3 minutos. Ya puedes continuar al paso 2.';
            thinkStatus.style.color = '#16a34a';
            thinkStatus.classList.add('timer-complete');
        }

        showStep2Right();
    };

    const finishSocialStep = () => {
        stopInterval(socialInterval);
        socialInterval = null;
        socialSeconds = 0;
        renderTimer(socialTimerDisplay, socialSeconds, SOCIAL_TOTAL_SECONDS);

        if (socialStatus) {
            socialStatus.textContent = 'Tiempo completado. Ya puedes grabar tu respuesta final.';
            socialStatus.style.color = '#16a34a';
            socialStatus.classList.add('timer-complete');
        }

        rightContent.classList.add('think-hidden');
        responseBlock.classList.remove('think-hidden');
        audioBox.style.display = 'flex';
    };

    // Estado inicial del flujo
    enhanceCandleTimer(thinkTimerDisplay);
    enhanceCandleTimer(socialTimerDisplay);
    renderTimer(thinkTimerDisplay, thinkSeconds, THINK_TOTAL_SECONDS);
    renderTimer(socialTimerDisplay, socialSeconds, SOCIAL_TOTAL_SECONDS);
    rightContent.classList.add('think-hidden');
    responseBlock.classList.add('think-hidden');
    audioBox.style.display = 'none';

    thinkStartBtn.addEventListener('click', () => {
        if (thinkInterval) return;

        thinkStartBtn.disabled = true;
        thinkStartBtn.style.opacity = '0.6';
        thinkStartBtn.style.cursor = 'not-allowed';

        if (thinkStatus) {
            thinkStatus.classList.remove('timer-complete');
            thinkStatus.textContent = 'Tiempo corriendo: piensa y escribe tus ideas.';
            thinkStatus.style.color = '#1d4ed8';
        }

        thinkInterval = setInterval(() => {
            thinkSeconds -= 1;
            if (thinkSeconds < 0) thinkSeconds = 0;
            renderTimer(thinkTimerDisplay, thinkSeconds, THINK_TOTAL_SECONDS);

            if (thinkSeconds === 0) {
                finishThinkStep();
            }
        }, 1000);
    });

    forceShowRightBtn?.addEventListener('click', () => {
        showStep2Right();
    });

    socialReadyBtn.addEventListener('click', () => {
        step2VerifyBlock.classList.add('think-hidden');
        step2ConversationBlock.classList.remove('think-hidden');

        if (socialStatus) {
            socialStatus.classList.remove('timer-complete');
            socialStatus.textContent = 'Cuando inicies, conversen durante los 5 minutos completos.';
            socialStatus.style.color = '#1d4ed8';
        }
    });

    socialStartBtn.addEventListener('click', () => {
        if (socialInterval) return;

        socialStartBtn.disabled = true;
        socialStartBtn.style.opacity = '0.6';
        socialStartBtn.style.cursor = 'not-allowed';

        if (socialStatus) {
            socialStatus.classList.remove('timer-complete');
            socialStatus.textContent = 'Conversación en curso: aprovecha este espacio para escuchar y compartir ideas.';
            socialStatus.style.color = '#1d4ed8';
        }

        socialInterval = setInterval(() => {
            socialSeconds -= 1;
            if (socialSeconds < 0) socialSeconds = 0;
            renderTimer(socialTimerDisplay, socialSeconds, SOCIAL_TOTAL_SECONDS);

            if (socialSeconds === 0) {
                finishSocialStep();
            }
        }, 1000);
    });

    forceFinishSocialBtn?.addEventListener('click', () => {
        finishSocialStep();
    });
}

// ─────────────────────────────────────────────
// 9. SPREAD 13-14 – MENTE DE ANDRES (BOLSITAS)
// ─────────────────────────────────────────────
function initMenteAndresSystem() {
    const gotoBtn    = document.getElementById('goToMenteAndresBtn');
    const gotoBtnM0  = document.getElementById('goToMenteAndresBtnM0');
    const verifyBtn  = document.getElementById('verifyTraysBtnM1Q2');
    const traysImage = document.getElementById('bandejasFotoM1Q2');

    let traysSystem = null;
    let returnSpread = 7;
    let menteAndresNoticeTimer = null;

    function showMenteAndresNotice(message, type = 'success', durationMs = 2400, onDone = null) {
        const menteAndresScreen = document.getElementById('MenteAndresScreen');
        if (!menteAndresScreen) {
            if (typeof onDone === 'function') onDone();
            return;
        }

        const oldNotice = document.getElementById('MenteAndresFloatingNotice');
        if (oldNotice) oldNotice.remove();
        if (menteAndresNoticeTimer) {
            clearTimeout(menteAndresNoticeTimer);
            menteAndresNoticeTimer = null;
        }

        const notice = document.createElement('div');
        notice.id = 'MenteAndresFloatingNotice';
        notice.className = `mente-andres-floating-notice ${type}`;
        notice.setAttribute('role', 'status');
        notice.setAttribute('aria-live', 'polite');

        const icon = type === 'success' ? '✅' : '⚠️';
        notice.innerHTML = `
            <div class="mente-andres-floating-notice-card">
                <span class="mente-andres-floating-notice-icon">${icon}</span>
                <p class="mente-andres-floating-notice-text">${message}</p>
            </div>
        `;

        menteAndresScreen.appendChild(notice);

        menteAndresNoticeTimer = setTimeout(() => {
            notice.classList.add('hide');
            setTimeout(() => {
                notice.remove();
                if (typeof onDone === 'function') onDone();
            }, 280);
        }, durationMs);
    }

    const openMenteAndres = (targetSpread) => {
        returnSpread = targetSpread;

        // Inicializar sistema de bolsitas si no existe
        if (!traysSystem) {
            if (typeof window.TraysSystem === 'function') {
                traysSystem = new window.TraysSystem('traysAreaM1Q2');
            } else {
                traysSystem = createTraysSystem('traysAreaM1Q2');
            }
        }

        const oldNotice = document.getElementById('MenteAndresFloatingNotice');
        if (oldNotice) oldNotice.remove();
        if (menteAndresNoticeTimer) {
            clearTimeout(menteAndresNoticeTimer);
            menteAndresNoticeTimer = null;
        }

        if (traysImage) traysImage.style.display = 'none';
        hide('ContenedorLibro');
        hide('prevBtn');
        hide('nextBtn');
        show('ContenedorMenteAndres');
    };

    gotoBtn?.addEventListener('click', () => openMenteAndres(7));
    gotoBtnM0?.addEventListener('click', () => openMenteAndres(4));

    verifyBtn?.addEventListener('click', () => {
        if (!traysSystem) return;
        const rawValidation = traysSystem.validatePairings();
        const validation = Array.isArray(rawValidation)
            ? { pairResults: rawValidation }
            : rawValidation;
        const results = validation.pairResults;
        const allCorrect = results.length === 3 && results.every(r => r.isCorrect);
        const totalPaired = results.length;

        if (allCorrect) {
            showMenteAndresNotice(
                '¡Perfecto! Emparejaste las bolsitas correctas. Te llevaremos al libro.',
                'success',
                4000,
                () => {
                hide('ContenedorMenteAndres');
                show('ContenedorLibro');
                show('prevBtn');
                show('nextBtn');
                if (traysImage) traysImage.style.display = 'block';
                menteAndresCompleted = true;

                if (returnSpread === 7) {
                    show('m1Q2FinalQuestion');
                    const leftInput = document.getElementById('m1q2LeftInput');
                    if (leftInput) leftInput.focus();
                }

                if (returnSpread === 4) {
                    menteAndresM0Completed = true;
                }

                goToSpread(returnSpread);
                }
            );
        } else {
            const wrongCount = results.filter(r => !r.isCorrect).length;
            const missingPairs = Math.max(0, 3 - totalPaired);
            let msg = '';

            if (wrongCount > 0) {
                msg += `Tienes ${wrongCount} emparejamiento(s) incorrecto(s). Revisa las parejas que no corresponden. `;
            }

            if (missingPairs > 0) {
                msg += `Aún faltan ${missingPairs} pareja(s) por formar.`;
            }

            showMenteAndresNotice(msg || 'Revisa los emparejamientos.', 'error', 3200);
        }
    });
}

// ─── Sistema de bolsitas (simplificado, autocontenido) ───
function createTraysSystem(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const AREPA_ICON_EMOJI = '🫓';

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
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';

                const bun = document.createElement('span');
                bun.className = 'tray-item-emoji';
                bun.textContent = AREPA_ICON_EMOJI;
                bun.style.fontSize = `${Math.max(10, Math.floor(bunSize * 0.6))}px`;
                bun.style.lineHeight = '1';
                bun.style.display = 'inline-flex';
                bun.style.alignItems = 'center';
                bun.style.justifyContent = 'center';
                bun.style.pointerEvents = 'none';

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
// 10. SPREAD 11-12 – ACTIVIDAD: UNE PAREJAS CON SUMAS MISTERIOSAS
// ─────────────────────────────────────────────
function initMatchingActivity() {
    const pairsEl    = document.getElementById('matchingPairs');
    const sumsEl     = document.getElementById('matchingSums');
    const svgEl      = document.getElementById('matchingLinesSVG');
    const verifyBtn  = document.getElementById('matchingVerifyBtn');
    const feedbackEl = document.getElementById('matchingFeedback');
    if (!pairsEl || !sumsEl || !verifyBtn) return;

    // Pares de pedidos: cada uno apunta a su suma correcta
    const PAIRS = [
        { id: 'mpair0', imageSrc: './assets/images/pedidos%201%20y%204.png', alt: 'Pedidos 1 y 4', correctSum: 'msum0' },
        { id: 'mpair1', imageSrc: './assets/images/pedidos%205%20y%202.png', alt: 'Pedidos 5 y 2', correctSum: 'msum1' },
        { id: 'mpair2', imageSrc: './assets/images/pedidos%206%20y%203.png', alt: 'Pedidos 6 y 3', correctSum: 'msum2' }
    ];

    // Sumas misteriosas – se barajan al cargar
    const SUMS = [
        { id: 'msum0', text: '5+5+5 = 3+3+3+3+3'},
        { id: 'msum1', text: '2+2+2+2 = 4+4'},
        { id: 'msum2', text: '6+6+6+6+6 = 5+5+5+5+5+5'}
    ];
    let shuffledSums = [...SUMS].sort(() => Math.random() - 0.5);

    // Estado
    const connections = {}; // pairId → sumId
    let selectedPair  = null;
    let selectedSum   = null;

    // Color fijo por pareja visual
    // mpair0 = pedidos 1 y 4 (rojo)
    // mpair1 = pedidos 5 y 2 (azul fuerte)
    // mpair2 = pedidos 6 y 3 (verde)
    const LAZO_COLORS = { mpair0: '#dc2626', mpair1: '#1d4ed8', mpair2: '#16a34a' };
    const LAZO_BOX_BG = { mpair0: 'rgba(220, 38, 38, 0.14)', mpair1: 'rgba(29, 78, 216, 0.14)', mpair2: 'rgba(22, 163, 74, 0.14)' };

    function connectPairAndSum(pairId, sumId) {
        // Liberar ocupante previo de esta suma
        for (const [pid, sid] of Object.entries(connections)) {
            if (sid === sumId && pid !== pairId) {
                delete connections[pid];
                break;
            }
        }

        // Conectar la pareja a la suma elegida
        connections[pairId] = sumId;

        // Limpiar selección y refrescar estado
        selectedPair = null;
        selectedSum = null;
        matchingCompleted = false;
        updateNavButtons();
        drawLines();
        if (feedbackEl) feedbackEl.textContent = '';
    }

    function formatSumText(text) {
        const [left, right] = text.split('=');
        return `${left}<span class="match-equal">=</span>${right}`;
    }

    const shuffledPairs = [...PAIRS].sort(() => Math.random() - 0.5);

    // Evita coincidencia visual por filas: ninguna imagen debe quedar frente a su suma correcta.
    const isRowAligned = (pairs, sums) => pairs.every((p, idx) => p.correctSum === sums[idx]?.id);
    if (isRowAligned(shuffledPairs, shuffledSums)) {
        shuffledSums = [shuffledSums[1], shuffledSums[2], shuffledSums[0]];
    }

    shuffledPairs.forEach(p => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'match-pair-card';
        card.id = p.id;
        card.innerHTML = `<img src="${p.imageSrc}" alt="${p.alt}" class="match-pair-image">`;
        card.addEventListener('click', () => {
            // Si ya hay una suma elegida, conectar inmediatamente (caja -> imagen)
            if (selectedSum) {
                connectPairAndSum(p.id, selectedSum);
                return;
            }

            if (selectedPair === p.id) {
                selectedPair = null;
            } else {
                selectedPair = p.id;
            }
        });
        pairsEl.appendChild(card);
    });

    // ── Renderizar recuadros de sumas (derecha, orden aleatorio) ───
    shuffledSums.forEach(s => {
        const box = document.createElement('div');
        box.className = 'match-sum-box';
        box.id = s.id;
        box.innerHTML = `<span class="match-sum-text">${formatSumText(s.text)}</span>`;
        box.addEventListener('click', () => {
            // Si ya hay pareja elegida, conectar inmediatamente (imagen -> caja)
            if (selectedPair) {
                connectPairAndSum(selectedPair, s.id);
                return;
            }

            // Si no hay pareja elegida, dejar esta suma seleccionada para el próximo clic en imagen
            selectedSum = (selectedSum === s.id) ? null : s.id;
        });
        sumsEl.appendChild(box);
    });

    // ── Dibujar lazos ────────────────────────────────────────────
    function drawLines() {
        if (!svgEl) return;
        const spread = document.getElementById('matchingSpread');
        if (!spread) return;

        const w = spread.offsetWidth;
        const h = spread.offsetHeight;
        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svgEl.setAttribute('width', w);
        svgEl.setAttribute('height', h);
        svgEl.innerHTML = '';

        const sr = spread.getBoundingClientRect();

        // Colorear las cajas de sumas según la cuerda conectada (correcta o incorrecta)
        sumsEl.querySelectorAll('.match-sum-box').forEach(box => {
            box.style.borderColor = '';
            box.style.boxShadow = '';
        });

        for (const [pairId, sumId] of Object.entries(connections)) {
            const sumBox = document.getElementById(sumId);
            if (sumBox) {
                sumBox.style.borderColor = LAZO_COLORS[pairId] || '#fb923c';
                sumBox.style.boxShadow = `0 0 0 2px ${LAZO_BOX_BG[pairId] || 'rgba(0,0,0,0.08)'}`;
            }
        }

        for (const [pairId, sumId] of Object.entries(connections)) {
            const pEl = document.getElementById(pairId);
            const sEl = document.getElementById(sumId);
            if (!pEl || !sEl) continue;

            const pAnchor = pEl.querySelector('.match-pair-image') || pEl;
            const pR = pAnchor.getBoundingClientRect();
            const sR = sEl.getBoundingClientRect();

            let renderedLeft = pR.left;
            let renderedRight = pR.right;
            let renderedTop = pR.top;
            let renderedHeight = pR.height;

            // Ajustar al contenido realmente visible del IMG (sin bandas vacías por object-fit: contain).
            if (pAnchor.tagName === 'IMG' && pAnchor.naturalWidth > 0 && pAnchor.naturalHeight > 0) {
                const boxW = pR.width;
                const boxH = pR.height;
                const boxRatio = boxW / boxH;
                const imgRatio = pAnchor.naturalWidth / pAnchor.naturalHeight;

                if (imgRatio > boxRatio) {
                    // Ocupa todo el ancho; se centra verticalmente.
                    const renderedH = boxW / imgRatio;
                    const offsetY = (boxH - renderedH) / 2;
                    renderedTop = pR.top + offsetY;
                    renderedHeight = renderedH;
                } else {
                    // Ocupa todo el alto; se centra horizontalmente.
                    const renderedW = boxH * imgRatio;
                    const offsetX = (boxW - renderedW) / 2;
                    renderedLeft = pR.left + offsetX;
                    renderedRight = renderedLeft + renderedW;
                }
            }

            const pairCenterX = (renderedLeft + renderedRight) / 2;
            const sumCenterX = sR.left + (sR.width / 2);
            const pairIsLeftOfSum = pairCenterX < sumCenterX;

            const x1 = pairIsLeftOfSum
                ? (renderedRight - sr.left - 1)
                : (renderedLeft - sr.left + 1);
            const y1 = renderedTop - sr.top + renderedHeight / 2;
            const x2 = pairIsLeftOfSum
                ? (sR.left - sr.left + 2)
                : (sR.right - sr.left - 2);
            const y2 = sR.top - sr.top + sR.height / 2;
            const cx = (x1 + x2) / 2;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`);
            path.setAttribute('stroke', LAZO_COLORS[pairId] || '#7c3aed');
            path.setAttribute('stroke-width', '4');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-dasharray', '10 5');
            svgEl.appendChild(path);
        }
    }

    // ── Verificar si todas son correctas (solo al presionar botón) ─────────────────────────
    function verifyAll() {
        if (Object.keys(connections).length < 3) return;
        const wrongCount = PAIRS.filter(p => connections[p.id] !== p.correctSum).length;
        const allOk = wrongCount === 0;
        if (feedbackEl) {
            feedbackEl.textContent = allOk
                ? '✅ ¡Perfecto! Todas las parejas son correctas.'
                : `🔁 Tienes ${wrongCount} emparejamiento(s) incorrecto(s). Inténtalo de nuevo.`;
            feedbackEl.style.color = '#111827';
        }
        if (allOk) {
            matchingCompleted = true;
            updateNavButtons();
        } else {
            matchingCompleted = false;
            updateNavButtons();
        }
    }

    verifyBtn.addEventListener('click', () => {
        if (Object.keys(connections).length < 3) {
            if (feedbackEl) {
                feedbackEl.textContent = 'Une las 3 parejas antes de verificar.';
                feedbackEl.style.color = '#111827';
            }
            return;
        }
        verifyAll();
    });

    matchingDrawLines = drawLines;
    window.addEventListener('resize', drawLines);
}

// ─────────────────────────────────────────────
// 11. SPREAD 17-18 – EJERCICIOS DE CONMUTATIVIDAD
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
        await addDoc(collection(db, 'Actividad2'), {
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
// 12. SPREAD 19-20 – ENCUESTA (Google Forms)
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



