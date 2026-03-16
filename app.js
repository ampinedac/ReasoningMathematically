// ===== FLIPBOOK APP =====
// Interactive storybook - Vanilla JavaScript

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        totalPages: 0,
        soundEnabled: true,
        soundFrequency: 800,
        soundDuration: 100,
        narrationEnabled: false // Control para la narración de texto
    };

    // ===== STATE =====
    let currentPage = 0;
    let currentSpeech = null; // Almacenar el objeto de narración actual
    let completionEventDispatched = false;
    const TURN_DURATION_MS = 1050;
    const TURN_HALF_MS = Math.round(TURN_DURATION_MS / 2);

    // ===== DOM ELEMENTS =====
    const pages = document.querySelectorAll('#flipbook .page');
    CONFIG.totalPages = pages.length;
    const elements = {
        progressBar: document.getElementById('progressBar'),
        progressText: document.getElementById('progressText'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        soundToggle: document.getElementById('soundToggle')
    };

    function applyRealBookPageNumbers() {
        const storyPages = document.querySelectorAll('#flipbook .story-page');

        storyPages.forEach((storyPage, spreadIndex) => {
            const pageNumber = storyPage.querySelector('.page-number');
            if (!pageNumber) return;

            const leftPageNumber = (spreadIndex * 2) + 1;
            const rightPageNumber = leftPageNumber + 1;

            pageNumber.classList.add('book-spread-number');
            pageNumber.innerHTML = `
                <span class="page-number-left">${leftPageNumber}</span>
                <span class="page-number-right">${rightPageNumber}</span>
            `;
        });
    }

    // ===== WEB AUDIO API - REALISTIC PAGE TURN SOUND =====
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function playPageTurnSound() {
        if (!CONFIG.soundEnabled) return;

        try {
            const duration = 0.42;
            const now = audioContext.currentTime;

            // Crear buffer para ruido blanco (simula papel)
            const bufferSize = audioContext.sampleRate * duration;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // Generar ruido blanco
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            // Crear fuente de buffer
            const noise = audioContext.createBufferSource();
            noise.buffer = buffer;

            // Filtro paso-alto para quitar graves tipo "golpe"
            const highpass = audioContext.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 1400;
            highpass.Q.value = 0.7;

            // Filtro paso-bajo para evitar brillo áspero
            const lowpass = audioContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 3400;
            lowpass.Q.value = 0.8;

            // Control de volumen suave (sin ataque brusco)
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.04, now + 0.08);
            gainNode.gain.linearRampToValueAtTime(0.026, now + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            // Conectar cadena de audio
            noise.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Reproducir
            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }

    // Exponer globalmente para que main.js pueda usarla en páginas 10 y 11
    window.playPageTurnSound = playPageTurnSound;

    // ===== TOGGLE SONIDO =====
    function toggleNarration() {
        CONFIG.narrationEnabled = !CONFIG.narrationEnabled;
        updateSoundButton();
        
        if (CONFIG.narrationEnabled) {
            // Narrar la página actual
            narrateCurrentPage();
        } else {
            // Detener narración
            stopNarration();
        }
        
        // Guardar preferencia
        localStorage.setItem('flipbookNarrationEnabled', CONFIG.narrationEnabled);
    }

    function narrateCurrentPage() {
        // Detener cualquier narración anterior
        stopNarration();
        
        const currentPageElement = pages[currentPage];
        const storyText = currentPageElement.querySelector('.story-text');
        
        if (!storyText) return;
        
        const text = storyText.textContent;
        
        // Usar Web Speech API
        if ('speechSynthesis' in window) {
            currentSpeech = new SpeechSynthesisUtterance(text);
            currentSpeech.lang = 'es-ES'; // Español
            currentSpeech.rate = 0.9; // Velocidad un poco más lenta
            currentSpeech.pitch = 1.1; // Tono ligeramente más alto (voz femenina)
            
            // Buscar voz femenina con acento neutral (es-ES o es-MX preferentemente)
            const voices = window.speechSynthesis.getVoices();
            
            // Priorizar voces de España (es-ES) o México (es-MX) que suelen ser más neutrales
            const spanishFemaleVoice = voices.find(voice => 
                (voice.lang === 'es-ES' || voice.lang === 'es-MX') && 
                (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
            ) || voices.find(voice => 
                voice.lang === 'es-ES' && voice.name.toLowerCase().includes('lucia')
            ) || voices.find(voice => 
                voice.lang === 'es-MX' && voice.name.toLowerCase().includes('paulina')
            ) || voices.find(voice => 
                voice.lang.startsWith('es') && !voice.name.toLowerCase().includes('male')
            ) || voices.find(voice => voice.lang.startsWith('es'));
            
            if (spanishFemaleVoice) {
                currentSpeech.voice = spanishFemaleVoice;
                console.log('🎙️ Usando voz:', spanishFemaleVoice.name);
            }
            
            currentSpeech.onend = () => {
                console.log('🔊 Narración completada');
            };
            
            window.speechSynthesis.speak(currentSpeech);
        }
    }

    function stopNarration() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        currentSpeech = null;
    }

    function updateSoundButton() {
        if (!elements.soundToggle) return;
        
        const muteLine = elements.soundToggle.querySelector('.mute-line');
        const soundWaves = elements.soundToggle.querySelector('.sound-waves');
        
        // Siempre mostrar bocina abierta (ondas de sonido visibles)
        muteLine.style.display = 'none';
        soundWaves.style.display = 'block';
        
        // Cambiar solo el aria-label para accesibilidad
        if (CONFIG.narrationEnabled) {
            elements.soundToggle.setAttribute('aria-label', 'Detener narración');
        } else {
            elements.soundToggle.setAttribute('aria-label', 'Narrar página');
        }
    }

    // ===== PROGRESS INDICATOR =====
    function updateProgress(page) {
        currentPage = page;
        const progress = ((page + 1) / CONFIG.totalPages) * 100;
        
        // Update progress bar only if it exists
        if (elements.progressBar) {
            elements.progressBar.style.setProperty('--progress', `${progress}%`);
            elements.progressBar.querySelector('::before')?.style.setProperty('width', `${progress}%`);
            // Update CSS variable for progress bar
            document.documentElement.style.setProperty('--flipbook-progress', `${progress}%`);
        }
        
        // Update progress text only if it exists
        if (elements.progressText) {
            elements.progressText.textContent = `Página ${page + 1} de ${CONFIG.totalPages}`;
        }
        
        // Al llegar por primera vez a la última página, mostrar Situación 1 automáticamente
        if (page === CONFIG.totalPages - 1 && !completionEventDispatched) {
            completionEventDispatched = true;
            document.dispatchEvent(new CustomEvent('flipbook:completed'));
            console.log('✅ Última página alcanzada - evento de situación emitido');
        }

        document.dispatchEvent(new CustomEvent('flipbook:pagechange', {
            detail: {
                page,
                totalPages: CONFIG.totalPages,
                isLastPage: page === CONFIG.totalPages - 1
            }
        }));
        
        // Update navigation buttons
        updateNavButtons(page);
    }

    function updateNavButtons(page) {
        if (page === 0) {
            document.body.classList.add('flipbook-on-cover');
        } else {
            document.body.classList.remove('flipbook-on-cover');
        }
        elements.prevBtn.disabled = page === 0;
        const allowNextOnLastPageForActivity0B = document.body.classList.contains('activity-0b')
            && page === CONFIG.totalPages - 1;
        elements.nextBtn.disabled = !allowNextOnLastPageForActivity0B && page === CONFIG.totalPages - 1;
    }

    // ===== PAGE DISPLAY =====
    function showPage(pageIndex, direction = 'forward') {
        const oldPage = pages[currentPage];
        const newPage = pages[pageIndex];
        const flipbookEl = document.getElementById('flipbook');
        
        if (!newPage) return;
        
        // Detener narración al cambiar de página
        stopNarration();
        CONFIG.narrationEnabled = false;
        updateSoundButton();
        
        // Limpiar todas las clases de animación
        pages.forEach(page => {
            page.classList.remove('turning-forward', 'turning-backward', 'turned', 'active');
        });

        if (flipbookEl) {
            flipbookEl.classList.remove('spread-turn-forward', 'spread-turn-backward');
        }
        
        if (direction === 'forward') {
            if (flipbookEl) {
                flipbookEl.classList.add('spread-turn-forward');
                setTimeout(() => {
                    flipbookEl.classList.remove('spread-turn-forward');
                }, TURN_DURATION_MS);
            }

            // Voltear hacia adelante
            if (oldPage) {
                oldPage.classList.add('turning-forward');
                setTimeout(() => {
                    oldPage.classList.remove('turning-forward');
                    oldPage.classList.add('turned');
                }, TURN_DURATION_MS);
            }
            
            setTimeout(() => {
                newPage.classList.add('active');
            }, TURN_HALF_MS);
            
        } else {
            if (flipbookEl) {
                flipbookEl.classList.add('spread-turn-backward');
                setTimeout(() => {
                    flipbookEl.classList.remove('spread-turn-backward');
                }, TURN_DURATION_MS);
            }

            // Voltear hacia atrás
            newPage.classList.remove('turned');
            newPage.classList.add('turning-backward');
            
            setTimeout(() => {
                newPage.classList.remove('turning-backward');
                newPage.classList.add('active');
                if (oldPage) {
                    oldPage.classList.remove('active');
                }
            }, TURN_DURATION_MS);
        }
        
        currentPage = pageIndex;
        updateProgress(pageIndex);
        playPageTurnSound();
    }

    // ===== NAVIGATION =====
    function goToPage(pageIndex, direction = null) {
        if (pageIndex >= 0 && pageIndex < pages.length && pageIndex !== currentPage) {
            const autoDirection = direction || (pageIndex > currentPage ? 'forward' : 'backward');
            showPage(pageIndex, autoDirection);
        }
    }

    function nextPage() {
        if (currentPage < pages.length - 1) {
            goToPage(currentPage + 1, 'forward');
        }
    }

    function previousPage() {
        if (currentPage > 0) {
            goToPage(currentPage - 1, 'backward');
        }
    }

    // ===== KEYBOARD NAVIGATION =====
    function initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                previousPage();
            } else if (e.key === 'Home') {
                e.preventDefault();
                goToPage(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                goToPage(CONFIG.totalPages);
            }
        });
    }

    // ===== TOUCH/SWIPE SUPPORT =====
    function initTouchSupport() {
        let touchStartX = 0;
        let touchEndX = 0;

        const flipbookEl = document.getElementById('flipbook');

        flipbookEl.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        flipbookEl.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next page
                    nextPage();
                } else {
                    // Swipe right - previous page
                    previousPage();
                }
            }
        }
    }

    // ===== EVENT LISTENERS =====
    function initEventListeners() {
        // Navigation buttons
        elements.prevBtn.addEventListener('click', previousPage);
        elements.nextBtn.addEventListener('click', nextPage);
        
        // Sound toggle
        if (elements.soundToggle) {
            elements.soundToggle.addEventListener('click', toggleNarration);
        }
        
        // Cargar voces disponibles
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                const voices = window.speechSynthesis.getVoices();
                console.log('🎙️ Voces disponibles:', voices.length);
            };
        }
    }

    // ===== CUSTOM PROGRESS BAR STYLE =====
    function addProgressBarStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .progress-bar::before {
                width: var(--flipbook-progress, 0%);
            }
        `;
        document.head.appendChild(style);
    }

    // ===== INITIALIZATION =====
    function init() {
        // Cargar preferencia de narración
        const savedNarrationPref = localStorage.getItem('flipbookNarrationEnabled');
        if (savedNarrationPref !== null) {
            CONFIG.narrationEnabled = savedNarrationPref === 'true';
        }
        
        addProgressBarStyle();
        initEventListeners();
        initKeyboardNavigation();
        initTouchSupport();
        updateSoundButton();
        applyRealBookPageNumbers();
        
        // Show first story page without animation
        pages[0].classList.add('active');
        updateProgress(0);

        console.log('📖 Flipbook initialized successfully!');
    }

    // ===== START APP =====
    init();

});