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

// Datos de Momento 2
let tablePairs = [];
let tableAttempts = 0;
let consecutiveErrors = 0;

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
    
    // Construir la pregunta basada en si es docente o estudiante
    let pregunta = '';
    if (studentInfo.curso === 'DOCENTE') {
        pregunta = `¿Eres ${studentInfo.nombre} ${studentInfo.apellidos}?`;
    } else {
        pregunta = `¿Eres ${studentInfo.nombre} ${studentInfo.apellidos} del curso ${studentInfo.curso}?`;
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
    
    // Cargar cuento HTML
    loadCuento();
    
    // Botones de navegación del PDF
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            flipPage(-1);
        }
    });
    
    document.getElementById('nextPageBtn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            flipPage(1);
        }
    });
    
    // Botón "Ya terminé la lectura"
    document.getElementById('finishReadingBtn').addEventListener('click', () => {
        document.getElementById('pdfReaderSection').style.display = 'none';
        document.getElementById('problemQ1Section').classList.remove('hidden');
        initProblemQ1();
    });
    
    // Botón continuar a M2
    document.getElementById('continueToM2Btn').addEventListener('click', () => {
        showScreen('moment2Screen');
        initMoment2();
    });
}

// ========================================
// LECTOR DE CUENTO HTML
// ========================================

function loadCuento() {
    try {
        totalPages = cuentoData.paginas.length;
        console.log(`Cuento cargado: ${totalPages} páginas`);
        
        // Renderizar primera página
        renderStoryPage(currentPage);
        updatePageIndicator();
        
    } catch (error) {
        console.error('Error al cargar cuento:', error);
        alert('No se pudo cargar el cuento.');
    }
}

function renderStoryPage(pageNum) {
    try {
        const frontCanvas = document.getElementById('pageFrontCanvas');
        const container = frontCanvas.parentElement;
        
        // Ocultar canvas y mostrar contenido HTML
        frontCanvas.style.display = 'none';
        
        // Buscar o crear div para el cuento
        let storyDiv = document.getElementById('storyContent');
        if (!storyDiv) {
            storyDiv = document.createElement('div');
            storyDiv.id = 'storyContent';
            storyDiv.className = 'story-page-content';
            container.insertBefore(storyDiv, frontCanvas);
        }
        
        const pagina = cuentoData.paginas[pageNum - 1];
        
        if (pageNum === 1) {
            // Página de título
            storyDiv.innerHTML = `
                <div class="story-title-page">
                    <button id="readStoryBtn" class="read-story-btn" title="Escuchar el cuento">🔊</button>
                    <h1 class="story-main-title">${cuentoData.titulo}</h1>
                    <p class="story-author">${cuentoData.autor}</p>
                    <div class="story-decoration">🥐 🧈 🫓</div>
                </div>
            `;
            
            // Agregar evento al botón de leer
            document.getElementById('readStoryBtn').addEventListener('click', readCurrentPage);
        } else {
            // Páginas del cuento
            storyDiv.innerHTML = `
                <div class="story-page">
                    <button id="readStoryBtn" class="read-story-btn" title="Escuchar esta página">🔊</button>
                    <div class="story-illustration-top">${pagina.emojis || '📖'}</div>
                    <p class="story-text">${pagina.texto}</p>
                </div>
            `;
            
            // Agregar evento al botón de leer
            document.getElementById('readStoryBtn').addEventListener('click', readCurrentPage);
        }
        
    } catch (error) {
        console.error('Error al renderizar página del cuento:', error);
    }
}

