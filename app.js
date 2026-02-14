// ===== FLIPBOOK APP =====
// Interactive storybook - Vanilla JavaScript

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        totalPages: 11, // Cover + TOC + 9 story pages + Back cover
        soundEnabled: true,
        soundFrequency: 800,
        soundDuration: 100
    };

    // ===== STATE =====
    let currentPage = 0;
    let darkMode = localStorage.getItem('darkMode') === 'true';

    // ===== DOM ELEMENTS =====
    const pages = document.querySelectorAll('#flipbook .page');
    const elements = {
        darkModeToggle: document.getElementById('darkModeToggle'),
        progressBar: document.getElementById('progressBar'),
        progressText: document.getElementById('progressText'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        startBtn: document.getElementById('startBtn'),
        restartBtn: document.getElementById('restartBtn'),
        tocItems: document.querySelectorAll('.toc-item')
    };

    // ===== WEB AUDIO API - PAGE TURN SOUND =====
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function playPageTurnSound() {
        if (!CONFIG.soundEnabled) return;

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = CONFIG.soundFrequency;

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + CONFIG.soundDuration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + CONFIG.soundDuration / 1000);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }

    // ===== DARK MODE =====
    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
        elements.darkModeToggle.textContent = darkMode ? '☀️' : '🌙';
    }

    function initDarkMode() {
        if (darkMode) {
            document.body.classList.add('dark-mode');
            elements.darkModeToggle.textContent = '☀️';
        }
    }

    // ===== PROGRESS INDICATOR =====
    function updateProgress(page) {
        currentPage = page;
        const progress = (page / CONFIG.totalPages) * 100;
        elements.progressBar.style.setProperty('--progress', `${progress}%`);
        elements.progressBar.querySelector('::before')?.style.setProperty('width', `${progress}%`);
        
        // Update CSS variable for progress bar
        document.documentElement.style.setProperty('--flipbook-progress', `${progress}%`);
        
        elements.progressText.textContent = `Página ${page} de ${CONFIG.totalPages}`;
        
        // Update navigation buttons
        updateNavButtons(page);
    }

    function updateNavButtons(page) {
        elements.prevBtn.disabled = page === 0;
        elements.nextBtn.disabled = page === CONFIG.totalPages;
    }

    // ===== PAGE DISPLAY =====
    function showPage(pageIndex, direction = 'forward') {
        const oldPage = pages[currentPage];
        const newPage = pages[pageIndex];
        
        if (!newPage) return;
        
        // Limpiar todas las clases de animación
        pages.forEach(page => {
            page.classList.remove('turning-forward', 'turning-backward', 'turned', 'active');
        });
        
        if (direction === 'forward') {
            // Voltear hacia adelante
            if (oldPage) {
                oldPage.classList.add('turning-forward');
                setTimeout(() => {
                    oldPage.classList.remove('turning-forward');
                    oldPage.classList.add('turned');
                }, 800);
            }
            
            setTimeout(() => {
                newPage.classList.add('active');
            }, 400);
            
        } else {
            // Voltear hacia atrás
            newPage.classList.remove('turned');
            newPage.classList.add('turning-backward');
            
            setTimeout(() => {
                newPage.classList.remove('turning-backward');
                newPage.classList.add('active');
                if (oldPage) {
                    oldPage.classList.remove('active');
                }
            }, 800);
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

    // ===== TABLE OF CONTENTS =====
    function initTableOfContents() {
        elements.tocItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = parseInt(item.getAttribute('data-page'));
                const direction = targetPage > currentPage ? 'forward' : 'backward';
                goToPage(targetPage, direction);
            });
        });
    }

    // ===== EVENT LISTENERS =====
    function initEventListeners() {
        // Dark mode toggle
        elements.darkModeToggle.addEventListener('click', toggleDarkMode);

        // Navigation buttons
        elements.prevBtn.addEventListener('click', previousPage);
        elements.nextBtn.addEventListener('click', nextPage);

        // Start button (on cover)
        elements.startBtn.addEventListener('click', () => {
            goToPage(1, 'forward');
        });

        // Restart button (on back cover)
        elements.restartBtn.addEventListener('click', () => {
            goToPage(0, 'backward');
        });
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
        initDarkMode();
        addProgressBarStyle();
        initEventListeners();
        
        // Show first page (cover) without animation
        pages[0].classList.add('active');
        updateProgress(0);

        console.log('📖 Flipbook initialized successfully!');
    }

    // ===== START APP =====
    init();

});