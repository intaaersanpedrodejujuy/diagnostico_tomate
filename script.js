// Configuración de rutas (asegúrate de que los nombres coincidan con tus archivos en /data/)
const FILES = {
    partes: 'data/partes_planta.csv',
    enfermedades: 'data/enfermedades.csv',
    mapeo_loc: 'data/mapeo_localizacion.csv',
    sintomas: 'data/catalogo_sintomas.csv',
    signos: 'data/catalogo_signos.csv',
    criterios: 'data/diagnostico_criterio.csv',
    manejo: 'data/manejo_seguridad.csv'
};

// Almacén de datos global
let db = {};

// Función para cargar y procesar CSV
async function fetchCSV(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    const text = await response.text();
    const rows = text.split('\n').filter(row => row.trim() !== "");
    const headers = rows.split(',');
    return rows.slice(1).map(row => {
        // Manejo simple de comas dentro de comillas
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return values.map(v => v.replace(/"/g, '').trim());
    });
}

// Carga inicial de todos los datos
async function initApp() {
    try {
        db.partes = await fetchCSV(FILES.partes);
        db.enfermedades = await fetchCSV(FILES.enfermedades);
        db.mapeo_loc = await fetchCSV(FILES.mapeo_loc);
        db.sintomas = await fetchCSV(FILES.sintomas);
        db.signos = await fetchCSV(FILES.signos);
        db.criterios = await fetchCSV(FILES.criterios);
        db.manejo = await fetchCSV(FILES.manejo);

        poblarLocalizaciones();
        console.log("Base de datos técnica cargada correctamente.");
    } catch (e) {
        console.error("Error al inicializar:", e);
    }
}

// 1. Llenar el primer menú (Partes de la planta)
function poblarLocalizaciones() {
    const select = document.getElementById('select-localizacion');
    db.partes.forEach(p => {
        let opt = document.createElement('option');
        opt.value = p; // ID (L01, L02...)
        opt.textContent = p[1]; // Nombre (Hoja, Fruto...)
        select.appendChild(opt);
    });
}

// 2. Evento: Al cambiar Localización -> Mostrar Síntomas
document.getElementById('select-localizacion').addEventListener('change', (e) => {
    const locId = e.target.value;
    const selectSintoma = document.getElementById('select-sintoma');
    const secSintomas = document.getElementById('sec-sintomas');

    if (!locId) return secSintomas.classList.add('hidden');

    // Filtrar enfermedades en esa zona
    const enfermedadesEnZona = db.mapeo_loc
        .filter(m => m[2] === locId)
        .map(m => m[1]);

    // Buscar síntomas asociados a esas enfermedades en Diagnostico Criterios
    const sintomasIds = db.criterios
        .filter(c => enfermedadesEnZona.includes(c[1]))
        .map(c => c[2]);

    // Limpiar y poblar select de síntomas
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
});

// 3. Evento: Al cambiar Síntoma -> Mostrar Signos
document.getElementById('select-sintoma').addEventListener('change', (e) => {
    const sId = e.target.value;
    const selectSigno = document.getElementById('select-signo');
    const secSignos = document.getElementById('sec-signos');

    if (!sId) return secSignos.classList.add('hidden');

    // Buscar si ese síntoma tiene signos asociados en los criterios
    const signosIds = db.criterios
        .filter(c => c[2] === sId && c[3] !== "")
        .map(c => c[3]);

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
    mostrarResultado(); // Intento de diagnóstico previo
});

// 4. Mostrar el diagnóstico final basándose en la guía
document.getElementById('select-signo').addEventListener('change', mostrarResultado);

function mostrarResultado() {
    const sId = document.getElementById('select-sintoma').value;
    const sgId = document.getElementById('select-signo').value;
    const resDiv = document.getElementById('resultado');

    if (!sId) return resDiv.classList.add('hidden');

    // Buscar la enfermedad que coincida con síntoma (y signo si existe)
    let match = db.criterios.find(c => {
        if (sgId !== "NINGUNO") return c[2] === sId && c[3] === sgId;
        return c[2] === sId;
    });

    if (match) {
        const enfId = match[1];
        const enfInfo = db.enfermedades.find(e => e === enfId);
        const manejoInfo = db.manejo.find(m => m[1] === enfId);

        document.getElementById('diag-nombre').textContent = enfInfo[1];
        document.getElementById('diag-agente').textContent = `Agente: ${enfInfo[2]}`;
        document.getElementById('diag-manejo').textContent = manejoInfo ? manejoInfo[2] : "Consulte la guía para manejo específico.";
        
        // Alerta de seguridad (Marbete)
        const alerta = document.getElementById('alerta-seguridad');
        alerta.textContent = `Riesgo: ${manejoInfo ? manejoInfo[4] : 'Ver marbete'}`;
        alerta.style.backgroundColor = obtenerColorMarbete(manejoInfo ? manejoInfo[4] : '');

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