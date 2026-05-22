const FILES = {
    partes: 'data/pastes_planta.csv', // Usando tu nombre "pastes"
    enfermedades: 'data/enfermedades.csv',
    mapeo_loc: 'data/mapeo_localización.csv', // Usando tu nombre con acento
    sintomas: 'data/catalogo_sintomas.csv',
    signos: 'data/catalogo_signos.csv',
    criterios: 'data/diagnostico_criterio.csv',
    manejo: 'data/manejo_seguridad.csv'
};

let db = {};

// Cargador de CSV con limpieza profunda
async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} - No se encontró ${url}`);
        const text = await response.text();
        
        // Dividimos por filas y limpiamos espacios y caracteres de Windows (\r)
        const rows = text.replace(/\r/g, '').split('\n').filter(row => row.trim() !== "");
        
        return rows.slice(1).map(row => {
            let cells = [];
            let cell = "";
            let inQuotes = false;
            for (let char of row) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    cells.push(cell.trim().replace(/^"|"$/g, ''));
                    cell = "";
                } else {
                    cell += char;
                }
            }
            cells.push(cell.trim().replace(/^"|"$/g, ''));
            return cells;
        });
    } catch (e) {
        console.error("Error cargando:", url, e);
        return [];
    }
}

async function initApp() {
    console.log("Cargando base de datos...");
    db.partes = await fetchCSV(FILES.partes);
    db.enfermedades = await fetchCSV(FILES.enfermedades);
    db.mapeo_loc = await fetchCSV(FILES.mapeo_loc);
    db.sintomas = await fetchCSV(FILES.sintomas);
    db.signos = await fetchCSV(FILES.signos);
    db.criterios = await fetchCSV(FILES.criterios);
    db.manejo = await fetchCSV(FILES.manejo);

    if (db.partes.length > 0) {
        poblarMenuLocalizacion();
        console.log("✔ Menú de localización listo.");
    } else {
        console.error("❌ No se cargaron las partes de la planta. Revisa 'data/pastes_planta.csv'");
    }
}

// 1. Cargar el primer menú (Dónde observa el daño)
function poblarMenuLocalizacion() {
    const select = document.getElementById('select-localizacion');
    select.innerHTML = '<option value="">Seleccione parte de la planta...</option>';
    
    db.partes.forEach(p => {
        // p es el ID (L01), p[1] es el nombre (Hoja)
        if (p && p[1]) {
            let opt = document.createElement('option');
            opt.value = p; 
            opt.textContent = p[1];
            select.appendChild(opt);
        }
    });
}

// 2. Filtrar Síntomas según la Guía
document.getElementById('select-localizacion').addEventListener('change', (e) => {
    const locId = e.target.value;
    const selectSintoma = document.getElementById('select-sintoma');
    const secSintomas = document.getElementById('sec-sintomas');

    if (!locId) return secSintomas.classList.add('hidden');

    // Buscamos enfermedades en esa zona (Columna 2 de mapeo_localización)
    const enfermedadesEnZona = db.mapeo_loc
        .filter(m => m[2] === locId)
        .map(m => m[1]);

    // Buscamos síntomas asociados (Columna 1 y 2 de diagnostico_criterio)
    const sintomasIds = db.criterios
        .filter(c => enfermedadesEnZona.includes(c[1]))
        .map(c => c[2]);

    selectSintoma.innerHTML = '<option value="">Seleccione un síntoma...</option>';
    [...new Set(sintomasIds)].forEach(sId => {
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

// El resto de la lógica de Signos y Resultado se mantiene igual...
initApp();
