// main.js - Lógica principal de la aplicación
import { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase.js';
import { cuentoData } from './assets/cuento-data.js';
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
            console.log('📌 Abriendo Actividad 0 en nueva pestaña');
            window.open('actividad0.html', '_blank');
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
    const nombreFormateado = toTitleCase(studentInfo.nombre);
    const apellidosFormateados = toTitleCase(studentInfo.apellidos);
    
    // Construir la pregunta basada en si es docente o estudiante
    let pregunta = '';
    if (studentInfo.curso === 'DOCENTE') {
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
            span.textContent = studentCode;
        });
    }
}

// ========================================
// MOMENTO 1: CUENTO + PROBLEMA Q1
// ========================================

function initMoment1() {
    document.getElementById('studentCodeM1').textContent = studentCode;
    
    console.log('✅ Momento 1 inicializado');
    console.log('📖 El cuento ya está en el HTML, no necesita cargarse');
    
    // El flipbook ya está en el HTML y app.js maneja la animación
    // app.js también maneja la lógica del botón directamente
    
    // Botón "Ya terminé la lectura" - Solo manejar el click
    const finishReadingBtn = document.getElementById('finishReadingBtn');
    if (finishReadingBtn) {
        finishReadingBtn.addEventListener('click', () => {
            console.log('🔘 Click en botón "Ya terminé la lectura"');
            document.getElementById('flipbookSection').style.display = 'none';
            finishReadingBtn.style.display = 'none'; // Ocultar el botón también
            const problemSection = document.getElementById('problemQ1Section');
            if (problemSection) {
                problemSection.classList.remove('hidden');
                initProblemQ1();
            }
        });
        console.log('✅ Event listener del botón configurado');
    } else {
        console.error('❌ No se encontró el botón finishReadingBtn');
    }
}

// ========================================
// PROBLEMA Q1 CON PIZARRA Y AUDIO
// ========================================

function initProblemQ1() {
    console.log('🔧 Inicializando Problema Q1...');
    
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
        // Solo requiere audio (pizarra opcional)
        submitBtn.disabled = !hasAudio;
        
        // Mostrar mensaje de qué falta
        const statusText = document.getElementById(statusTextId);
        if (!hasAudio) {
            statusText.textContent = '🎤 Graba tu explicación';
            statusText.className = 'status-text';
        } else {
            statusText.textContent = '✅ Listo para enviar';
            statusText.className = 'status-text success';
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
            
            statusText.textContent = 'Guardado exitosamente ✅ Continuando...';
            statusText.className = 'status-text success';
            
            // Mantener botón deshabilitado permanentemente
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            // Deshabilitar solo los botones de herramientas de ESTE momento
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Continuar automáticamente al Momento 2 después de un breve delay
            setTimeout(() => {
                // Ocultar botón de lectura si existe
                const finishReadingBtn = document.getElementById('finishReadingBtn');
                if (finishReadingBtn) {
                    finishReadingBtn.style.display = 'none';
                }
                showScreen('moment2Screen');
                initMoment2();
            }, 1000);
            
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
    document.getElementById('studentCodeM2').textContent = studentCode;
    
    // Crear juego de bandejas
    createTraysGame();
    
    // Botón continuar a M3
    document.getElementById('continueToM3Btn').addEventListener('click', () => {
        showScreen('moment3Screen');
        initMoment3();
    });
}

// ========================================
// JUEGO DE BANDEJAS - DRAG AND DROP
// ========================================

function createTraysGame() {
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
        
        // Grid de arepas (SIN etiqueta para que las niñas cuenten)
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
        
        // Emojis de arepas
        for (let i = 0; i < data.total; i++) {
            const arepa = document.createElement('span');
            arepa.textContent = '🫓';
            arepa.style.fontSize = emojiSize;
            grid.appendChild(arepa);
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
            tryPairing(draggedTray, elem);
            return;
        }
    }
    
    console.log('❌ No hay bandeja debajo');
}

