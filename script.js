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

// Procesador de CSV mejorado para manejar comas y comillas correctamente
function parseCSV(text) {
    const rows = text.replace(/\r/g, '').split('\n').filter(r => r.trim() !== "");
    return rows.slice(1).map(row => {
        // Esta línea separa las columnas correctamente incluso si hay comas dentro de las descripciones
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(v => v.replace(/^"|"$/g, '').trim());
    });
}

async function init() {
    try {
        const responses = await Promise.all(Object.values(FILES).map(f => fetch(f)));
        const texts = await Promise.all(responses.map(async (r, i) => {
            if (!r.ok) throw new Error(`No se encontró el archivo: ${Object.keys(FILES)[i]}`);
            return await r.text();
        }));

        const keys = Object.keys(FILES);
        keys.forEach((key, i) => db[key] = parseCSV(texts[i]));

        poblarMenuLocalizacion();
        console.log("Base de datos cargada y menús listos.");
    } catch (err) {
        console.error("Error crítico:", err);
    }
}

function poblarMenuLocalizacion() {
    const select = document.getElementById('select-localizacion');
    select.innerHTML = '<option value="">Seleccione parte de la planta...</option>';
    
    // row es el ID (L01, L02...) y row[1] es el Nombre (Semilla, Raíz...)
    db.partes.forEach(row => {
        if (row.length >= 2) {
            let opt = document.createElement('option');
            opt.value = row; 
            opt.textContent = row[1]; 
            select.appendChild(opt);
        }
    });
}

// Filtrado de Síntomas al elegir la Localización
document.getElementById('select-localizacion').addEventListener('change', e => {
    const locId = e.target.value;
    const selectSintoma = document.getElementById('select-sintoma');
    const secSintomas = document.getElementById('sec-sintomas');

    if (!locId) return secSintomas.classList.add('hidden');

    // 1. Buscamos qué enfermedades afectan esa zona (mapeo: col 2 es LocID, col 1 es EnfID)
    const enfIds = db.mapeo.filter(m => m[3] === locId).map(m => m[1]);
    
    // 2. Buscamos síntomas de esas enfermedades (criterios: col 1 es EnfID, col 2 es SintID)
    const sintIds = db.criterios.filter(c => enfIds.includes(c[1])).map(c => c[3]);
    const unicos = [...new Set(sintIds)];

    selectSintoma.innerHTML = '<option value="">Seleccione un síntoma...</option>';
    unicos.forEach(sId => {
        const sData = db.sintomas.find(s => s === sId);
        if (sData) {
            let opt = document.createElement('option');
            opt.value = sId;
            opt.textContent = sData[1]; 
            selectSintoma.appendChild(opt);
        }
    });

    secSintomas.classList.remove('hidden');
});

// Lógica para Signos y Diagnóstico
document.getElementById('select-sintoma').addEventListener('change', e => {
    const sId = e.target.value;
    const selectSigno = document.getElementById('select-signo');
    const secSignos = document.getElementById('sec-signos');
    if (!sId) return secSignos.classList.add('hidden');

    const signoIds = db.criterios.filter(c => c[3] === sId && c[4]).map(c => c[4]);
    selectSigno.innerHTML = '<option value="NINGUNO">Ninguno / No se observa</option>';
    [...new Set(signoIds)].forEach(sgId => {
        const sgData = db.signos.find(sg => sg === sgId);
        if (sgData) {
            let opt = document.createElement('option');
            opt.value = sgId;
            opt.textContent = sgData[1];
            selectSigno.appendChild(opt);
        }
    });
    secSignos.classList.remove('hidden');
    mostrarResultado();
});

document.getElementById('select-signo').addEventListener('change', mostrarResultado);

function mostrarResultado() {
    const sId = document.getElementById('select-sintoma').value;
    const sgId = document.getElementById('select-signo').value;
    const resDiv = document.getElementById('resultado');

    const match = db.criterios.find(c => {
        if (sgId !== "NINGUNO") return c[3] === sId && c[4] === sgId;
        return c[3] === sId;
    });

    if (match) {
        const eId = match[1];
        const eData = db.enfermedades.find(e => e === eId);
        const mData = db.manejo.find(m => m[1] === eId);

        document.getElementById('diag-nombre').textContent = eData ? eData[1] : "No identificado";
        document.getElementById('diag-agente').textContent = eData ? `Agente: ${eData[3]}` : "";
        document.getElementById('diag-manejo').textContent = mData ? mData[3] : "Consulte la guía.";
        resDiv.classList.remove('hidden');
    }
}

init();
