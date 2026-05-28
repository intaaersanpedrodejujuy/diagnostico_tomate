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

    console.log(
        'LOCALIZACION URL:',
        locId
    );

    const select =
        document.getElementById(
            'select-localizacion'
        );

    // Cargar opciones ocultas
    db.partes.forEach(row => {

        const opt =
            document.createElement('option');

        opt.value =
            String(row[0]).trim();

        opt.textContent =
            row[1];

        select.appendChild(opt);
    });

    // Seleccionar automáticamente
    select.value = locId;

    // Mostrar nombre elegido
    const parte =
        db.partes.find(p =>
            String(p[0]).trim() === locId
        );

    if (
        parte &&
        document.getElementById(
            'parte-seleccionada'
        )
    ) {

        document.getElementById(
            'parte-seleccionada'
        ).textContent =
            parte[1];
    }

    // Disparar evento para cargar síntomas
    select.dispatchEvent(
        new Event('change')
    );
}
