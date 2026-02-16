# 🫓 Sistema de Bandejas - Documentación Completa

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Archivos Creados](#archivos-creados)
3. [Características](#características)
4. [Integración en tu Proyecto](#integración-en-tu-proyecto)
5. [API y Métodos](#api-y-métodos)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Descripción General

Sistema completo de drag & drop para organizar y emparejar bandejas de pandebonos. Diseñado específicamente para resolver el problema de duplicación de bandejas y proporcionar una experiencia interactiva limpia.

### ✅ Problemas Resueltos

1. **Duplicación de bandejas** - El contenedor se limpia antes de cada render
2. **Estado inconsistente** - Usa una estructura `Map` para emparejamientos bidireccionales
3. **Referencias incorrectas** - IDs consistentes y validados
4. **Drag & drop no funcional** - Sistema completo con eventos nativos HTML5

---

## 📁 Archivos Creados

### 1. `trays-system.js` (Lógica principal)
- Clase `TraysSystem` con toda la funcionalidad
- Gestión de estado limpia y declarativa
- Sistema de emparejamientos bidireccional

### 2. `trays-styles.css` (Estilos)
- Estilos responsive para las bandejas
- Animaciones de interacción
- Estados visuales (dragging, paired, selected, etc.)

### 3. `trays-demo.html` (Demo independiente)
- Demostración completa del sistema
- Validación de emparejamientos
- Estadísticas en tiempo real

### 4. `TRAYS_README.md` (Este archivo)
- Documentación completa del sistema

---

## ⚡ Características

### ✨ Funcionalidades Principales

1. **Exactamente 8 bandejas** - No más, no menos
2. **IDs únicos** - `tray-1` hasta `tray-8`
3. **Drag & drop nativo HTML5** - Funciona en todos los navegadores modernos
4. **Click para emparejar** - Alternativa al drag & drop (mejor para móviles)
5. **Emparejamiento visual** - Bordes de colores únicos para cada par
6. **Desemparejamiento** - Volver a arrastrar/click para separar
7. **Re-emparejamiento automático** - Si una bandeja ya tiene pareja, se rompe automáticamente
8. **No duplicados** - Limpieza completa antes de cada render
9. **Estado persistente** - Los emparejamientos se mantienen hasta que se desemparejen
10. **Validación** - Método para verificar si los emparejamientos son correctos

---

## 🔧 Integración en tu Proyecto

### Opción 1: Prueba la Demo Primero

```bash
# Abre el archivo en tu navegador
trays-demo.html
```

### Opción 2: Integrar en `actividad0.html`

#### Paso 1: Agregar los archivos CSS y JS

En `actividad0.html`, dentro del `<head>`:

```html
<!-- Estilos de bandejas -->
<link rel="stylesheet" href="trays-styles.css">
```

Antes del cierre del `</body>`:

```html
<!-- Sistema de bandejas -->
<script src="trays-system.js"></script>
```

#### Paso 2: Modificar el HTML del Momento 2

Reemplazar el contenedor de bandejas por:

```html
<!-- ÁREA DE BANDEJAS -->
<div id="traysGameSection">
    <div id="traysArea" class="trays-container">
        <!-- Las 8 bandejas se generarán automáticamente -->
    </div>
    
    <div class="game-controls">
        <button id="verifyTraysBtn" class="btn btn-primary">✅ Verificar emparejamientos</button>
        <p id="traysFeedback" class="feedback-text"></p>
    </div>
</div>
```

#### Paso 3: Modificar `main.js`

Reemplazar la función `initMoment2()` y `createTraysGame()` por:

```javascript
// Variable global para el sistema de bandejas
let traysSystem = null;

function initMoment2() {
    console.log('🎯 Inicializando Momento 2...');
    
    document.getElementById('studentCodeM2').textContent = studentCode;
    
    // Destruir instancia previa si existe (evitar duplicados)
    if (traysSystem) {
        traysSystem.destroy();
    }
    
    // Crear nueva instancia del sistema de bandejas
    traysSystem = new TraysSystem('traysArea');
    
    // Configurar botón de verificación
    document.getElementById('verifyTraysBtn').addEventListener('click', verifyTraysPairings);
    
    // Botón continuar a M3 (cuando esté listo)
    const continueBtn = document.getElementById('continueToM3Btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            showScreen('moment3Screen');
            initMoment3();
        });
    }
}

function verifyTraysPairings() {
    const results = traysSystem.validatePairings();
    const feedback = document.getElementById('traysFeedback');
    
    if (results.length === 0) {
        feedback.textContent = '⚠️ No hay emparejamientos. Arrastra las bandejas para unirlas.';
        feedback.className = 'feedback-text info';
        return;
    }
    
    // Contar emparejamientos correctos
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalPairs = results.length;
    
    if (correctCount === totalPairs) {
        feedback.textContent = `🎉 ¡Perfecto! Todos los ${totalPairs} emparejamientos son correctos.`;
        feedback.className = 'feedback-text success';
        
        // Mostrar siguiente sección si existe
        const nextSection = document.getElementById('finalQuestionSection');
        if (nextSection) {
            nextSection.classList.remove('hidden');
        }
    } else {
        feedback.textContent = `✨ ${correctCount} de ${totalPairs} correctos. ¡Sigue intentando!`;
        feedback.className = 'feedback-text error';
    }
    
    console.log('📊 Resultados:', results);
}
```

#### Paso 4: Eliminar código antiguo

En `main.js`, **ELIMINAR** o **comentar**:
- La función `createTraysGame()` antigua (líneas ~496-597)
- Todas las funciones de drag & drop antiguas:
  - `setupDragging()`
  - `checkForPairingMouse()`
  - `tryPairing()`
  - `addPairing()`
  - `setupWrapperDragging()`
  - Event listeners globales de `mousemove` y `mouseup` para bandejas

---

## 📚 API y Métodos

### Constructor

```javascript
const traysSystem = new TraysSystem('containerId');
```

**Parámetros:**
- `containerId` (string): ID del contenedor donde se renderizarán las bandejas

### Métodos Públicos

#### `render()`
Renderiza las 8 bandejas. Limpia el contenedor primero.

```javascript
traysSystem.render();
```

#### `getPairings()`
Obtiene todos los emparejamientos actuales.

```javascript
const pairs = traysSystem.getPairings();
// Retorna: [['tray-1', 'tray-2'], ['tray-3', 'tray-4']]
```

#### `validatePairings()`
Valida si los emparejamientos son correctos (mismo total de items).

```javascript
const results = traysSystem.validatePairings();
// Retorna: [
//   { pair: ['tray-1', 'tray-2'], total1: 12, total2: 12, isCorrect: true },
//   { pair: ['tray-3', 'tray-4'], total1: 12, total2: 15, isCorrect: false }
// ]
```

#### `reset()`
Reinicia el sistema (limpia emparejamientos y re-renderiza).

```javascript
traysSystem.reset();
```

#### `destroy()`
Destruye la instancia y limpia todo.

```javascript
traysSystem.destroy();
```

### Propiedades Públicas

- `BASE_TRAYS` - Array con los datos de las 8 bandejas (inmutable)
- `pairings` - Map con los emparejamientos actuales (bidireccional)

---

## 🐛 Solución de Problemas

### Problema: Las bandejas no se arrastran

**Solución:**
- Verifica que el CSS esté cargado correctamente
- Asegúrate de que el atributo `draggable="true"` esté presente
- Revisa la consola del navegador para ver errores

### Problema: Aparecen más de 8 bandejas

**Causa:** El contenedor no se limpia antes de renderizar

**Solución:**
```javascript
// El sistema ya hace esto automáticamente
// Pero si llamas render() manualmente, asegúrate de que
// el contenedor exista y no esté duplicado
```

### Problema: Los emparejamientos no se guardan

**Causa:** El Map de pairings no se actualiza correctamente

**Solución:**
```javascript
// Usa los métodos públicos:
const pairs = traysSystem.getPairings();
console.log('Emparejamientos actuales:', pairs);
```

### Problema: Las bandejas se superponen

**Causa:** CSS no cargado o grid mal configurado

**Solución:**
- Asegúrate de que `trays-styles.css` esté cargado
- Verifica que el contenedor tenga la clase `trays-container`

### Problema: Los bordes de colores no aparecen

**Causa:** La clase `.paired` no se aplica correctamente

**Solución:**
```javascript
// Verifica en la consola:
console.log(traysSystem.pairings);

// Si el Map está vacío, el emparejamiento no se realizó
```

---

## 🎨 Personalización

### Cambiar los emojis

En `trays-system.js`, modifica la propiedad `emoji`:

```javascript
this.BASE_TRAYS = [
    { id: 'tray-1', rows: 3, cols: 4, total: 12, emoji: '🍞' }, // Pan
    { id: 'tray-2', rows: 4, cols: 3, total: 12, emoji: '🥐' }, // Croissant
    // ...
];
```

### Cambiar colores de emparejamiento

En `trays-system.js`, método `getUniqueColor()`:

```javascript
const colors = [
    '#ff6b6b', // Rojo personalizado
    '#4ecdc4', // Turquesa
    '#ffe66d', // Amarillo
    // ... más colores
];
```

### Ajustar el tamaño de las bandejas

En `trays-styles.css`:

```css
.tray-card {
    min-height: 220px; /* Cambiar a tu tamaño preferido */
}

.tray-grid {
    max-width: 180px; /* Ajustar ancho del grid */
    max-height: 180px; /* Ajustar alto del grid */
}
```

---

## 📊 Flujo de Datos

```
Usuario arrastra Bandeja A sobre Bandeja B
    ↓
handleDragStart() - Guarda referencia de A
    ↓
handleDragOver() - Muestra indicador visual
    ↓
handleDrop() - Detecta B como objetivo
    ↓
togglePairing(A, B) - Verificar si ya están emparejadas
    ↓
    ├─ SI → unpair(A, B) - Desemparejar
    └─ NO → pair(A, B) - Emparejar
        ↓
        pairings.set(A, B) + pairings.set(B, A) [bidireccional]
        ↓
        Aplicar clases CSS y colores
        ↓
        Estado actualizado ✅
```

---

## 🚀 Mejoras Futuras (Opcional)

1. **Persistencia en Firebase** - Guardar emparejamientos en la base de datos
2. **Animación de validación** - Efecto cuando se valida correctamente
3. **Sonidos** - Feedback auditivo al emparejar/desemparejar
4. **Tutorial interactivo** - Guía paso a paso la primera vez
5. **Modo difícil** - Más bandejas o restricciones adicionales
6. **Gamificación** - Puntos, tiempo límite, niveles

---

## 📝 Notas Importantes

1. ⚠️ **Limpieza obligatoria**: El sistema llama `container.innerHTML = ''` antes de cada render para evitar duplicados
2. ⚠️ **Map bidireccional**: Los emparejamientos se guardan en ambas direcciones (A→B y B→A)
3. ⚠️ **Una pareja a la vez**: Una bandeja solo puede estar emparejada con otra bandeja
4. ⚠️ **Destruir al salir**: Llama `traysSystem.destroy()` al cambiar de pantalla para liberar memoria

---

## 🤝 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (`F12`)
2. Verifica que todos los archivos estén cargados
3. Comprueba que los IDs de los elementos coincidan
4. Consulta esta documentación para verificar el uso correcto de la API

---

## 📄 Licencia

Este código es parte de tu proyecto de tesis y es de uso libre dentro del mismo.

---

**Última actualización:** Febrero 2026
**Versión:** 1.0.0
**Autor:** Sistema personalizado para proyecto "Thinking Mathematically"
