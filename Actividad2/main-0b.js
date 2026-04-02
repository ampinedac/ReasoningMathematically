// main-0b.js – Actividad2 · Lógica principal
// Arquitectura basada en Actividad1, adaptada para Actividad2
import './assets/estudiantes-data.js';

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE (importación dinámica con fallback gracioso)
// ─────────────────────────────────────────────────────────────────────────────
let db=null,storage=null,collection=null,addDoc=null,serverTimestamp=null,
    ref=null,uploadBytes=null,getDownloadURL=null;

async function initFirebaseServices() {
    try {
        const m = await import('./firebase2.js');
        db=m.db; storage=m.storage; collection=m.collection; addDoc=m.addDoc;
        serverTimestamp=m.serverTimestamp; ref=m.ref;
        uploadBytes=m.uploadBytes; getDownloadURL=m.getDownloadURL;
        console.log('✅ Firebase listo');
    } catch (e) {
        console.warn('⚠️ Firebase no disponible, la actividad continúa sin guardado:', e);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────────
let studentCode  = null;
let studentInfo  = null;

// Flipbook (Momento 1)
let currentFlipbookPage = 0;
let isFlipping          = false;

// Submit flags
let m1q1Submitted         = false;
let m2OrderCompleted      = false;
let m2ExplanationSubmitted= false;
let m3q1Submitted         = false;
let m3q2Submitted         = false;

// Momento 2
let m2CurrentSpread          = 0;
let traysSystem              = null;
let m2Q1AssociatedSubmitted  = false;
let m2Q1AudioCheckInterval   = null;

// Momento 3
let m3Choice = null;

// Momento 4
let m4Lives             = 3;
let m4Finalized         = false;
let m4CurrentItem       = 1;
let m4Responses         = [];
let m4ErrorsTotal       = 0;
let m4ReflectionSelected= false;
let m4ReflectionSaved   = false;
let m4ReflectionSaving  = false;
let m4ReturnHomeTimeout = null;

const FINAL_SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeNKfEc_IzO3Vn4fWwlrTKcCuhW6lCXMRe6TTAmnpwnZdya_A/viewform?usp=header';

// ─────────────────────────────────────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Actividad2 iniciada');
    initFirebaseServices();
    initVisibility();
    initWelcome();
    initConfirmation();
    initPortada();
});

window.addEventListener('error',            e => console.error('❌ Error global:',         e.error));
window.addEventListener('unhandledrejection',e => console.error('❌ Promesa rechazada:',    e.reason));

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILIDAD INICIAL
// ─────────────────────────────────────────────────────────────────────────────
function initVisibility() {
    show('ContenedorBienvenida');
    hide('ContenedorConfirmacion');
    hide('ContenedorPortada');
    hide('ContenedorLibro');
    // Momentos dentro del libro: todos ocultos hasta que JS los active
    ['moment1Screen','moment2Screen','moment3Screen','moment4Screen'].forEach(hide);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES show / hide
// ─────────────────────────────────────────────────────────────────────────────
function show(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const map = {
        ContenedorBienvenida: 'flex',
        ContenedorConfirmacion:'flex',
        ContenedorPortada:     'flex',
        ContenedorLibro:       'flex',
        moment1Screen:         'flex',
        moment2Screen:         'flex',
        moment3Screen:         'flex',
        moment4Screen:         'flex',
    };
    el.style.display = map[id] || 'block';
}
function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// Cambia el contenedor raíz visible
function toggleContainers(target) {
    ['ContenedorBienvenida','ContenedorConfirmacion','ContenedorPortada','ContenedorLibro'].forEach(hide);
    const map = {
        bienvenida:   'ContenedorBienvenida',
        confirmacion: 'ContenedorConfirmacion',
        portada:      'ContenedorPortada',
        libro:        'ContenedorLibro',
    };
    if (map[target]) show(map[target]);
}

// Muestra un momento y oculta los demás dentro del libro
function showMoment(momentId) {
    ['moment1Screen','moment2Screen','moment3Screen','moment4Screen'].forEach(hide);
    show(momentId);
    updateStudentCodeDisplays();
}

// ─────────────────────────────────────────────────────────────────────────────
// CÓDIGO DEL ESTUDIANTE (displays)
// ─────────────────────────────────────────────────────────────────────────────
function toTitle(str) {
    if (!str) return '';
    return str.toLocaleLowerCase('es-CO').split(/\s+/).filter(Boolean)
        .map(w => w.charAt(0).toLocaleUpperCase('es-CO') + w.slice(1)).join(' ');
}
function getStudentHeaderText() {
    if (!studentCode) return '';
    if (studentCode === '0000' && studentInfo?.nombre)
        return `${studentCode} · ${toTitle(studentInfo.nombre)}`;
    return studentCode;
}
function updateStudentCodeDisplays() {
    const text = getStudentHeaderText();
    document.querySelectorAll('.student-code-display span').forEach(el => { el.textContent = text; });
}

// ─────────────────────────────────────────────────────────────────────────────
// BIENVENIDA
// ─────────────────────────────────────────────────────────────────────────────
function initWelcome() {
    const input = document.getElementById('studentCodeInput');
    const btn   = document.getElementById('enterBtn');
    const err   = document.getElementById('welcomeError');
    if (!input || !btn) return;

    // Solo dígitos
    input.addEventListener('keydown', e => {
        const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
        if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    });
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); });
    input.addEventListener('keypress', e => { if (e.key === 'Enter') btn.click(); });

    btn.addEventListener('click', () => {
        const code = input.value.trim();
        if (!code)              { showErr(err, 'Por favor escribe tu código.'); return; }
        if (!/^\d+$/.test(code)){ showErr(err, 'Solo se permiten números.');    return; }

        if (code === '0000') {
            const name = (window.prompt('Escribe tu nombre para ingresar como invitado') || '').trim();
            if (!name) { showErr(err, 'Para ingresar con 0000 debes escribir tu nombre.'); return; }
            studentCode = code;
            studentInfo = { nombre: name, apellidos: '', curso: 'INVITADO' };
            buildConfirmationQuestion();
            toggleContainers('confirmacion');
            return;
        }

        const est = (window.estudiantesData || {})[code];
        if (!est) { showErr(err, 'Código no encontrado. Verifica que esté bien escrito.'); return; }
        clearErr(err);
        studentCode = code;
        studentInfo = est;
        buildConfirmationQuestion();
        toggleContainers('confirmacion');
    });
}

