const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxsKfsQ--Y1h4ub-o3hoT6lladiHt389M6O4xgyHvS68XwAWchQI4DJ3qMfZ_4NotfuXQ/exec";
const SESSION_KEY = "usuarioVentasGastos";
const session = readSession();

if (!session || typeof session.usuario !== "string" || !session.usuario.trim()) {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("./login.html");
  throw new Error("Sesión no encontrada");
}

const appView = document.getElementById("appView");
const dashboardView = document.getElementById("dashboardView");
const tipo = document.getElementById("tipo");
const fecha = document.getElementById("fecha");
const clienteBox = document.getElementById("clienteBox");
const expenseTypeBox = document.getElementById("expenseTypeBox");
const tipoGasto = document.getElementById("tipoGasto");
const tipoTexto = document.getElementById("tipoTexto");
const tipoIcono = document.getElementById("tipoIcono");
const tipoChevron = document.getElementById("tipoChevron");
const selectButton = document.getElementById("selectButton");
const selectMenu = document.getElementById("selectMenu");

// datos.html inicia oculto para evitar mostrarlo sin sesión.
// Una vez validada la sesión guardada, se muestra la aplicación.
appView.classList.remove("hidden");

let resumenChart = null;
let gastosPieChart = null;
let clientesPieChart = null;

fecha.valueAsDate = new Date();
document.getElementById("usuarioActivo").textContent = "Usuario: " + session.usuario;
actualizarFormulario();

document.getElementById("registroForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const mensaje = document.getElementById("mensaje");
  const tipoValor = String(tipo.value || "").trim();

  if (tipoValor === "gasto" && !tipoGasto.value) {
    mensaje.textContent = "Seleccioná el tipo de gasto";
    mensaje.className = "mt-4 text-center text-sm font-medium text-red-600";
    return;
  }

  // El usuario se envía explícitamente; Apps Script lo registra en la última columna.
  const datos = {
    usuario: session.usuario,
    usuarioActivo: session.usuario,
    tipo: tipoValor,
    fecha: document.getElementById("fecha").value,
    descripcion: document.getElementById("descripcion").value.trim(),
    monto: document.getElementById("monto").value
  };

  if (tipoValor === "venta") {
    datos.cliente = document.getElementById("cliente").value.trim();
  }

  if (tipoValor === "gasto") {
    datos.tipoGasto = String(tipoGasto.value || "").trim();
  }

  if (tipoValor === "gasto_personal") {
    // Este valor debe coincidir exactamente con APP_CFG.TYPES.PERSONAL_EXPENSE.
    datos.tipo = "gasto_personal";
  }

  mensaje.textContent = "Guardando...";
  mensaje.className = "mt-4 text-center text-sm font-medium text-neutral-500";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(datos)
    });
    const result = await response.json();

    if (!result.success) {
      mensaje.textContent = result.error || "No se pudo guardar";
      mensaje.className = "mt-4 text-center text-sm font-medium text-red-600";
      return;
    }

    if (tipoValor === "gasto_personal" && result.tipo !== "gasto_personal") {
      console.warn("El backend respondió un tipo inesperado:", result);
    }

    mensaje.textContent = "Registro guardado correctamente";
    mensaje.className = "mt-4 text-center text-sm font-medium text-[#73a35a]";
    document.getElementById("registroForm").reset();
    tipo.value = "venta";
    tipoTexto.textContent = "Venta";
    tipoIcono.className = "type-icon type-icon-sale";
    tipoIcono.innerHTML = '<i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>';
    tipoChevron.classList.remove("rotate-180");
    tipoGasto.value = "";
    fecha.valueAsDate = new Date();
    actualizarFormulario();
  } catch (error) {
    console.error("Error al guardar:", error);
    mensaje.textContent = "Error de conexión al guardar";
    mensaje.className = "mt-4 text-center text-sm font-medium text-red-600";
  }
});

selectButton.addEventListener("click", () => {
  const abierto = selectMenu.classList.toggle("hidden") === false;
  selectButton.setAttribute("aria-expanded", String(abierto));
  tipoChevron.classList.toggle("rotate-180", abierto);
});

document.querySelectorAll(".dropdown-option").forEach((option) => {
  option.addEventListener("click", () => {
    const value = option.dataset.value;
    tipo.value = value;
    tipoTexto.textContent = option.querySelector("strong").textContent;
    tipoIcono.className = "type-icon " + (value === "venta" ? "type-icon-sale" : value === "gasto" ? "type-icon-expense" : "type-icon-personal");
    tipoIcono.innerHTML = value === "venta"
      ? '<i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>'
      : value === "gasto"
        ? '<i class="fa-solid fa-receipt" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-user" aria-hidden="true"></i>';
    selectMenu.classList.add("hidden");
    selectButton.setAttribute("aria-expanded", "false");
    tipoChevron.classList.remove("rotate-180");
    actualizarFormulario();
  });
});

