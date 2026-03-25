// --- Ocultar todas las páginas del flipbook ---
function hideAllFlipbookPages() {
    flipbook = document.getElementById('flipbook');
    if (!flipbook) return;
    const pages = flipbook.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
}

function showFlipbookPage(page) {
    if (!page) return;
    page.classList.add('active');
}
// (Movido más abajo) Hacer que syncBookNextButton esté disponible globalmente para handlers fuera del módulo
// main.js - Lógica principal de la aplicación
import { db, storage, collection, addDoc, doc, runTransaction, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase.js';
// import { estudiantesData } from './assets/estudiantes-data.js';
// Usar variable global para compatibilidad con GitHub Pages

console.log('✅ Firebase cargado correctamente');

// ========================================
// VARIABLES GLOBALES
// ========================================

let studentCode = null;
let studentInfo = null; // Información del estudiante (nombre, apellidos, curso)
let currentPage = 1;
let totalPages = 0;
let flipbook;
let cocinaScreen;

// Datos de Momento 2 (Juego de Bandejas)
let traysSystem = null; // Nueva instancia del sistema de bandejas
let m1ProblemInitialized = false;
let m1FlipbookListenerAttached = false;
let m1FlipbookPageHandler = null;
let m1NextGuardHandler = null;
let m1Moment4CompletedHandler = null;
let m1Moment3AdvanceListenerAttached = false;
let m1Q1Submitted = false;
let m1Q2Submitted = false;
let m3Q1Submitted = false;
let m3Q2Submitted = false;

function getM1Q1StorageKey() {
    if (!studentCode) return null;

    if (studentCode === '0000' && studentInfo?.nombre) {
        return `m1-q1-submitted-${studentCode}-${studentInfo.nombre.trim().toLowerCase()}`;
    }

    return `m1-q1-submitted-${studentCode}`;
}

function getM1Q2StorageKey() {
    if (!studentCode) return null;

    if (studentCode === '0000' && studentInfo?.nombre) {
        return `m1-q2-submitted-${studentCode}-${studentInfo.nombre.trim().toLowerCase()}`;
    }

    return `m1-q2-submitted-${studentCode}`;
}

function applyM1Q1SubmittedLock() {
    const statusText = document.getElementById('statusM1Q1');
    const submitBtn = document.getElementById('submitM1Q1');
    const recordBtn = document.getElementById('recordBtnM1Q1');
    const stopBtn = document.getElementById('stopBtnM1Q1');
    const canvas = document.getElementById('boardCanvasM1Q1');
    const evidenceSection = canvas ? canvas.closest('.evidence-section') : null;

    if (statusText) {
        statusText.textContent = '';
        statusText.className = 'status-text hidden';
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }

    if (recordBtn) {
        recordBtn.disabled = true;
    }

    if (stopBtn) {
        stopBtn.disabled = true;
    }

    if (canvas) {
        canvas.style.pointerEvents = 'none';
    }

    if (evidenceSection) {
        evidenceSection.querySelectorAll('.tool-btn').forEach(btn => btn.disabled = true);
    }
}

// Datos de Momento 3
let m3_a = 0;
let m3_b = 0;
let m3_choice = null;
let m3Q1EvidenceInitialized = false;
let m3Q2EvidenceInitialized = false;

// Datos de Momento 4
let m4_currentItem = 1;
let m4_responses = [];
let m4_errorsTotal = 0;
let m4_errorsConsecutive = 0;
let m4_errorsConsecutiveMax = 0;
let m4_magicLives = 3; // Sistema de vidas mágicas
let m4_isFinalizing = false;
let m4_returnHomeTimeout = null;
let m4_questions = [];
let m4_completed = false;
let m4_reflectionSelected = false;
let m4_reflectionSaved = false;
let m4_reflectionSaving = false;
let m4_closeTriggered = false;

const M4_REFLECTION_OPTION_MAP = {
    'facil': 'facil',
    'interesante': 'interesante',
    'dificil': 'dificil',
    'pensar-mucho': 'pensarMucho',
    'confusa': 'confusa'
};

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Aplicación iniciada');
    console.log('📅 Fecha:', new Date().toLocaleString());
    
    // Inicialización completada
    console.log('✅ Sistema inicializado');
    
    // Verificar si ya hay código guardado
    const savedCode = localStorage.getItem('studentCode');
    if (savedCode) {
        studentCode = savedCode;
        console.log('ℹ️ Código guardado encontrado:', studentCode);

        if (savedCode === '0000') {
            const savedGuestName = localStorage.getItem('guestName');
            if (savedGuestName) {
                studentInfo = {
                    nombre: savedGuestName,
                    apellidos: '',
                    curso: 'INVITADO'
                };
            }
        }
    }
    
    initHomeScreen();
    initWelcomeScreen();
    initConfirmationScreen();
    initPortadaScreen();
// ========================================
// PANTALLA DE PORTADA
// ========================================
function initPortadaScreen() {
    const btnContinuarPortada = document.getElementById('btnContinuarPortada');
    if (btnContinuarPortada) {
        btnContinuarPortada.addEventListener('click', () => {
            showScreen('ContenedorLibro');
            initMoment1();
        });
    }
}
});

// Manejador global de errores
window.addEventListener('error', (event) => {
    console.error('❌ Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promesa rechazada:', event.reason);
});

// ========================================
// PANTALLA PRINCIPAL
// ========================================

function initHomeScreen() {
    console.log('🔧 Inicializando pantalla principal...');
    
    const activity0Btn = document.getElementById('activity0Btn');
    
    if (activity0Btn) {
        activity0Btn.addEventListener('click', () => {
            console.log('📌 Abriendo Actividad 0A en nueva pestaña');
            window.open('actividad0A.html', '_blank');
        });
    }
}

// ========================================
// PANTALLA DE BIENVENIDA
// ========================================

function initWelcomeScreen() {
    console.log('🔧 Inicializando pantalla de bienvenida...');
    
    const enterBtn = document.getElementById('enterBtn');
    const studentCodeInput = document.getElementById('studentCodeInput');
    const welcomeError = document.getElementById('welcomeError');
    
    // Bloquear cualquier tecla que no sea un número
    studentCodeInput.addEventListener('keydown', (e) => {
        // Permitir: backspace, delete, tab, escape, enter
        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Permitir: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        // Bloquear si no es un número (0-9 del teclado principal o numérico)
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
    
    // Eliminar cualquier carácter no numérico al pegar
    studentCodeInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const numericOnly = pasteData.replace(/\D/g, '');
        studentCodeInput.value = numericOnly;
    });
    
    // Verificar que los elementos existen
    if (!enterBtn || !studentCodeInput || !welcomeError) {
        console.error('❌ Error: No se encontraron los elementos de bienvenida');
        console.log('enterBtn:', enterBtn);
        console.log('studentCodeInput:', studentCodeInput);
        console.log('welcomeError:', welcomeError);
        return;
    }
    
    console.log('✅ Elementos encontrados, enlazando eventos...');
    
    enterBtn.addEventListener('click', () => {
        console.log('🖱️ Click en botón Ingresar');
        const code = studentCodeInput.value.trim();
        console.log('Código ingresado:', code);
        
        if (!code) {
            console.log('⚠️ Código vacío, mostrando error');
            welcomeError.textContent = 'Por favor ingresa tu código estudiantil';
            welcomeError.classList.remove('hidden');
            return;
        }
        
        // Validar que solo contenga números
        if (!/^\d+$/.test(code)) {
            console.log('⚠️ Código inválido, solo se permiten números');
            welcomeError.textContent = 'Solo se permiten números';
            welcomeError.classList.remove('hidden');
            return;
        }

        // Flujo especial para participantes invitados
        if (code === '0000') {
            const providedName = window.prompt('¡Bienvenido(a)! ¿Cuál es tu nombre?');
            const invitedName = providedName ? providedName.trim() : '';

            if (!invitedName) {
                welcomeError.textContent = 'Para continuar con el código 0000, escribe tu nombre.';
                welcomeError.classList.remove('hidden');
                return;
            }

            welcomeError.classList.add('hidden');
            studentCode = code;
            studentInfo = {
                nombre: invitedName,
                apellidos: '',
                curso: 'INVITADO'
            };

            showConfirmationScreen();
            return;
        }
        
        // Verificar que el código existe en la base de datos
        const estudiante = window.estudiantesData ? window.estudiantesData[code] : undefined;
        if (!estudiante) {
            console.log('⚠️ Código no encontrado en la base de datos');
            welcomeError.textContent = 'Código no encontrado. Verifica que esté bien escrito.';
            welcomeError.classList.remove('hidden');
            return;
        }
        
        // Ocultar error si había uno previo
        welcomeError.classList.add('hidden');
        
        // Guardar temporalmente el código y la información del estudiante
        // NO guardar en localStorage hasta que se confirme
        studentCode = code;
        studentInfo = estudiante;
        console.log('✅ Estudiante encontrado:', estudiante);
        console.log('⏯️ Navegando a pantalla de confirmación...');
        
        // Navegar a pantalla de confirmación - REQUERIDO, no se puede saltar
        showConfirmationScreen();
    });
    
    studentCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('⌨️ Tecla Enter presionada');
            enterBtn.click();
        }
    });
    
    console.log('✅ Eventos enlazados correctamente');
}

