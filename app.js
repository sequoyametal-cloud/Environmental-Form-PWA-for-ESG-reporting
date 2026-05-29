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

    proj4.defs(
        "EPSG:32717",
        "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs"
    );

    const resultado = proj4(
        "EPSG:4326",
        "EPSG:32717",
        [lon, lat]
    );

    return {
        easting: resultado[0],
        northing: resultado[1]
    };
}
function guardarReporteLocal() {

    const fecha = document.getElementById("fecha").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const departamento = document.getElementById("departamento").value.trim();
    const ubicacionEvento = document.getElementById("ubicacionEvento").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const archivoFoto =
    document.getElementById("fotos").files[0];

    if (!fecha || !nombre || !departamento || !ubicacionEvento || !descripcion) {
        document.getElementById("estadoFormulario").innerHTML =
            "<span class='error'>Complete los campos obligatorios marcados con *.</span>";
        return;
    }

    const reporte = {
        marcaLocal: new Date().toISOString(),
        estadoLocal: "pendiente",

        fecha: fecha,
        nombre: nombre,
        departamento: departamento,
        ubicacionEvento: ubicacionEvento,
        tipoObservacion: document.getElementById("tipoObservacion").value,
        descripcion: descripcion,
        categoria: document.getElementById("categoria").value,
        accionCorrectiva: document.getElementById("accionCorrectiva").value,
        departamentoEncargado: document.getElementById("departamentoEncargado").value,

        latitud: ultimaLat,
        longitud: ultimaLon,
        x: ultimoEsteUTM,
        y: ultimoNorteUTM,
        altitud: ultimaAltitud,
        errorGps: ultimaPrecision
    };

if (archivoFoto) {

    const reader = new FileReader();

    reader.onload = function(event) {

        reporte.fotos = [
            {
                nombre: archivoFoto.name,
                mimeType: archivoFoto.type,
                data: event.target.result
            }
        ];
        
       console.log("Foto guardada en reporte:", reporte.fotos);
        
        guardarReporteEnIndexedDB(reporte);
    };

    reader.readAsDataURL(archivoFoto);

} else {

    reporte.fotos = [];

    guardarReporteEnIndexedDB(reporte);
}

}

    window.addEventListener("load", function() {

        navigator.serviceWorker.register("service-worker.js")
            .then(function(registration) {
                console.log(
                    "Service Worker registrado:",
                    registration.scope
                );
            })
            .catch(function(error) {
                console.error(
                    "Error registrando Service Worker:",
                    error
                );
            });

    });

}
if ("serviceWorker" in navigator) {

    window.addEventListener("load", function() {

        navigator.serviceWorker.register("service-worker.js")
            .then(function(registration) {
                console.log(
                    "Service Worker registrado:",
                    registration.scope
                );
            })
            .catch(function(error) {
                console.error(
                    "Error registrando Service Worker:",
                    error
                );
            });

    });

}
