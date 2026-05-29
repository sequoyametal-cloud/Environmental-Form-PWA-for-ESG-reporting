console.log("ENVIRONMENTAL FORM PWA iniciado");

let ultimaLat = null;
let ultimaLon = null;
let ultimaPrecision = null;
let ultimaAltitud = null;

let ultimoEsteUTM = null;
let ultimoNorteUTM = null;

let coordenadaFijada = false;
let watchId = null;

document.addEventListener("DOMContentLoaded", function () {
    console.log("Aplicación cargada correctamente");

    actualizarEstadoConexion();

    window.addEventListener("online", actualizarEstadoConexion);
    window.addEventListener("offline", actualizarEstadoConexion);
});

function actualizarEstadoConexion() {
    const estado = document.getElementById("estadoConexion");

    if (!estado) return;

    if (navigator.onLine) {
        estado.innerHTML = "<span class='ok'>Conectado</span>";
    } else {
        estado.innerHTML = "<span class='error'>Sin conexión</span>";
    }
}

function generarCoordenada() {
    if (!navigator.geolocation) {
        document.getElementById("estadoGPS").innerHTML =
            "<span class='error'>GPS no soportado por este dispositivo.</span>";
        return;
    }

    if (coordenadaFijada) {
        document.getElementById("estadoGPS").innerHTML =
            "<span class='ok'>La coordenada ya fue fijada.</span>";
        return;
    }

    document.getElementById("estadoGPS").innerHTML =
        "Buscando coordenada GPS...";

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }

    watchId = navigator.geolocation.watchPosition(
        procesarCoordenada,
        mostrarErrorGPS,
        {
            enableHighAccuracy: true,
            timeout: 60000,
            maximumAge: 1000
        }
    );
}

function procesarCoordenada(position) {
    ultimaLat = position.coords.latitude;
    ultimaLon = position.coords.longitude;
    ultimaPrecision = position.coords.accuracy;
    ultimaAltitud = position.coords.altitude;

    const utm = convertirLatLonAUTM17S(ultimaLat, ultimaLon);

    ultimoEsteUTM = utm.easting;
    ultimoNorteUTM = utm.northing;

    actualizarVistaCoordenada(false);
}

function fijarCoordenada() {
    if (ultimoEsteUTM === null || ultimoNorteUTM === null) {
        document.getElementById("estadoGPS").innerHTML =
            "<span class='error'>Primero genere una coordenada.</span>";
        return;
    }

    coordenadaFijada = true;

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    actualizarVistaCoordenada(true);

    document.getElementById("estadoGPS").innerHTML =
        "<span class='ok'>Coordenada fijada correctamente.</span>";
}

function reiniciarCoordenada() {
    coordenadaFijada = false;

    ultimaLat = null;
    ultimaLon = null;
    ultimaPrecision = null;
    ultimaAltitud = null;

    ultimoEsteUTM = null;
    ultimoNorteUTM = null;

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    document.getElementById("xTexto").textContent = "No disponible";
    document.getElementById("yTexto").textContent = "No disponible";
    document.getElementById("altitudTexto").textContent = "No disponible";
    document.getElementById("errorTexto").textContent = "No disponible";

    document.getElementById("estadoGPS").innerHTML =
        "Coordenada reiniciada.";
}

function actualizarVistaCoordenada(fijada) {
    const altitudTexto =
        ultimaAltitud !== null && ultimaAltitud !== undefined
            ? ultimaAltitud.toFixed(0)
            : "ND";

    document.getElementById("xTexto").textContent =
        ultimoEsteUTM.toFixed(0);

    document.getElementById("yTexto").textContent =
        ultimoNorteUTM.toFixed(0);

    document.getElementById("altitudTexto").textContent =
        altitudTexto;

    document.getElementById("errorTexto").textContent =
        "±" + ultimaPrecision.toFixed(1) + " m";

    if (!fijada) {
        document.getElementById("estadoGPS").innerHTML =
            "Coordenada en tiempo real. Fije la coordenada cuando el error GPS sea aceptable.";
    }
}

function mostrarErrorGPS(error) {
    let mensaje = "Error GPS desconocido.";

    if (error.code === 1) {
        mensaje = "Permiso GPS denegado. Active ubicación en el navegador.";
    } else if (error.code === 2) {
        mensaje = "No se pudo obtener ubicación GPS.";
    } else if (error.code === 3) {
        mensaje = "Tiempo agotado buscando GPS.";
    }

    document.getElementById("estadoGPS").innerHTML =
        "<span class='error'>" + mensaje + "</span>";
}

/*
   Conversión aproximada WGS84 Lat/Lon a UTM Zona 17S
*/
function convertirLatLonAUTM17S(lat, lon) {
    const a = 6378137.0;
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const e = Math.sqrt(f * (2 - f));
    const lon0 = -81 * Math.PI / 180;

    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;

    const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) ** 2);
    const T = Math.tan(latRad) ** 2;
    const C = (e * e / (1 - e * e)) * Math.cos(latRad) ** 2;
    const A = Math.cos(latRad) * (lonRad - lon0);

    const M =
        a *
        (
            (1 - e ** 2 / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256) * latRad
            - (3 * e ** 2 / 8 + 3 * e ** 4 / 32 + 45 * e ** 6 / 1024) * Math.sin(2 * latRad)
            + (15 * e ** 4 / 256 + 45 * e ** 6 / 1024) * Math.sin(4 * latRad)
            - (35 * e ** 6 / 3072) * Math.sin(6 * latRad)
        );

    const easting =
        k0 *
        N *
        (
            A +
            (1 - T + C) * A ** 3 / 6 +
            (5 - 18 * T + T ** 2 + 72 * C - 58 * (e * e / (1 - e * e))) * A ** 5 / 120
        ) + 500000;

    let northing =
        k0 *
        (
            M +
            N *
            Math.tan(latRad) *
            (
                A ** 2 / 2 +
                (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 +
                (61 - 58 * T + T ** 2 + 600 * C - 330 * (e * e / (1 - e * e))) * A ** 6 / 720
            )
        );

    if (lat < 0) {
        northing += 10000000;
    }

    return {
        easting: easting,
        northing: northing
    };
}
function generarCoordenada() {
    alert("Botón Generar coordenada funcionando");
}

function fijarCoordenada() {
    alert("Botón Fijar coordenada funcionando");
}

function reiniciarCoordenada() {
    alert("Botón Reiniciar funcionando");
}
