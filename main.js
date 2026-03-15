// main.js - Lógica principal de la aplicación
import { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase.js';
import { estudiantesData } from './assets/estudiantes-data.js';

console.log('✅ Firebase cargado correctamente');

// ========================================
// VARIABLES GLOBALES
// ========================================

let studentCode = null;
let studentInfo = null; // Información del estudiante (nombre, apellidos, curso)
let currentPage = 1;
let totalPages = 0;

// Datos de Momento 2 (Juego de Bandejas)
let trays = [];
let pairs = [];
let traysSystem = null; // Nueva instancia del sistema de bandejas
let m1ProblemInitialized = false;
let m1FlipbookListenerAttached = false;
let m1Q1Submitted = false;

function getM1Q1StorageKey() {
    if (!studentCode) return null;

    if (studentCode === '0000' && studentInfo?.nombre) {
        return `m1-q1-submitted-${studentCode}-${studentInfo.nombre.trim().toLowerCase()}`;
    }

    return `m1-q1-submitted-${studentCode}`;
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

// Datos de Momento 4
let m4_currentItem = 1;
let m4_responses = [];
let m4_errorsTotal = 0;
let m4_errorsConsecutive = 0;
let m4_errorsConsecutiveMax = 0;
let m4_magicLives = 3; // Sistema de vidas mágicas
let m4_isFinalizing = false;
let m4_returnHomeTimeout = null;

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
        const estudiante = estudiantesData[code];
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
        
        // Navegar a Momento 1
        showScreen('moment1Screen');
        initMoment1();
    });
    
    confirmNoBtn.addEventListener('click', () => {
        console.log('❌ Usuario rechazó identidad');
        
        // Limpiar variables temporales
        studentCode = null;
        studentInfo = null;
        
        // Limpiar localStorage también por seguridad
        localStorage.removeItem('studentCode');
        localStorage.removeItem('guestName');
        console.log('🧹 Datos limpiados');
        
        // Volver a la pantalla de bienvenida
        showScreen('welcomeScreen');
        
        // Limpiar el input
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

function showScreen(screenId) {
    console.log(`🔄 Navegando a pantalla: ${screenId}`);
    
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error(`❌ Error: No se encontró la pantalla con ID: ${screenId}`);
        return;
    }
    
    // Remover 'active' de todas las pantallas
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Agregar 'active' a la pantalla objetivo
    targetScreen.classList.add('active');
    console.log(`✅ Pantalla ${screenId} activada`);
    
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
    document.getElementById('studentCodeM1').textContent = getStudentHeaderText();
    
    console.log('✅ Momento 1 inicializado');
    console.log('📖 El cuento ya está en el HTML, no necesita cargarse');

    const problemSection = document.getElementById('problemQ1Section');
    const problemSection2 = document.getElementById('problemQ2Section');
    const m1Q2FinalQuestion = document.getElementById('m1Q2FinalQuestion');
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const soundToggle = document.getElementById('soundToggle');
    let showProblemTimer = null;
    let isAtLastStoryPage = false;
    let traysM1Q2Initialized = false;
    let isOnSheet10 = false;
    let isOnSheet11 = false;
    let isSpecialPageTransitioning = false;
    let m1Q2Verified = false;
    const m1StorageKey = getM1Q1StorageKey();
    m1Q1Submitted = m1StorageKey ? localStorage.getItem(m1StorageKey) === 'true' : false;

    const hideProblemSection2 = () => {
        if (!problemSection2) return;
        problemSection2.classList.add('hidden');
        if (m1Q2FinalQuestion) {
            m1Q2FinalQuestion.classList.add('hidden');
        }
    };

    const showM1Q2FinalQuestion = () => {
        if (!m1Q2FinalQuestion) return;
        m1Q2FinalQuestion.classList.remove('hidden');
        m1Q2FinalQuestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
                        // Mostrar botón siguiente para continuar
                        if (nextBtn) {
                            nextBtn.style.display = '';
                            nextBtn.disabled = false;
                        }
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

    const playForwardTurnTransition = (fromEl, onMidTurn) => {
        if (!fromEl || isSpecialPageTransitioning) return;

        isSpecialPageTransitioning = true;
        fromEl.classList.add('turning-forward');

        setTimeout(() => {
            onMidTurn();
        }, 600);

        setTimeout(() => {
            fromEl.classList.remove('turning-forward');
            isSpecialPageTransitioning = false;
        }, 1200);
    };

    const showProblemSection = () => {
        if (flipbook) {
            flipbook.style.display = 'none';
        }
        if (nextBtn) {
            nextBtn.style.display = '';
            nextBtn.disabled = !m1Q1Submitted;
        }
        if (soundToggle) {
            soundToggle.style.display = 'none';
        }
        if (prevBtn) {
            prevBtn.style.display = '';
        }

        problemSection.classList.remove('hidden');
        problemSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        hideProblemSection2();
        isOnSheet10 = true;
        isOnSheet11 = false;

        if (m1Q1Submitted) {
            applyM1Q1SubmittedLock();
        } else if (!m1ProblemInitialized) {
            m1ProblemInitialized = true;
            initProblemQ1();
        }
    };

    const showProblemSection2 = () => {
        if (!problemSection2) return;

        if (flipbook) {
            flipbook.style.display = 'none';
        }
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.disabled = true;
        }
        if (soundToggle) {
            soundToggle.style.display = 'none';
        }
        if (prevBtn) {
            prevBtn.style.display = '';
        }

        problemSection.classList.add('hidden');
        problemSection2.classList.remove('hidden');
        problemSection2.scrollIntoView({ behavior: 'smooth', block: 'start' });

        isOnSheet10 = false;
        isOnSheet11 = true;
        initSheet11Trays();
    };

    const hideProblemSection = () => {
        if (flipbook) {
            flipbook.style.display = '';
        }
        if (prevBtn) {
            prevBtn.style.display = '';
        }
        if (nextBtn) {
            nextBtn.style.display = '';
            if (isAtLastStoryPage) {
                nextBtn.disabled = false;
            }
        }
        if (soundToggle) {
            soundToggle.style.display = '';
        }

        problemSection.classList.remove('turning-forward');
        if (problemSection2) {
            problemSection2.classList.remove('turning-forward');
        }
        problemSection.classList.add('hidden');
        hideProblemSection2();
        isOnSheet10 = false;
        isOnSheet11 = false;
    };

    const syncM1WithFlipbookPage = (event) => {
        if (!problemSection) {
            return;
        }

        const isLastPage = Boolean(event?.detail?.isLastPage);
        isAtLastStoryPage = isLastPage;

        if (showProblemTimer) {
            clearTimeout(showProblemTimer);
            showProblemTimer = null;
        }

        // La página 9 debe permanecer visible; la Situación 1 (página 10) se abre al dar siguiente
        hideProblemSection();

        if (isLastPage && nextBtn) {
            // app.js deshabilita el botón al final; lo reactivamos para permitir pasar a la página 10
            setTimeout(() => {
                nextBtn.disabled = false;
            }, 0);
        }
    };

    if (nextBtn) {
        // Capturar antes del handler del flipbook para distinguir 8->9 de 9->10
        nextBtn.addEventListener('click', (event) => {
            if (isSpecialPageTransitioning) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (isOnSheet10) {
                if (!m1Q1Submitted) {
                    return;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                playForwardTurnTransition(problemSection, () => {
                    showProblemSection2();
                });
                return;
            }

            if (isOnSheet11) {
                 if (!m1Q2Verified) return;
                 event.preventDefault();
                 event.stopImmediatePropagation();
                showM1Q2FinalQuestion();
                if (nextBtn) {
                    nextBtn.disabled = true;
                }
                 return;
            }

            // Solo abrir Situación 1 cuando YA estamos en la última página del cuento (página 9)
            if (isAtLastStoryPage) {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (showProblemTimer) {
                    clearTimeout(showProblemTimer);
                }

                const currentStoryPage = flipbook ? flipbook.querySelector('.page.active') : null;
                if (currentStoryPage) {
                    playForwardTurnTransition(currentStoryPage, () => {
                        showProblemSection();
                    });
                } else {
                    showProblemSection();
                }
            }
        }, true);
    }

    if (prevBtn) {
        // En la página 10 (Situación 1), volver exactamente a la página 9 del cuento
        prevBtn.addEventListener('click', (event) => {
            if (isOnSheet11) {
                event.preventDefault();
                event.stopImmediatePropagation();
                showProblemSection();
                return;
            }

            if (isOnSheet10) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (showProblemTimer) {
                    clearTimeout(showProblemTimer);
                    showProblemTimer = null;
                }
                hideProblemSection();
            }
        }, true);
    }

    // Estado inicial: en el cuento no se muestra la respuesta
    if (problemSection && !problemSection.classList.contains('hidden')) {
        problemSection.classList.add('hidden');
    }

    if (!m1FlipbookListenerAttached) {
        document.addEventListener('flipbook:pagechange', syncM1WithFlipbookPage);
        m1FlipbookListenerAttached = true;
        console.log('✅ Listener de cambio de página del cuento configurado');
    }
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
        // Solo requiere audio (tablero opcional)
        submitBtn.disabled = !hasAudio;
        
        // Mostrar mensaje de qué falta
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '';
            statusText.className = 'status-text';
        }
    };
    
    // Verificar cada vez que se dibuja o graba
    setInterval(checkEvidence, 500);
    
    // Enviar evidencia
    submitBtn.addEventListener('click', async () => {
        // Bloquear botón inmediatamente
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
            
            // Mantener botón deshabilitado permanentemente
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';

            // Al enviar en la hoja 10, habilitar la flecha derecha para pasar a la hoja 11
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.style.display = '';
                nextBtn.disabled = false;
            }
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            // Deshabilitar solo los botones de herramientas de ESTE momento
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Ya no salta automáticamente de pantalla: la flecha derecha lleva a la hoja 11
            
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
            
            // Rehabilitar botón solo si hay error
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    });
}

