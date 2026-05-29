const DB_NAME = "ENVIRONMENTAL_FORM_PWA";
const DB_VERSION = 1;
const STORE_NAME = "reportes";

let db = null;

function iniciarBaseDatos() {

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function(event) {
        console.error("Error abriendo IndexedDB", event);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log("IndexedDB conectada correctamente");
    };

    request.onupgradeneeded = function(event) {

        db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {

            const store = db.createObjectStore(
                STORE_NAME,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

            store.createIndex(
                "fecha",
                "fecha",
                {
                    unique: false
                }
            );

            console.log("Tabla reportes creada");
        }
    };
}

function guardarReporteEnIndexedDB(datos) {

    if (!db) {
        console.error("Base de datos no disponible");
        return;
    }

    const transaction = db.transaction(
        [STORE_NAME],
        "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);

    store.add(datos);

transaction.oncomplete = function() {

    console.log("Reporte guardado localmente");

    contarPendientes();

    document.getElementById("estadoFormulario").innerHTML =
        "<span class='ok'>Reporte guardado localmente.</span>";

    document.getElementById("fecha").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("departamento").selectedIndex = 0;
    document.getElementById("ubicacionEvento").value = "";
    document.getElementById("descripcion").value = "";

    document.getElementById("tipoObservacion").selectedIndex = 0;
    document.getElementById("categoria").selectedIndex = 0;

    document.getElementById("accionCorrectiva").value = "";
    document.getElementById("departamentoEncargado").selectedIndex = 0;

};

transaction.onerror = function(event) {

    console.error(
        "Error guardando reporte",
        event
    );

};
}

function contarPendientes() {

    if (!db) return;

    const transaction = db.transaction(
        [STORE_NAME],
        "readonly"
    );

    const store = transaction.objectStore(STORE_NAME);

    const request = store.count();

    request.onsuccess = function() {

        const elemento =
            document.getElementById(
                "contadorPendientes"
            );

        if (elemento) {

            elemento.textContent =
                request.result;
        }
    };
}

document.addEventListener(
    "DOMContentLoaded",
    iniciarBaseDatos
);
function mostrarReportesPendientes() {

    if (!db) return;

    const transaction = db.transaction(
        [STORE_NAME],
        "readonly"
    );

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = function() {

        const lista =
            document.getElementById("listaPendientes");

        if (!lista) return;

        const reportes = request.result;

        if (reportes.length === 0) {
            lista.innerHTML =
                "<p>No existen reportes pendientes.</p>";
            return;
        }

        let html = "<h3>Reportes pendientes</h3>";

        reportes.forEach(function(reporte) {

            html +=
                "<div class='box'>" +
                "<b>ID local:</b> " + reporte.id + "<br>" +
                "<b>Fecha:</b> " + (reporte.fecha || "") + "<br>" +
                "<b>Nombre:</b> " + (reporte.nombre || "") + "<br>" +
                "<b>Ubicación:</b> " + (reporte.ubicacionEvento || "") + "<br>" +
                "<b>Descripción:</b> " + (reporte.descripcion || "") +
                "</div>";
        });

        lista.innerHTML = html;
    };

    request.onerror = function(event) {
        console.error(
            "Error leyendo reportes pendientes",
            event
        );
    };
}