// ========================================
// PANTALLA DE CONFIRMACIÓN
// ========================================

// Función para convertir texto a formato título (Primera Letra Mayúscula)
function toTitleCase(text) {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getStudentHeaderText() {
    if (!studentCode) return '';

    if (studentCode === '0000' && studentInfo?.nombre) {
        return `${studentCode} · ${toTitleCase(studentInfo.nombre)}`;
    }

    return studentCode;
}

function showConfirmationScreen() {
    console.log('🔍 Mostrando pantalla de confirmación...');
    console.log('📋 Información del estudiante:', studentInfo);
    
    const confirmationQuestion = document.getElementById('confirmationQuestion');
    
    if (!confirmationQuestion) {
        console.error('❌ Error: No se encontró el elemento confirmationQuestion');
        return;
    }
    
    if (!studentInfo) {
        console.error('❌ Error: No hay información del estudiante');
        return;
    }
    
    // Convertir nombre y apellidos a formato título
    const nombreFormateado = toTitleCase(studentInfo.nombre || '');
    const apellidosFormateados = toTitleCase(studentInfo.apellidos || '');
    
    // Construir la pregunta basada en si es docente o estudiante
    let pregunta = '';
    if (studentCode === '0000' || studentInfo.curso === 'INVITADO') {
        pregunta = `¡Hola, ${nombreFormateado}! ¿Deseas iniciar la actividad?`;
    } else if (studentInfo.curso === 'DOCENTE') {
        pregunta = `¿Eres ${nombreFormateado} ${apellidosFormateados}?`;
    } else {
        pregunta = `¿Eres ${nombreFormateado} ${apellidosFormateados} del curso ${studentInfo.curso}?`;
    }
    
    confirmationQuestion.textContent = pregunta;
    console.log('❓ Pregunta de confirmación:', pregunta);
    showScreen('confirmationScreen');
    console.log('✅ Pantalla de confirmación mostrada');
}

function initConfirmationScreen() {
    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');
    if (!confirmYesBtn || !confirmNoBtn) {
        console.error('❌ Error: No se encontraron los botones de confirmación');
        return;
    }
    confirmYesBtn.addEventListener('click', () => {
        console.log('✅ Usuario confirmó identidad');
        if (!studentCode || !studentInfo) {
            console.error('❌ Error: No hay código o información del estudiante');
            showScreen('welcomeScreen');
            return;
        }
        // SOLO AHORA guardar el código en localStorage
        localStorage.setItem('studentCode', studentCode);
        if (studentCode === '0000' && studentInfo?.nombre) {
            localStorage.setItem('guestName', studentInfo.nombre);
        }
        console.log('💾 Código guardado en localStorage:', studentCode);
        // Navegar a Portada
        showScreen('portadaScreen');
    });
    confirmNoBtn.addEventListener('click', () => {
        console.log('❌ Usuario rechazó identidad');
        studentCode = null;
        studentInfo = null;
        localStorage.removeItem('studentCode');
        localStorage.removeItem('guestName');
        console.log('🧹 Datos limpiados');
        showScreen('welcomeScreen');
        const studentCodeInput = document.getElementById('studentCodeInput');
        if (studentCodeInput) {
            studentCodeInput.value = '';
            studentCodeInput.focus();
        }
    });
    console.log('✅ Pantalla de confirmación inicializada');
}

// ========================================
// NAVEGACIÓN ENTRE PANTALLAS
// ========================================

function showScreen(containerId) {
    console.log(`🔄 Navegando a contenedor: ${containerId}`);
    const contenedores = [
        'ContenedorBienvenida',
        'ContenedorConfirmacion',
        'ContenedorPortada',
        'ContenedorLibro'
    ];
    contenedores.forEach(id => {
        const c = document.getElementById(id);
        if (c) c.style.display = 'none';
    });
    const target = document.getElementById(containerId);
    if (target) {
        target.style.display = '';
        // Si contiene una sección con clase .screen, actívala
        const screen = target.querySelector('.screen');
        if (screen) screen.classList.add('active');
    } else {
        console.error(`❌ Error: No se encontró el contenedor con ID: ${containerId}`);
    }
    // Actualizar código estudiantil en encabezados
    if (studentCode) {
        document.querySelectorAll('.student-code-display span').forEach(span => {
            span.textContent = getStudentHeaderText();
        });
    }
}

// ========================================
// MOMENTO 1: CUENTO + PROBLEMA Q1
// ========================================

function initMoment1() {
    console.log('[initMoment1] Entrando a la pantalla del cuento...');
    // Forzar cocinaScreen oculta al iniciar momento 1
    cocinaScreen = document.getElementById('cocinaScreen');
    if (cocinaScreen) {
        cocinaScreen.classList.add('hidden');
    }
    const moment1Screen = document.getElementById('moment1Screen');
    if (moment1Screen) {
        moment1Screen.classList.add('active');
        console.log('[initMoment1] moment1Screen activa');
    }
    flipbook = document.getElementById('flipbook');
    if (flipbook) {
        // Limpiar visibilidad de todas las páginas
        const pages = flipbook.querySelectorAll('.page');
        pages.forEach(p => {
            p.classList.remove('active');
        });
        // Mostrar solo la portada
        const portada = flipbook.querySelector('.book-cover-page');
        if (portada) {
            portada.classList.add('active');
            console.log('[initMoment1] Portada activada');
        } else {
            console.warn('[initMoment1] No se encontró la portada (book-cover-page)');
        }
    } else {
        console.warn('[initMoment1] No se encontró el flipbook');
    }
    const studentCodeM1 = document.getElementById('studentCodeM1');
    if (studentCodeM1) {
        studentCodeM1.textContent = getStudentHeaderText();
    } else {
        console.error('❌ No se encontró el elemento studentCodeM1');
    }

    console.log('✅ Momento 1 inicializado');
    console.log('📖 El cuento ya está en el HTML, no necesita cargarse');

    const problemSection = document.getElementById('problemQ1Section');
    const problemSection2 = document.getElementById('problemQ2Section');
    const problemSection3 = document.getElementById('problemQ3Section');
    const problemSection3b = document.getElementById('problemQ3Section2');
    const problemSection4 = document.getElementById('problemQ4Section');
    const problemSection5 = document.getElementById('problemQ5Section');
    const m1Q2FinalQuestion = document.getElementById('m1Q2FinalQuestion');
    flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const soundToggle = document.getElementById('soundToggle');
    let traysM1Q2Initialized = false;
    let m1Q2Verified = false;
    let m1Q2AudioInitialized = false;
    let m3BookInitialized = false;
    let m4BookInitialized = false;
    const m1StorageKey = getM1Q1StorageKey();
    const m1Q2StorageKey = getM1Q2StorageKey();
    m1Q1Submitted = m1StorageKey ? localStorage.getItem(m1StorageKey) === 'true' : false;
    m1Q2Submitted = m1Q2StorageKey ? localStorage.getItem(m1Q2StorageKey) === 'true' : false;
    cocinaScreen = document.getElementById('cocinaScreen');
    const goToCocinaBtn = document.getElementById('goToCocinaBtn');

    // Refuerzo de visibilidad y diagnóstico
    // --- Eliminado todo el refuerzo de visibilidad y diagnóstico anterior ---

    const flipbookPages = Array.from(flipbook.querySelectorAll('.page'));
    const q1PageIndex = flipbookPages.findIndex(page => page.id === 'problemQ1Section');
    const q2PageIndex = flipbookPages.findIndex(page => page.id === 'problemQ2Section');
    const q3PageIndex = flipbookPages.findIndex(page => page.id === 'problemQ3Section');
    const q3bPageIndex = flipbookPages.findIndex(page => page.id === 'problemQ3Section2');
    const q4PageIndex = flipbookPages.findIndex(page => page.id === 'problemQ4Section');
    const q5PageIndex = flipbookPages.findIndex(page => page.id === 'problemQ5Section');

    // --- ACTIVAR PORTADA SI NINGUNA PÁGINA ESTÁ ACTIVA ---
    if (flipbookPages.length > 0) {
        const anyActive = flipbookPages.some(p => p.classList.contains('active'));
        if (!anyActive) {
            // Quitar display:none de todas
            flipbookPages.forEach(p => p.style.display = '');
            // Activar la portada (primera página)
            flipbookPages[0].classList.add('active');
            console.log('ℹ️ Portada activada automáticamente');
        } else {
            console.log('ℹ️ Ya hay una página activa en el flipbook');
        }
    } else {
        console.warn('⚠️ No se encontraron páginas en el flipbook');
    }

    const getCurrentFlipbookPage = (event) => Number.isInteger(event?.detail?.page)
        ? event.detail.page
        : (window.flipbookControls?.getCurrentPage?.() ?? 0);

    const syncBookNextButton = () => {
        if (!nextBtn) return;

        const currentFlipbookPage = getCurrentFlipbookPage();

        nextBtn.style.display = '';
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';

        if (currentFlipbookPage === q1PageIndex) {
            nextBtn.disabled = !m1Q1Submitted;
        } else if (currentFlipbookPage === q2PageIndex) {
            // Solo habilitar si el usuario fue a la cocina y además grabó y envió el audio
            nextBtn.disabled = !(m1Q2Verified && m1Q2Submitted);
        } else if (currentFlipbookPage === q3PageIndex) {
            nextBtn.disabled = !m3Q1Submitted;
        } else if (currentFlipbookPage === q3bPageIndex) {
            nextBtn.disabled = !m3Q2Submitted;
        } else if (currentFlipbookPage === q4PageIndex) {
            nextBtn.disabled = !m4_completed;
        } else if (currentFlipbookPage === q5PageIndex) {
            nextBtn.disabled = !m4_reflectionSelected;
        }

        if (nextBtn.disabled) {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }
    };

    // Hacer que syncBookNextButton esté disponible globalmente para handlers fuera del módulo
    window.syncBookNextButton = syncBookNextButton;

    const showM1Q2FinalQuestion = () => {
        if (!m1Q2FinalQuestion) return;
        m1Q2FinalQuestion.classList.remove('hidden');
        m1Q2FinalQuestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (!m1Q2AudioInitialized) {
            m1Q2AudioInitialized = true;
            const audioState = initAudio('recordBtnM1Q2', 'stopBtnM1Q2', 'audioStatusM1Q2');
            const submitBtn = document.getElementById('submitM1Q2');
            const recordBtn = document.getElementById('recordBtnM1Q2');
            const stopBtn = document.getElementById('stopBtnM1Q2');
            if (submitBtn && audioState) {
                const checkAudio = setInterval(() => {
                    if (audioState.audioBlob) { submitBtn.disabled = false; clearInterval(checkAudio); }
                }, 500);
                submitBtn.addEventListener('click', async () => {
                    submitBtn.disabled = true;
                    const statusEl = document.getElementById('statusM1Q2');
                    if (statusEl) { statusEl.textContent = 'Subiendo...'; statusEl.className = 'status-text loading'; statusEl.style.display = 'block'; }
                    try {
                        await submitEvidence({
                            moment: 'm1', tag: 'q2-final',
                            data: { question: '¿Por qué bandejas distintas tienen la misma cantidad?' },
                            boardBlob: null, audioBlob: audioState.audioBlob
                        });
                        m1Q2Submitted = true;
                        if (m1Q2StorageKey) {
                            localStorage.setItem(m1Q2StorageKey, 'true');
                        }
                        if (statusEl) { statusEl.textContent = ''; statusEl.className = 'status-text hidden'; statusEl.style.display = 'none'; }
                        submitBtn.disabled = true;
                        submitBtn.style.opacity = '0.5';
                        submitBtn.style.cursor = 'not-allowed';
                        if (recordBtn) {
                            recordBtn.disabled = true;
                            recordBtn.style.opacity = '0.5';
                            recordBtn.style.cursor = 'not-allowed';
                        }
                        if (stopBtn) {
                            stopBtn.disabled = true;
                            stopBtn.classList.add('hidden');
                        }
                        syncBookNextButton();
                    } catch (err) {
                        // Fallback local: evita bloquear el flujo pedagógico por fallas de red.
                        m1Q2Submitted = true;
                        if (m1Q2StorageKey) {
                            localStorage.setItem(m1Q2StorageKey, 'true');
                        }
                        if (statusEl) {
                            statusEl.textContent = 'Se guardó localmente por problema de conexión. Puedes continuar.';
                            statusEl.className = 'status-text info';
                            statusEl.style.display = 'block';
                        }
                        submitBtn.disabled = true;
                        submitBtn.style.opacity = '0.5';
                        submitBtn.style.cursor = 'not-allowed';
                        if (recordBtn) {
                            recordBtn.disabled = true;
                            recordBtn.style.opacity = '0.5';
                            recordBtn.style.cursor = 'not-allowed';
                        }
                        if (stopBtn) {
                            stopBtn.disabled = true;
                            stopBtn.classList.add('hidden');
                        }
                        syncBookNextButton();
                    }
                });
            }
        }
    };

    const updateCocinaButtonState = () => {
        if (!goToCocinaBtn) return;
        if (m1Q2Verified) {
            goToCocinaBtn.disabled = true;
            goToCocinaBtn.setAttribute('aria-disabled', 'true');
            goToCocinaBtn.textContent = '✅ Organización completada';
            return;
        }
        goToCocinaBtn.disabled = false;
        goToCocinaBtn.removeAttribute('aria-disabled');
        goToCocinaBtn.textContent = '👩‍🍳 Ir a la cocina a organizar';
    };


    const initSheet11Trays = () => {
        if (traysM1Q2Initialized) return;
        try {
            if (traysSystem) {
                traysSystem.destroy();
                traysSystem = null;
            }

            traysSystem = new TraysSystem('traysAreaM1Q2');
            traysM1Q2Initialized = true;

            const verifyBtn = document.getElementById('verifyTraysBtnM1Q2');
            const feedback = document.getElementById('traysFeedbackM1Q2');

            if (verifyBtn && feedback) {
                verifyBtn.addEventListener('click', () => {
                    const results = traysSystem.validatePairings();
                    const correctPairs = results.filter(r => r.isCorrect).length;
                    const incorrectPairs = results.filter(r => !r.isCorrect).length;

                    // Detectar si quedan pares válidos entre las bandejas sin emparejar
                    const pairedIds = new Set([...traysSystem.pairings.keys()]);
                    const unpairedTrays = traysSystem.BASE_TRAYS.filter(t => !pairedIds.has(t.id));
                    let validPairRemains = false;
                    outer: for (let i = 0; i < unpairedTrays.length; i++) {
                        for (let j = i + 1; j < unpairedTrays.length; j++) {
                            if (unpairedTrays[i].total === unpairedTrays[j].total) {
                                validPairRemains = true;
                                break outer;
                            }
                        }
                    }

                    // Todas las parejas correctas y no quedan más pares posibles → éxito
                    if (incorrectPairs === 0 && !validPairRemains) {
                        feedback.textContent = '¡Excelente! Has encontrado todas las parejas posibles.';
                        feedback.className = 'feedback-text success';
                        // Congelar: deshabilitar botón y bloquear interacción con bandejas
                        verifyBtn.disabled = true;
                        if (traysSystem.selectedTray) {
                            traysSystem.selectedTray.classList.remove('selected');
                            traysSystem.selectedTray = null;
                        }
                        traysSystem.container.style.pointerEvents = 'none';
                        m1Q2Verified = true;
                        updateCocinaButtonState();
                        setTimeout(() => {
                            hideCocinaScreen();
                            showM1Q2FinalQuestion();
                        }, 1500);
                        return;
                    }

                    // Hay parejas incorrectas
                    if (incorrectPairs > 0) {
                        const hint = correctPairs > 0
                            ? ` Tienes ${correctPairs} ${correctPairs === 1 ? 'pareja correcta' : 'parejas correctas'}.`
                            : '';
                        feedback.textContent = `Hay ${incorrectPairs === 1 ? 'una pareja' : 'parejas'} con cantidades distintas.${hint} Revisa e intenta de nuevo.`;
                        feedback.className = 'feedback-text error';
                        return;
                    }

                    // Todo correcto hasta ahora, pero aún quedan pares válidos por hacer
                    if (correctPairs > 0) {
                        feedback.textContent = `Vas bien: tienes ${correctPairs} ${correctPairs === 1 ? 'pareja correcta' : 'parejas correctas'}. Aún puedes hacer más emparejamientos.`;
                    } else {
                        feedback.textContent = 'Aún no tienes emparejamientos. ¡Selecciona dos bandejas para comenzar!';
                    }
                    feedback.className = 'feedback-text info';
                });
            }
        } catch (error) {
            console.error('❌ Error al inicializar bandejas de hoja 11:', error);
        }
    };

    const showCocinaScreen = () => {
        if (!cocinaScreen) return;
        if (m1Q2Verified) return;
        cocinaScreen.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (typeof window.playPageTurnSound === 'function') window.playPageTurnSound();
        initSheet11Trays();
    };

    const hideCocinaScreen = () => {
        if (!cocinaScreen) return;
        cocinaScreen.classList.add('hidden');
        document.body.style.overflow = '';
        if (typeof window.playPageTurnSound === 'function') window.playPageTurnSound();
        // Mostrar la imagen de bandejas al regresar de la cocina
        const bandejasFotoRegreso = document.getElementById('bandejasFotoRegreso');
        if (bandejasFotoRegreso) {
            bandejasFotoRegreso.classList.remove('hidden');
        }
    };

    const closeBookAndReturnToActivities = () => {
        if (m4_closeTriggered) return;
        m4_closeTriggered = true;

        const wrapper = document.querySelector('.flipbook-wrapper');
        if (wrapper) {
            wrapper.classList.add('book-closing');
        }

        if (prevBtn) {
            prevBtn.style.display = 'none';
            prevBtn.disabled = true;
        }
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.disabled = true;
        }

        const existingOverlay = document.getElementById('bookClosingOverlay');
        if (!existingOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'bookClosingOverlay';
            overlay.className = 'book-closing-overlay';
            overlay.innerHTML = '<div class="book-closing-card"><h3>📚 Cerrando el libro...</h3><p>Regresando a la página de actividades.</p></div>';
            document.body.appendChild(overlay);
        }

        if (m4_returnHomeTimeout) {
            clearTimeout(m4_returnHomeTimeout);
        }
        m4_returnHomeTimeout = setTimeout(() => {
            window.location.href = 'index.html';
        }, 5000);
    };

    const getMoment4ReflectionSelection = () => {
        const checkedOptions = Array.from(document.querySelectorAll('input[name="m4Reflection"]:checked'));
        const values = checkedOptions.map((option) => option.value);
        const labels = checkedOptions.map((option) => {
            const label = option.closest('label');
            return (label?.textContent || option.value).trim();
        });

        return { values, labels };
    };

    const getParticipantIdentifier = () => {
        const participantName = [studentInfo?.nombre, studentInfo?.apellidos]
            .filter(Boolean)
            .join(' ')
            .trim();

        const effectiveIdentifier = (studentCode === '0000' && participantName)
            ? participantName
            : studentCode;

        const storageSafeIdentifier = String(effectiveIdentifier || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '');

        return storageSafeIdentifier || 'invitado';
    };

    const saveMoment4ReflectionStats = async (selectedValues, selectedLabels) => {
        if (!db) {
            throw new Error('Firestore no está disponible para actualizar estadísticas.');
        }

        const selectedFields = selectedValues
            .map((value) => M4_REFLECTION_OPTION_MAP[value])
            .filter(Boolean);

        const uniqueSelectedFields = Array.from(new Set(selectedFields));
        const participantIdentifier = getParticipantIdentifier();
        const responseRef = doc(db, 'reflectionResponses', `act0_m4_${participantIdentifier}`);
        const statsRef = doc(db, 'stats', 'act0_m4_reflection');

        await runTransaction(db, async (transaction) => {
            const previousResponseSnapshot = await transaction.get(responseRef);
            const statsSnapshot = await transaction.get(statsRef);

            const previousSelectedFields = Array.isArray(previousResponseSnapshot.data()?.selectedFields)
                ? previousResponseSnapshot.data().selectedFields
                : [];

            const counters = {
                facil: Number(statsSnapshot.data()?.facil || 0),
                interesante: Number(statsSnapshot.data()?.interesante || 0),
                dificil: Number(statsSnapshot.data()?.dificil || 0),
                pensarMucho: Number(statsSnapshot.data()?.pensarMucho || 0),
                confusa: Number(statsSnapshot.data()?.confusa || 0),
                totalResponses: Number(statsSnapshot.data()?.totalResponses || 0)
            };

            const counterKeys = ['facil', 'interesante', 'dificil', 'pensarMucho', 'confusa'];
            counterKeys.forEach((key) => {
                const wasSelected = previousSelectedFields.includes(key);
                const isSelected = uniqueSelectedFields.includes(key);

                if (wasSelected && !isSelected) {
                    counters[key] = Math.max(0, counters[key] - 1);
                }

                if (!wasSelected && isSelected) {
                    counters[key] += 1;
                }
            });

            if (!previousResponseSnapshot.exists()) {
                counters.totalResponses += 1;
            }

            transaction.set(responseRef, {
                participantIdentifier,
                activity: 'act0',
                moment: 'm4',
                tag: 'reflection-final',
                selectedOptions: selectedValues,
                selectedLabels,
                selectedFields: uniqueSelectedFields,
                updatedAt: serverTimestamp()
            }, { merge: true });

            transaction.set(statsRef, {
                activity: 'act0',
                moment: 'm4',
                tag: 'reflection-final',
                facil: counters.facil,
                interesante: counters.interesante,
                dificil: counters.dificil,
                pensarMucho: counters.pensarMucho,
                confusa: counters.confusa,
                totalResponses: counters.totalResponses,
                updatedAt: serverTimestamp()
            }, { merge: true });
        });
    };

    const saveMoment4Reflection = async () => {
        if (m4_reflectionSaved) return true;
        if (m4_reflectionSaving) return false;

        const { values, labels } = getMoment4ReflectionSelection();
        if (values.length === 0 || values.length > 2) {
            const hint = document.querySelector('#problemQ5Section .reflection-hint');
            if (hint) {
                hint.textContent = values.length > 2
                    ? 'Puedes seleccionar máximo dos opciones.'
                    : 'Selecciona al menos una opción para continuar.';
            }
            return false;
        }

        const nextButton = document.getElementById('nextBtn');
        const hint = document.querySelector('#problemQ5Section .reflection-hint');
        m4_reflectionSaving = true;

        if (nextButton) {
            nextButton.disabled = true;
        }
        if (hint) {
            hint.textContent = 'Guardando tu respuesta...';
        }

        try {
            await submitEvidence({
                moment: 'm4',
                tag: 'reflection-final',
                data: {
                    selectedOptions: values,
                    selectedLabels: labels,
                    selectedCount: values.length
                },
                boardBlob: null,
                audioBlob: null
            });

            await saveMoment4ReflectionStats(values, labels);

            m4_reflectionSaved = true;
            if (hint) {
                hint.textContent = 'Respuesta guardada. Puedes continuar.';
            }
            return true;
        } catch (error) {
            console.error('❌ Error al guardar reflexión final:', error);
            if (hint) {
                hint.textContent = 'No se pudo guardar. Revisa internet e intenta de nuevo.';
            }
            return false;
        } finally {
            m4_reflectionSaving = false;
            syncBookNextButton();
        }
    };

    const updateMoment4ReflectionSelection = (event) => {
        const checkedOptions = document.querySelectorAll('input[name="m4Reflection"]:checked');
        const hint = document.querySelector('#problemQ5Section .reflection-hint');

        if (checkedOptions.length > 2 && event?.target) {
            event.target.checked = false;
        }

        const validCheckedOptions = document.querySelectorAll('input[name="m4Reflection"]:checked');
        m4_reflectionSelected = validCheckedOptions.length > 0 && validCheckedOptions.length <= 2;
        m4_reflectionSaved = false;

        if (hint) {
            if (validCheckedOptions.length === 0) {
                hint.textContent = 'Selecciona al menos una opción para continuar (máximo dos).';
            } else if (validCheckedOptions.length >= 2) {
                hint.textContent = 'Ya seleccionaste el máximo de dos opciones.';
            } else {
                hint.textContent = 'Puedes seleccionar una opción más (máximo dos).';
            }
        }

        syncBookNextButton();
    };

    const syncM1WithFlipbookPage = (event) => {
        // Oculta todas las páginas antes de mostrar la actual
        hideAllFlipbookPages();
        // Mostrar la página activa
        const currentFlipbookPage = getCurrentFlipbookPage(event);
        if (flipbookPages[currentFlipbookPage]) {
            showFlipbookPage(flipbookPages[currentFlipbookPage]);
        }
        if (!problemSection || !flipbook) {
            return;
        }

        const isProblemPage = [q1PageIndex, q2PageIndex, q3PageIndex, q3bPageIndex, q4PageIndex, q5PageIndex].includes(currentFlipbookPage);

        if (soundToggle) {
            soundToggle.style.display = isProblemPage ? 'none' : '';
        }

        if (prevBtn) {
            prevBtn.style.display = '';
            prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
            prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
        }

        if (currentFlipbookPage === q1PageIndex) {
            if (m1Q1Submitted) {
                applyM1Q1SubmittedLock();
            } else if (!m1ProblemInitialized) {
                m1ProblemInitialized = true;
                initProblemQ1();
            }
        }

        if (currentFlipbookPage === q2PageIndex) {
            updateCocinaButtonState();
            initSheet11Trays();
            if (m1Q2Verified) {
                showM1Q2FinalQuestion();
            }
        }

        if (currentFlipbookPage === q3PageIndex && !m3BookInitialized) {
            m3BookInitialized = true;
            const nums = [3, 4, 5, 6, 7];
            const fixedNum = nums[Math.floor(Math.random() * nums.length)];
            ['q3FixedNum1', 'q3FixedNum2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = fixedNum;
            });
            initMoment3();
            const studentCodeM3 = document.getElementById('studentCodeM3');
            if (studentCodeM3) {
                studentCodeM3.textContent = getStudentHeaderText();
            }
        }

        if (currentFlipbookPage === q4PageIndex && !m4BookInitialized) {
            m4BookInitialized = true;
            initMoment4();
        }

        syncBookNextButton();
    };

    if (m1NextGuardHandler && nextBtn) {
        nextBtn.removeEventListener('click', m1NextGuardHandler, true);
    }

    if (nextBtn) {
        m1NextGuardHandler = async (event) => {
            const currentFlipbookPage = getCurrentFlipbookPage();

            if (currentFlipbookPage === q1PageIndex && !m1Q1Submitted) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (currentFlipbookPage === q2PageIndex && !m1Q2Submitted) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (currentFlipbookPage === q3PageIndex && !m3Q1Submitted) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (currentFlipbookPage === q3bPageIndex && !m3Q2Submitted) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (currentFlipbookPage === q4PageIndex && !m4_completed) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (currentFlipbookPage === q5PageIndex) {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (!m4_reflectionSelected) {
                    return;
                }

                const saved = await saveMoment4Reflection();
                if (saved) {
                    closeBookAndReturnToActivities();
                }
            }
        };

        nextBtn.addEventListener('click', m1NextGuardHandler, true);
    }

    if (goToCocinaBtn) {
        goToCocinaBtn.addEventListener('click', showCocinaScreen);
    }

    updateCocinaButtonState();

    document.querySelectorAll('input[name="m4Reflection"]').forEach((option) => {
        option.addEventListener('change', updateMoment4ReflectionSelection);
    });

    if (m1Moment4CompletedHandler) {
        document.removeEventListener('moment4:completed', m1Moment4CompletedHandler);
    }

    m1Moment4CompletedHandler = () => {
        m4_completed = true;
        syncBookNextButton();
    };

    document.addEventListener('moment4:completed', m1Moment4CompletedHandler);

    if (m1FlipbookPageHandler) {
        document.removeEventListener('flipbook:pagechange', m1FlipbookPageHandler);
    }

    m1FlipbookPageHandler = syncM1WithFlipbookPage;
    document.addEventListener('flipbook:pagechange', m1FlipbookPageHandler);
    m1FlipbookListenerAttached = true;
    console.log('✅ Listener de cambio de página del cuento configurado');

    syncM1WithFlipbookPage();

}

