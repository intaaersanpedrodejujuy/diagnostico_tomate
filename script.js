const FOLDER = 'data/';
const FILES = {
    partes: FOLDER + 'partes_planta.csv',
    enfermedades: FOLDER + 'enfermedades.csv',
    mapeo: FOLDER + 'mapeo_localizacion.csv',
    sintomas: FOLDER + 'catalogo_sintomas.csv',
    signos: FOLDER + 'catalogo_signos.csv',
    criterios: FOLDER + 'diagnostico_criterio.csv',
    manejo: FOLDER + 'manejo_seguridad.csv'
};

let db = {};

// Parser de CSV que ignora comas dentro de comillas (importante para las descripciones)
function parseCSV(text) {
    const rows = text.replace(/\r/g, '').split('\n').filter(r => r.trim() !== "");
    return rows.slice(1).map(row => {
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(v => v.replace(/^"|"$/g, '').trim());
    });
}

async function init() {
    try {
        const responses = await Promise.all(Object.values(FILES).map(f => fetch(f)));
        const texts = await Promise.all(responses.map(r => {
            if (!r.ok) throw new Error(`No se pudo cargar ${r.url}`);
            return r.text();
        }));

        const keys = Object.keys(FILES);
        keys.forEach((key, i) => db[key] = parseCSV(texts[i]));

        poblarMenuInicial();
    } catch (err) {
        console.error("Error en carga:", err);
        document.getElementById('select-localizacion').innerHTML = '<option>Error al cargar datos</option>';
    }
}

function poblarMenuInicial() {
    const select = document.getElementById('select-localizacion');
    select.innerHTML = '<option value="">Seleccione parte de la planta...</option>';
    db.partes.forEach(row => {
        let opt = document.createElement('option');
        opt.value = row; // ID (L01)
        opt.textContent = row[8]; // Nombre (Hoja)
        select.appendChild(opt);
    });
}

// Lógica de filtrado de síntomas
document.getElementById('select-localizacion').addEventListener('change', e => {
    const locId = e.target.value;
    const secSintomas = document.getElementById('sec-sintomas');
    const selectSintoma = document.getElementById('select-sintoma');

    if (!locId) return secSintomas.classList.add('hidden');

    // Filtrar enfermedades por localización
    const enfIds = db.mapeo.filter(m => m[9] === locId).map(m => m[8]);
    
    // Obtener síntomas de esas enfermedades
    const sintIds = db.criterios.filter(c => enfIds.includes(c[8])).map(c => c[9]);
    const unicos = [...new Set(sintIds)];

    selectSintoma.innerHTML = '<option value="">Seleccione un síntoma...</option>';
    unicos.forEach(sId => {
        const sData = db.sintomas.find(s => s === sId);
        if (sData) {
            let opt = document.createElement('option');
            opt.value = sId;
            opt.textContent = sData[8];
            selectSintoma.appendChild(opt);
        }
    });

    secSintomas.classList.remove('hidden');
    document.getElementById('sec-signos').classList.add('hidden');
    document.getElementById('resultado').classList.add('hidden');
});

// Al seleccionar síntoma -> Signos y Diagnóstico
document.getElementById('select-sintoma').addEventListener('change', e => {
    const sId = e.target.value;
    const selectSigno = document.getElementById('select-signo');
    const secSignos = document.getElementById('sec-signos');

    if (!sId) return secSignos.classList.add('hidden');

    const signoIds = db.criterios.filter(c => c[9] === sId && c[10]).map(c => c[10]);
    
    selectSigno.innerHTML = '<option value="NINGUNO">Ninguno / No se observa</option>';
    [...new Set(signoIds)].forEach(sgId => {
        const sgData = db.signos.find(sg => sg === sgId);
        if (sgData) {
            let opt = document.createElement('option');
            opt.value = sgId;
            opt.textContent = sgData[8];
            selectSigno.appendChild(opt);
        }
    });

    secSignos.classList.remove('hidden');
    mostrarDiagnostico();
});

document.getElementById('select-signo').addEventListener('change', mostrarDiagnostico);

function mostrarDiagnostico() {
    const sId = document.getElementById('select-sintoma').value;
    const sgId = document.getElementById('select-signo').value;
    const res = document.getElementById('resultado');

    if (!sId) return;

    let match = db.criterios.find(c => {
        if (sgId !== "NINGUNO") return c[9] === sId && c[10] === sgId;
        return c[9] === sId;
    });

    if (match) {
        const eId = match[8];
        const eData = db.enfermedades.find(e => e === eId);
        const mData = db.manejo.find(m => m[8] === eId);

        document.getElementById('diag-nombre').textContent = eData ? eData[8] : "No identificado";
        document.getElementById('diag-agente').textContent = eData ? `Agente: ${eData[9]}` : "";
        document.getElementById('diag-manejo').textContent = mData ? mData[9] : "Consulte la guía técnica.";
        
        const alerta = document.getElementById('alerta-seguridad');
        const tox = mData ? mData[11] : "";
        alerta.textContent = tox ? `Alerta Marbete: ${tox}` : "";
        alerta.className = tox.toLowerCase().includes('verde') ? 'marbete-verde' : 
                          tox.toLowerCase().includes('azul') ? 'marbete-azul' :
                          tox.toLowerCase().includes('amarillo') ? 'marbete-amarillo' :
                          tox.toLowerCase().includes('rojo') ? 'marbete-rojo' : '';

        res.classList.remove('hidden');
    }
}

init();