document.querySelectorAll(".expense-option").forEach((option) => {
  option.addEventListener("click", () => {
    tipoGasto.value = option.dataset.expenseType;
    document.querySelectorAll(".expense-option").forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
  });
});

document.addEventListener("click", (event) => {
  if (!selectButton.contains(event.target) && !selectMenu.contains(event.target)) {
    selectMenu.classList.add("hidden");
    selectButton.setAttribute("aria-expanded", "false");
    tipoChevron.classList.remove("rotate-180");
  }
});

document.querySelector('[onclick="cerrarSesion()"]').removeAttribute("onclick");
document.querySelector('[onclick="cerrarSesion()"]').addEventListener("click", cerrarSesion);
document.querySelector('[onclick="mostrarDashboard()"]').removeAttribute("onclick");
document.querySelector('[onclick="mostrarDashboard()"]').addEventListener("click", mostrarDashboard);
document.querySelector('[onclick="mostrarFormulario()"]').removeAttribute("onclick");
document.querySelector('[onclick="mostrarFormulario()"]').addEventListener("click", mostrarFormulario);

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch (_) { return null; }
}

function actualizarFormulario() {
  const esVenta = tipo.value === "venta";
  const esGasto = tipo.value === "gasto";
  clienteBox.classList.toggle("hidden", !esVenta);
  expenseTypeBox.classList.toggle("hidden", !esGasto);
  if (!esVenta) document.getElementById("cliente").value = "";
  if (!esGasto) {
    tipoGasto.value = "";
    document.querySelectorAll(".expense-option").forEach((item) => item.classList.remove("selected"));
  }
}

function mostrarDashboard() {
  appView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  cargarGraficoResumen();
}

function mostrarFormulario() {
  dashboardView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("./login.html");
}

async function cargarGraficoResumen() {
  const errorGrafico = document.getElementById("errorGrafico");
  errorGrafico.textContent = "Cargando...";
  try {
    const response = await fetch(WEB_APP_URL);
    const data = await response.json();
    const resumenData = Array.isArray(data) ? data : (data.resumen || []);
    const gastosAltos = data.gastosAltos || [];
    const clientesTop = data.clientesTop || [];
    const labels = resumenData.map((item) => item.mes);
    const ventas = resumenData.map((item) => item.ventas);
    const gastos = resumenData.map((item) => item.gastos);
    const personales = resumenData.map((item) => item.personales);
    const utilidad = resumenData.map((item) => item.utilidad);

    if (resumenChart) resumenChart.destroy();
    if (gastosPieChart) gastosPieChart.destroy();
    if (clientesPieChart) clientesPieChart.destroy();

    resumenChart = new Chart(document.getElementById("resumenChart"), {
      type: "bar",
      data: { labels, datasets: [
        { label: "Ventas", data: ventas, backgroundColor: "#ec1665", borderRadius: 10 },
        { label: "Gastos", data: gastos, backgroundColor: "#f698ac", borderRadius: 10 },
        { label: "Gastos personales", data: personales, backgroundColor: "#addc9e", borderRadius: 10 },
        { label: "Utilidad", data: utilidad, backgroundColor: utilidad.map((v) => v < 0 ? "#dc2626" : "#73a35a"), borderRadius: 10 }
      ]},
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "bottom" } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: false } } }
    });
    gastosPieChart = crearGraficoPastel("gastosPieChart", gastosAltos, "Gastos");
    clientesPieChart = crearGraficoPastel("clientesPieChart", clientesTop, "Clientes");
    errorGrafico.textContent = "";
  } catch (error) {
    console.error("Error cargando resumen:", error);
    errorGrafico.textContent = "Error cargando gráfico";
  }
}

function crearGraficoPastel(canvasId, data, label) {
  if (!data.length) return null;
  return new Chart(document.getElementById(canvasId), {
    type: "doughnut",
    data: { labels: data.map((item) => item.nombre), datasets: [{ label, data: data.map((item) => item.monto), backgroundColor: ["#ec1665", "#f698ac", "#73a35a", "#addc9e", "#f97316", "#a855f7"], borderColor: "#ffffff", borderWidth: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
  });
}