// ========================================
// PROBLEMA Q1 CON TABLERO Y AUDIO
// ========================================

function initProblemQ1() {
    console.log('🔧 Inicializando Problema Q1...');

    if (m1Q1Submitted) {
        applyM1Q1SubmittedLock();
        return;
    }
    
    const canvasId = 'boardCanvasM1Q1';
    const recordBtnId = 'recordBtnM1Q1';
    const stopBtnId = 'stopBtnM1Q1';
    const statusId = 'audioStatusM1Q1';
    const submitBtnId = 'submitM1Q1';
    const statusTextId = 'statusM1Q1';
    
    // Verificar que existen los elementos
    const canvas = document.getElementById(canvasId);
    const recordBtn = document.getElementById(recordBtnId);
    const stopBtn = document.getElementById(stopBtnId);
    
    console.log('Canvas:', canvas ? '✅ Encontrado' : '❌ No encontrado');
    console.log('Botón grabar:', recordBtn ? '✅ Encontrado' : '❌ No encontrado');
    console.log('Botón detener:', stopBtn ? '✅ Encontrado' : '❌ No encontrado');
    
    if (!canvas || !recordBtn || !stopBtn) {
        console.error('⚠️ Faltan elementos necesarios para el problema Q1');
        return;
    }
    
    const boardState = initBoard(canvasId);
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    console.log('✅ Board y Audio inicializados');
    
    // Habilitar botón enviar cuando haya evidencia
    const submitBtn = document.getElementById(submitBtnId);
    const checkEvidence = () => {
        const hasAudio = audioState.audioBlob !== null;
        submitBtn.disabled = !hasAudio;
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '';
            statusText.className = 'status-text';
        }
        syncBookNextButton();
    };
    setInterval(checkEvidence, 500);
    // Enviar evidencia
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        try {
            const boardBlob = boardState.hasDrawing ? await canvasToBlob(canvasId) : null;
            await submitEvidence({
                moment: 'm1',
                tag: 'q1',
                data: { question: 'Q1: ¿Quién tiene razón?' },
                boardBlob: boardBlob,
                audioBlob: audioState.audioBlob
            });
            m1Q1Submitted = true;
            const m1StorageKey = getM1Q1StorageKey();
            if (m1StorageKey) {
                localStorage.setItem(m1StorageKey, 'true');
            }
            statusText.textContent = '';
            statusText.className = 'status-text hidden';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            syncBookNextButton();
        } catch (error) {
            console.error('Error al enviar:', error);
            console.error('Detalles del error:', error.message);
            let errorMsg = 'Error al guardar. ';
            if (error.message.includes('Firebase no está configurado')) {
                errorMsg += 'Firebase no disponible. ';
            } else if (error.message.includes('network')) {
                errorMsg += 'Revisa tu conexión a internet. ';
            }
            errorMsg += 'Intenta de nuevo.';
            statusText.textContent = errorMsg;
            statusText.className = 'status-text error';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            syncBookNextButton();
        }
    });
}

