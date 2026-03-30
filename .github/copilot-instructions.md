# 🤖 Copilot Workspace Instructions

## Propósito
Estas instrucciones guían a GitHub Copilot y agentes de IA para contribuir de manera efectiva en este proyecto educativo sobre la propiedad conmutativa de la multiplicación.

## Principios clave
- **Simplicidad y claridad**: Prefiere soluciones simples y código legible para niñas de primaria y docentes.
- **Seguridad**: No exponer credenciales ni dejar reglas abiertas de Firebase en producción.
- **Accesibilidad**: Mantener compatibilidad con PC y tablets, y navegación amigable.
- **Persistencia de evidencias**: Toda evidencia (audio, imagen, respuestas) debe guardarse en Firestore/Storage.
- **No duplicar lógica**: Centraliza la lógica de interacción en `main.js` y la configuración de Firebase en `firebase.js`.
- **Link, don’t embed**: Si existe documentación relevante en README.md u otros archivos, enlaza en vez de duplicar.

## Comandos y flujo de trabajo
- Para desarrollo local: `npx serve .` o `npm run dev`
- Para despliegue: GitHub Pages (ver README)
- Configuración de Firebase: editar solo `firebase.js` y seguir instrucciones del README
- Personalización visual: modificar `styles.css` y fuentes en la carpeta `assets/Font/`

## Convenciones
- Usa rutas relativas para recursos (`./assets/...`)
- Mantén los nombres de archivos y carpetas como en el README
- Los datos de Firestore deben seguir la estructura documentada en README
- No agregar dependencias innecesarias

## Antipatrones
- No dejar reglas de Firebase abiertas tras el piloto
- No usar frameworks pesados (React, Angular, etc.)
- No mezclar lógica de UI y persistencia en un solo archivo
- No modificar archivos fuera de la estructura documentada

## Ejemplos de prompts
- "Agrega un nuevo momento de actividad con guardado en Firestore."
- "Mejora la accesibilidad del tablero para tablets."
- "Corrige el flujo de navegación entre momentos."
- "Agrega validación visual para la subida de audio."

## Siguientes pasos sugeridos
- Crear instrucciones específicas para agentes de testeo automatizado.
- Documentar ejemplos de integración con otros sistemas educativos.

> Para detalles completos, consulta siempre el README.md.