// ========================================
// MOMENTO 2: TABLA + PROBLEMA 1
// ========================================

function initMoment2() {
    console.log('🎯 Inicializando Momento 2 - Sistema de Bandejas');
    
    document.getElementById('studentCodeM2').textContent = getStudentHeaderText();
    
    // Destruir instancia previa si existe (evitar duplicados)
    if (traysSystem) {
        traysSystem.destroy();
        traysSystem = null;
    }
    
    // Crear nueva instancia del sistema de bandejas
    try {
        traysSystem = new TraysSystem('traysArea');
        console.log('✅ Sistema de bandejas inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar sistema de bandejas:', error);
    }
    
    // Configurar botón de verificación
    const verifyBtn = document.getElementById('verifyTraysBtn');
    if (verifyBtn) {
        // Remover event listeners previos
        const newVerifyBtn = verifyBtn.cloneNode(true);
        verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
        
        newVerifyBtn.addEventListener('click', verifyTraysPairings);
    }
    
    // Botón continuar a M3
    const continueBtn = document.getElementById('continueToM3Btn');
    if (continueBtn) {
        // Remover event listeners previos
        const newContinueBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
        
        newContinueBtn.addEventListener('click', () => {
            showScreen('moment3Screen');
            initMoment3();
        });
    }
}