// ========================================
// MOMENTO 3: VERACIDAD + EVIDENCIA
// ========================================

function initMoment3() {
    const studentCodeM3 = document.getElementById('studentCodeM3');
    if (studentCodeM3) {
        studentCodeM3.textContent = getStudentHeaderText();
    }
    
    // Radio buttons para Problema 1
    const radiosQ1 = document.querySelectorAll('input[name="truthQ1"]');
    radiosQ1.forEach(radio => {
        radio.addEventListener('change', (e) => {
            m3_choice = e.target.value;
            showPrompt1(m3_choice);
        });
    });
    
    // Radio buttons para Problema 2
    const radiosQ2 = document.querySelectorAll('input[name="truthQ2"]');
    radiosQ2.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const choice = e.target.value;
            showPrompt2(choice);
        });
    });
    
    // Botón continuar a M4
    const continueToM4Btn = document.getElementById('continueToM4Btn');
    if (continueToM4Btn) {
        continueToM4Btn.addEventListener('click', () => {
            showScreen('moment4Screen');
            initMoment4();
        });
    }
}

function showPrompt1(choice) {
    const promptSection = document.getElementById('promptSection1');
    const promptText = document.getElementById('promptText1');
    const placeholder = document.getElementById('m3Q1Placeholder');
    
    const prompts = {
        yes: 'Explica cómo lo sabes',
        no: '¿Con qué números crees que no funcionaría?',
        unsure: 'Explícame cómo estás pensando para decidir si esta igualdad será verdadera para cualquier número.'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    if (placeholder) {
        placeholder.classList.add('hidden');
    }
    
    // Inicializar tablero y audio para problema 1
    initProblemM3Q1();
}

function showPrompt2(choice) {
    const promptSection = document.getElementById('promptSection2');
    const promptText = document.getElementById('promptText2');
    const placeholder = document.getElementById('m3Q2Placeholder');
    
    const prompts = {
        yes: 'Explica cómo lo sabes',
        no: '¿Con qué números crees que no funcionaría?',
        unsure: 'Explícame cómo estás pensando para decidir si esta igualdad será verdadera para cualquier número.'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    if (placeholder) {
        placeholder.classList.add('hidden');
    }
    
    // Inicializar tablero y audio para problema 2
    initProblemM3Q2();
}

function initProblemM3Q1() {
    if (m3Q1EvidenceInitialized) return;
    m3Q1EvidenceInitialized = true;

    const recordBtnId = 'recordBtnM3Q1';
    const stopBtnId = 'stopBtnM3Q1';
    const statusId = 'audioStatusM3Q1';
    const submitBtnId = 'submitM3Q1';
    const statusTextId = 'statusM3Q1';
    
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasAudio = audioState.audioBlob !== null;
        submitBtn.disabled = !hasAudio;
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '✅ Listo para enviar';
            statusText.className = 'status-text success';
        }
        syncBookNextButton();
    };
    let checkInterval = setInterval(checkEvidence, 500);
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        clearInterval(checkInterval);
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        try {
            const boardBlob = null;
            await submitEvidence({
                moment: 'm3',
                tag: 'problema1',
                data: { choice: m3_choice },
                boardBlob: boardBlob,
                audioBlob: audioState.audioBlob
            });
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            m3Q1Submitted = true;
            const recordBtn = document.getElementById(recordBtnId);
            const stopBtn = document.getElementById(stopBtnId);
            if (recordBtn) {
                recordBtn.disabled = true;
                recordBtn.style.opacity = '0.5';
                recordBtn.style.cursor = 'not-allowed';
            }
            if (stopBtn) {
                stopBtn.disabled = true;
                stopBtn.classList.add('hidden');
            }
            syncBookNextButton();
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            checkInterval = setInterval(checkEvidence, 500);
            syncBookNextButton();
        }
    });
}

