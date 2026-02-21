// ========================================
// SISTEMA DE BOLSAS - DRAG & DROP
// ========================================

class TraysSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} no encontrado`);
        }
        
        // Datos base de las 8 bolsas (Actividad 0B)
        this.BASE_TRAYS = [
            { id: 'tray-1', rows: 3, cols: 5, total: 15, emoji: '🫓' },
            { id: 'tray-2', rows: 5, cols: 3, total: 15, emoji: '🫓' },
            { id: 'tray-3', rows: 2, cols: 4, total: 8, emoji: '🫓' },
            { id: 'tray-4', rows: 4, cols: 2, total: 8, emoji: '🫓' },
            { id: 'tray-5', rows: 6, cols: 5, total: 30, emoji: '🫓' },
            { id: 'tray-6', rows: 5, cols: 6, total: 30, emoji: '🫓' },
            { id: 'tray-7', rows: 6, cols: 4, total: 24, emoji: '🫓' },
            { id: 'tray-8', rows: 5, cols: 4, total: 20, emoji: '🫓' }
        ];
        
        // Estado de emparejamiento (Map bidireccional)
        this.pairings = new Map(); // trayId -> mateId
        
        // Contador de pares para asignar colores únicos
        this.pairCounter = 0;
        this.pairColors = new Map(); // pairKey -> color
        
        // Estado de drag
        this.draggedTray = null;
        this.selectedTray = null;
        this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
        
        // Inicializar
        this.init();
    }
    
    init() {
        console.log('🎯 Inicializando sistema de bolsas...');
        this.render();
        this.setupEventListeners();
    }
    
    // Limpiar y renderizar las 8 bandejas
    render() {
        // CRÍTICO: Limpiar contenedor primero
        this.container.innerHTML = '';
        // El CSS ya define el grid, no sobrescribir aquí
        
        // Crear copia para barajar (no mutar el original)
        const shuffledTrays = [...this.BASE_TRAYS].sort(() => Math.random() - 0.5);
        
        // Renderizar cada bandeja
        shuffledTrays.forEach((trayData, index) => {
            const trayElement = this.createTrayElement(trayData, index);
            this.container.appendChild(trayElement);
        });
        
        console.log('✅ 8 bolsas renderizadas correctamente');
    }
    
    // Crear elemento de bolsa
    createTrayElement(data, index) {
        const tray = document.createElement('div');
        tray.className = 'tray-card';
        tray.id = data.id;
        tray.setAttribute('draggable', this.isTouchDevice ? 'false' : 'true');
        tray.dataset.total = data.total;

        const bagShape = document.createElement('div');
        bagShape.className = 'bag-shape';

        const bagTop = document.createElement('div');
        bagTop.className = 'bag-top';

        const bagWindow = document.createElement('div');
        bagWindow.className = 'bag-window';

        const bagItems = document.createElement('div');
        bagItems.className = 'bag-items';

        const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
        const emojiSize = data.total >= 24
            ? (isSmallScreen ? '0.62em' : '0.82em')
            : data.total >= 15
                ? (isSmallScreen ? '0.72em' : '0.95em')
                : (isSmallScreen ? '0.85em' : '1.05em');

        // Posicionar panes dentro de la bolsa con patrón natural (no matricial)
        for (let i = 0; i < data.total; i++) {
            const angle = i * 2.399963229728653; // ángulo áureo
            const radius = Math.sqrt((i + 0.6) / data.total) * 42;
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;

            const driftX = ((i % 4) - 1.5) * 1.1;
            const driftY = (((i + 2) % 5) - 2) * 0.9;

            const centerX = 50;
            const centerY = 55;

            const item = document.createElement('span');
            item.textContent = data.emoji;
            item.className = 'bag-item';
            item.style.fontSize = emojiSize;
            item.style.left = `${Math.min(92, Math.max(8, centerX + offsetX + driftX))}%`;
            item.style.top = `${Math.min(91, Math.max(14, centerY + offsetY + driftY))}%`;

            bagItems.appendChild(item);
        }

        bagWindow.appendChild(bagItems);
        bagShape.appendChild(bagTop);
        bagShape.appendChild(bagWindow);
        tray.appendChild(bagShape);
        return tray;
    }
    
    // Configurar event listeners
    setupEventListeners() {
        if (!this.isTouchDevice) {
            // Drag & Drop solo en escritorio (más estable)
            this.container.addEventListener('dragstart', (e) => this.handleDragStart(e));
            this.container.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.container.addEventListener('drop', (e) => this.handleDrop(e));
            this.container.addEventListener('dragend', (e) => this.handleDragEnd(e));
        }
        
        // Click para selección manual (alternativa al drag)
        this.container.addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleDragStart(e) {
        const tray = e.target.closest('.tray-card');
        if (!tray) return;
        
        this.draggedTray = tray;
        tray.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', tray.id);
    }
    
    handleDragOver(e) {
        e.preventDefault(); // Permitir drop
        e.dataTransfer.dropEffect = 'move';
        
        const targetTray = e.target.closest('.tray-card');
        if (targetTray && targetTray !== this.draggedTray) {
            targetTray.classList.add('drag-over');
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetTray = e.target.closest('.tray-card');
        if (!targetTray || targetTray === this.draggedTray) return;
        
        targetTray.classList.remove('drag-over');
        
        // Emparejar o desemparejar
        this.togglePairing(this.draggedTray.id, targetTray.id);
    }
    
    handleDragEnd(e) {
        const tray = e.target.closest('.tray-card');
        if (tray) {
            tray.classList.remove('dragging');
        }
        
        // Limpiar cualquier clase drag-over residual
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        this.draggedTray = null;
    }
    
    // Método alternativo: click para seleccionar y emparejar
    handleClick(e) {
        const tray = e.target.closest('.tray-card');
        if (!tray) return;
        
        if (!this.selectedTray) {
            // Primera selección
            this.selectedTray = tray;
            tray.classList.add('selected');
            console.log('📍 Seleccionada:', tray.id);
        } else {
            // Segunda selección - intentar emparejar
            if (this.selectedTray === tray) {
                // Click en la misma - deseleccionar
                this.selectedTray.classList.remove('selected');
                this.selectedTray = null;
                console.log('❌ Deseleccionada');
            } else {
                // Emparejar o desemparejar
                this.togglePairing(this.selectedTray.id, tray.id);
                this.selectedTray.classList.remove('selected');
                this.selectedTray = null;
            }
        }
    }
    
    // Emparejar o desemparejar (toggle)
    togglePairing(id1, id2) {
        if (id1 === id2) return;
        
        const tray1 = document.getElementById(id1);
        const tray2 = document.getElementById(id2);
        
        // Verificar si ya están emparejadas entre sí
        if (this.pairings.get(id1) === id2) {
            // Desemparejar
            this.unpair(id1, id2);
            console.log('🔓 Desemparejadas:', id1, id2);
        } else {
            // Si alguna ya tiene pareja, desemparejar primero
            if (this.pairings.has(id1)) {
                this.unpair(id1, this.pairings.get(id1));
            }
            if (this.pairings.has(id2)) {
                this.unpair(id2, this.pairings.get(id2));
            }
            
            // Emparejar (bidireccional)
            this.pair(id1, id2);
            console.log('🔗 Emparejadas:', id1, id2);
        }
    }
    
    // Emparejar dos bandejas
    pair(id1, id2) {
        this.pairings.set(id1, id2);
        this.pairings.set(id2, id1); // Bidireccional
        
        const tray1 = document.getElementById(id1);
        const tray2 = document.getElementById(id2);
        
        if (!tray1 || !tray2) return;
        
        // Generar color único para este par
        const pairKey = [id1, id2].sort().join('-');
        const color = this.getUniqueColorForPair(pairKey);
        
        // Crear wrapper para el par
        const wrapper = document.createElement('div');
        wrapper.className = 'tray-pair-wrapper';
        wrapper.dataset.pair = pairKey;
        wrapper.style.display = 'flex';
        wrapper.style.gap = '10px';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.gridColumn = 'span 2'; // Ocupa 2 columnas
        
        // Marcar bandejas como emparejadas
        tray1.classList.add('paired');
        tray2.classList.add('paired');
        tray1.style.borderColor = color;
        tray2.style.borderColor = color;
        
        // Mover bandejas al wrapper
        const parent = tray1.parentElement;
        wrapper.appendChild(tray1);
        wrapper.appendChild(tray2);
        
        // Insertar wrapper en el contenedor
        parent.appendChild(wrapper);
        
        // Reorganizar layout
        this.reorganizeLayout();
    }
    
    // Desemparejar dos bandejas
    unpair(id1, id2) {
        this.pairings.delete(id1);
        this.pairings.delete(id2);
        
        const tray1 = document.getElementById(id1);
        const tray2 = document.getElementById(id2);
        
        if (!tray1 || !tray2) return;
        
        // Remover del wrapper si existe
        const wrapper = tray1.closest('.tray-pair-wrapper') || tray2.closest('.tray-pair-wrapper');
        
        if (wrapper) {
            const parent = wrapper.parentElement;
            
            // Devolver bandejas al contenedor principal
            parent.appendChild(tray1);
            parent.appendChild(tray2);
            
            // Eliminar wrapper
            wrapper.remove();
        }
        
        // Limpiar estilos
        tray1.classList.remove('paired');
        tray1.style.borderColor = '';
        tray2.classList.remove('paired');
        tray2.style.borderColor = '';
        
        // Reorganizar layout
        this.reorganizeLayout();
    }
    
    // Generar color único para cada par (sin repeticiones)
    getUniqueColorForPair(pairKey) {
        // Si ya tiene color asignado, retornarlo
        if (this.pairColors.has(pairKey)) {
            return this.pairColors.get(pairKey);
        }
        
        // Colores distintivos y contrastantes
        const availableColors = [
            '#ef4444', // Rojo brillante
            '#3b82f6', // Azul
            '#10b981', // Verde esmeralda
            '#f59e0b', // Ámbar/Naranja
            '#8b5cf6', // Púrpura
            '#ec4899', // Rosa fucsia
            '#14b8a6', // Turquesa
            '#f97316'  // Naranja oscuro
        ];
        
        // Obtener el siguiente color disponible
        const color = availableColors[this.pairCounter % availableColors.length];
        this.pairCounter++;
        
        // Guardar color para este par
        this.pairColors.set(pairKey, color);
        
        console.log(`🎨 Asignado color ${color} al par ${pairKey}`);
        return color;
    }
    
    // Reorganizar layout después de emparejar/desemparejar
    reorganizeLayout() {
        // Los wrappers ocupan 2 columnas (span 2)
        // Las bandejas solas ocupan 1 columna
        // El CSS grid se encarga automáticamente del flujo
        console.log('📐 Layout reorganizado automáticamente por CSS Grid');
    }
    
    // Obtener todos los emparejamientos actuales
    getPairings() {
        const pairs = [];
        const processed = new Set();
        
        for (const [id1, id2] of this.pairings) {
            const pairKey = [id1, id2].sort().join('-');
            if (!processed.has(pairKey)) {
                pairs.push([id1, id2]);
                processed.add(pairKey);
            }
        }
        
        return pairs;
    }
    
    // Validar si los emparejamientos son correctos (mismo total)
    validatePairings() {
        const pairs = this.getPairings();
        const results = [];
        
        for (const [id1, id2] of pairs) {
            const tray1Data = this.BASE_TRAYS.find(t => t.id === id1);
            const tray2Data = this.BASE_TRAYS.find(t => t.id === id2);
            
            const isCorrect = tray1Data.total === tray2Data.total;
            results.push({
                pair: [id1, id2],
                total1: tray1Data.total,
                total2: tray2Data.total,
                isCorrect
            });
        }
        
        return results;
    }
    
    // Reiniciar el sistema
    reset() {
        this.pairings.clear();
        this.pairColors.clear();
        this.pairCounter = 0;
        this.selectedTray = null;
        this.draggedTray = null;
        this.render();
    }

    // Corregir glitch visual en iPhone sin perder el armado actual
    stabilizeTouchLayout() {
        if (!this.isTouchDevice) return;

        const wrappers = this.container.querySelectorAll('.tray-pair-wrapper');
        const cards = this.container.querySelectorAll('.tray-card');

        wrappers.forEach(wrapper => {
            wrapper.style.display = 'flex';
            wrapper.style.visibility = 'visible';
            wrapper.style.opacity = '1';
        });

        cards.forEach(card => {
            card.style.display = 'flex';
            card.style.visibility = 'visible';
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        });

        // Forzar repaint en Safari/iOS
        this.container.style.transform = 'translateZ(0)';
        this.container.offsetHeight;
        requestAnimationFrame(() => {
            this.container.style.transform = '';
        });
    }
    
    // Destruir y limpiar
    destroy() {
        this.container.innerHTML = '';
        this.pairings.clear();
        this.pairColors.clear();
        this.pairCounter = 0;
        console.log('🗑️ Sistema de bandejas destruido');
    }
}

// Exportar para uso global
window.TraysSystem = TraysSystem;