// ========================================
// JUEGO DE BANDEJAS - DRAG AND DROP
// ========================================
// NOTA: Esta sección ha sido reemplazada por el nuevo sistema TraysSystem
// El código antiguo se mantiene comentado por referencia

/*
// ===== CÓDIGO ANTIGUO (DESHABILITADO) =====
function createTraysGame_OLD() {
    const traysData = [
        { id: 1, rows: 3, cols: 4, total: 12, pairId: 'A' },
        { id: 2, rows: 4, cols: 3, total: 12, pairId: 'A' },
        { id: 3, rows: 2, cols: 6, total: 12, pairId: 'B' },
        { id: 4, rows: 6, cols: 2, total: 12, pairId: 'B' },
        { id: 5, rows: 5, cols: 3, total: 15, pairId: 'C' },
        { id: 6, rows: 3, cols: 5, total: 15, pairId: 'C' },
        { id: 7, rows: 4, cols: 5, total: 20, pairId: 'D' },  // Sin pareja
        { id: 8, rows: 2, cols: 7, total: 14, pairId: 'E' }   // Sin pareja
    ];
    
    const traysArea = document.getElementById('traysArea');
    const containerWidth = traysArea.offsetWidth || 900;
    const containerHeight = 600;
    
    // Configurar eventos del contenedor para permitir drop
    traysArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        return false;
    });
    
    traysArea.addEventListener('drop', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Sistema de grid para evitar sobreposiciones
    const cols = 4;
    const rows = 2;
    const cellWidth = containerWidth / cols;
    const cellHeight = containerHeight / rows;
    const positions = [];
    
    // Generar posiciones posibles
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            positions.push({
                x: col * cellWidth + (cellWidth - 220) / 2,
                y: row * cellHeight + (cellHeight - 240) / 2
            });
        }
    }
    
    // Barajar posiciones
    positions.sort(() => Math.random() - 0.5);
    
    // Crear bandejas
    traysData.forEach((data, index) => {
        const trayCard = document.createElement('div');
        trayCard.className = 'tray-card';
        trayCard.dataset.id = data.id;
        trayCard.dataset.pairId = data.pairId;
        trayCard.dataset.total = data.total;
        
        // Usar posición del grid (sin sobreposiciones)
        const pos = positions[index];
        trayCard.style.left = pos.x + 'px';
        trayCard.style.top = pos.y + 'px';
        
        // Grid de pandebonos (SIN etiqueta para que las niñas cuenten)
        const grid = document.createElement('div');
        grid.className = 'tray-grid';
        grid.style.gridTemplateColumns = `repeat(${data.cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${data.rows}, 1fr)`;
        
        // Ajustar tamaño de emojis según filas/columnas para que todo quepa
        const maxDimension = Math.max(data.rows, data.cols);
        let emojiSize = '1.2em';
        if (maxDimension >= 6) {
            emojiSize = '0.8em';
        } else if (maxDimension >= 5) {
            emojiSize = '0.9em';
        } else if (maxDimension >= 4) {
            emojiSize = '1.0em';
        }
        
        // Emojis de pandebonos
        for (let i = 0; i < data.total; i++) {
            const pandebono = document.createElement('span');
            pandebono.textContent = '🫓';
            pandebono.style.fontSize = emojiSize;
            grid.appendChild(pandebono);
        }
        
        trayCard.appendChild(grid);
        traysArea.appendChild(trayCard);
        
        // Eventos de mouse para arrastrar (más control que drag & drop nativo)
        setupDragging(trayCard);
        
        trays.push({
            element: trayCard,
            data: data,
            paired: false,
            pairedWith: null
        });
    });
    
    // Botón verificar
    document.getElementById('verifyTraysBtn').addEventListener('click', verifyPairings);
}

// Sistema de arrastre con mouse (más confiable que drag & drop nativo)
let currentDraggedTray = null;
let isDraggingMouse = false;
let startX = 0;
let startY = 0;
let initialLeft = 0;
let initialTop = 0;

function setupDragging(trayCard) {
    trayCard.addEventListener('mousedown', function(e) {
        currentDraggedTray = this;
        isDraggingMouse = true;
        
        // Si estaba emparejada, desemparejarla
        if (this.classList.contains('paired')) {
            const myId = parseInt(this.dataset.id);
            const pairIndex = pairs.findIndex(p => p.includes(myId));
            
            if (pairIndex !== -1) {
                const [id1, id2] = pairs[pairIndex];
                const otherId = id1 === myId ? id2 : id1;
                const otherTray = document.querySelector(`.tray-card[data-id="${otherId}"]`);
                
                // Buscar el wrapper padre
                const wrapper = this.closest('.tray-pair-wrapper');
                if (wrapper) {
                    const traysContainer = wrapper.parentElement;
                    const wrapperRect = wrapper.getBoundingClientRect();
                    const containerRect = traysContainer.getBoundingClientRect();
                    
                    // Restaurar posicionamiento absoluto de las bandejas
                    this.style.position = 'absolute';
                    this.style.left = (wrapperRect.left - containerRect.left) + 'px';
                    this.style.top = (wrapperRect.top - containerRect.top) + 'px';
                    
                    if (otherTray) {
                        otherTray.style.position = 'absolute';
                        otherTray.style.left = (wrapperRect.left - containerRect.left) + 'px';
                        otherTray.style.top = (wrapperRect.top - containerRect.top) + 'px';
                        otherTray.classList.remove('paired');
                    }
                    
                    // Mover bandejas de vuelta al contenedor principal
                    traysContainer.appendChild(this);
                    if (otherTray) {
                        traysContainer.appendChild(otherTray);
                    }
                    
                    // Eliminar wrapper
                    wrapper.remove();
                }
                
                // Remover clase paired
                this.classList.remove('paired');
                
                // Eliminar del array
                pairs.splice(pairIndex, 1);
                console.log('🔓 Desemparejada de bandeja', otherId);
            }
        }
        
        // Guardar posición inicial
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(this.style.left) || 0;
        initialTop = parseInt(this.style.top) || 0;
        
        // Estilo visual
        this.classList.add('dragging');
        this.style.zIndex = '1000';
        this.style.cursor = 'grabbing';
        
        console.log('🎯 Inicio arrastre:', this.dataset.id);
        
        e.preventDefault();
    });
}

document.addEventListener('mousemove', function(e) {
    if (!isDraggingMouse || !currentDraggedTray) return;
    
    // Calcular nueva posición
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    currentDraggedTray.style.left = (initialLeft + deltaX) + 'px';
    currentDraggedTray.style.top = (initialTop + deltaY) + 'px';
});

document.addEventListener('mouseup', function(e) {
    if (!isDraggingMouse || !currentDraggedTray) return;
    
    console.log('🎯 Fin arrastre');
    
    // Restaurar estilo
    currentDraggedTray.classList.remove('dragging');
    currentDraggedTray.style.zIndex = 'auto';
    currentDraggedTray.style.cursor = 'grab';
    
    // Verificar si se soltó sobre otra bandeja
    checkForPairingMouse(e, currentDraggedTray);
    
    isDraggingMouse = false;
    currentDraggedTray = null;
});

function checkForPairingMouse(e, draggedTray) {
    // Obtener todas las bandejas bajo el cursor
    const elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
    
    // Buscar otra bandeja (que no sea la que estamos arrastrando)
    for (let elem of elementsBelow) {
        if (elem.classList && elem.classList.contains('tray-card') && elem !== draggedTray) {
            console.log('🔍 Bandeja encontrada debajo:', elem.dataset.id);
            
            // Detectar en qué lado de la bandeja se soltó
            const rect = elem.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const isLeftSide = e.clientX < centerX;
            
            console.log(`📍 Soltada en el lado: ${isLeftSide ? 'IZQUIERDO' : 'DERECHO'}`);
            
            tryPairing(draggedTray, elem, isLeftSide);
            return;
        }
    }
    
    console.log('❌ No hay bandeja debajo');
}

function tryPairing(draggedTray, targetTray, isLeftSide) {
    const id1 = parseInt(draggedTray.dataset.id);
    const id2 = parseInt(targetTray.dataset.id);
    
    console.log(`🔍 Uniendo: Bandeja ${id1} con Bandeja ${id2} (lado ${isLeftSide ? 'izquierdo' : 'derecho'})`);
    
    // Permitir emparejar cualquier bandeja con cualquier otra (excepto consigo misma)
    if (id1 !== id2) {
        console.log('✅ Uniendo bandejas...');
        
        // Si la bandeja objetivo ya está emparejada, desemparejarla primero
        if (targetTray.classList.contains('paired')) {
            console.log('🔓 Bandeja objetivo ya emparejada, desemparejando...');
            const targetId = parseInt(targetTray.dataset.id);
            const pairIndex = pairs.findIndex(p => p.includes(targetId));
            
            if (pairIndex !== -1) {
                const [id_a, id_b] = pairs[pairIndex];
                const otherTargetId = id_a === targetId ? id_b : id_a;
                const otherTargetTray = document.querySelector(`.tray-card[data-id="${otherTargetId}"]`);
                
                // Buscar el wrapper padre de targetTray
                const oldWrapper = targetTray.closest('.tray-pair-wrapper');
                if (oldWrapper) {
                    const traysContainer = oldWrapper.parentElement;
                    const wrapperRect = oldWrapper.getBoundingClientRect();
                    const containerRect = traysContainer.getBoundingClientRect();
                    
                    // Restaurar targetTray
                    targetTray.style.position = 'absolute';
                    targetTray.style.left = (wrapperRect.left - containerRect.left) + 'px';
                    targetTray.style.top = (wrapperRect.top - containerRect.top) + 'px';
                    targetTray.classList.remove('paired');
                    traysContainer.appendChild(targetTray);
                    
                    // Restaurar la otra bandeja
                    if (otherTargetTray) {
                        otherTargetTray.style.position = 'absolute';
                        otherTargetTray.style.left = (wrapperRect.left - containerRect.left) + 'px';
                        otherTargetTray.style.top = (wrapperRect.top - containerRect.top) + 'px';
                        otherTargetTray.classList.remove('paired');
                        traysContainer.appendChild(otherTargetTray);
                    }
                    
                    // Eliminar wrapper
                    oldWrapper.remove();
                }
                
                // Eliminar del array
                pairs.splice(pairIndex, 1);
            }
        }
        
        // Crear contenedor wrapper para el nuevo par
        const wrapper = document.createElement('div');
        wrapper.classList.add('tray-pair-wrapper');
        wrapper.dataset.pair = `${id1}-${id2}`;
        
        // Obtener posición de la bandeja objetivo
        const rectTarget = targetTray.getBoundingClientRect();
        const traysContainer = document.getElementById('traysContainer');
        const containerRect = traysContainer.getBoundingClientRect();
        
        // Ajustar posición del wrapper según el lado
        let wrapperLeft, wrapperTop;
        if (isLeftSide) {
            // La arrastrada va a la izquierda, wrapper comienza más a la izquierda
            wrapperLeft = (rectTarget.left - containerRect.left) - 210; // ancho bandeja + gap
            wrapperTop = rectTarget.top - containerRect.top;
        } else {
            // La arrastrada va a la derecha, wrapper comienza en la posición de la target
            wrapperLeft = rectTarget.left - containerRect.left;
            wrapperTop = rectTarget.top - containerRect.top;
        }
        
        // Posicionar wrapper
        wrapper.style.position = 'absolute';
        wrapper.style.left = wrapperLeft + 'px';
        wrapper.style.top = wrapperTop + 'px';
        
        // Agregar wrapper al contenedor de bandejas
        traysContainer.appendChild(wrapper);
        
        // Resetear estilos de posicionamiento de las bandejas
        draggedTray.style.position = 'relative';
        draggedTray.style.left = '0';
        draggedTray.style.top = '0';
        targetTray.style.position = 'relative';
        targetTray.style.left = '0';
        targetTray.style.top = '0';
        
        // Agregar bandejas al wrapper en el orden correcto
        if (isLeftSide) {
            // Arrastrada a la izquierda, objetivo a la derecha
            wrapper.appendChild(draggedTray);
            wrapper.appendChild(targetTray);
        } else {
            // Objetivo a la izquierda, arrastrada a la derecha
            wrapper.appendChild(targetTray);
            wrapper.appendChild(draggedTray);
        }
        
        // Marcar como emparejadas
        draggedTray.classList.add('paired');
        targetTray.classList.add('paired');
        
        // Hacer el wrapper draggable para mover el par junto
        setupWrapperDragging(wrapper);
        
        // Registrar emparejamiento
        addPairing(id1, id2);
        
        console.log('✨ Bandejas agrupadas en wrapper - la validación ocurrirá al verificar');
    } else {
        console.log('❌ No puedes emparejar una bandeja consigo misma');
    }
}

function addPairing(id1, id2) {
    // Eliminar emparejamientos previos de estas bandejas
    pairs = pairs.filter(p => !p.includes(id1) && !p.includes(id2));
    
    // Agregar nuevo emparejamiento
    pairs.push([id1, id2].sort((a, b) => a - b));
    
    console.log('Emparejamientos actuales:', pairs);
}

// Variables para arrastrar wrappers
let isDraggingWrapper = false;
let currentDraggedWrapper = null;
let wrapperStartX, wrapperStartY, wrapperInitialLeft, wrapperInitialTop;

function setupWrapperDragging(wrapper) {
    wrapper.addEventListener('mousedown', function(e) {
        // Solo si el clic es directamente en el wrapper (no en las bandejas)
        if (e.target === this || e.target.classList.contains('tray-pair-wrapper')) {
            isDraggingWrapper = true;
            currentDraggedWrapper = this;
            
            wrapperStartX = e.clientX;
            wrapperStartY = e.clientY;
            wrapperInitialLeft = parseInt(this.style.left) || 0;
            wrapperInitialTop = parseInt(this.style.top) || 0;
            
            this.style.cursor = 'grabbing';
            this.style.zIndex = '1000';
            
            console.log('📦 Arrastrando par completo');
            
            e.stopPropagation();
            e.preventDefault();
        }
    });
}

// Event listeners globales para arrastrar wrappers
document.addEventListener('mousemove', function(e) {
    if (!isDraggingWrapper || !currentDraggedWrapper) return;
    
    const deltaX = e.clientX - wrapperStartX;
    const deltaY = e.clientY - wrapperStartY;
    
    currentDraggedWrapper.style.left = (wrapperInitialLeft + deltaX) + 'px';
    currentDraggedWrapper.style.top = (wrapperInitialTop + deltaY) + 'px';
});

document.addEventListener('mouseup', function(e) {
    if (!isDraggingWrapper || !currentDraggedWrapper) return;
    
    currentDraggedWrapper.style.cursor = 'grab';
    currentDraggedWrapper.style.zIndex = 'auto';
    
    console.log('📦 Par movido');
    
    isDraggingWrapper = false;
    currentDraggedWrapper = null;
});
*/
// ===== FIN DEL CÓDIGO ANTIGUO =====