function initProblemM3Q2() {
    if (m3Q2EvidenceInitialized) return;
    m3Q2EvidenceInitialized = true;

    const recordBtnId = 'recordBtnM3Q2';
    const stopBtnId = 'stopBtnM3Q2';
    const statusId = 'audioStatusM3Q2';
    const submitBtnId = 'submitM3Q2';
    const statusTextId = 'statusM3Q2';

    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasAudio = audioState.audioBlob !== null;
        submitBtn.disabled = !hasAudio;
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '✅ Listo para enviar';
            statusText.className = 'status-text success';
        }
        syncBookNextButton();
    };
    let checkInterval = setInterval(checkEvidence, 500);
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        clearInterval(checkInterval);
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        try {
            const choice2 = document.querySelector('input[name="truthQ2"]:checked')?.value;
            await submitEvidence({
                moment: 'm3',
                tag: 'problema2',
                data: { choice: choice2 },
                boardBlob: null,
                audioBlob: audioState.audioBlob
            });
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            m3Q2Submitted = true;
            document.getElementById(recordBtnId).disabled = true;
            document.getElementById(stopBtnId).disabled = true;
            document.getElementById(stopBtnId).classList.add('hidden');
            syncBookNextButton();
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            checkInterval = setInterval(checkEvidence, 500);
            syncBookNextButton();
        }
    });
}

