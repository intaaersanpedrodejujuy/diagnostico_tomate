const FILES = {
    partes: 'data/partes_planta.csv',
    enfermedades: 'data/enfermedades.csv',
    mapeo_loc: 'data/mapeo_enfermedades_localizacion.csv',
    sintomas: 'data/catalogo_sintomas.csv',
    signos: 'data/catalogo_signos.csv',
    criterios: 'data/diagnostico_criterio.csv',
    manejo: 'data/manejo_seguridad.csv'
};

let db = {};

async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const text = await response.text();
        const rows = text.replace(/\r/g, '').split('\n').filter(row => row.trim() !== "");
        return rows.slice(1).map(row => {
            let cells = [];
            let cell = "";
            let inQuotes = false;
            for (let char of row) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    cells.push(cell.trim());
                    cell = "";
                } else {
                    cell += char;
                }
            }
            cells.push(cell.trim());
            return cells;
        });
    } catch (e) {
        console.error(`Error en ${url}:`, e);
        return [];
    }
}

async function initApp() {
    db.partes = await fetchCSV(FILES.partes);
    db.enfermedades = await fetchCSV(FILES.enfermedades);
    db.mapeo_loc = await fetchCSV(FILES.mapeo_loc);
    db.sintomas = await fetchCSV(FILES.sintomas);
    db.signos = await fetchCSV(FILES.signos);
    db.criterios = await fetchCSV(FILES.criterios);
    db.manejo = await fetchCSV(FILES.manejo);

    if (db.partes.length > 0) {
        const select = document.getElementById('select-localizacion');
        db.partes.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p; // ID (L01, L02...)
            opt.textContent = p[1]; // Nombre (Hoja, Fruto...)
            select.appendChild(opt);
        });
    }
}

// FILTRADO DE SÍNTOMAS (CORREGIDO)
document.getElementById('select-localizacion').addEventListener('change', (e) => {
    const locId = e.target.value;
    const selectSintoma = document.getElementById('select-sintoma');
    const secSintomas = document.getElementById('sec-sintomas');

    if (!locId) return secSintomas.classList.add('hidden');

    // 1. Buscamos enfermedades que afecten esa zona (Indice 2 del mapeo)
    const enfermedadesIds = db.mapeo_loc
        .filter(m => m[2] === locId)
        .map(m => m[1]);

    // 2. Buscamos los síntomas de esas enfermedades (Indice 1 y 2 de criterios)
    const sintomasIds = db.criterios
        .filter(c => enfermedadesIds.includes(c[1]))
        .map(c => c[2]);

    selectSintoma.innerHTML = '<option value="">Seleccione un síntoma...</option>';
    const unicos = [...new Set(sintomasIds)];
    
    unicos.forEach(sId => {
        const sInfo = db.sintomas.find(s => s === sId);
        if (sInfo) {
            let opt = document.createElement('option');
            opt.value = sId;
            opt.textContent = sInfo[1];
            selectSintoma.appendChild(opt);
        }
    });

    secSintomas.classList.remove('hidden');
});

// EVENTO DE SÍNTOMA A SIGNO
document.getElementById('select-sintoma').addEventListener('change', (e) => {
    const sId = e.target.value;
    const selectSigno = document.getElementById('select-signo');
    const secSignos = document.getElementById('sec-signos');

    if (!sId) return secSignos.classList.add('hidden');

    const signosIds = db.criterios
        .filter(c => c[2] === sId && c[3] !== "")
        .map(c => c[3]);

    selectSigno.innerHTML = '<option value="NINGUNO">Ninguno / No se observa</option>';
    [...new Set(signosIds)].forEach(sgId => {
        const sgInfo = db.signos.find(sg => sg === sgId);
        if (sgInfo) {
            let opt = document.createElement('option');
            opt.value = sgId;
            opt.textContent = sgInfo[1];
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

    if (!sId) return;

    let match = db.criterios.find(c => {
        if (sgId !== "NINGUNO") return c[2] === sId && c[3] === sgId;
        return c[2] === sId;
    });

    if (match) {
        const enfId = match[1];
        const enfInfo = db.enfermedades.find(e => e === enfId);
        const manejoInfo = db.manejo.find(m => m[1] === enfId);

        document.getElementById('diag-nombre').textContent = enfInfo ? enfInfo[1] : "Desconocida";
        document.getElementById('diag-agente').textContent = `Agente: ${enfInfo ? enfInfo[2] : "No determinado"}`;
        document.getElementById('diag-manejo').textContent = manejoInfo ? manejoInfo[2] : "Consulte la guía.";
        
        const alerta = document.getElementById('alerta-seguridad');
        const tox = manejoInfo ? manejoInfo[4] : '';
        alerta.textContent = `Alerta de Seguridad: ${tox}`;
        alerta.style.backgroundColor = tox.includes('Verde') ? '#2ecc71' : tox.includes('Azul') ? '#3498db' : tox.includes('Amarillo') ? '#f1c40f' : tox.includes('Rojo') ? '#e74c3c' : '#bdc3c7';

        resDiv.classList.remove('hidden');
    }
}