// Nueva función de verificación usando el sistema TraysSystem
function verifyTraysPairings() {
    if (!traysSystem) {
        console.error('❌ Sistema de bandejas no inicializado');
        return;
    }
    
    const results = traysSystem.validatePairings();
    const feedback = document.getElementById('traysFeedback');
    
    if (results.length === 0) {
        feedback.textContent = '⚠️ No hay emparejamientos. Selecciona dos bandejas para formar cada pareja.';
        feedback.className = 'feedback-text info';
        return;
    }
    
    // Contar emparejamientos correctos
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalPairs = results.length;
    
    console.log('📊 Validación:', { correctCount, totalPairs, results });
    
    // Emparejamientos esperados: 3 pares correctos (12-12, 12-12, 15-15)
    // Bandejas solas: tray-7 (20) y tray-8 (14)
    const expectedCorrectPairs = 3;
    
    if (correctCount === totalPairs && totalPairs === expectedCorrectPairs) {
        feedback.textContent = `🎉 ¡Perfecto! Todos los ${totalPairs} emparejamientos son correctos.`;
        feedback.className = 'feedback-text success';
        
        // Deshabilitar el botón
        document.getElementById('verifyTraysBtn').disabled = true;
        
        // Mostrar pregunta final
        setTimeout(() => {
            const finalSection = document.getElementById('finalQuestionSection');
            if (finalSection) {
                finalSection.classList.remove('hidden');
                initMoment2Audio();
            }
        }, 1000);
        
    } else {
        let errorMsg = '';
        
        if (totalPairs < expectedCorrectPairs) {
            errorMsg = `🔍 Te faltan emparejamientos. Solo tienes ${totalPairs} de ${expectedCorrectPairs} pares.`;
        } else if (totalPairs > expectedCorrectPairs) {
            errorMsg = '� Pista: algunas bandejas no tienen pareja.';
        } else {
            errorMsg = `✨ ${correctCount} de ${totalPairs} emparejamientos son correctos. Vuelve a contar y verifica que las parejas estén unidas solo si tienen la misma cantidad.`;
        }
        
        feedback.textContent = errorMsg;
        feedback.className = 'feedback-text error';

        // iPhone/Safari: evitar glitch visual sin perder el armado actual
        if (traysSystem?.isTouchDevice) {
            setTimeout(() => {
                traysSystem.stabilizeTouchLayout();
            }, 400);
        }
    }
}