// ========================================
// MOMENTO 4: 6 ÍTEMS
// ========================================

function initMoment4() {
    m4_currentItem = 1;
    m4_responses = [];
    m4_errorsTotal = 0;
    m4_errorsConsecutive = 0;
    m4_errorsConsecutiveMax = 0;
    m4_magicLives = 3; // Sistema de vidas mágicas
    m4_isFinalizing = false;
    m4_completed = false;
    m4_reflectionSelected = false;
    m4_reflectionSaved = false;
    m4_reflectionSaving = false;
    m4_closeTriggered = false;
    if (m4_returnHomeTimeout) {
        clearTimeout(m4_returnHomeTimeout);
        m4_returnHomeTimeout = null;
    }

    document.querySelectorAll('.magic-heart').forEach(heart => heart.classList.remove('lost'));
    const finalSection = document.getElementById('finalQuestionSection');
    if (finalSection) {
        finalSection.classList.add('hidden');
    }
    const magicTheme = document.querySelector('#problemQ4Section .magic-theme');
    if (magicTheme) {
        magicTheme.classList.remove('m4-final-only');
    }
    const problemQ4Section = document.getElementById('problemQ4Section');
    if (problemQ4Section) {
        problemQ4Section.classList.remove('m4-final-only');
    }

    document.getElementById('studentCodeM4').textContent = getStudentHeaderText();
    
    // Generar las 6 preguntas
    generateMoment4Questions();
    
    // Mostrar primer ítem
    showItem(1);
}

function generateMoment4Questions() {
    // Generar 6 preguntas con números aleatorios entre 1 y 50
    const questions = [];
    
    // SVG del sobre mágico (faltante)
    const envelope = `<span class="missing-envelope" aria-label="sobre misterioso" role="img">
        <svg class="envelope magic" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="10" width="50" height="35" fill="#ffd166" stroke="#ff9f1c" stroke-width="2" rx="4"/>
            <path d="M5 10 L30 30 L55 10" fill="#ffe28a" stroke="#ff9f1c" stroke-width="2"/>
            <path d="M5 10 L30 30 L55 10 Z" fill="#fff4c2" opacity="0.85"/>
            <circle cx="30" cy="28" r="3" fill="#ff6f91"/>
        </svg>
    </span>`;
    
    const patterns = [
        (a, b) => ({ eq: `${a} × ${envelope} = ${b} × ${a}`, ans: b, fullEq: `${a} × ${b} = ${b} × ${a}` }),
        (a, b) => ({ eq: `${envelope} × ${a} = ${a} × ${b}`, ans: b, fullEq: `${b} × ${a} = ${a} × ${b}` }),
        (a, b) => ({ eq: `${a} × ${b} = ${b} × ${envelope}`, ans: a, fullEq: `${a} × ${b} = ${b} × ${a}` }),
        (a, b) => ({ eq: `${envelope} × ${b} = ${b} × ${a}`, ans: a, fullEq: `${a} × ${b} = ${b} × ${a}` }),
        (a, b) => ({ eq: `${b} × ${envelope} = ${a} × ${b}`, ans: a, fullEq: `${b} × ${a} = ${a} × ${b}` }),
        (a, b) => ({ eq: `${a} × ${b} = ${envelope} × ${a}`, ans: b, fullEq: `${a} × ${b} = ${b} × ${a}` })
    ];
    
    patterns.forEach(pattern => {
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        const result = pattern(a, b);
        questions.push({
            equation: result.eq,
            answer: result.ans,
            fullEquation: result.fullEq
        });
    });
    
    m4_questions = questions;

    const wrapper = document.getElementById('itemsWrapper');
    wrapper.innerHTML = '<div id="m4ActiveItem" class="item-box"></div>';
}

function showItem(itemNum) {
    const activeBox = document.getElementById('m4ActiveItem');
    const question = m4_questions[itemNum - 1];

    if (!activeBox || !question) {
        return;
    }

    const renderQuestion = () => {
        activeBox.innerHTML = `
            <div class="item-equation">${question.equation}</div>
            <div style="text-align: center; margin-top: 20px;">
                <input type="number"
                       class="item-input"
                       data-answer="${question.answer}"
                       data-full-equation="${question.fullEquation}"
                       data-attempts="0"
                       placeholder="?"
                       min="1"
                       max="50">
                <button class="btn btn-primary check-answer-btn" style="margin-left: 15px; padding: 10px 25px;">Comprobar</button>
            </div>
            <div class="item-feedback" style="margin-top: 15px; font-size: 1.2em; min-height: 50px;"></div>
        `;

        const checkBtn = activeBox.querySelector('.check-answer-btn');
        const input = activeBox.querySelector('.item-input');

        checkBtn.addEventListener('click', () => validateItem(input, activeBox));

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkBtn.click();
            }
        });

        input.focus();
    };

    if (!activeBox.hasChildNodes()) {
        renderQuestion();
        return;
    }

    activeBox.classList.add('item-box-transition-out');
    setTimeout(() => {
        renderQuestion();
        activeBox.classList.remove('item-box-transition-out');
        activeBox.classList.add('item-box-transition-in');
        setTimeout(() => {
            activeBox.classList.remove('item-box-transition-in');
        }, 260);
    }, 220);
}

// ========================================
// SISTEMA DE VIDAS MÁGICAS
// ========================================

function loseLife() {
    if (m4_magicLives > 0) {
        m4_magicLives--;
        const hearts = document.querySelectorAll('.magic-heart');
        if (hearts[2 - m4_magicLives]) {
            hearts[2 - m4_magicLives].classList.add('lost');
        }
        
        if (m4_magicLives === 0) {
            // Game over - finalizar actividad
            setTimeout(() => {
                finalizeMoment4();
            }, 2000);
        }
    }
}

// ========================================
// ANIMACIÓN DE HECHIZO
// ========================================

function createSpellEffect(itemBox) {
    const canvas = document.getElementById('magicCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    const colors = ['#9b59b6', '#8e44ad', '#ffd700', '#fff', '#bb86fc'];
    
    // Obtener posición del itemBox
    const rect = itemBox.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015
        });
    }
    
    // Animar partículas
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let anyAlive = false;
        
        particles.forEach(p => {
            if (p.alpha > 0) {
                anyAlive = true;
                
                // Actualizar posición
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravedad
                p.alpha -= p.decay;
                
                // Dibujar partícula
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fill();
                
                // Dibujar estela
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.radius / 2;
                ctx.stroke();
            }
        });
        
        ctx.globalAlpha = 1;
        
        if (anyAlive) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
    
    // Agregar emoji de hechizo temporal
    const emoji = document.createElement('div');
    emoji.className = 'spell-effect';
    emoji.textContent = '✨';
    itemBox.style.position = 'relative';
    itemBox.appendChild(emoji);
    
    setTimeout(() => {
        if (emoji.parentElement) {
            emoji.remove();
        }
    }, 1000);
}


