const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxsKfsQ--Y1h4ub-o3hoT6lladiHt389M6O4xgyHvS68XwAWchQI4DJ3qMfZ_4NotfuXQ/exec";
const SESSION_KEY = "usuarioVentasGastos";

// El login es una página independiente: solo redirige si la sesión es válida.
// Esto evita ciclos cuando localStorage contiene JSON incompleto o corrupto.
function obtenerSesionValida() {
  try {
    const sesion = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return sesion && typeof sesion.usuario === "string" && sesion.usuario.trim()
      ? sesion
      : null;
  } catch (_) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

if (obtenerSesionValida()) {
  window.location.replace("./datos.html");
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const mensaje = document.getElementById("loginMensaje");
  const boton = event.currentTarget.querySelector("button[type=submit]");
  const datos = {
    action: "login",
    usuario: document.getElementById("usuario").value.trim(),
    password: document.getElementById("password").value.trim()
  };

  mensaje.textContent = "Validando...";
  mensaje.className = "mt-4 text-center text-sm font-medium text-neutral-500";
  boton.disabled = true;

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(datos)
    });
    const result = await response.json();

    if (!result.success || !result.usuario) {
      mensaje.textContent = result.error || "Usuario o contraseña incorrectos";
      mensaje.className = "mt-4 text-center text-sm font-medium text-red-600";
      return;
    }

    // Se guarda el objeto completo para poder enviar siempre el usuario al backend.
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      usuario: result.usuario,
      tipoAcceso: result.tipoAcceso || "Empleado",
      canViewDashboard: Boolean(result.canViewDashboard)
    }));
    window.location.replace("./datos.html");
  } catch (error) {
    console.error("Error de login:", error);
    mensaje.textContent = "Error de conexión con el servidor";
    mensaje.className = "mt-4 text-center text-sm font-medium text-red-600";
  } finally {
    boton.disabled = false;
  }
});
