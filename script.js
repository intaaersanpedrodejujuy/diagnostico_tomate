const FOLDER = 'data/';
    secSignos.classList.remove('hidden');

    mostrarDiagnostico();
});

// ----------------------
// DIAGNOSTICO
// ----------------------
document.getElementById('select-signo').addEventListener('change', mostrarDiagnostico);

function mostrarDiagnostico() {

    const sId = document.getElementById('select-sintoma').value;
    const sgId = document.getElementById('select-signo').value;

    const res = document.getElementById('resultado');

    if (!sId) return;

    let match = db.criterios.find(c => {

        if (sgId !== 'NINGUNO') {
            return c[1] === sId && c[2] === sgId;
        }

        return c[1] === sId;
    });

    if (!match) return;

    const eId = match[0];

    // enfermedades.csv
    // [0]=id
    // [1]=nombre
    // [2]=agente

    const eData = db.enfermedades.find(e => e[0] === eId);

    // manejo_seguridad.csv
    // [0]=id_enfermedad
    // [1]=manejo
    // [2]=marbete

    const mData = db.manejo.find(m => m[0] === eId);

    document.getElementById('diag-nombre').textContent =
        eData ? eData[1] : 'No identificado';

    document.getElementById('diag-agente').textContent =
        eData ? `Agente: ${eData[2]}` : '';

    document.getElementById('diag-manejo').textContent =
        mData ? mData[1] : 'Consulte la guía técnica.';

    const alerta = document.getElementById('alerta-seguridad');

    const tox = mData ? mData[2] : '';

    alerta.textContent = tox
        ? `Alerta Marbete: ${tox}`
        : '';

    alerta.className = '';

    if (tox.toLowerCase().includes('verde')) {
        alerta.classList.add('marbete-verde');
    }
    else if (tox.toLowerCase().includes('azul')) {
        alerta.classList.add('marbete-azul');
    }
    else if (tox.toLowerCase().includes('amarillo')) {
        alerta.classList.add('marbete-amarillo');
    }
    else if (tox.toLowerCase().includes('rojo')) {
        alerta.classList.add('marbete-rojo');
    }

    res.classList.remove('hidden');
}

init();