function validateItem(input, itemBox) {
    const answer = parseInt(input.dataset.answer);
    const fullEquation = input.dataset.fullEquation;
    const userAnswer = parseInt(input.value);
    const feedback = itemBox.querySelector('.item-feedback');
    const checkBtn = itemBox.querySelector('.check-answer-btn');
    let attempts = parseInt(input.dataset.attempts);
    
    if (input.value === '' || isNaN(userAnswer)) {
        feedback.textContent = '⚠️ Por favor ingresa un número';
        feedback.className = 'item-feedback incorrect';
        return;
    }
    
    const getComparisonParts = () => {
        const equationText = itemBox.querySelector('.item-equation')?.textContent || '';
        const normalized = equationText.replace(/\s+/g, ' ').trim();
        const parts = normalized.split('=').map(s => s.trim());

        const fillMissingValue = (part) => {
            if (!part.includes('×')) {
                return part;
            }

            const factors = part.split('×').map(s => s.trim());
            if (factors.length !== 2) {
                return part;
            }

            const leftFactor = /\d/.test(factors[0]) ? factors[0] : String(userAnswer);
            const rightFactor = /\d/.test(factors[1]) ? factors[1] : String(userAnswer);
            return `${leftFactor} × ${rightFactor}`;
        };

        if (parts.length === 2) {
            return [fillMissingValue(parts[0]), fillMissingValue(parts[1])];
        }

        const fallback = fullEquation.split('=').map(s => s.trim());
        return [fallback[0], fallback[1]];
    };

    if (userAnswer === answer) {
        // ✅ CORRECTO - Activar animación de hechizo
        createSpellEffect(itemBox);
        
        feedback.innerHTML = '<span style="color: #27ae60; font-weight: bold;">✅ ¡Correcto! Muy bien.</span>';
        feedback.className = 'item-feedback correct';
        input.disabled = true;
        checkBtn.disabled = true;
        checkBtn.style.opacity = '0.5';
        
        m4_responses.push({
            item: m4_currentItem,
            correct: true,
            attempts: attempts + 1
        });
        
        // Avanzar al siguiente ítem
        setTimeout(() => {
            m4_currentItem++;
            if (m4_currentItem <= 6) {
                showItem(m4_currentItem);
            } else {
                finalizeMoment4();
            }
        }, 1500);
        
    } else {
        // ❌ INCORRECTO
        attempts++;
        input.dataset.attempts = attempts;
        m4_errorsTotal++;
        
        if (attempts === 1) {
            // Primer intento fallido
            feedback.innerHTML = '<span style="color: #e67e22;">❌ Verifica tu respuesta. Recuerda lo que hemos hecho para adivinar el número que va en el sobre.</span>';
            feedback.className = 'item-feedback incorrect';
            input.focus();
            
        } else if (attempts === 2) {
            // Segundo intento fallido - solo sugerir hacer las multiplicaciones sin decir si está bien o mal
            const parts = getComparisonParts();
            feedback.innerHTML = `<span style="color: #555; font-size: 1.1em;">💭 Intenta hacer ambas multiplicaciones:<br><strong>${parts[0]}</strong> y <strong>${parts[1]}</strong></span>`;
            feedback.className = 'item-feedback';
            input.focus();
            
        } else {
            // Tercer intento fallido - mostrar respuesta incorrecta ingresada y perder vida
            loseLife();
            
            const parts = getComparisonParts();
            
            feedback.innerHTML = `<span style="color: #c0392b;">❌ Intentaste hacer ambas multiplicaciones:<br>
                <strong>${parts[0]}</strong> y <strong>${parts[1]}</strong><br>
                Pero con el número <strong>${userAnswer}</strong> no te da lo mismo en ambas multiplicaciones.<br>
                💔 ¡Perdiste una vida mágica!</span>`;
            feedback.className = 'item-feedback incorrect';
            input.disabled = true;
            checkBtn.disabled = true;
            checkBtn.style.opacity = '0.5';
            
            m4_responses.push({
                item: m4_currentItem,
                correct: false,
                attempts: 3
            });
            
            // Si todavía hay vidas, continuar con la siguiente pregunta
            if (m4_magicLives > 0) {
                setTimeout(() => {
                    m4_currentItem++;
                    if (m4_currentItem <= 6) {
                        showItem(m4_currentItem);
                    } else {
                        finalizeMoment4();
                    }
                }, 4000);
            }
            // Si no hay vidas, loseLife() ya llamó a finalizeMoment4()
        }
    }
}

async function finalizeMoment4() {
    if (m4_isFinalizing) return;
    m4_isFinalizing = true;

    const needsSupport = m4_errorsConsecutiveMax > 2;
    
    const statusText = document.getElementById('moment4Status');
    statusText.textContent = 'Guardando resultados...';
    statusText.className = 'status-text loading';
    
    try {
        await submitEvidence({
            moment: 'm4',
            tag: 'm4',
            data: {
                responses: m4_responses,
                errorsTotal: m4_errorsTotal,
                errorsConsecutiveMax: m4_errorsConsecutiveMax,
                needsSupport: needsSupport,
                livesRemaining: m4_magicLives,
                comment: needsSupport ? 'No está clara la propiedad conmutativa' : null
            },
            boardBlob: null,
            audioBlob: null
        });
        
        statusText.textContent = 'Completado ✅';
        statusText.className = 'status-text success';
        
        // Mostrar pantalla final
        const finalSection = document.getElementById('finalQuestionSection');
        finalSection.classList.remove('hidden');
        const magicTheme = document.querySelector('#problemQ4Section .magic-theme');
        if (magicTheme) {
            magicTheme.classList.add('m4-final-only');
        }
        const problemQ4Section = document.getElementById('problemQ4Section');
        if (problemQ4Section) {
            problemQ4Section.classList.add('m4-final-only');
        }
        
        // Celebración si termina con al menos 1 vida
        if (m4_magicLives > 0) {
            createFullScreenMagicEffect();
        }

        // Si terminó con las 3 vidas, mostrar mensaje especial
        if (m4_magicLives === 3) {
            
            const finalBox = finalSection.querySelector('.final-box');
            finalBox.innerHTML = `
                <h3 class="m4-special-title">🎉 ¡Increíble! 🎉</h3>
                <p class="final-question m4-special-message">
                    ¡Completaste todos los desafíos sin perder ninguna vida mágica! ✨
                </p>
                <p class="m4-special-points">
                    🌟 Puedes reclamar <strong>3 PUNTOS POSITIVOS</strong> 🌟
                </p>
                <p class="thank-you">¿El orden de los factores altera el producto o no?</p>
                <p class="thank-you-sub">¡Gracias por participar!</p>
            `;
        } else {
            // Calcular puntos basados en vidas restantes
            const points = m4_magicLives;
            const totalPointsEl = document.getElementById('totalPoints');
            if (totalPointsEl) {
                totalPointsEl.textContent = points;
            }
        }
        m4_completed = true;
        statusText.textContent = 'Completado ✅ Continúa con la siguiente página.';
        document.dispatchEvent(new CustomEvent('moment4:completed'));
        
    } catch (error) {
        console.error('Error:', error);
        statusText.textContent = 'Error al guardar. Intenta de nuevo.';
        statusText.className = 'status-text error';
    }
}

