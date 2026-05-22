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

// Cargador de CSV con limpieza profunda de caracteres invisibles
async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`No se encontró el archivo: ${url}`);
        const text = await response.text();
        
        // Eliminamos caracteres de retorno de carro y espacios raros
        const rows = text.replace(/\r/g, '').split('\n').filter(row => row.trim() !== "");
        
        return rows.slice(1).map(row => {
            let cells = [];
            let cell = "";
            let inQuotes = false;
            for (let char of row) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    cells.push(cell.trim().replace(/^"|"$/g, '')); // Quita comillas y espacios
                    cell = "";
                } else {
                    cell += char;
                }
            }
            cells.push(cell.trim().replace(/^"|"$/g, ''));
            return cells;
        });
    } catch (e) {
        console.error(`Error crítico en ${url}:`, e);
        return [];
    }
}

async function initApp() {
    console.log("--- Iniciando carga de base de datos técnica ---");
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
            if (p && p[1]) {
                let opt = document.createElement('option');
                opt.value = p; // ID: L01
                opt.textContent = p[1]; // Nombre: Semilla
                select.appendChild(opt);
            }
        });
        console.log("✔ Menú Localización cargado.");
    }
}

// Lógica de filtrado de síntomas
document.getElementById('select-localizacion').addEventListener('change', (e) => {
    const locId = e.target.value;
    const selectSintoma = document.getElementById('select-sintoma');
    const secSintomas = document.getElementById('sec-sintomas');

    if (!locId) return secSintomas.classList.add('hidden');

    console.log(`Buscando enfermedades para localización: ${locId}`);

    // 1. Filtrar mapeo para obtener IDs de enfermedades (Columna 2 es Localización, Columna 1 es Enfermedad)
    const enfermedadesIds = db.mapeo_loc
        .filter(m => m[2] === locId)
        .map(m => m[1]);
    
    console.log("Enfermedades encontradas:", enfermedadesIds);

    // 2. Filtrar criterios para obtener síntomas (Columna 1 es Enfermedad, Columna 2 es Síntoma)
    const sintomasIds = db.criterios
        .filter(c => enfermedadesIds.includes(c[1]))
        .map(c => c[2]);

    console.log("IDs de síntomas vinculados:", sintomasIds);

    // 3. Poblar el menú de síntomas
    selectSintoma.innerHTML = '<option value="">Seleccione un síntoma...</option>';
    const unicosSintomas = [...new Set(sintomasIds)];
    
    unicosSintomas.forEach(sId => {
        const sInfo = db.sintomas.find(s => s === sId);
        if (sInfo) {
            let opt = document.createElement('option');
            opt.value = sId;
            opt.textContent = sInfo[1]; // Descripción del síntoma
            selectSintoma.appendChild(opt);
        }
    });

    if (unicosSintomas.length > 0) {
        secSintomas.classList.remove('hidden');
    } else {
        console.warn("No se encontraron síntomas para los IDs:", sintomasIds);
        alert("Atención: No hay síntomas mapeados para esta zona en los archivos CSV.");
    }
});

// Eventos para el resto del flujo
document.getElementById('select-sintoma').addEventListener('change', (e) => {
    const sId = e.target.value;
    const selectSigno = document.getElementById('select-signo');
    const secSignos = document.getElementById('sec-signos');
    if (!sId) return secSignos.classList.add('hidden');

    const signosIds = db.criterios.filter(c => c[2] === sId && c[3]).map(c => c[3]);
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

    const match = db.criterios.find(c => {
        if (sgId !== "NINGUNO") return c[2] === sId && c[3] === sgId;
        return c[2] === sId;
    });

    if (match) {
        const enfId = match[1];
        const enfInfo = db.enfermedades.find(e => e === enfId);
        const manejoInfo = db.manejo.find(m => m[1] === enfId);

        document.getElementById('diag-nombre').textContent = enfInfo ? enfInfo[1] : "No identificado";
        document.getElementById('diag-agente').textContent = `Agente Causal: ${enfInfo ? enfInfo[2] : "Consulte la guía"}`;
        document.getElementById('diag-manejo').textContent = manejoInfo ? manejoInfo[2] : "Siga las recomendaciones generales de la guía.";
        resDiv.classList.remove('hidden');
    }
}