// Función para leer el texto con voz mejorada
function readCurrentPage() {
    // Detener cualquier lectura previa
    if (typeof responsiveVoice !== 'undefined') {
        responsiveVoice.cancel();
    } else {
        window.speechSynthesis.cancel();
    }
    
    const pagina = cuentoData.paginas[currentPage - 1];
    const textoALeer = currentPage === 1 ? cuentoData.titulo : pagina.texto;
    
    // Usar ResponsiveVoice si está disponible (voz más expresiva)
    if (typeof responsiveVoice !== 'undefined') {
        // Opciones de ResponsiveVoice
        // Voces: "Mexican Spanish Female" (neutral latino), "Spanish Latin American Female"
        responsiveVoice.speak(textoALeer, "Mexican Spanish Female", {
            pitch: 1.05,
            rate: 0.88,
            volume: 1,
            onstart: function() {
                console.log("🔊 Iniciando lectura...");
                const btn = document.getElementById('readStoryBtn');
                if (btn) btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            },
            onend: function() {
                console.log("✅ Lectura completada");
                const btn = document.getElementById('readStoryBtn');
                if (btn) btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        });
    } else {
        // Fallback a la voz nativa del navegador
        const utterance = new SpeechSynthesisUtterance(textoALeer);
        utterance.lang = 'es-MX';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        
        const voices = window.speechSynthesis.getVoices();
        const femaleSpanishVoice = voices.find(voice => 
            voice.lang.includes('es') && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
            voice.lang.includes('es') && !voice.name.toLowerCase().includes('male')
        ) || voices.find(voice => voice.lang.includes('es'));
        
        if (femaleSpanishVoice) {
            utterance.voice = femaleSpanishVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

function flipPage(direction) {
    const nextPage = currentPage + direction;
    
    if (nextPage >= 1 && nextPage <= totalPages) {
        const storyDiv = document.getElementById('storyContent');
        
        // Animación de salida
        storyDiv.style.opacity = '0';
        storyDiv.style.transform = 'translateX(' + (direction > 0 ? '-20px' : '20px') + ')';
        
        setTimeout(() => {
            currentPage = nextPage;
            renderStoryPage(currentPage);
            
            // Animación de entrada
            storyDiv.style.transform = 'translateX(' + (direction > 0 ? '20px' : '-20px') + ')';
            
            setTimeout(() => {
                storyDiv.style.opacity = '1';
                storyDiv.style.transform = 'translateX(0)';
            }, 50);
            
            updatePageIndicator();
            checkLastPage();
        }, 300);
    }
}

function updatePageIndicator() {
    document.getElementById('pageIndicator').textContent = `Página ${currentPage} / ${totalPages}`;
    
    // Deshabilitar botones según corresponda
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
}

function checkLastPage() {
    if (currentPage === totalPages) {
        document.getElementById('finishReadingBtn').classList.remove('hidden');
    }
}

// ========================================
// PROBLEMA Q1 CON PIZARRA Y AUDIO
// ========================================

function initProblemQ1() {
    const canvasId = 'boardCanvasM1Q1';
    const recordBtnId = 'recordBtnM1Q1';
    const stopBtnId = 'stopBtnM1Q1';
    const statusId = 'audioStatusM1Q1';
    const submitBtnId = 'submitM1Q1';
    const statusTextId = 'statusM1Q1';
    
    const boardState = initBoard(canvasId);
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    // Habilitar botón enviar cuando haya evidencia
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasDrawing = boardState.hasDrawing;
        const hasAudio = audioState.audioBlob !== null;
        // Requiere AMBOS: dibujo Y audio
        submitBtn.disabled = !(hasDrawing && hasAudio);
        
        // Mostrar mensaje de qué falta
        const statusText = document.getElementById(statusTextId);
        if (!hasDrawing && !hasAudio) {
            statusText.textContent = '⚠️ Debes dibujar tu respuesta y grabar tu explicación';
            statusText.className = 'status-text';
        } else if (!hasDrawing) {
            statusText.textContent = '✏️ Falta dibujar tu respuesta';
            statusText.className = 'status-text';
        } else if (!hasAudio) {
            statusText.textContent = '🎤 Falta grabar tu explicación (es obligatorio)';
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
        submitBtn.disabled = true;
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
            
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            // Deshabilitar solo los botones de herramientas de ESTE momento
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Mostrar botón continuar y hacer scroll hacia él
            const continueBtn = document.getElementById('continueToM2Btn');
            continueBtn.classList.remove('hidden');
            
            // Scroll suave hacia el botón
            setTimeout(() => {
                continueBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
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
        }
    });
}

// ========================================
// MOMENTO 2: TABLA + PROBLEMA 1
// ========================================

function initMoment2() {
    document.getElementById('studentCodeM2').textContent = studentCode;
    
    // Generar 3 pares aleatorios
    tablePairs = [
        [randomInt(1, 10), randomInt(1, 10)],
        [randomInt(1, 10), randomInt(1, 10)],
        [randomInt(1, 10), randomInt(1, 10)]
    ];
    
    console.log('Pares generados:', tablePairs);
    
    // Renderizar tabla
    renderTable();
    
    // Botón continuar a M3
    document.getElementById('continueToM3Btn').addEventListener('click', () => {
        showScreen('moment3Screen');
        initMoment3();
    });
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    tablePairs.forEach((pair, index) => {
        const [a, b] = pair;
        const tr = document.createElement('tr');
        tr.dataset.row = index;
        
        // Deshabilitar filas que no son la primera sin completar
        if (index > 0) {
            tr.classList.add('disabled');
        }
        
        tr.innerHTML = `
            <td>${a}</td>
            <td>${b}</td>
            <td><input type="number" class="total-input martha-total" data-row="${index}" min="0" max="999" ${index > 0 ? 'disabled' : ''}></td>
            <td>${b}</td>
            <td>${a}</td>
            <td><input type="number" class="total-input lucas-total" data-row="${index}" min="0" max="999" ${index > 0 ? 'disabled' : ''}></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Event listeners para validación
    document.querySelectorAll('.total-input').forEach(input => {
        input.addEventListener('input', validateRow);
    });
}

function validateRow(e) {
    const row = parseInt(e.target.dataset.row);
    const tr = document.querySelector(`tr[data-row="${row}"]`);
    
    const marthaInput = tr.querySelector('.martha-total');
    const lucasInput = tr.querySelector('.lucas-total');
    
    const [a, b] = tablePairs[row];
    const correctTotal = a * b;
    
    const marthaVal = parseInt(marthaInput.value);
    const lucasVal = parseInt(lucasInput.value);
    
    const feedback = document.getElementById('tableFeedback');
    
    // Validar solo si ambos campos tienen valor
    if (marthaInput.value && lucasInput.value) {
        const isCorrect = (marthaVal === correctTotal) && (lucasVal === correctTotal) && (marthaVal === lucasVal);
        
        if (isCorrect) {
            tr.classList.add('correct');
            tr.classList.remove('disabled');
            feedback.textContent = '¡Muy bien! ✅';
            feedback.className = 'feedback-text success';
            
            // Habilitar siguiente fila
            const nextRow = document.querySelector(`tr[data-row="${row + 1}"]`);
            if (nextRow) {
                nextRow.classList.remove('disabled');
                nextRow.querySelectorAll('input').forEach(inp => inp.disabled = false);
            } else {
                // Todas las filas completadas
                document.getElementById('submitTableBtn').classList.remove('hidden');
            }
            
            consecutiveErrors = 0;
            
        } else {
            feedback.textContent = '🔍 Revisa de nuevo… ¿estás segura?';
            feedback.className = 'feedback-text error';
            tableAttempts++;
            consecutiveErrors++;
        }
    }
}

// Enviar tabla
document.getElementById('submitTableBtn')?.addEventListener('click', async () => {
    try {
        await submitEvidence({
            moment: 'm2',
            tag: 'table',
            data: {
                pairs: tablePairs,
                attempts: tableAttempts,
                errorsConsecutive: consecutiveErrors
            },
            boardBlob: null,
            audioBlob: null
        });
        
        // Bloquear tabla
        document.querySelectorAll('.total-input').forEach(input => input.disabled = true);
        document.getElementById('submitTableBtn').classList.add('hidden');
        
        // Mostrar Problema 1
        document.getElementById('problem1Section').classList.remove('hidden');
        initProblem1();
        
    } catch (error) {
        console.error('Error al enviar tabla:', error);
        alert('Error al guardar. Intenta de nuevo.');
    }
});

function initProblem1() {
    const canvasId = 'boardCanvasM2P1';
    const recordBtnId = 'recordBtnM2P1';
    const stopBtnId = 'stopBtnM2P1';
    const statusId = 'audioStatusM2P1';
    const submitBtnId = 'submitM2P1';
    const statusTextId = 'statusM2P1';
    
    const boardState = initBoard(canvasId);
    const audioState = initAudio(recordBtnId, stopBtnId, statusId);
    
    const submitBtn = document.getElementById(submitBtnId);
    
    const checkEvidence = () => {
        const hasDrawing = boardState.hasDrawing;
        const hasAudio = audioState.audioBlob !== null;
        // Requiere AMBOS: dibujo Y audio
        submitBtn.disabled = !(hasDrawing && hasAudio);
        
        // Mostrar mensaje de qué falta
        const statusText = document.getElementById(statusTextId);
        if (!hasDrawing && !hasAudio) {
            statusText.textContent = '⚠️ Debes dibujar tu respuesta y grabar tu explicación';
            statusText.className = 'status-text';
        } else if (!hasDrawing) {
            statusText.textContent = '✏️ Falta dibujar tu respuesta';
            statusText.className = 'status-text';
        } else if (!hasAudio) {
            statusText.textContent = '🎤 Falta grabar tu explicación (es obligatorio)';
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
                moment: 'm2',
                tag: 'prob1',
                data: { question: 'Problema 1: ¿Por qué da el mismo número?' },
                boardBlob: boardBlob,
                audioBlob: audioState.audioBlob
            });
            
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            // Deshabilitar herramientas de este momento
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Mostrar botón continuar y hacer scroll
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
    
    // Generar números aleatorios
    m3_a = randomInt(1, 10);
    m3_b = randomInt(1, 10);
    
    document.querySelectorAll('#formulaA, #formulaA2').forEach(el => el.textContent = m3_a);
    document.querySelectorAll('#formulaB, #formulaB2').forEach(el => el.textContent = m3_b);
    
    // Radio buttons
    const radios = document.querySelectorAll('input[name="truthQ"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            m3_choice = e.target.value;
            showPrompt(m3_choice);
        });
    });
    
    // Botón continuar a M4
    document.getElementById('continueToM4Btn').addEventListener('click', () => {
        showScreen('moment4Screen');
        initMoment4();
    });
}

function showPrompt(choice) {
    const promptSection = document.getElementById('promptSection');
    const promptText = document.getElementById('promptText');
    
    const prompts = {
        yes: 'Puede ser verdadero. Muéstrame por qué con un ejemplo.',
        no: 'Crees que es falso. ¿Qué ejemplo te hace pensar eso?',
        unsure: '¿Qué no te permite decidir?'
    };
    
    promptText.textContent = prompts[choice] || '';
    promptSection.classList.remove('hidden');
    
    // Inicializar pizarra y audio para M3
    initProblemM3Q2();
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
        const hasDrawing = boardState.hasDrawing;
        const hasAudio = audioState.audioBlob !== null;
        // Requiere AMBOS: dibujo Y audio
        submitBtn.disabled = !(hasDrawing && hasAudio);
        
        // Mostrar mensaje de qué falta
        const statusText = document.getElementById(statusTextId);
        if (!hasDrawing && !hasAudio) {
            statusText.textContent = '⚠️ Debes dibujar tu respuesta y grabar tu explicación';
            statusText.className = 'status-text';
        } else if (!hasDrawing) {
            statusText.textContent = '✏️ Falta dibujar tu respuesta';
            statusText.className = 'status-text';
        } else if (!hasAudio) {
            statusText.textContent = '🎤 Falta grabar tu explicación (es obligatorio)';
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
                tag: 'q2',
                data: { a: m3_a, b: m3_b, choice: m3_choice },
                boardBlob: boardBlob,
                audioBlob: audioState.audioBlob
            });
            
            statusText.textContent = 'Guardado exitosamente ✅';
            statusText.className = 'status-text success';
            
            // Bloquear edición
            boardState.disabled = true;
            const canvas = document.getElementById(canvasId);
            canvas.style.pointerEvents = 'none';
            
            // Deshabilitar herramientas
            const evidenceSection = canvas.closest('.evidence-section');
            evidenceSection.querySelectorAll('.tool-btn').forEach(b => b.disabled = true);
            document.getElementById(recordBtnId).disabled = true;
            
            // Mostrar botón continuar y hacer scroll
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
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    let isDrawing = false;
    let currentTool = 'black';
    let hasDrawing = false;
    let disabled = false;
    
    // Configurar herramientas
    const toolButtons = canvas.closest('.evidence-section').querySelectorAll('.tool-btn');
    
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            
            if (tool === 'clear') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hasDrawing = false;
                return;
            }
            
            currentTool = tool;
            
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
                ctx.globalAlpha = 0.4;
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
    const recordBtn = document.getElementById(recordBtnId);
    const stopBtn = document.getElementById(stopBtnId);
    const status = document.getElementById(statusId);
    
    let mediaRecorder = null;
    let audioChunks = [];
    let audioBlob = null;
    
    recordBtn.addEventListener('click', async () => {
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
