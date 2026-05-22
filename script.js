// URLs de tus archivos CSV en el repositorio
const FILES = {
    partes: 'partes_planta.csv',
    enfermedades: 'enfermedades.csv',
    mapeo: 'mapeo_enfermedades_localizacion.csv',
    sintomas: 'catalogo_sintomas.csv',
    signos: 'catalogo_signos.csv',
    criterios: 'diagnostico_criterio.csv',
    manejo: 'manejo_seguridad.csv'
};

// Función para cargar y parsear CSV simple
async function loadCSV(file) {
    const response = await fetch(file);
    const text = await response.text();
    const rows = text.split('\n').slice(1); // Omitir encabezado
    return rows.map(row => row.split(',').map(cell => cell.replace(/"/g, '').trim()));
}

// Lógica de inicio
async function init() {
    const partes = await loadCSV(FILES.partes);
    const selectLoc = document.getElementById('select-localizacion');

    // Poblar Localizaciones (L01, L02...)
    partes.forEach(p => {
        if(p) {
            let opt = document.createElement('option');
            opt.value = p; opt.textContent = p[4];
            selectLoc.appendChild(opt);
        }
    });

    // Eventos de cambio para filtrar (Aquí iría la lógica relacional)
    selectLoc.addEventListener('change', async (e) => {
        const locId = e.target.value;
        if(!locId) return;
        
        // Aquí filtrarías la tabla 'mapeo' para mostrar síntomas de esa localización
        console.log("Filtrando por localización:", locId);
        document.getElementById('sec-sintomas').classList.remove('hidden');
    });
}

init();