function tryPairing(tray1, tray2) {
    const pairId1 = tray1.dataset.pairId;
    const pairId2 = tray2.dataset.pairId;
    const id1 = parseInt(tray1.dataset.id);
    const id2 = parseInt(tray2.dataset.id);
    
    console.log(`🔍 Uniendo: Bandeja ${id1} (pareja ${pairId1}) con Bandeja ${id2} (pareja ${pairId2})`);
    
    // Permitir emparejar cualquier bandeja con cualquier otra (excepto consigo misma)
    if (id1 !== id2) {
        console.log('✅ Uniendo bandejas...');
        
        // Crear contenedor wrapper para el par
        const wrapper = document.createElement('div');
        wrapper.classList.add('tray-pair-wrapper');
        wrapper.dataset.pair = `${id1}-${id2}`;
        
        // Obtener posición de tray2
        const rect2 = tray2.getBoundingClientRect();
        const containerRect = tray2.parentElement.getBoundingClientRect();
        
        const wrapperLeft = rect2.left - containerRect.left;
        const wrapperTop = rect2.top - containerRect.top;
        
        // Posicionar wrapper
        wrapper.style.position = 'absolute';
        wrapper.style.left = wrapperLeft + 'px';
        wrapper.style.top = wrapperTop + 'px';
        
        // Agregar wrapper al contenedor de bandejas
        const traysContainer = tray2.parentElement;
        traysContainer.appendChild(wrapper);
        
        // Resetear estilos de posicionamiento de las bandejas
        tray1.style.position = 'relative';
        tray1.style.left = '0';
        tray1.style.top = '0';
        tray2.style.position = 'relative';
        tray2.style.left = '0';
        tray2.style.top = '0';
        
        // Mover ambas bandejas al wrapper
        wrapper.appendChild(tray2);
        wrapper.appendChild(tray1);
        
        // Marcar como emparejadas
        tray1.classList.add('paired');
        tray2.classList.add('paired');
        
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

function verifyPairings() {
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
            errorMsg += 'Recuerda que debes emparejar las bandejas con la misma cantidad de arepas. ';
        }
        
        if (wrongPairs.length > 0) {
            errorMsg += 'Hay bandejas que no tienen pareja porque tienen cantidades únicas. ';
        }
        
        if (missingPairs.length > 0) {
            errorMsg += 'Cuenta bien las arepas de cada bandeja.';
        }
        
        feedback.textContent = errorMsg;
        feedback.className = 'feedback-text error';
    }
}

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
    
    setInterval(checkEvidence, 500);
    
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
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
            
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            
            document.getElementById(recordBtnId).disabled = true;
            
            const continueBtn = document.getElementById('continueToM3Btn');
            continueBtn.classList.remove('hidden');
            setTimeout(() => {
                continueBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            submitBtn.disabled = false;
        }
    });
}

// ========================================
// MOMENTO 3: VERACIDAD + EVIDENCIA
// ========================================

function initMoment3() {
    document.getElementById('studentCodeM3').textContent = studentCode;
    
    // Radio buttons para Pregunta 1
    const radiosQ1 = document.querySelectorAll('input[name="truthQ1"]');
    radiosQ1.forEach(radio => {
        radio.addEventListener('change', (e) => {
            m3_choice = e.target.value;
            showPrompt1(m3_choice);
        });
    });
    
    // Radio buttons para Pregunta 2
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
        yes: 'Muéstrame por qué con un ejemplo.',
        no: '¿Qué ejemplo te hace pensar eso?',
        unsure: '¿Qué no te permite decidir?'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    
    // Inicializar pizarra y audio para pregunta 1
    initProblemM3Q1();
}