function showErr(el, msg) { if (el) { el.textContent = msg; el.classList.remove('hidden'); } }
function clearErr(el)      { if (el) { el.textContent = '';  el.classList.add('hidden');    } }

function buildConfirmationQuestion() {
    const q = document.getElementById('confirmationQuestion');
    if (!q || !studentInfo) return;
    const nombre    = toTitle(studentInfo.nombre    || '');
    const apellidos = toTitle(studentInfo.apellidos || '');
    if (studentCode === '0000' || studentInfo.curso === 'INVITADO')
        q.textContent = `¡Hola, ${nombre}! ¿Deseas iniciar la actividad?`;
    else if (studentInfo.curso === 'DOCENTE')
        q.textContent = `¿Eres ${nombre} ${apellidos}?`;
    else
        q.textContent = `¿Eres ${nombre} ${apellidos} del curso ${studentInfo.curso}?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRMACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function initConfirmation() {
    document.getElementById('confirmYesBtn')?.addEventListener('click', () => {
        updateStudentCodeDisplays();
        toggleContainers('portada');
    });
    document.getElementById('confirmNoBtn')?.addEventListener('click', () => {
        studentCode = null;
        studentInfo = null;
        const input = document.getElementById('studentCodeInput');
        if (input) input.value = '';
        clearErr(document.getElementById('welcomeError'));
        updateStudentCodeDisplays();
        toggleContainers('bienvenida');
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTADA
// ─────────────────────────────────────────────────────────────────────────────
function initPortada() {
    document.getElementById('btnContinuarPortada')?.addEventListener('click', () => {
        toggleContainers('libro');
        showMoment('moment1Screen');
        initMoment1();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTO 1: FLIPBOOK + PROBLEMA Q1
// ─────────────────────────────────────────────────────────────────────────────
function initMoment1() {
    const codeEl = document.getElementById('studentCodeM1');
    if (codeEl) codeEl.textContent = getStudentHeaderText();

    const flipbook = document.getElementById('flipbook');
    if (!flipbook) return;

    const pages        = Array.from(flipbook.querySelectorAll('.page'));
    const q1PageIdx    = pages.findIndex(p => p.id === 'problemQ1Section');
    const bridgeIdx    = pages.findIndex(p => p.id === 'm1ToM2BridgePage');
    let prevBtn        = document.getElementById('prevBtn');
    let nextBtn        = document.getElementById('nextBtn');
    let m1Q1Done       = m1q1Submitted;

    // Reemplazar botones para limpiar listeners viejos
    if (prevBtn) { const c=prevBtn.cloneNode(true); prevBtn.parentNode.replaceChild(c,prevBtn); prevBtn=c; }
    if (nextBtn) { const c=nextBtn.cloneNode(true); nextBtn.parentNode.replaceChild(c,nextBtn); nextBtn=c; }

    function goToPage(index) {
        if (isFlipping || index<0 || index>=pages.length) return;
        isFlipping = true;

        const oldPage = pages[currentFlipbookPage];
        const dir = index > currentFlipbookPage ? 'forward' : 'backward';

        oldPage.classList.add(dir==='forward' ? 'turning-next' : 'turning-prev');

        setTimeout(() => {
            oldPage.classList.remove('turning-next','turning-prev','active');
            oldPage.classList.add('turned');
            currentFlipbookPage = index;

            const newPage = pages[index];
            newPage.classList.remove('turned');
            newPage.classList.add('active');
            updateFlipbookNav();
            isFlipping = false;

            // Puente → pasar al Momento 2
            if (index === bridgeIdx) {
                setTimeout(() => {
                    showMoment('moment2Screen');
                    initMoment2();
                }, 400);
                return;
            }

            // Página del Problema Q1
            if (index === q1PageIdx) {
                if (m1Q1Done) applyM1Q1Lock();
                else if (!flipbook.dataset.q1Init) {
                    flipbook.dataset.q1Init = '1';
                    initProblemQ1(onM1Q1Submitted);
                }
            }
        }, 350);
    }

    function onM1Q1Submitted() {
        m1Q1Done = true;
        m1q1Submitted = true;
        updateFlipbookNav();
    }

    function updateFlipbookNav() {
        const isQ1     = currentFlipbookPage === q1PageIdx;
        const isBridge = currentFlipbookPage === bridgeIdx;

        if (prevBtn) {
            prevBtn.disabled      = currentFlipbookPage <= 0 || isBridge;
            prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
        }
        if (nextBtn) {
            nextBtn.disabled      = isBridge || (isQ1 && !m1Q1Done);
            nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
            nextBtn.style.display = isBridge ? 'none' : 'flex';
        }
    }

    prevBtn?.addEventListener('click', () => { if (currentFlipbookPage > 0) goToPage(currentFlipbookPage-1); });
    nextBtn?.addEventListener('click', () => { const n=document.getElementById('nextBtn'); if(!n?.disabled) goToPage(currentFlipbookPage+1); });

    // Inicializar primera página
    pages.forEach((p,i) => {
        p.classList.remove('active','turned','turning-next','turning-prev');
        if (i===0) p.classList.add('active');
    });
    delete flipbook.dataset.q1Init;
    currentFlipbookPage = 0;
    updateFlipbookNav();
}

function applyM1Q1Lock() {
    ['submitM1Q1','recordBtnM1Q1'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled=true; el.style.opacity='0.5'; }
    });
    document.getElementById('stopBtnM1Q1')?.classList.add('hidden');
    const cv = document.getElementById('boardCanvasM1Q1');
    if (cv) cv.style.pointerEvents='none';
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMA Q1 (tablero + audio)
// ─────────────────────────────────────────────────────────────────────────────
function initProblemQ1(onSubmitCallback) {
    const boardState  = initBoard('boardCanvasM1Q1');
    const audioSt     = initAudio('recordBtnM1Q1','stopBtnM1Q1','audioStatusM1Q1');
    const submitBtn   = document.getElementById('submitM1Q1');
    const statusText  = document.getElementById('statusM1Q1');

    const iv = setInterval(() => { if (submitBtn) submitBtn.disabled = !audioSt.audioBlob; }, 500);

    submitBtn?.addEventListener('click', async () => {
        submitBtn.disabled = true; submitBtn.style.opacity='0.5';
        if (statusText) statusText.textContent = 'Subiendo evidencia...';
        clearInterval(iv);
        try {
            const boardBlob = boardState.hasDrawing ? await canvasToBlob('boardCanvasM1Q1') : null;
            await submitEvidence({ moment:'m1', tag:'q1', data:{ question:'Situación 1: ¿Vendieron más en la primera o la segunda venta?' }, boardBlob, audioBlob: audioSt.audioBlob });
            if (statusText) { statusText.textContent='Guardado ✅ Ya puedes pasar a la siguiente página.'; statusText.className='status-text success'; }
            applyM1Q1Lock();
            onSubmitCallback?.();
        } catch (e) {
            console.error('Error M1Q1:', e);
            if (statusText) { statusText.textContent='Error al guardar. Intenta de nuevo.'; statusText.className='status-text error'; }
            submitBtn.disabled=false; submitBtn.style.opacity='1';
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTO 2: ORGANIZANDO PEDIDOS
// ─────────────────────────────────────────────────────────────────────────────
function initMoment2() {
    const codeEl = document.getElementById('studentCodeM2');
    if (codeEl) codeEl.textContent = getStudentHeaderText();

    // Destruir instancia previa
    traysSystem?.destroy?.();
    traysSystem = null;
    try {
        traysSystem = new TraysSystem('traysArea');
    } catch (e) {
        console.error('Error al crear TraysSystem:', e);
    }

    m2CurrentSpread = 0;
    renderMoment2Snapshots();
    setupMoment2UI();
}

function renderMoment2Snapshot(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (!m2OrderCompleted) { el.innerHTML=''; return; }
    el.innerHTML='<p class="m2-photo-fixed-text">📸 Así quedaron tus parejas:</p>'
        +'<img src="assets/images/BolsasFoto.png" alt="Así quedaron tus parejas" class="m2-photo-fixed-image">';
}
function renderMoment2Snapshots() {
    renderMoment2Snapshot('m2PreviewPage18');
    renderMoment2Snapshot('m2PreviewPage19');
}

function setupMoment2UI() {
    const spreads = Array.from(document.querySelectorAll('#problemQ2Section .m2-spread'));

    const updateSpreadUI = () => {
        spreads.forEach((s,i) => { s.style.display = i===m2CurrentSpread ? 'flex':'none'; });
        const pq2 = document.getElementById('prevBtnQ2');
        const nq2 = document.getElementById('nextBtnQ2');
        if (pq2) pq2.disabled = false;
        if (nq2) {
            if (m2CurrentSpread===0 && !m2OrderCompleted) { nq2.disabled=true; nq2.style.opacity='0.5'; }
            else if (m2CurrentSpread===spreads.length-1 && !m2ExplanationSubmitted) { nq2.disabled=true; nq2.style.opacity='0.5'; }
            else { nq2.disabled=false; nq2.style.opacity='1'; }
        }
    };

    const prevQ2 = cloneReplace('prevBtnQ2');
    const nextQ2 = cloneReplace('nextBtnQ2');

    prevQ2?.addEventListener('click', () => {
        if (m2CurrentSpread>0) { m2CurrentSpread--; updateSpreadUI(); }
        else { showMoment('moment1Screen'); initMoment1(); }
    });
    nextQ2?.addEventListener('click', () => {
        if (m2CurrentSpread<spreads.length-1) { m2CurrentSpread++; updateSpreadUI(); }
        else { showMoment('moment3Screen'); initMoment3(); }
    });

    // Botón cocina
    const gotoBtn = cloneReplace('goToCocinaBtn');
    if (gotoBtn) {
        if (m2OrderCompleted) {
            gotoBtn.disabled=true; gotoBtn.textContent='✅ Organización completada';
        } else {
            gotoBtn.textContent='👩‍🍳 Ir a la cocina a organizar';
            gotoBtn.addEventListener('click', () => {
                if (!traysSystem) {
                    try { traysSystem = new TraysSystem('traysArea'); } catch(e){ return; }
                }
                openCocinaScreen();
            });
        }
    }

    // Botón verificar
    const verifyBtn = cloneReplace('verifyTraysBtn');
    if (verifyBtn) {
        verifyBtn.disabled = m2OrderCompleted;
        verifyBtn.addEventListener('click', verifyTraysPairings);
    }

    // Estado de la UI según m2OrderCompleted
    document.getElementById('m2PendingCard')?.classList.toggle('hidden', m2OrderCompleted);
    document.getElementById('m2PreviewPage18')?.closest('.m2-preview-card')?.classList.toggle('hidden',!m2OrderCompleted);
    document.getElementById('m2PreviewPage19')?.closest('.m2-preview-card')?.classList.toggle('hidden',!m2OrderCompleted);
    document.getElementById('finalQuestionSectionM2')?.classList.toggle('hidden',!m2OrderCompleted);

    if (m2OrderCompleted) initMoment2Audio();

    setupM2RadioButtons();
    updateSpreadUI();
    hideCocinaScreen();
}

function openCocinaScreen() {
    const cs = document.getElementById('cocinaScreen');
    if (cs) { cs.classList.remove('hidden'); cs.setAttribute('aria-hidden','false'); }
    document.body.style.overflow='hidden';
}
function hideCocinaScreen() {
    const cs = document.getElementById('cocinaScreen');
    if (cs) { cs.classList.add('hidden'); cs.setAttribute('aria-hidden','true'); }
    document.body.style.overflow='';
}

function verifyTraysPairings() {
    if (!traysSystem) return;
    const results  = traysSystem.validatePairings();
    const feedback = document.getElementById('traysFeedback');
    if (!feedback) return;

    if (results.length===0) {
        feedback.textContent='⚠️ No hay emparejamientos. Haz clic en las bolsas para unirlas.';
        feedback.className='feedback-text info'; return;
    }

    const correctCount   = results.filter(r=>r.isCorrect).length;
    const expectedPairs  = 3;

    if (correctCount===results.length && results.length===expectedPairs) {
        feedback.textContent=`🎉 ¡Perfecto! Todos los ${results.length} emparejamientos son correctos.`;
        feedback.className='feedback-text success';
        m2OrderCompleted=true;
        renderMoment2Snapshots();
        document.getElementById('m2PendingCard')?.classList.add('hidden');
        document.getElementById('m2PreviewPage18')?.closest('.m2-preview-card')?.classList.remove('hidden');
        document.getElementById('m2PreviewPage19')?.closest('.m2-preview-card')?.classList.remove('hidden');
        document.getElementById('verifyTraysBtn').disabled=true;
        const gotoBtn=document.getElementById('goToCocinaBtn');
        if (gotoBtn){ gotoBtn.disabled=true; gotoBtn.textContent='✅ Organización completada'; }

        setTimeout(() => {
            hideCocinaScreen();
            const finalQ=document.getElementById('finalQuestionSectionM2');
            if (finalQ) { finalQ.classList.remove('hidden'); finalQ.scrollIntoView({behavior:'smooth',block:'start'}); initMoment2Audio(); }
            const nextQ2=document.getElementById('nextBtnQ2');
            if (nextQ2) { nextQ2.disabled=false; nextQ2.style.opacity='1'; }
        }, 1000);
    } else {
        let msg='';
        if (results.length<expectedPairs) msg=`🔍 Te faltan emparejamientos. Solo tienes ${results.length} de ${expectedPairs} pares.`;
        else if (results.length>expectedPairs) msg='💡 Pista: algunas bolsas no tienen pareja.';
        else msg=`✨ ${correctCount} de ${results.length} emparejamientos son correctos. Vuelve a contar.`;
        feedback.textContent=msg; feedback.className='feedback-text error';
    }
}

function initMoment2Audio() {
    const audioSt   = initAudio('recordBtnM2','stopBtnM2','audioStatusM2');
    const submitBtn = document.getElementById('submitM2');
    const statusText= document.getElementById('statusM2');
    if (!submitBtn) return;

    const iv = setInterval(()=>{ submitBtn.disabled=!audioSt.audioBlob; }, 500);

    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled=true; submitBtn.style.opacity='0.5';
        clearInterval(iv);
        if (statusText) statusText.textContent='Subiendo...';
        try {
            await submitEvidence({ moment:'m2', tag:'trays_explanation', data:{question:'¿Por qué tienen la misma cantidad?'}, boardBlob:null, audioBlob:audioSt.audioBlob });
            if (statusText){ statusText.textContent='Guardado ✅ Ya puedes avanzar.'; statusText.className='status-text success'; }
            m2ExplanationSubmitted=true;
            const nq2=document.getElementById('nextBtnQ2');
            if (nq2){ nq2.disabled=false; nq2.style.opacity='1'; }
        } catch(e) {
            if (statusText){ statusText.textContent='Error al guardar.'; statusText.className='status-text error'; }
            submitBtn.disabled=false; submitBtn.style.opacity='1';
        }
    });
}

function setupM2RadioButtons() {
    const promptSect = document.getElementById('m2PromptSectionQ1');
    const promptText = document.getElementById('m2PromptTextQ1');
    const promptMap  = {
        yes:    'Explica detalladamente cómo lo sabes.',
        no:     '¿Con qué número crees que no funcionaría?',
        unsure: 'Explícame cómo estás pensando para decidir.'
    };
    if (promptSect) promptSect.classList.add('hidden');
    document.querySelectorAll('input[name="truthQ1M2"]').forEach(r => {
        r.checked=false;
        r.onchange = e => {
            if (promptText) promptText.textContent = promptMap[e.target.value]||'';
            if (promptSect) promptSect.classList.remove('hidden');
            if (!m2Q1AssociatedSubmitted) setupM2AssociatedAudio();
        };
    });
    setupMulTableValidation();
}

function setupM2AssociatedAudio() {
    if (m2Q1AssociatedSubmitted) return;
    if (m2Q1AudioCheckInterval) { clearInterval(m2Q1AudioCheckInterval); m2Q1AudioCheckInterval=null; }
    const audioSt   = initAudio('recordBtnM2Q1','stopBtnM2Q1','audioStatusM2Q1');
    const submitBtn = cloneReplace('submitM2Q1');
    const statusText= document.getElementById('statusM2Q1');
    if (!submitBtn) return;

    m2Q1AudioCheckInterval = setInterval(()=>{ submitBtn.disabled=!audioSt.audioBlob; }, 500);

    document.getElementById('submitM2Q1').addEventListener('click', async () => {
        const btn = document.getElementById('submitM2Q1');
        if (!audioSt.audioBlob) return;
        btn.disabled=true;
        clearInterval(m2Q1AudioCheckInterval);
        if (statusText) statusText.textContent='Subiendo...';
        try {
            await submitEvidence({ moment:'m2', tag:'q1-bolsas-secretas', data:{ choice:document.querySelector('input[name="truthQ1M2"]:checked')?.value }, boardBlob:null, audioBlob:audioSt.audioBlob });
            if (statusText){ statusText.textContent='Guardado ✅'; statusText.className='status-text success'; }
            m2Q1AssociatedSubmitted=true;
            m2ExplanationSubmitted=true;
            const nq2=document.getElementById('nextBtnQ2');
            if (nq2){ nq2.disabled=false; nq2.style.opacity='1'; }
        } catch(e) {
            if (statusText){ statusText.textContent='Error.'; statusText.className='status-text error'; }
            btn.disabled=false;
        }
    });
}

function setupMulTableValidation() {
    const verifyBtn = cloneReplace('verifyMulTableBtn');
    const feedback  = document.getElementById('m2MulTableFeedback');
    const entryRows = Array.from(document.querySelectorAll('#problemQ2Section .m2-mul-table .m2-mul-entry-row'));
    if (!verifyBtn||!feedback||entryRows.length<3) return;
    feedback.textContent='';
    verifyBtn.addEventListener('click', () => {
        const traySource  = traysSystem?.BASE_TRAYS||[];
        const trayByPedido= new Map(traySource.map(t=>[Number(t.pedido),t]));
        const pedidoPairs = [[3,7],[2,6],[4,8]];
        let emptyVals=false, wrongVals=0;
        pedidoPairs.forEach((pair,row)=>{
            const r=entryRows[row]; if(!r){wrongVals++;return;}
            const inputs=Array.from(r.querySelectorAll('input')); if(inputs.length<6){wrongVals++;return;}
            pair.forEach((pedido,side)=>{
                const expected=trayByPedido.get(pedido); if(!expected){wrongVals++;return;}
                const o=side*3;
                const vals=[inputs[o],inputs[o+1],inputs[o+2]].map(i=>parseInt((i?.value||'').trim(),10));
                if(vals.some(Number.isNaN)){emptyVals=true;return;}
                if(vals[0]!==Number(expected.bags)||vals[1]!==Number(expected.itemsPerBag)||vals[2]!==Number(expected.total)) wrongVals++;
            });
        });
        if(emptyVals){feedback.textContent='Completa todos los espacios.';feedback.className='feedback-text info';return;}
        feedback.textContent=wrongVals===0?'¡Excelente! Los datos coinciden.': `Hay ${wrongVals} dato(s) que no coinciden. Revisa.`;
        feedback.className=wrongVals===0?'feedback-text success':'feedback-text error';
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTO 3: LAS BOLSAS MISTERIOSAS
// ─────────────────────────────────────────────────────────────────────────────
function initMoment3() {
    const codeEl=document.getElementById('studentCodeM3');
    if (codeEl) codeEl.textContent=getStudentHeaderText();

    let p1Init=false, p2Init=false;

    const PROMPTS = {
        yes:    'Explica detalladamente cómo lo sabes.',
        no:     '¿Con qué número crees que no funcionaría? Explica.',
        unsure: 'Explícame cómo estás pensando para decidir si esto siempre será verdadero.'
    };

    function setupRadio(name, sectionId, placeholderId, textId, onFirst) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(r=>{
            r.addEventListener('change', ()=>{
                const t=document.getElementById(textId); if(t) t.textContent=PROMPTS[r.value]||'';
                document.getElementById(sectionId)?.classList.remove('hidden');
                document.getElementById(placeholderId)?.classList.add('hidden');
                if (onFirst) { onFirst(); onFirst=null; }
            });
        });
    }

    setupRadio('truthQ1','promptSection1','m3Q1ChoicePlaceholder','promptText1', ()=>{
        if (!p1Init) { p1Init=true; initProblemM3Q1(); }
    });
    setupRadio('truthQ2','promptSection2','m3Q2ChoicePlaceholder','promptText2', ()=>{
        if (!p2Init) { p2Init=true; initProblemM3Q2(); }
    });

    document.getElementById('continueToM4Btn')?.addEventListener('click', ()=>{
        showMoment('moment4Screen'); initMoment4();
    });
}

function initProblemM3Q1() {
    const boardState = initBoard('boardCanvasM3Q1');
    const audioSt    = initAudio('recordBtnM3Q1','stopBtnM3Q1','audioStatusM3Q1');
    const submitBtn  = document.getElementById('submitM3Q1');
    const statusText = document.getElementById('statusM3Q1');

    const iv = setInterval(()=>{ if(submitBtn) submitBtn.disabled=!audioSt.audioBlob; }, 500);

    submitBtn?.addEventListener('click', async ()=>{
        submitBtn.disabled=true; submitBtn.style.opacity='0.5';
        clearInterval(iv);
        if (statusText) statusText.textContent='Subiendo...';
        try {
            const choice=document.querySelector('input[name="truthQ1"]:checked')?.value;
            const boardBlob=boardState.hasDrawing?await canvasToBlob('boardCanvasM3Q1'):null;
            await submitEvidence({ moment:'m3', tag:'problema1', data:{choice}, boardBlob, audioBlob:audioSt.audioBlob });
            if (statusText){ statusText.textContent='Guardado ✅'; statusText.className='status-text success'; }
            lockBoard('boardCanvasM3Q1','recordBtnM3Q1');
            m3q1Submitted=true;
            setTimeout(()=>{
                document.getElementById('problem2Section')?.classList.remove('hidden');
                document.getElementById('problem2Section')?.scrollIntoView({behavior:'smooth'});
            }, 1000);
        } catch(e) {
            if (statusText){ statusText.textContent='Error. Intenta de nuevo.'; statusText.className='status-text error'; }
            submitBtn.disabled=false; submitBtn.style.opacity='1';
        }
    });
}

function initProblemM3Q2() {
    const boardState = initBoard('boardCanvasM3Q2');
    const audioSt    = initAudio('recordBtnM3Q2','stopBtnM3Q2','audioStatusM3Q2');
    const submitBtn  = document.getElementById('submitM3Q2');
    const statusText = document.getElementById('statusM3Q2');

    const iv = setInterval(()=>{ if(submitBtn) submitBtn.disabled=!audioSt.audioBlob; }, 500);

    submitBtn?.addEventListener('click', async ()=>{
        submitBtn.disabled=true; submitBtn.style.opacity='0.5';
        clearInterval(iv);
        if (statusText) statusText.textContent='Subiendo...';
        try {
            const choice=document.querySelector('input[name="truthQ2"]:checked')?.value;
            const boardBlob=boardState.hasDrawing?await canvasToBlob('boardCanvasM3Q2'):null;
            await submitEvidence({ moment:'m3', tag:'problema2', data:{choice}, boardBlob, audioBlob:audioSt.audioBlob });
            if (statusText){ statusText.textContent='Guardado ✅ Continuando...'; statusText.className='status-text success'; }
            lockBoard('boardCanvasM3Q2','recordBtnM3Q2');
            m3q2Submitted=true;
            document.getElementById('continueToM4Btn')?.classList.remove('hidden');
        } catch(e) {
            if (statusText){ statusText.textContent='Error. Intenta de nuevo.'; statusText.className='status-text error'; }
            submitBtn.disabled=false; submitBtn.style.opacity='1';
        }
    });
}

function lockBoard(canvasId, recordBtnId) {
    const canvas=document.getElementById(canvasId); if(canvas) canvas.style.pointerEvents='none';
    canvas?.closest('.evidence-section')?.querySelectorAll('.tool-btn').forEach(b=>b.disabled=true);
    const rb=document.getElementById(recordBtnId); if(rb){ rb.disabled=true; }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTO 4: EL RETO FINAL
// ─────────────────────────────────────────────────────────────────────────────
function initMoment4() {
    const codeEl=document.getElementById('studentCodeM4');
    if (codeEl) codeEl.textContent=getStudentHeaderText();
    m4Lives=3; m4Finalized=false; m4CurrentItem=1; m4Responses=[]; m4ErrorsTotal=0;
    m4ReflectionSelected=false; m4ReflectionSaved=false; m4ReflectionSaving=false;
    if (m4ReturnHomeTimeout){ clearTimeout(m4ReturnHomeTimeout); m4ReturnHomeTimeout=null; }

    document.getElementById('moment4MainSpread')?.classList.remove('hidden');
    document.getElementById('moment4ReflectionSection')?.classList.add('hidden');
    document.getElementById('finalQuestionSection')?.classList.add('hidden');
    document.querySelectorAll('.magic-heart').forEach(h=>h.classList.remove('lost'));
    renderMagicLives();

    document.querySelectorAll('input[name="m4Reflection"]').forEach(cb=>{
        cb.checked=false; cb.disabled=false; cb.onchange=updateM4Reflection;
    });

    const hint    = document.querySelector('#moment4ReflectionSection .reflection-hint');
    const status  = document.getElementById('m4ReflectionStatus');
    const finishBtn = document.getElementById('finishM4Btn');
    if (hint)   hint.textContent='Selecciona al menos una opción para continuar (máximo dos).';
    if (status) status.textContent='';
    if (finishBtn) {
        finishBtn.disabled=true; finishBtn.style.opacity='0.5';
        finishBtn.onclick = async ()=>{
            const saved=await saveMoment4Reflection();
            if (saved) {
                if (status) status.textContent='Respuesta guardada. Cerrando libro...';
                m4ReturnHomeTimeout=setTimeout(()=>{ window.location.href=FINAL_SURVEY_URL; }, 2200);
            }
        };
    }

    generateMoment4Questions();
    showItem(1);
}

function renderMagicLives() {
    const el=document.getElementById('magicLives'); if(!el) return;
    el.innerHTML='';
    for (let i=0;i<3;i++){
        const h=document.createElement('span'); h.className='magic-heart';
        h.textContent = i<m4Lives?'❤️':'🖤'; el.appendChild(h);
    }
}

function generateMoment4Questions() {
    const envelope=`<span class="missing-envelope" aria-label="bolsa misteriosa" role="img">
        <svg class="envelope magic" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="44" height="34" fill="#ffd166" stroke="#ff9f1c" stroke-width="2" rx="8"/>
            <rect x="8" y="12" width="44" height="9" fill="#ffe28a" opacity="0.9" rx="8"/>
            <path d="M18 14 V8 C18 6 20 5 22 5 C24 5 26 6 26 8 V14" fill="none" stroke="#ff9f1c" stroke-width="2" stroke-linecap="round"/>
            <path d="M34 14 V8 C34 6 36 5 38 5 C40 5 42 6 42 8 V14" fill="none" stroke="#ff9f1c" stroke-width="2" stroke-linecap="round"/>
            <circle cx="30" cy="30" r="3" fill="#ff6f91"/>
        </svg></span>`;

    const patterns=[
        (a,b)=>({ eq:`${a} × ${envelope} = ${b} × ${a}`, ans:b }),
        (a,b)=>({ eq:`${envelope} × ${a} = ${b} × ${a}`, ans:b }),
        (a,b)=>({ eq:`${a} × ${b} = ${b} × ${envelope}`, ans:a }),
        (a,b)=>({ eq:`${envelope} × ${a} = ${b} × ${a}`, ans:b }),
        (a,b)=>({ eq:`${a} × ${envelope} = ${b} × ${a}`, ans:b }),
        (a,b)=>({ eq:`${a} × ${b} = ${envelope} × ${a}`, ans:b }),
    ];

    const wrapper=document.getElementById('itemsWrapper'); if(!wrapper) return;
    wrapper.innerHTML='';
    patterns.forEach((pat,index)=>{
        const a=Math.floor(Math.random()*50)+1;
        const b=Math.floor(Math.random()*50)+1;
        const { eq, ans }=pat(a,b);
        const box=document.createElement('div');
        box.className='item-box hidden'; box.dataset.item=index+1;
        box.innerHTML=`
            <div class="item-equation">${eq}</div>
            <div class="m4-answer-row">
                <input type="number" class="item-input" data-answer="${ans}" data-attempts="0"
                    placeholder="?" min="1" max="50">
                <button class="btn btn-primary check-answer-btn" style="margin-left:15px;padding:10px 25px;">Comprobar</button>
            </div>
            <div class="item-feedback" style="margin-top:15px;font-size:1.2em;min-height:50px;"></div>`;
        wrapper.appendChild(box);
    });
}

function showItem(itemNum) {
    document.querySelectorAll('.item-box').forEach(box=>{
        const match=parseInt(box.dataset.item)===itemNum;
        box.classList.toggle('hidden',!match);
        if (match) {
            const input=box.querySelector('.item-input');
            const checkBtn=box.querySelector('.check-answer-btn');
            checkBtn.addEventListener('click',()=>validateItem(input,box));
            input.addEventListener('keypress',e=>{ if(e.key==='Enter') checkBtn.click(); });
            input.focus();
        }
    });
}

function loseLife() {
    if (m4Lives>0) m4Lives--;
    renderMagicLives();
    if (m4Lives===0) setTimeout(finalizeMoment4, 2000);
}

function validateItem(input, itemBox) {
    const answer     = parseInt(input.dataset.answer);
    const userAnswer = parseInt(input.value);
    const feedback   = itemBox.querySelector('.item-feedback');
    const checkBtn   = itemBox.querySelector('.check-answer-btn');
    let   attempts   = parseInt(input.dataset.attempts);

    if (!input.value||isNaN(userAnswer)) { feedback.textContent='⚠️ Por favor ingresa un número.'; return; }

    if (userAnswer===answer) {
        createSpellEffect(itemBox);
        feedback.innerHTML='<span style="color:#27ae60;font-weight:bold;">✅ ¡Correcto! Muy bien.</span>';
        input.disabled=true; checkBtn.disabled=true; checkBtn.style.opacity='0.5';
        m4Responses.push({ item:m4CurrentItem, correct:true, attempts:attempts+1 });
        setTimeout(()=>{
            itemBox.classList.add('hidden'); m4CurrentItem++;
            m4CurrentItem<=6 ? showItem(m4CurrentItem) : finalizeMoment4();
        }, 1500);
    } else {
        attempts++; input.dataset.attempts=attempts; m4ErrorsTotal++;
        if (attempts===1) {
            feedback.innerHTML='<span style="color:#e67e22;">❌ Verifica tu respuesta. Recuerda la propiedad conmutativa.</span>';
            input.focus();
        } else if (attempts===2) {
            feedback.innerHTML='<span style="color:#555;">💭 Intenta hacer ambas multiplicaciones.</span>';
            input.focus();
        } else {
            loseLife();
            feedback.innerHTML='<span style="color:#c0392b;">❌ No es correcto. 💔 ¡Perdiste una vida mágica!</span>';
            input.disabled=true; checkBtn.disabled=true; checkBtn.style.opacity='0.5';
            m4Responses.push({ item:m4CurrentItem, correct:false, attempts:3 });
            if (m4Lives>0) setTimeout(()=>{
                itemBox.classList.add('hidden'); m4CurrentItem++;
                m4CurrentItem<=6 ? showItem(m4CurrentItem) : finalizeMoment4();
            }, 4000);
        }
    }
}

async function finalizeMoment4() {
    if (m4Finalized) return;
    m4Finalized=true;
    const statusText=document.getElementById('moment4Status');
    if (statusText){ statusText.textContent='Guardando resultados...'; statusText.className='status-text loading'; }
    try {
        await submitEvidence({ moment:'m4', tag:'m4', data:{ responses:m4Responses, errorsTotal:m4ErrorsTotal, livesRemaining:m4Lives }, boardBlob:null, audioBlob:null });
        if (statusText){ statusText.textContent='Completado ✅'; statusText.className='status-text success'; }
        document.getElementById('finalQuestionSection')?.classList.remove('hidden');
        if (m4Lives>0) createFullScreenMagicEffect();
        setTimeout(showMoment4ReflectionPage, 2200);
    } catch(e) {
        console.error(e);
        if (statusText){ statusText.textContent='Error al guardar.'; statusText.className='status-text error'; }
    }
}

function showMoment4ReflectionPage() {
    document.getElementById('moment4MainSpread')?.classList.add('hidden');
    document.getElementById('moment4ReflectionSection')?.classList.remove('hidden');
}

function updateM4Reflection(event) {
    const checked=document.querySelectorAll('input[name="m4Reflection"]:checked');
    if (checked.length>2 && event?.target) event.target.checked=false;
    const valid=document.querySelectorAll('input[name="m4Reflection"]:checked');
    m4ReflectionSelected=valid.length>0 && valid.length<=2;
    const finishBtn=document.getElementById('finishM4Btn');
    if (finishBtn){ finishBtn.disabled=!m4ReflectionSelected||m4ReflectionSaving; finishBtn.style.opacity=finishBtn.disabled?'0.5':'1'; }
}

async function saveMoment4Reflection() {
    if (m4ReflectionSaved) return true;
    if (m4ReflectionSaving) return false;
    const checked=Array.from(document.querySelectorAll('input[name="m4Reflection"]:checked'));
    if (checked.length===0||checked.length>2) return false;
    m4ReflectionSaving=true;
    try {
        await submitEvidence({ moment:'m4', tag:'reflection-final', data:{ options:checked.map(c=>c.value) }, boardBlob:null, audioBlob:null });
        m4ReflectionSaved=true; return true;
    } catch(e) { console.error(e); return false; }
    finally { m4ReflectionSaving=false; updateM4Reflection(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// EFECTOS VISUALES (Momento 4)
// ─────────────────────────────────────────────────────────────────────────────
function createSpellEffect(itemBox) {
    const canvas=document.getElementById('magicCanvas'); if(!canvas) return;
    const ctx=canvas.getContext('2d');
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const rect=itemBox.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const colors=['#9b59b6','#8e44ad','#ffd700','#fff','#bb86fc'];
    const particles=Array.from({length:50},()=>({
        x:cx,y:cy,vx:(Math.random()-.5)*10,vy:(Math.random()-.5)*10,
        r:Math.random()*4+2,color:colors[Math.floor(Math.random()*colors.length)],
        alpha:1,decay:Math.random()*.02+.015
    }));
    (function anim(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let alive=false;
        particles.forEach(p=>{
            if(p.alpha>0){alive=true;p.x+=p.vx;p.y+=p.vy;p.alpha-=p.decay;
                ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
                ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,p.alpha);ctx.fill();}
        });
        ctx.globalAlpha=1;
        if(alive) requestAnimationFrame(anim); else ctx.clearRect(0,0,canvas.width,canvas.height);
    })();
}

function createFullScreenMagicEffect() {
    const canvas=document.getElementById('magicCanvas'); if(!canvas) return;
    const ctx=canvas.getContext('2d');
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const cx=canvas.width/2, cy=canvas.height/2;
    const colors=['#ffd700','#fff','#9b59b6','#8e44ad','#bb86fc'];
    const particles=Array.from({length:150},(_,i)=>{
        const angle=(Math.PI*2*i)/150, v=3+Math.random()*5;
        return{x:cx,y:cy,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,
               r:Math.random()*5+2,color:colors[i%colors.length],alpha:1,decay:Math.random()*.01+.005};
    });
    (function anim(){
        ctx.clearRect(0,0,canvas.width,canvas.height); let alive=false;
        particles.forEach(p=>{
            if(p.alpha>0){alive=true;p.x+=p.vx;p.y+=p.vy;p.vy+=.1;p.alpha-=p.decay;
                ctx.save();ctx.translate(p.x,p.y);ctx.beginPath();
                for(let j=0;j<5;j++){const a=(Math.PI*2*j)/5-Math.PI/2;
                    j===0?ctx.moveTo(Math.cos(a)*p.r,Math.sin(a)*p.r):ctx.lineTo(Math.cos(a)*p.r,Math.sin(a)*p.r);
                    const ia=a+Math.PI/5;ctx.lineTo(Math.cos(ia)*p.r*.5,Math.sin(ia)*p.r*.5);}
                ctx.closePath();ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,p.alpha);ctx.fill();ctx.restore();}
        });
        ctx.globalAlpha=1;
        if(alive) requestAnimationFrame(anim); else ctx.clearRect(0,0,canvas.width,canvas.height);
    })();
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLERO (canvas de dibujo)
// ─────────────────────────────────────────────────────────────────────────────
function initBoard(canvasId) {
    const canvas=document.getElementById(canvasId);
    if(!canvas) return { hasDrawing:false, disabled:false };
    const ctx=canvas.getContext('2d');
    let isDrawing=false, currentTool='black', hasDrawing=false, disabled=false;

    const evidenceSection=canvas.closest('.evidence-section');
    if(!evidenceSection) return { hasDrawing:false, disabled:false };

    evidenceSection.querySelectorAll('.tool-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
            const tool=btn.dataset.tool;
            if(tool==='clear'){
                if(window.confirm('¿Estás segura de querer limpiar todo el tablero?')){
                    ctx.clearRect(0,0,canvas.width,canvas.height); hasDrawing=false; } return;
            }
            currentTool=tool;
            evidenceSection.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    const getCoords=e=>{
        const rect=canvas.getBoundingClientRect();
        const sx=canvas.width/rect.width, sy=canvas.height/rect.height;
        const src=e.touches?e.touches[0]:e;
        return{x:(src.clientX-rect.left)*sx, y:(src.clientY-rect.top)*sy};
    };
    const startDraw=e=>{ if(disabled)return; e.preventDefault(); isDrawing=true; applyTool(ctx,currentTool); const{x,y}=getCoords(e); ctx.beginPath();ctx.moveTo(x,y); };
    const draw=e=>{ if(!isDrawing||disabled)return; e.preventDefault(); const{x,y}=getCoords(e); ctx.lineTo(x,y); ctx.stroke(); hasDrawing=true; };
    const endDraw=()=>{ if(isDrawing){isDrawing=false;ctx.closePath();} };

    canvas.addEventListener('mousedown',startDraw);
    canvas.addEventListener('mousemove',draw);
    canvas.addEventListener('mouseup',  endDraw);
    canvas.addEventListener('mouseleave',endDraw);
    canvas.addEventListener('touchstart',startDraw,{passive:false});
    canvas.addEventListener('touchmove', draw,      {passive:false});
    canvas.addEventListener('touchend',  endDraw);

    return {
        get hasDrawing(){return hasDrawing;},
        get disabled(){return disabled;},
        set disabled(v){disabled=v;}
    };
}

function applyTool(ctx,tool) {
    ctx.lineJoin='round'; ctx.lineCap='round';
    if(tool==='black')       {ctx.strokeStyle='#000';    ctx.lineWidth=3;  ctx.globalAlpha=1;    ctx.globalCompositeOperation='source-over';}
    else if(tool==='red')    {ctx.strokeStyle='#e74c3c'; ctx.lineWidth=3;  ctx.globalAlpha=1;    ctx.globalCompositeOperation='source-over';}
    else if(tool==='yellow') {ctx.strokeStyle='#f1c40f'; ctx.lineWidth=15; ctx.globalAlpha=0.35; ctx.globalCompositeOperation='source-over';}
    else if(tool==='eraser') {ctx.strokeStyle='#fff';    ctx.lineWidth=20; ctx.globalAlpha=1;    ctx.globalCompositeOperation='destination-out';}
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO (MediaRecorder)
// ─────────────────────────────────────────────────────────────────────────────
function initAudio(recordBtnId, stopBtnId, statusId) {
    const recordBtn=document.getElementById(recordBtnId);
    const stopBtn  =document.getElementById(stopBtnId);
    const status   =document.getElementById(statusId);
    if(!recordBtn||!stopBtn) return { get audioBlob(){return null;} };

    let mediaRecorder=null, chunks=[], audioBlob=null;

    recordBtn.addEventListener('click', async ()=>{
        try {
            const stream=await navigator.mediaDevices.getUserMedia({audio:true});
            const opts={mimeType:'audio/webm;codecs=opus'};
            if(!MediaRecorder.isTypeSupported(opts.mimeType)) opts.mimeType='audio/webm';
            mediaRecorder=new MediaRecorder(stream,opts); chunks=[];
            mediaRecorder.ondataavailable=e=>{ if(e.data.size>0) chunks.push(e.data); };
            mediaRecorder.onstop=()=>{
                audioBlob=new Blob(chunks,{type:opts.mimeType});
                stream.getTracks().forEach(t=>t.stop());
                if(status) status.textContent='🎤 Audio grabado.';
                stopBtn.classList.add('hidden'); recordBtn.classList.remove('hidden');
                recordBtn.disabled=true; recordBtn.style.opacity='0.4';
            };
            mediaRecorder.start();
            recordBtn.classList.add('hidden'); stopBtn.classList.remove('hidden');
            if(status) status.textContent='🔴 Grabando...';
        } catch(e) {
            if(status) status.textContent='❌ Error: permite el acceso al micrófono.';
        }
    });
    stopBtn.addEventListener('click',()=>{ if(mediaRecorder&&mediaRecorder.state!=='inactive') mediaRecorder.stop(); });
    return { get audioBlob(){return audioBlob;} };
}

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE: SUBIR EVIDENCIA
// ─────────────────────────────────────────────────────────────────────────────
async function submitEvidence({ moment, tag, data, boardBlob, audioBlob }) {
    if(!db||!storage) throw new Error('Firebase no está configurado.');
    const participantName=[studentInfo?.nombre,studentInfo?.apellidos].filter(Boolean).join(' ').trim()||null;
    const safe=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    const effectiveId=(studentCode==='0000'&&participantName)?participantName:studentCode;
    const storeId=safe(effectiveId)||'invitado';
    const basePath=`Actividad2/${storeId}/${tag}`;
    const ts=Date.now();
    let boardUrl=null, audioUrl=null;
    if(boardBlob){ const r=ref(storage,`${basePath}/canvas_${ts}.png`); await uploadBytes(r,boardBlob); boardUrl=await getDownloadURL(r); }
    if(audioBlob){ const r=ref(storage,`${basePath}/audio_${ts}.webm`); await uploadBytes(r,audioBlob); audioUrl=await getDownloadURL(r); }
    const docRef=await addDoc(collection(db,'submissions'),{
        studentCode:effectiveId, accessCode:studentCode, participantName,
        activity:'act0b', moment, tag, createdAt:serverTimestamp(),
        boardUrl, audioUrl, data, deviceInfo:navigator.userAgent
    });
    return docRef.id;
}

async function canvasToBlob(canvasId) {
    return new Promise(res=>{ document.getElementById(canvasId)?.toBlob(b=>res(b),'image/png'); });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function cloneReplace(id) {
    const el=document.getElementById(id); if(!el) return null;
    const clone=el.cloneNode(true);
    el.parentNode.replaceChild(clone,el);
    return clone;
}