// Función antigua (mantenida por referencia)
/*
function verifyPairings_OLD() {
    const feedback = document.getElementById('traysFeedback');
    
    // Emparejamientos correctos
    const correctPairs = [
        [1, 2],  // 3x4 y 4x3
        [3, 4],  // 2x6 y 6x2
        [5, 6]   // 5x3 y 3x5
    ];
    
    // Bandejas que deben quedar solas
    const singleTrays = [7, 8];
    
    // Verificar que todos los pares correctos estén presentes
    let allCorrect = true;
    let missingPairs = [];
    
    for (const correctPair of correctPairs) {
        const found = pairs.some(pair => 
            (pair[0] === correctPair[0] && pair[1] === correctPair[1]) ||
            (pair[0] === correctPair[1] && pair[1] === correctPair[0])
        );
        
        if (!found) {
            allCorrect = false;
            const tray1 = trays.find(t => t.data.id === correctPair[0]);
            const tray2 = trays.find(t => t.data.id === correctPair[1]);
            missingPairs.push(`${tray1.data.rows}×${tray1.data.cols} con ${tray2.data.rows}×${tray2.data.cols}`);
        }
    }
    
    // Verificar que no hayan emparejado las bandejas solas
    const wrongPairs = pairs.filter(pair => 
        singleTrays.includes(pair[0]) || singleTrays.includes(pair[1])
    );
    
    if (wrongPairs.length > 0) {
        allCorrect = false;
    }
    
    if (allCorrect && pairs.length === 3) {
        feedback.textContent = '🎉 ¡Perfecto! Todos los emparejamientos son correctos.';
        feedback.className = 'feedback-text success';
        
        // Deshabilitar el juego
        trays.forEach(t => {
            t.element.draggable = false;
            t.element.style.cursor = 'default';
        });
        
        document.getElementById('verifyTraysBtn').disabled = true;
        
        // Mostrar pregunta final
        setTimeout(() => {
            document.getElementById('finalQuestionSection').classList.remove('hidden');
            initMoment2Audio();
        }, 1000);
        
    } else {
        let errorMsg = '🔍 Revisa de nuevo. ';
        
        if (pairs.length < 3) {
            errorMsg += 'Recuerda que debes emparejar las bandejas con la misma cantidad de pandebonos. ';
        }
        
        if (wrongPairs.length > 0) {
            errorMsg += 'Hay bandejas que no tienen pareja porque tienen cantidades únicas. ';
        }
        
        if (missingPairs.length > 0) {
            errorMsg += 'Cuenta bien los pandebonos de cada bandeja.';
        }
        
        feedback.textContent = errorMsg;
        feedback.className = 'feedback-text error';
    }
}
*/

