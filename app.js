console.log("ENVIRONMENTAL FORM PWA iniciado");

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "Aplicación cargada correctamente"
    );

    actualizarEstadoConexion();

    window.addEventListener(
      "online",
      actualizarEstadoConexion
    );

    window.addEventListener(
      "offline",
      actualizarEstadoConexion
    );

  }
);

function actualizarEstadoConexion() {

  if (navigator.onLine) {

    console.log("Conectado");

  } else {

    console.log("Sin conexión");

  }

}
