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
// PARSER CSV
// ======================================

function parseCSV(text) {

    return text
        .replace(/\r/g, '')
        .trim()
        .split('\n')
        .slice(1)
        .map(line =>
            line.split(',').map(v =>
                v.trim().replace(/^"|"$/g, '')
            )
        );
}

// ======================================
// CARGA ARCHIVOS
// ======================================

async function init() {

    try {

        const textos = await Promise.all(

            Object.values(FILES).map(async file => {

                console.log('Cargando:', file);

                const response =
                    await fetch(file);

                if (!response.ok) {

                    throw new Error(
                        'No se pudo cargar ' + file
                    );
                }

                return response.text();
            })
        );

        const keys =
            Object.keys(FILES);

        keys.forEach((key, i) => {

            db[key] =
                parseCSV(textos[i]);
        });

        console.log('BASE:', db);

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

function poblarMenuInicial() {

    alert("ENTRO A poblarMenuInicial");

    const params =
        new URLSearchParams(
            window.location.search
        );

    const locId =
        params.get('loc');

    alert("LOC = " + locId);

    ...
}

// ======================================
// MENU PARTE PLANTA
// ======================================

function poblarMenuInicial() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const locId =
        params.get('loc');

    if (!locId) {

        console.error(
            'No se recibió localización'
        );

        return;
    }

    const select =
        document.getElementById(
            'select-localizacion'
        );

    select.innerHTML = '';

    db.partes.forEach(row => {

        const opt =
            document.createElement('option');

        opt.value =
            String(row[0]).trim();

        opt.textContent =
            row[1];

        select.appendChild(opt);
    });

    // Selecciona automáticamente la parte elegida
    select.value = locId;

    // Muestra el nombre en pantalla
    const parte =
        db.partes.find(row =>
            String(row[0]).trim() === locId
        );

    if (parte) {

        const etiqueta =
            document.getElementById(
                'parte-seleccionada'
            );

        if (etiqueta) {

            etiqueta.textContent =
                parte[1];
        }
    }

    // Fuerza la carga de síntomas
    select.dispatchEvent(
        new Event('change')
    );
}

// ======================================
// LOCALIZACION -> SINTOMAS
// ======================================

document.getElementById(
    'select-localizacion'
).addEventListener('change', e => {

    const locId =
        String(e.target.value).trim();

    console.log(
        'LOCALIZACION:',
        locId
    );

    const secSintomas =
        document.getElementById(
            'sec-sintomas'
        );

    const selectSintoma =
        document.getElementById(
            'select-sintoma'
        );

    if (!locId) {

        secSintomas.classList.add(
            'hidden'
        );

        return;
    }

    // ======================================
    // mapeo_localizacion.csv
    //
    // [0] ID interno
    // [1] ID_Enfermedad
    // [2] ID_Localizacion
    // ======================================

    const enfIds = db.mapeo
        .filter(m => {

            return (
                String(m[2]).trim() ===
                locId
            );
        })
        .map(m =>
            String(m[1]).trim()
        );

    console.log(
        'ENFERMEDADES:',
        enfIds
    );

    // ======================================
    // diagnostico_criterio.csv
    //
    // [0] ID interno
    // [1] ID_Enfermedad
    // [2] ID_Sintoma
    // [3] ID_Signo
    // ======================================

    const sintIds = db.criterios
        .filter(c => {

            return enfIds.includes(
                String(c[1]).trim()
            );
        })
        .map(c =>
            String(c[2]).trim()
        );

    console.log(
        'SINTOMAS:',
        sintIds
    );

    const unicos =
        [...new Set(sintIds)];

    selectSintoma.innerHTML =
        '<option value="">Seleccione un síntoma...</option>';

    unicos.forEach(sId => {

        const sData =
            db.sintomas.find(s => {

                return (
                    String(s[0]).trim() ===
                    sId
                );
            });

        console.log(
            'SINTOMA:',
            sId,
            sData
        );

        if (sData) {

            const opt =
                document.createElement(
                    'option'
                );

            opt.value = sId;

            opt.textContent =
                sData[1];

            selectSintoma.appendChild(
                opt
            );
        }
    });

    secSintomas.classList.remove(
        'hidden'
    );

    document.getElementById(
        'sec-signos'
    ).classList.add(
        'hidden'
    );

    document.getElementById(
        'resultado'
    ).classList.add(
        'hidden'
    );
});

// ======================================
// SINTOMA -> SIGNOS
// ======================================

document.getElementById(
    'select-sintoma'
).addEventListener('change', e => {

    const sId =
        String(e.target.value).trim();

    console.log(
        'SINTOMA:',
        sId
    );

    const selectSigno =
        document.getElementById(
            'select-signo'
        );

    const secSignos =
        document.getElementById(
            'sec-signos'
        );

    if (!sId) {

        secSignos.classList.add(
            'hidden'
        );

        return;
    }

    const signoIds =
        db.criterios
        .filter(c => {

            return (
                String(c[2]).trim() ===
                sId
            );
        })
        .map(c =>
            String(c[3]).trim()
        )
        .filter(v => v !== '');

    console.log(
        'SIGNOS:',
        signoIds
    );

    selectSigno.innerHTML =
        '<option value="NINGUNO">Ninguno / No se observa</option>';

    [...new Set(signoIds)]
    .forEach(sgId => {

        const sgData =
            db.signos.find(sg => {

                return (
                    String(sg[0]).trim() ===
                    sgId
                );
            });

        if (sgData) {

            const opt =
                document.createElement(
                    'option'
                );

            opt.value = sgId;

            opt.textContent =
                sgData[1];

            selectSigno.appendChild(
                opt
            );
        }
    });

    secSignos.classList.remove(
        'hidden'
    );

    mostrarDiagnostico();
});

// ======================================
// CAMBIO SIGNO
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
        String(
            document.getElementById(
                'select-sintoma'
            ).value
        ).trim();

    const sgId =
        String(
            document.getElementById(
                'select-signo'
            ).value
        ).trim();

    const res =
        document.getElementById(
            'resultado'
        );

    if (!sId) return;

    let match =
        db.criterios.find(c => {

            const sintoma =
                String(c[2]).trim();

            const signo =
                String(c[3]).trim();

            if (
                sgId !== 'NINGUNO'
            ) {

                return (
                    sintoma === sId &&
                    signo === sgId
                );
            }

            return sintoma === sId;
        });

    console.log(
        'MATCH:',
        match
    );

    if (!match) return;

    const eId =
        String(match[1]).trim();

    // ======================================
    // enfermedades.csv
    //
    // [0] ID_Enfermedad
    // [1] Nombre_Comun
    // [2] Agente_Causal
    // ======================================

    const eData =
        db.enfermedades.find(e => {

            return (
                String(e[0]).trim() ===
                eId
            );
        });

    console.log(
        'ENFERMEDAD:',
        eData
    );

    // ======================================
    // manejo_seguridad.csv
    //
    // [0] ID_Manejo
    // [1] ID_Enfermedad
    // [2] Recomendacion
    // [3] Tipo
    // [4] Alerta
    // ======================================

    const mData =
        db.manejo.find(m => {

            return (
                String(m[1]).trim() ===
                eId
            );
        });

    console.log(
        'MANEJO:',
        mData
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
            ? mData[2]
            : 'Consulte la guía técnica';

    const alerta =
        document.getElementById(
            'alerta-seguridad'
        );

    const tox =
        mData
            ? mData[4]
            : '';

    alerta.textContent =
        tox
            ? 'Alerta Marbete: ' + tox
            : '';

    alerta.className = '';

    if (
        tox.toLowerCase()
        .includes('verde')
    ) {

        alerta.classList.add(
            'marbete-verde'
        );
    }
    else if (
        tox.toLowerCase()
        .includes('azul')
    ) {

        alerta.classList.add(
            'marbete-azul'
        );
    }
    else if (
        tox.toLowerCase()
        .includes('amarillo')
    ) {

        alerta.classList.add(
            'marbete-amarillo'
        );
    }
    else if (
        tox.toLowerCase()
        .includes('rojo')
    ) {

        alerta.classList.add(
            'marbete-rojo'
        );
    }

    res.classList.remove(
        'hidden'
    );
}

// ======================================
// INICIO
// ======================================

init();