function initMoment2Audio() {
    const recordBtnId = 'recordBtnM2';
    const stopBtnId = 'stopBtnM2';
    const statusId = 'audioStatusM2';
    const submitBtnId = 'submitM2';
    const statusTextId = 'statusM2';
    
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasAudio = audioState.audioBlob !== null;
        submitBtn.disabled = !hasAudio;
        
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '🎤 Graba tu explicación';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '✅ Listo para enviar';
            statusText.className = 'status-text success';
        }
    };
    
    const checkInterval = setInterval(checkEvidence, 500);
    
    submitBtn.addEventListener('click', async () => {
        // Bloquear botón inmediatamente y permanentemente
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        
        // Detener el intervalo de verificación
        clearInterval(checkInterval);
        
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        
        try {
            await submitEvidence({
                moment: 'm2',
                tag: 'trays_explanation',
                data: { 
                    question: '¿Por qué tienen la misma cantidad?',
                    pairs: pairs
                },
                boardBlob: null,
                audioBlob: audioState.audioBlob
            });
            
            statusText.textContent = 'Guardado exitosamente ✅ Continuando...';
            statusText.className = 'status-text success';
            
            // Deshabilitar botón de grabar también
            document.getElementById(recordBtnId).disabled = true;
            
            // Continuar automáticamente al Momento 3 después de un breve delay
            setTimeout(() => {
                showScreen('moment3Screen');
                initMoment3();
            }, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            // Solo rehabilitar si hay error
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            // Reiniciar el intervalo si hay error
            checkInterval = setInterval(checkEvidence, 500);
        }
    });
}

