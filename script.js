const FOLDER = './data/';

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

// ======================================
// PARSER CSV SIMPLE Y ROBUSTO
// ======================================

function parseCSV(text) {

    return text
        .replace(/\r/g, '')
        .trim()
        .split('\n')
        .slice(1)
        .map(line =>
            line
                .split(',')
                .map(v =>
                    v.trim().replace(/^"|"$/g, '')
                )
        );
}

// ======================================
// CARGA INICIAL
// ======================================

async function init() {

    try {

        const textos = await Promise.all(

            Object.values(FILES).map(async file => {

                console.log('Cargando:', file);

                const r = await fetch(file);

                console.log(file, r.status);

                if (!r.ok) {
                    throw new Error(
                        'No se pudo cargar ' + file
                    );
                }

                return r.text();
            })
        );

        const keys = Object.keys(FILES);

        keys.forEach((key, i) => {

            db[key] = parseCSV(textos[i]);
        });

        console.log('BASE CARGADA:', db);

        poblarMenuInicial();

    }
    catch(err) {

        console.error(err);

        alert(err.message);

        document.getElementById(
            'select-localizacion'
        ).innerHTML =
            '<option>Error al cargar datos</option>';
    }
}

// ======================================
// MENU INICIAL
// ======================================

function poblarMenuInicial() {

    const select =
        document.getElementById(
            'select-localizacion'
        );

    select.innerHTML =
        '<option value="">Seleccione parte de la planta...</option>';

    db.partes.forEach(row => {

        // partes_planta.csv
        // columna 0 = id
        // columna 1 = nombre

        const opt =
            document.createElement('option');

        opt.value = row[0];

        opt.textContent = row[1];

        select.appendChild(opt);
    });
}

// ======================================
// LOCALIZACION -> SINTOMAS
// ======================================

document.getElementById(
    'select-localizacion'
).addEventListener('change', e => {

    const locId = e.target.value;

    const secSintomas =
        document.getElementById(
            'sec-sintomas'
        );

    const selectSintoma =
        document.getElementById(
            'select-sintoma'
        );

    if (!locId) {

        secSintomas.classList.add('hidden');

        return;
    }

    // mapeo_localizacion.csv
    // [0] id_localizacion
    // [1] id_enfermedad
    

    const enfIds = db.mapeo
        .filter(m => m[0] === locId)
        .map(m => m[1]);

    // diagnostico_cr```js id="q3m3b5"
const enfIds = db.mapeo
    .filter(m => {

        return String(m[0]).trim() ===
               String(locId).trim();
    })
    .map(m => String(m[1]).trim());

console.log("LOCALIZACION:", locId);

console.log("ENFERMEDADES:", enfIds);


    
iterio.csv
    // [0] id_enfermedad
    // [1] id_sintoma
    // [2] id_signo

    const sintIds = db.criterios
        .filter(c =>
            enfIds.includes(c[0])
        )
        .map(c => c[1]);

    const unicos = [...new Set(sintIds)];

    selectSintoma.innerHTML =
        '<option value="">Seleccione un síntoma...</option>';

    unicos.forEach(sId => {

        // catalogo_sintomas.csv
        // [0] id
        // [1] nombre

        const sData =
            db.sintomas.find(
                s => s[0] === sId
            );

        if (sData) {

            const opt =
                document.createElement('option');

            opt.value = sId;

            opt.textContent = sData[1];

            selectSintoma.appendChild(opt);
        }
    });

    secSintomas.classList.remove('hidden');

    document.getElementById(
        'sec-signos'
    ).classList.add('hidden');

    document.getElementById(
        'resultado'
    ).classList.add('hidden');
});

// ======================================
// SINTOMA -> SIGNOS
// ======================================

document.getElementById(
    'select-sintoma'
).addEventListener('change', e => {

    const sId = e.target.value;

    const selectSigno =
        document.getElementById(
            'select-signo'
        );

    const secSignos =
        document.getElementById(
            'sec-signos'
        );

    if (!sId) {

        secSignos.classList.add('hidden');

        return;
    }

    const signoIds = db.criterios
        .filter(c =>
            c[1] === sId &&
            c[2]
        )
        .map(c => c[2]);

    selectSigno.innerHTML =
        '<option value="NINGUNO">Ninguno / No se observa</option>';

    [...new Set(signoIds)].forEach(sgId => {

        // catalogo_signos.csv
        // [0] id
        // [1] nombre

        const sgData =
            db.signos.find(
                sg => sg[0] === sgId
            );

        if (sgData) {

            const opt =
                document.createElement('option');

            opt.value = sgId;

            opt.textContent = sgData[1];

            selectSigno.appendChild(opt);
        }
    });

    secSignos.classList.remove('hidden');

    mostrarDiagnostico();
});

// ======================================
// CAMBIO DE SIGNO
// ======================================

document.getElementById(
    'select-signo'
).addEventListener(
    'change',
    mostrarDiagnostico
);

// ======================================
// MOSTRAR DIAGNOSTICO
// ======================================

function mostrarDiagnostico() {

    const sId =
        document.getElementById(
            'select-sintoma'
        ).value;

    const sgId =
        document.getElementById(
            'select-signo'
        ).value;

    const res =
        document.getElementById(
            'resultado'
        );

    if (!sId) return;

    let match = db.criterios.find(c => {

        if (sgId !== 'NINGUNO') {

            return (
                c[1] === sId &&
                c[2] === sgId
            );
        }

        return c[1] === sId;
    });

    if (!match) return;

    const eId = match[0];

    // enfermedades.csv
    // [0] id
    // [1] nombre
    // [2] agente

    const eData =
        db.enfermedades.find(
            e => e[0] === eId
        );

    // manejo_seguridad.csv
    // [0] id_enfermedad
    // [1] manejo
    // [2] marbete

    const mData =
        db.manejo.find(
            m => m[0] === eId
        );

    document.getElementById(
        'diag-nombre'
    ).textContent =
        eData
            ? eData[1]
            : 'No identificado';

    document.getElementById(
        'diag-agente'
    ).textContent =
        eData
            ? 'Agente: ' + eData[2]
            : '';

    document.getElementById(
        'diag-manejo'
    ).textContent =
        mData
            ? mData[1]
            : 'Consulte la guía técnica';

    const alerta =
        document.getElementById(
            'alerta-seguridad'
        );

    const tox =
        mData
            ? mData[2]
            : '';

    alerta.textContent =
        tox
            ? 'Alerta Marbete: ' + tox
            : '';

    alerta.className = '';

    if (tox.toLowerCase().includes('verde')) {

        alerta.classList.add(
            'marbete-verde'
        );
    }
    else if (
        tox.toLowerCase().includes('azul')
    ) {

        alerta.classList.add(
            'marbete-azul'
        );
    }
    else if (
        tox.toLowerCase().includes('amarillo')
    ) {

        alerta.classList.add(
            'marbete-amarillo'
        );
    }
    else if (
        tox.toLowerCase().includes('rojo')
    ) {

        alerta.classList.add(
            'marbete-rojo'
        );
    }

    res.classList.remove('hidden');
}

// ======================================
// INICIO
// ======================================

init();
