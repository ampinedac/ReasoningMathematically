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
        // narrationEnabled: false // Eliminado control de narración de texto
    };

    // ===== STATE =====
    let currentPage = 0;
    // let currentSpeech = null; // Eliminado narración por voz
    let completionEventDispatched = false;
    let isTurning = false;
    const TURN_DURATION_MS = 920;
    const TURN_HALF_MS = Math.round(TURN_DURATION_MS / 2);

    // ===== DOM ELEMENTS =====
    const pages = document.querySelectorAll('#flipbook .page');
    CONFIG.totalPages = pages.length;
    const elements = {
        progressBar: document.getElementById('progressBar'),
        progressText: document.getElementById('progressText'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
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

    function clearTemporaryTurnLayers() {
        document.querySelectorAll('#flipbook .page-turn-leaf').forEach(layer => layer.remove());
    }

    function resetPageTurnState() {
        pages.forEach(page => {
            page.classList.remove(
                'turning-forward',
                'turning-backward',
                'turned',
                'active',
                'page-static-left',
                'page-static-right',
                'page-under-left',
                'page-under-right'
            );
        });
    }

    function createTurnContent(sourcePage, visibleHalf) {
        const clone = sourcePage.cloneNode(true);
        clone.classList.remove(
            'turning-forward',
            'turning-backward',
            'turned',
            'active',
            'page-static-left',
            'page-static-right',
            'page-under-left',
            'page-under-right'
        );
        clone.classList.add('page-turn-source');

        clone.style.left = visibleHalf === 'right' ? '-100%' : '0';
        clone.style.top = '0';
        clone.style.width = '200%';
        clone.style.height = '100%';
        clone.style.transform = 'none';
        clone.style.opacity = '1';
        clone.style.pointerEvents = 'none';
        clone.style.zIndex = '1';
        clone.style.margin = '0';

        return clone;
    }

    function createTurnLeaf({ frontPage, frontHalf, backPage, backHalf, direction }) {
        const leaf = document.createElement('div');
        leaf.className = `page-turn-leaf ${direction}`;

        const frontFace = document.createElement('div');
        frontFace.className = 'page-turn-face front';
        frontFace.appendChild(createTurnContent(frontPage, frontHalf));

        const backFace = document.createElement('div');
        backFace.className = 'page-turn-face back';
        backFace.appendChild(createTurnContent(backPage, backHalf));

        leaf.appendChild(frontFace);
        leaf.appendChild(backFace);

        return leaf;
    }

    function finishPageTurn(pageIndex) {
        clearTemporaryTurnLayers();
        resetPageTurnState();
        currentPage = pageIndex;
        // Asegurar visibilidad exclusiva
        pages.forEach((page, idx) => {
            if (idx === pageIndex) {
                page.classList.add('active');
                page.style.opacity = '';
                page.style.pointerEvents = '';
            } else {
                page.classList.remove('active');
                page.style.opacity = '0';
                page.style.pointerEvents = 'none';
            }
        });
        updateProgress(pageIndex);
        isTurning = false;
    }

    function showSimplePage(pageIndex, direction) {
        const oldPage = pages[currentPage];
        const newPage = pages[pageIndex];

        resetPageTurnState();

        if (direction === 'forward') {
            if (oldPage) {
                oldPage.classList.add('turning-forward');
                setTimeout(() => {
                    oldPage.classList.remove('turning-forward');
                    oldPage.classList.add('turned');
                }, TURN_DURATION_MS);
            }

            setTimeout(() => {
                // Solo la nueva página visible
                pages.forEach((page, idx) => {
                    if (idx === pageIndex) {
                        page.classList.add('active');
                        page.style.opacity = '';
                        page.style.pointerEvents = '';
                    } else {
                        page.classList.remove('active');
                        page.style.opacity = '0';
                        page.style.pointerEvents = 'none';
                    }
                });
            }, TURN_HALF_MS);
        } else {
            newPage.classList.remove('turned');
            newPage.classList.add('turning-backward');

            setTimeout(() => {
                // Solo la nueva página visible
                pages.forEach((page, idx) => {
                    if (idx === pageIndex) {
                        page.classList.add('active');
                        page.style.opacity = '';
                        page.style.pointerEvents = '';
                    } else {
                        page.classList.remove('active');
                        page.style.opacity = '0';
                        page.style.pointerEvents = 'none';
                    }
                });
            }, TURN_DURATION_MS);
        }

        setTimeout(() => {
            currentPage = pageIndex;
            updateProgress(pageIndex);
            isTurning = false;
        }, TURN_DURATION_MS);
    }

    // ===== PAGE DISPLAY =====
    function showPage(pageIndex, direction = 'forward') {
        const oldPage = pages[currentPage];
        const newPage = pages[pageIndex];
        
        if (!newPage || isTurning) return;

        isTurning = true;
        
        // Detener narración al cambiar de página
        // stopNarration();
        // CONFIG.narrationEnabled = false;


        clearTemporaryTurnLayers();

        // Eliminar excepción: ahora la portada también usará la animación de hoja

        playPageTurnSound();

        // Solo ocultar todas menos la actual y la nueva para evitar superposición
        pages.forEach((page, idx) => {
            if (idx !== currentPage && idx !== pageIndex) {
                page.classList.remove(
                    'turning-forward',
                    'turning-backward',
                    'turned',
                    'active',
                    'page-static-left',
                    'page-static-right',
                    'page-under-left',
                    'page-under-right'
                );
                page.style.opacity = '0';
                page.style.pointerEvents = 'none';
            } else {
                page.style.opacity = '';
                page.style.pointerEvents = '';
            }
        });

        const flipbook = document.getElementById('flipbook');
        if (!flipbook || !oldPage) {
            showSimplePage(pageIndex, direction);
            return;
        }

        if (direction === 'forward') {
            oldPage.classList.add('page-static-left');
            newPage.classList.add('page-under-right', 'active');

            const leaf = createTurnLeaf({
                frontPage: oldPage,
                frontHalf: 'right',
                backPage: newPage,
                backHalf: 'left',
                direction: 'forward'
            });

            flipbook.appendChild(leaf);
            leaf.addEventListener('animationend', () => finishPageTurn(pageIndex), { once: true });
        } else {
            oldPage.classList.add('page-static-right');
            newPage.classList.add('page-under-left', 'active');

            const leaf = createTurnLeaf({
                frontPage: oldPage,
                frontHalf: 'left',
                backPage: newPage,
                backHalf: 'right',
                direction: 'backward'
            });

            flipbook.appendChild(leaf);
            leaf.addEventListener('animationend', () => finishPageTurn(pageIndex), { once: true });
        }
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
        // Navigation buttons: ahora la lógica se centraliza en main.js
        // Los listeners se agregan desde main.js para permitir validación pedagógica
        
        // Sound toggle
        
        // Cargar voces disponibles
        // if ('speechSynthesis' in window) {
        //     window.speechSynthesis.onvoiceschanged = () => {
        //         const voices = window.speechSynthesis.getVoices();
        //         console.log('🎙️ Voces disponibles:', voices.length);
        //     };
        // }
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
        // Eliminada carga de preferencia de narración
        
        addProgressBarStyle();
        initEventListeners();
        initKeyboardNavigation();
        initTouchSupport();

        applyRealBookPageNumbers();
        

        // Refuerzo: buscar portada (book-cover-page) y activarla como primera página, con logs
        let portadaIndex = 0;
        for (let i = 0; i < pages.length; i++) {
            if (pages[i].classList.contains('book-cover-page')) {
                portadaIndex = i;
                break;
            }
        }
        // Desactivar todas las páginas primero
        pages.forEach(p => {
            p.classList.remove('active');
            p.style.opacity = '0';
            p.style.pointerEvents = 'none';
        });
        // Activar portada
        if (pages[portadaIndex]) {
            pages[portadaIndex].classList.add('active');
            pages[portadaIndex].style.opacity = '';
            pages[portadaIndex].style.pointerEvents = '';
            updateProgress(portadaIndex);
            console.log('[app.js:init] Portada activada como primera página (índice', portadaIndex, ')');
        } else {
            console.warn('[app.js:init] No se encontró portada, activando primera página por defecto');
            if (pages[0]) {
                pages[0].classList.add('active');
                pages[0].style.opacity = '';
                pages[0].style.pointerEvents = '';
                updateProgress(0);
            }
        }
        console.log('[app.js:init] Estado de páginas tras inicialización:', Array.from(pages).map((p,i)=>({i,active:p.classList.contains('active'),opacity:p.style.opacity})));

        window.flipbookControls = {
            goToPage,
            nextPage,
            previousPage,
            getCurrentPage: () => currentPage,
            getTotalPages: () => pages.length
        };

        console.log('📖 Flipbook initialized successfully!');
    }

    // ===== START APP =====
    init();

});