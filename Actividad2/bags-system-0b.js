// ========================================
// SISTEMA DE BOLSAS - DRAG & DROP
// ========================================

class TraysSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} no encontrado`);
        }
        
        // Datos base de los 8 pedidos (Actividad 0B)
        this.BASE_TRAYS = [
            { id: 'tray-1', pedido: 1, bags: 5, itemsPerBag: 4, total: 20 },
            { id: 'tray-2', pedido: 2, bags: 3, itemsPerBag: 5, total: 15 },
            { id: 'tray-3', pedido: 3, bags: 4, itemsPerBag: 2, total: 8 },
            { id: 'tray-4', pedido: 4, bags: 5, itemsPerBag: 6, total: 30 },
            { id: 'tray-5', pedido: 5, bags: 6, itemsPerBag: 4, total: 24 },
            { id: 'tray-6', pedido: 6, bags: 5, itemsPerBag: 3, total: 15 },
            { id: 'tray-7', pedido: 7, bags: 2, itemsPerBag: 4, total: 8 },
            { id: 'tray-8', pedido: 8, bags: 6, itemsPerBag: 5, total: 30 }
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
        console.log('Inicializando sistema de bolsas...');
        this.render();
        this.setupEventListeners();
    }
    
    // Limpiar y renderizar los 8 pedidos
    render() {
        // CRÍTICO: Limpiar contenedor primero
        this.container.innerHTML = '';
        // El CSS ya define el grid, no sobrescribir aquí
        
        // Crear copia para barajar (no mutar el original)
        const shuffledTrays = [...this.BASE_TRAYS].sort(() => Math.random() - 0.5);
        
        // Renderizar cada pedido
        shuffledTrays.forEach((trayData, index) => {
            const trayElement = this.createTrayElement(trayData, index);
            this.container.appendChild(trayElement);
        });
        
        console.log('8 pedidos renderizados correctamente');
    }
    
    // Crear tarjeta visual de pedido
    createTrayElement(data, index) {
        const tray = document.createElement('div');
        tray.className = 'tray-card';
        tray.id = data.id;
        tray.setAttribute('draggable', this.isTouchDevice ? 'false' : 'true');
        tray.dataset.total = data.total;

        const pedidoTitle = document.createElement('div');
        pedidoTitle.className = 'pedido-title';
        pedidoTitle.textContent = `Pedido ${data.pedido}`;

        const bagsGrid = document.createElement('div');
        bagsGrid.className = 'pedido-bags-grid';

        for (let bagIndex = 0; bagIndex < data.bags; bagIndex++) {
            const miniBag = document.createElement('div');
            miniBag.className = 'mini-bag';

            const miniHandleLeft = document.createElement('span');
            miniHandleLeft.className = 'mini-handle mini-handle-left';

            const miniHandleRight = document.createElement('span');
            miniHandleRight.className = 'mini-handle mini-handle-right';

            const miniWindow = document.createElement('div');
            miniWindow.className = 'mini-bag-window';

            const layout = this.getBagLayout(data.itemsPerBag);

            layout.forEach((position) => {
                const pane = document.createElement('span');
                pane.className = 'mini-pane';
                const paneImage = document.createElement('img');
                paneImage.src = 'assets/images/pandebono.png';
                paneImage.alt = 'Pan de bono';
                paneImage.className = 'mini-pane-image';
                pane.appendChild(paneImage);
                pane.style.left = `${position.left}%`;
                pane.style.top = `${position.top}%`;
                miniWindow.appendChild(pane);
            });

            miniBag.appendChild(miniHandleLeft);
            miniBag.appendChild(miniHandleRight);
            miniBag.appendChild(miniWindow);
            bagsGrid.appendChild(miniBag);
        }

        tray.appendChild(pedidoTitle);
        tray.appendChild(bagsGrid);
        return tray;
    }

    getBagLayout(itemsPerBag) {
        const layouts = {
            2: [
                { left: 35, top: 42 },
                { left: 65, top: 42 }
            ],
            3: [
                { left: 35, top: 36 },
                { left: 65, top: 36 },
                { left: 50, top: 68 }
            ],
            4: [
                { left: 34, top: 34 },
                { left: 66, top: 34 },
                { left: 34, top: 66 },
                { left: 66, top: 66 }
            ],
            5: [
                { left: 34, top: 34 },
                { left: 66, top: 34 },
                { left: 50, top: 50 },
                { left: 34, top: 66 },
                { left: 66, top: 66 }
            ],
            6: [
                { left: 34, top: 30 },
                { left: 66, top: 30 },
                { left: 34, top: 50 },
                { left: 66, top: 50 },
                { left: 34, top: 70 },
                { left: 66, top: 70 }
            ],
            7: [
                { left: 28, top: 28 },
                { left: 50, top: 28 },
                { left: 72, top: 28 },
                { left: 34, top: 50 },
                { left: 66, top: 50 },
                { left: 50, top: 64 },
                { left: 50, top: 78 }
            ]
        };

        return layouts[itemsPerBag] || layouts[6];
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
            console.log('Seleccionada:', tray.id);
        } else {
            // Segunda selección - intentar emparejar
            if (this.selectedTray === tray) {
                // Click en la misma - deseleccionar
                this.selectedTray.classList.remove('selected');
                this.selectedTray = null;
                console.log('Deseleccionada');
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
            console.log('Desemparejadas:', id1, id2);
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
            console.log('Emparejadas:', id1, id2);
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
        wrapper.style.border = `4px solid ${color}`;
        
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
        
        console.log(`Asignado color ${color} al par ${pairKey}`);
        return color;
    }
    
    // Reorganizar layout después de emparejar/desemparejar
    reorganizeLayout() {
        // Los wrappers ocupan 2 columnas (span 2)
        // Las bandejas solas ocupan 1 columna
        // El CSS grid se encarga automáticamente del flujo
        console.log('Layout reorganizado automáticamente por CSS Grid');
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
        console.log('??? Sistema de bandejas destruido');
    }
}

// Exportar para uso global
window.TraysSystem = TraysSystem;