function showPrompt2(choice) {
    const promptSection = document.getElementById('promptSection2');
    const promptText = document.getElementById('promptText2');
    
    const prompts = {
        yes: 'Muéstrame por qué con un ejemplo.',
        no: '¿Qué ejemplo te hace pensar eso?',
        unsure: '¿Qué no te permite decidir?'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    
    // Inicializar pizarra y audio para pregunta 2
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
    
    setInterval(checkEvidence, 500);
    
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        
        try {
            const boardBlob = boardState.hasDrawing ? await canvasToBlob(canvasId) : null;
            
            await submitEvidence({
                moment: 'm3',
                tag: 'pregunta1',
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
            
            // Mostrar Pregunta 2
            setTimeout(() => {
                document.getElementById('question2Section').classList.remove('hidden');
                document.getElementById('question2Section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            submitBtn.disabled = false;
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
    
    setInterval(checkEvidence, 500);
    
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        const statusText = document.getElementById(statusTextId);
        statusText.textContent = 'Subiendo evidencia...';
        statusText.className = 'status-text loading';
        
        try {
            const boardBlob = boardState.hasDrawing ? await canvasToBlob(canvasId) : null;
            
            const choice2 = document.querySelector('input[name="truthQ2"]:checked')?.value;
            
            await submitEvidence({
                moment: 'm3',
                tag: 'pregunta2',
                data: { choice: choice2 },
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
            
            // Mostrar botón continuar
            const continueBtn = document.getElementById('continueToM4Btn');
            continueBtn.classList.remove('hidden');
            setTimeout(() => {
                continueBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Error al guardar. Intenta de nuevo.';
            statusText.className = 'status-text error';
            submitBtn.disabled = false;
        }
    });
}

// ========================================
// MOMENTO 4: 6 ÍTEMS
// ========================================

function initMoment4() {
    document.getElementById('studentCodeM4').textContent = studentCode;
    
    // Mostrar primer ítem
    showItem(1);
    
    // Event listeners para los inputs
    const inputs = document.querySelectorAll('.item-input');
    inputs.forEach(input => {
        input.addEventListener('input', validateItem);
    });
}

function showItem(itemNum) {
    document.querySelectorAll('.item-box').forEach(box => {
        if (parseInt(box.dataset.item) === itemNum) {
            box.classList.remove('hidden');
        }
    });
}

function validateItem(e) {
    const input = e.target;
    const answer = parseInt(input.dataset.answer);
    const userAnswer = parseInt(input.value);
    const itemBox = input.closest('.item-box');
    const feedback = itemBox.querySelector('.item-feedback');
    
    if (input.value === '') {
        feedback.textContent = '';
        return;
    }
    
    if (userAnswer === answer) {
        // Correcto
        feedback.textContent = '✅';
        feedback.className = 'item-feedback correct';
        input.disabled = true;
        
        m4_responses.push({
            item: m4_currentItem,
            correct: true,
            errors: m4_errorsConsecutive
        });
        
        // Reiniciar contador de errores consecutivos
        if (m4_errorsConsecutive > m4_errorsConsecutiveMax) {
            m4_errorsConsecutiveMax = m4_errorsConsecutive;
        }
        m4_errorsConsecutive = 0;
        
        // Avanzar al siguiente ítem
        m4_currentItem++;
        if (m4_currentItem <= 6) {
            showItem(m4_currentItem);
        } else {
            finalizeMoment4();
        }
        
    } else {
        // Incorrecto
        feedback.textContent = 'Intenta de nuevo';
        feedback.className = 'item-feedback incorrect';
        m4_errorsTotal++;
        m4_errorsConsecutive++;
        input.value = '';
    }
}

async function finalizeMoment4() {
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
                comment: needsSupport ? 'No está clara la propiedad conmutativa' : null
            },
            boardBlob: null,
            audioBlob: null
        });
        
        statusText.textContent = 'Completado ✅';
        statusText.className = 'status-text success';
        
        // Mostrar pantalla final
        document.getElementById('finalQuestionSection').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error:', error);
        statusText.textContent = 'Error al guardar.';
        statusText.className = 'status-text error';
    }
}

// ========================================
// SISTEMA DE PIZARRA (CANVAS)
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
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1;
                break;
            case 'red':
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1;
                break;
            case 'yellow':
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 15;
                ctx.globalAlpha = 0.3; // 30% de opacidad para el resaltador
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
    
    const timestamp = Date.now();
    let boardUrl = null;
    let audioUrl = null;
    
    try {
        // Subir imagen de pizarra (si existe)
        if (boardBlob) {
            console.log('📸 Subiendo imagen...');
            const boardPath = `uploads/${studentCode}/act0/${moment}/${studentCode}_act0_${moment}_${tag}_${timestamp}.png`;
            const boardRef = ref(storage, boardPath);
            await uploadBytes(boardRef, boardBlob);
            boardUrl = await getDownloadURL(boardRef);
            console.log('✅ Pizarra subida:', boardUrl);
        }
        
        // Subir audio (si existe)
        if (audioBlob) {
            console.log('🎤 Subiendo audio...', audioBlob.size, 'bytes');
            const audioPath = `uploads/${studentCode}/act0/${moment}/${studentCode}_act0_${moment}_${tag}_${timestamp}.webm`;
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
        studentCode: studentCode,
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