// ========================================
// MOMENTO 3: VERACIDAD + EVIDENCIA
// ========================================

function initMoment3() {
    document.getElementById('studentCodeM3').textContent = getStudentHeaderText();
    
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
    document.getElementById('continueToM4Btn').addEventListener('click', () => {
        showScreen('moment4Screen');
        initMoment4();
    });
}

function showPrompt1(choice) {
    const promptSection = document.getElementById('promptSection1');
    const promptText = document.getElementById('promptText1');
    
    const prompts = {
        yes: 'Explica detalladamente cómo lo sabes.',
        no: '¿Con qué número crees que no funcionaría?',
        unsure: 'Explícame cómo estás pensando para decidir si esta igualdad será verdadera para cualquier número.'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    
    // Inicializar tablero y audio para problema 1
    initProblemM3Q1();
}

function showPrompt2(choice) {
    const promptSection = document.getElementById('promptSection2');
    const promptText = document.getElementById('promptText2');
    
    const prompts = {
        yes: 'Explica detalladamente cómo lo sabes.',
        no: '¿Con qué número crees que no funcionaría?',
        unsure: 'Explícame cómo estás pensando para decidir si esta igualdad será verdadera para cualquier número.'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    
    // Inicializar tablero y audio para problema 2
    initProblemM3Q2();
}

function initProblemM3Q1() {
    const canvasId = 'boardCanvasM3Q1';
    const recordBtnId = 'recordBtnM3Q1';
    const stopBtnId = 'stopBtnM3Q1';
    const statusId = 'audioStatusM3Q1';
    const submitBtnId = 'submitM3Q1';
    const statusTextId = 'statusM3Q1';
    
    const boardState = initBoard(canvasId);
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasAudio = audioState.audioBlob !== null;
        submitBtn.disabled = !hasAudio;
        
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '🎤 Graba tu explicación';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '✅ Listo para enviar';
            statusText.className = 'status-text success';
        }
    };
    
    const checkInterval = setInterval(checkEvidence, 500);
    
    submitBtn.addEventListener('click', async () => {
        // Bloquear botón inmediatamente y permanentemente
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        
        // Detener el intervalo de verificación
        clearInterval(checkInterval);
        
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        
        try {
            const boardBlob = boardState.hasDrawing ? await canvasToBlob(canvasId) : null;
            
            await submitEvidence({
                moment: 'm3',
                tag: 'problema1',
                data: { choice: m3_choice },
                boardBlob: boardBlob,
                audioBlob: audioState.audioBlob
            });
            
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Mostrar Problema 2
            setTimeout(() => {
                document.getElementById('problem2Section').classList.remove('hidden');
                document.getElementById('problem2Section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            // Solo rehabilitar si hay error
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            // Reiniciar el intervalo si hay error
            checkInterval = setInterval(checkEvidence, 500);
        }
    });
}

function initProblemM3Q2() {
    const canvasId = 'boardCanvasM3Q2';
    const recordBtnId = 'recordBtnM3Q2';
    const stopBtnId = 'stopBtnM3Q2';
    const statusId = 'audioStatusM3Q2';
    const submitBtnId = 'submitM3Q2';
    const statusTextId = 'statusM3Q2';
    
    const boardState = initBoard(canvasId);
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasAudio = audioState.audioBlob !== null;
        submitBtn.disabled = !hasAudio;
        
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '🎤 Graba tu explicación';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '✅ Listo para enviar';
            statusText.className = 'status-text success';
        }
    };
    
    const checkInterval = setInterval(checkEvidence, 500);
    
    submitBtn.addEventListener('click', async () => {
        // Bloquear botón inmediatamente y permanentemente
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        
        // Detener el intervalo de verificación
        clearInterval(checkInterval);
        
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        
        try {
            const boardBlob = boardState.hasDrawing ? await canvasToBlob(canvasId) : null;
            
            const choice2 = document.querySelector('input[name="truthQ2"]:checked')?.value;
            
            await submitEvidence({
                moment: 'm3',
                tag: 'problema2',
                data: { choice: choice2 },
                boardBlob: boardBlob,
                audioBlob: audioState.audioBlob
            });
            
            statusText.textContent = 'Guardado exitosamente ✅ Continuando...';
            statusText.className = 'status-text success';
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Continuar automáticamente al Momento 4 después de un breve delay
            setTimeout(() => {
                showScreen('moment4Screen');
                initMoment4();
            }, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            // Solo rehabilitar si hay error
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            // Reiniciar el intervalo si hay error
            checkInterval = setInterval(checkEvidence, 500);
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
    m4_magicLives = 3;
    m4_isFinalizing = false;
    if (m4_returnHomeTimeout) {
        clearTimeout(m4_returnHomeTimeout);
        m4_returnHomeTimeout = null;
    }

    document.querySelectorAll('.magic-heart').forEach(heart => heart.classList.remove('lost'));
    const finalSection = document.getElementById('finalQuestionSection');
    if (finalSection) {
        finalSection.classList.add('hidden');
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
    
    const wrapper = document.getElementById('itemsWrapper');
    wrapper.innerHTML = ''; // Limpiar contenedor
    
    questions.forEach((q, index) => {
        const itemNum = index + 1;
        const itemBox = document.createElement('div');
        itemBox.className = 'item-box hidden';
        itemBox.dataset.item = itemNum;
        
        itemBox.innerHTML = `
            <div class="item-equation">${q.equation}</div>
            <div style="text-align: center; margin-top: 20px;">
                <input type="number" 
                       class="item-input" 
                       data-answer="${q.answer}"
                       data-full-equation="${q.fullEquation}"
                       data-attempts="0"
                       placeholder="?"
                       min="1"
                       max="50">
                <button class="btn btn-primary check-answer-btn" style="margin-left: 15px; padding: 10px 25px;">Comprobar</button>
            </div>
            <div class="item-feedback" style="margin-top: 15px; font-size: 1.2em; min-height: 50px;"></div>
        `;
        
        wrapper.appendChild(itemBox);
    });
}

function showItem(itemNum) {
    document.querySelectorAll('.item-box').forEach(box => {
        if (parseInt(box.dataset.item) === itemNum) {
            box.classList.remove('hidden');
            
            // Agregar evento al botón comprobar
            const checkBtn = box.querySelector('.check-answer-btn');
            const input = box.querySelector('.item-input');
            
            checkBtn.addEventListener('click', () => validateItem(input, box));
            
            // Prevenir validación automática al escribir
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    checkBtn.click();
                }
            });
        }
    });
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
        
        // Celebración si termina con al menos 1 vida
        if (m4_magicLives > 0) {
            createFullScreenMagicEffect();
        }

        // Si terminó con las 3 vidas, mostrar mensaje especial
        if (m4_magicLives === 3) {
            
            const finalBox = finalSection.querySelector('.final-box');
            finalBox.innerHTML = `
                <h3 style="color: #ffd700; text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);">🎉 ¡Increíble! 🎉</h3>
                <p class="final-question" style="font-size: 1.4em; color: #fff; margin: 20px 0;">
                    ¡Completaste todos los desafíos sin perder ninguna vida mágica! ✨
                </p>
                <p style="font-size: 1.6em; color: #ffd700; font-weight: bold; margin: 25px 0; text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);">
                    🌟 Puedes reclamar <strong style="font-size: 1.3em;">3 PUNTOS POSITIVOS</strong> 🌟
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

        statusText.textContent = 'Completado ✅ Regresando al inicio...';
        m4_returnHomeTimeout = setTimeout(() => {
            window.location.href = 'index.html';
        }, 8000);
        
    } catch (error) {
        console.error('Error:', error);
        statusText.textContent = 'Error al guardar. Regresando al inicio...';
        statusText.className = 'status-text error';
        m4_returnHomeTimeout = setTimeout(() => {
            window.location.href = 'index.html';
        }, 5000);
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