// Crear efecto mágico de pantalla completa
function createFullScreenMagicEffect() {
    const canvas = document.getElementById('magicCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 150;
    const colors = ['#ffd700', '#fff', '#9b59b6', '#8e44ad', '#bb86fc', '#feca57'];
    
    // Crear partículas desde el centro de la pantalla
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 3 + Math.random() * 5;
        
        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            radius: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            decay: Math.random() * 0.01 + 0.005
        });
    }
    
    // Animar partículas
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let anyAlive = false;
        
        particles.forEach(p => {
            if (p.alpha > 0) {
                anyAlive = true;
                
                // Actualizar posición
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravedad
                p.alpha -= p.decay;
                
                // Dibujar partícula como estrella
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.beginPath();
                
                // Dibujar estrella de 5 puntas
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * p.radius;
                    const y = Math.sin(angle) * p.radius;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    
                    const innerAngle = angle + Math.PI / 5;
                    const innerX = Math.cos(innerAngle) * (p.radius * 0.5);
                    const innerY = Math.sin(innerAngle) * (p.radius * 0.5);
                    ctx.lineTo(innerX, innerY);
                }
                
                ctx.closePath();
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fill();
                
                // Agregar brillo
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        ctx.globalAlpha = 1;
        
        if (anyAlive) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

// ========================================
// SISTEMA DE TABLERO (CANVAS)
// ========================================

function initBoard(canvasId) {
    console.log('🎨 Inicializando board:', canvasId);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('❌ Canvas no encontrado:', canvasId);
        return { hasDrawing: false, disabled: false };
    }
    
    const ctx = canvas.getContext('2d');
    
    let isDrawing = false;
    let currentTool = 'black';
    let hasDrawing = false;
    let disabled = false;
    
    // Establecer cursor inicial (lápiz negro)
    canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'black\' d=\'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z\'/></svg>") 2 22, auto';
    
    // Configurar herramientas
    const evidenceSection = canvas.closest('.evidence-section');
    if (!evidenceSection) {
        console.error('❌ No se encontró .evidence-section para el canvas:', canvasId);
        return { hasDrawing: false, disabled: false };
    }
    
    const toolButtons = evidenceSection.querySelectorAll('.tool-btn');
    console.log('🔧 Botones de herramientas encontrados:', toolButtons.length);
    
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            
            if (tool === 'clear') {
                const shouldClear = window.confirm('¿Estás segura de querer limpiar todo el tablero?');
                if (!shouldClear) {
                    return;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hasDrawing = false;
                return;
            }
            
            currentTool = tool;
            
            // Cambiar cursor según herramienta
            switch (tool) {
                case 'black':
                    canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'black\' d=\'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z\'/></svg>") 2 22, auto';
                    break;
                case 'red':
                    canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'red\' d=\'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z\'/></svg>") 2 22, auto';
                    break;
                case 'yellow':
                    canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><rect x=\'4\' y=\'6\' width=\'16\' height=\'12\' fill=\'%23f1c40f\' opacity=\'0.5\'/><rect x=\'6\' y=\'8\' width=\'12\' height=\'8\' fill=\'%23f1c40f\'/></svg>") 12 12, auto';
                    break;
                case 'eraser':
                    canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'gray\' d=\'M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53l-4.95-4.95l-4.95 4.95z\'/></svg>") 12 12, auto';
                    break;
            }
            
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Dibujar
    const getCoords = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        
        if (e.type.includes('touch')) {
            clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX;
            clientY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };
    
    const startDrawing = (e) => {
        if (disabled) return;
        e.preventDefault();
        isDrawing = true;
        const coords = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    };
    
    const draw = (e) => {
        if (!isDrawing || disabled) return;
        e.preventDefault();
        
        const coords = getCoords(e);
        
        ctx.lineTo(coords.x, coords.y);
        
        switch (currentTool) {
            case 'black':
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 8;
                ctx.globalAlpha = 1;
                break;
            case 'red':
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 8;
                ctx.globalAlpha = 1;
                break;
            case 'yellow':
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 15;
                ctx.globalAlpha = 0.15; // 15% de opacidad para efecto resaltador real
                break;
            case 'eraser':
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 20;
                ctx.globalAlpha = 1;
                break;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        hasDrawing = true;
    };
    
    const stopDrawing = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        isDrawing = false;
        ctx.closePath();
    };
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    return {
        get hasDrawing() { return hasDrawing; },
        set disabled(value) { disabled = value; }
    };
}

// ========================================
// SISTEMA DE AUDIO (MediaRecorder)
// ========================================

function initAudio(recordBtnId, stopBtnId, statusId) {
    console.log('🎤 Inicializando audio:', recordBtnId);
    
    const recordBtn = document.getElementById(recordBtnId);
    const stopBtn = document.getElementById(stopBtnId);
    const status = document.getElementById(statusId);
    
    if (!recordBtn || !stopBtn || !status) {
        console.error('❌ Elementos de audio no encontrados');
        console.error('recordBtn:', recordBtn);
        console.error('stopBtn:', stopBtn);
        console.error('status:', status);
        return { audioBlob: null };
    }
    
    console.log('✅ Elementos de audio encontrados');
    
    let mediaRecorder = null;
    let audioChunks = [];
    let audioBlob = null;
    
    recordBtn.addEventListener('click', async () => {
        console.log('🔴 Intentando grabar audio...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Intentar usar codec WebM con Opus
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
            }
            
            mediaRecorder = new MediaRecorder(stream, options);
            audioChunks = [];
            
            mediaRecorder.addEventListener('dataavailable', (e) => {
                audioChunks.push(e.data);
            });
            
            mediaRecorder.addEventListener('stop', () => {
                audioBlob = new Blob(audioChunks, { type: options.mimeType });
                status.textContent = '🎤 Audio grabado';
                status.classList.remove('error-text');
                status.classList.add('success-text');
                
                // Detener todas las pistas del stream
                stream.getTracks().forEach(track => track.stop());
            });
            
            mediaRecorder.start();
            
            recordBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            status.textContent = '🔴 Grabando...';
            status.classList.remove('error-text');
            
        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            status.textContent = '❌ Error: El micrófono es OBLIGATORIO. Debes permitir el acceso para continuar.';
            status.classList.add('error-text');
        }
    });
    
    stopBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            
            stopBtn.classList.add('hidden');
            recordBtn.classList.remove('hidden');
        }
    });
    
    return {
        get audioBlob() { return audioBlob; }
    };
}

// ========================================
// FIREBASE: SUBIR EVIDENCIA
// ========================================

async function submitEvidence({ moment, tag, data, boardBlob, audioBlob }) {
    // Verificar si Firebase está disponible
    if (!db || !storage) {
        throw new Error('Firebase no está configurado. Los datos no se pueden guardar en la nube, pero puedes continuar con la actividad.');
    }
    
    console.log('📤 Iniciando envío:', { moment, tag, hasBoard: !!boardBlob, hasAudio: !!audioBlob });
    console.log('🎤 Audio blob:', audioBlob);

    const participantName = [studentInfo?.nombre, studentInfo?.apellidos]
        .filter(Boolean)
        .join(' ')
        .trim() || null;

    const storageSafeName = (value) =>
        String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '');

    const effectiveIdentifier = (studentCode === '0000' && participantName)
        ? participantName
        : studentCode;

    const storageIdentifier = storageSafeName(effectiveIdentifier) || 'invitado';
    
    const timestamp = Date.now();
    let boardUrl = null;
    let audioUrl = null;
    
    try {
        // Subir imagen del tablero (si existe)
        if (boardBlob) {
            console.log('📸 Subiendo imagen...');
            const boardPath = `uploads/${storageIdentifier}/act0/${moment}/${storageIdentifier}_act0_${moment}_${tag}_${timestamp}.png`;
            const boardRef = ref(storage, boardPath);
            await uploadBytes(boardRef, boardBlob);
            boardUrl = await getDownloadURL(boardRef);
            console.log('✅ Tablero subido:', boardUrl);
        }
        
        // Subir audio (si existe)
        if (audioBlob) {
            console.log('🎤 Subiendo audio...', audioBlob.size, 'bytes');
            const audioPath = `uploads/${storageIdentifier}/act0/${moment}/${storageIdentifier}_act0_${moment}_${tag}_${timestamp}.webm`;
            const audioRef = ref(storage, audioPath);
            await uploadBytes(audioRef, audioBlob);
            audioUrl = await getDownloadURL(audioRef);
            console.log('✅ Audio subido:', audioUrl);
        } else {
            console.warn('⚠️ No hay audio blob para subir');
        }
    } catch (storageError) {
        console.error('❌ Error al subir archivos:', storageError);
        throw storageError; // Propagar el error original, no uno genérico
    }
    
    // Crear documento en Firestore
    const docData = {
        studentCode: effectiveIdentifier,
        accessCode: studentCode,
        participantName: participantName,
        participantType: studentCode === '0000' ? 'invited' : 'registered',
        activity: 'act0',
        moment: moment,
        tag: tag,
        createdAt: serverTimestamp(),
        boardUrl: boardUrl,
        audioUrl: audioUrl,
        data: data,
        deviceInfo: navigator.userAgent,
        pageInfo: {
            currentStep: moment
        }
    };
    
    console.log('💾 Creando documento en Firestore...', docData);
    
    try {
        const docRef = await addDoc(collection(db, 'submissions'), docData);
        console.log('✅ Documento guardado con ID:', docRef.id);
        return docRef.id;
    } catch (firestoreError) {
        console.error('❌ Error al guardar en Firestore:', firestoreError);
        throw firestoreError;
    }
}

// ========================================
// UTILIDADES
// ========================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function canvasToBlob(canvasId) {
    const canvas = document.getElementById(canvasId);
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}
