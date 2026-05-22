// Configuración de rutas - Verifica que estos nombres coincidan con tus archivos en /data/
const FILES = {
    partes: 'data/partes_planta.csv',
    enfermedades: 'data/enfermedades.csv',
    mapeo_loc: 'data/mapeo_localizacion.csv',
    sintomas: 'data/catalogo_sintomas.csv',
    signos: 'data/catalogo_signos.csv',
    criterios: 'data/diagnostico_criterio.csv',
    manejo: 'data/manejo_seguridad.csv'
};

let db = {}; // Almacén de datos

// Función Robusta para leer CSV (maneja comas dentro de comillas y saltos de línea Windows/Unix)
async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const text = await response.text();
        
        // Limpiamos retornos de carro y dividimos por líneas
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
        console.error(`Error cargando ${url}:`, e);
        return [];
    }
}

// Inicialización
async function initApp() {
    console.log("Iniciando carga de datos técnicos...");
    db.partes = await fetchCSV(FILES.partes);
    db.enfermedades = await fetchCSV(FILES.enfermedades);
    db.mapeo_loc = await fetchCSV(FILES.mapeo_loc);
    db.sintomas = await fetchCSV(FILES.sintomas);
    db.signos = await fetchCSV(FILES.signos);
    db.criterios = await fetchCSV(FILES.criterios);
    db.manejo = await fetchCSV(FILES.manejo);

    if (db.partes.length > 0) {
        poblarLocalizaciones();
        console.log("Sistema listo. Localizaciones cargadas.");
    } else {
        alert("Error: No se pudieron cargar los datos. Verifica la carpeta /data/ y que uses un servidor (GitHub o Live Server).");
    }
}

// 1. Llenar el menú "Dónde observa el daño"
function poblarLocalizaciones() {
    const select = document.getElementById('select-localizacion');
    select.innerHTML = '<option value="">Seleccione parte de la planta...</option>';
    
    db.partes.forEach(p => {
        if (p.length >= 2) {
            let opt = document.createElement('option');
            opt.value = p;       // ID (Ej: L01)
            opt.textContent = p[1]; // Nombre (Ej: Semilla)
            select.appendChild(opt);
        }
    });
}

// 2. Al cambiar Localización -> Filtrar Síntomas según la Guía
document.getElementById('select-localizacion').addEventListener('change', (e) => {
    const locId = e.target.value;
    const selectSintoma = document.getElementById('select-sintoma');
    const secSintomas = document.getElementById('sec-sintomas');

    if (!locId) {
        secSintomas.classList.add('hidden');
        return;
    }

    // Obtenemos IDs de enfermedades que afectan esa parte (Cuadro Resumen II [2, 3])
    const enfermedadesIds = db.mapeo_loc
        .filter(m => m[4] === locId)
        .map(m => m[1]);

    // Obtenemos IDs de síntomas vinculados a esas enfermedades
    const sintomasIds = db.criterios
        .filter(c => enfermedadesIds.includes(c[1]))
        .map(c => c[4]);

    // Limpiar y poblar síntomas únicos
    selectSintoma.innerHTML = '<option value="">Seleccione un síntoma...</option>';
    const sintomasUnicos = [...new Set(sintomasIds)];
    
    sintomasUnicos.forEach(sId => {
        const sInfo = db.sintomas.find(s => s === sId);
        if (sInfo) {
            let opt = document.createElement('option');
            opt.value = sId;
            opt.textContent = sInfo[1];
            selectSintoma.appendChild(opt);
        }
    });

    secSintomas.classList.remove('hidden');
    document.getElementById('sec-signos').classList.add('hidden');
    document.getElementById('resultado').classList.add('hidden');
});

// 3. Al cambiar Síntoma -> Mostrar Signos de confirmación
document.getElementById('select-sintoma').addEventListener('change', (e) => {
    const sId = e.target.value;
    const selectSigno = document.getElementById('select-signo');
    const secSignos = document.getElementById('sec-signos');

    if (!sId) {
        secSignos.classList.add('hidden');
        return;
    }

    // Buscamos si hay signos biológicos asociados a este síntoma (Ej: esclerocios, zooglea [5, 6])
    const signosIds = db.criterios
        .filter(c => c[4] === sId && c[7] !== "")
        .map(c => c[7]);

    selectSigno.innerHTML = '<option value="NINGUNO">Ninguno / No se observa</option>';
    const signosUnicos = [...new Set(signosIds)];

    signosUnicos.forEach(sgId => {
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

    // Buscamos la enfermedad que encaje con la combinación síntoma/signo
    let match = db.criterios.find(c => {
        if (sgId !== "NINGUNO") return c[4] === sId && c[7] === sgId;
        return c[4] === sId;
    });

    if (match) {
        const enfId = match[1];
        const enfInfo = db.enfermedades.find(e => e === enfId);
        const manejoInfo = db.manejo.find(m => m[1] === enfId);

        document.getElementById('diag-nombre').textContent = enfInfo ? enfInfo[1] : "Desconocida";
        document.getElementById('diag-agente').textContent = `Agente: ${enfInfo ? enfInfo[4] : "No determinado"}`;
        document.getElementById('diag-manejo').textContent = manejoInfo ? manejoInfo[4] : "Consulte la guía.";
        
        const alerta = document.getElementById('alerta-seguridad');
        const toxicidad = manejoInfo ? manejoInfo[8] : '';
        alerta.textContent = `Riesgo: ${toxicidad}`;
        alerta.style.backgroundColor = obtenerColorMarbete(toxicidad);

        resDiv.classList.remove('hidden');
    }
}

function obtenerColorMarbete(texto) {
    if (texto.includes('Verde')) return '#2ecc71';
    if (texto.includes('Azul')) return '#3498db';
    if (texto.includes('Amarillo')) return '#f1c40f';
    if (texto.includes('Rojo')) return '#e74c3c';
    return '#bdc3c7';
}

initApp();