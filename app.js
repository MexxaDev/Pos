/**********************
 * PRODUCTOS (desde JSON)
 **********************/
let productos = {};

// Cargar productos desde productos.json
fetch("productos.json")
  .then(res => res.json())
  .then(data => {
    productos = data;
    console.log("Productos cargados:", productos);
  })
  .catch(err => {
    console.error("Error cargando productos:", err);
    alert("No se pudieron cargar los productos");
  });

/**********************
 * ESTADO
 **********************/
let carrito = [];

/**********************
 * ELEMENTOS DOM
 **********************/
const tablaBody = document.getElementById("tablaBody");
const statItems = document.getElementById("statItems");
const statCantidad = document.getElementById("statCantidad");
const statTotal = document.getElementById("statTotal");

const codigoInput = document.getElementById("codigoInput");
const cantidadInput = document.getElementById("cantidadInput");
const medioPagoSelect = document.getElementById("medioPago");

/**********************
 * EVENTOS
 **********************/
document.getElementById("btnAgregar").addEventListener("click", agregarProducto);
document.getElementById("btnLimpiar").addEventListener("click", limpiarCarrito);
document.getElementById("btnWhatsapp").addEventListener("click", enviarWhatsApp);
document.getElementById("btnImprimir").addEventListener("click", imprimirTicket);
document.getElementById("btnCerrarCaja").addEventListener("click", cerrarCaja);

/**********************
 * FUNCIONES
 **********************/
function agregarProducto() {
  const codigo = codigoInput.value.toLowerCase().trim();
  const cantidad = parseInt(cantidadInput.value);

  if (!productos[codigo]) {
    alert("Producto no encontrado");
    return;
  }

  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Cantidad inválida");
    return;
  }

  const producto = productos[codigo];
  const existente = carrito.find(p => p.codigo === codigo);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      nombre: producto.nombre,
      codigo: producto.codigo,
      precio: producto.precio,
      cantidad: cantidad
    });
  }

  codigoInput.value = "";
  cantidadInput.value = 1;

  renderCarrito();
}

function renderCarrito() {
  tablaBody.innerHTML = "";

  let total = 0;
  let cantidadTotal = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    cantidadTotal += item.cantidad;

    const row = document.createElement("div");
    row.className = "tabla-row";
    

    row.innerHTML = `
      <span>${item.nombre}</span>
      <span>${item.codigo}</span>
      <span>$${item.precio}</span>
      <span>${item.cantidad}</span>
      <span>$${subtotal}</span>
      <span class="trash" onclick="eliminarProducto(${index})">🗑</span>
    `;

    tablaBody.appendChild(row);
  });

  statItems.innerText = carrito.length;
  statCantidad.innerText = cantidadTotal;
  statTotal.innerText = `$${total}`;
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

function limpiarCarrito() {
  if (carrito.length === 0) return;

  if (confirm("¿Seguro que querés limpiar el carrito?")) {
    carrito = [];
    renderCarrito();
  }
}

/**********************
 * WHATSAPP
 **********************/
function enviarWhatsApp() {
  const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

  if (ventas.length === 0) {
    alert("No hay ventas registradas");
    return;
  }

  let totalEfectivo = 0;
  let totalTransferencia = 0;
  let totalCaja = 0;

  let resumenProductos = {};

  ventas.forEach(venta => {
    venta.items.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      totalCaja += subtotal;

      if (venta.medioPago === "Efectivo") {
        totalEfectivo += subtotal;
      } else if (venta.medioPago === "Transferencia") {
        totalTransferencia += subtotal;
      }

      if (!resumenProductos[item.nombre]) {
        resumenProductos[item.nombre] = {
          cantidad: 0,
          total: 0
        };
      }

      resumenProductos[item.nombre].cantidad += item.cantidad;
      resumenProductos[item.nombre].total += subtotal;
    });
  });

  const fecha = new Date().toLocaleDateString();

  let mensaje = `📦 *CIERRE DE CAJA*%0A`;
  mensaje += `📅 Fecha: ${fecha}%0A%0A`;

  mensaje += `💵 Efectivo: $${totalEfectivo}%0A`;
  mensaje += `🏦 Transferencia: $${totalTransferencia}%0A`;
  mensaje += `🧾 TOTAL: $${totalCaja}%0A%0A`;

  mensaje += `📋 *Detalle:*%0A`;

  for (let producto in resumenProductos) {
    const p = resumenProductos[producto];
    mensaje += `- ${producto} x${p.cantidad} $${p.total}%0A`;
  }

  const url = `https://api.whatsapp.com/send?phone=543496578813&text=${mensaje}`;
  window.open(url, "_blank");
}

/**********************
 * IMPRESIÓN (TICKET)
 **********************/
function imprimirTicket() {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const fecha = new Date().toLocaleString();
  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  const ticketDiv = document.getElementById("ticket-print");

  let html = `
    <div>
    <br>
      <div class="left">GG BEACH HOUSE</div>
      <p class="left">Costanera Este - Santa Fe</p>
      <p>Fecha: ${fecha}</p>  
  `;

  carrito.forEach(item => {
    html += `
      <div class="ticket-item">
        <span>${item.nombre} x${item.cantidad} &nbsp;</span>
        <span>$${item.precio * item.cantidad}</span>
      </div>
    `;
  });

  html += `
      <div class="ticket-line"></div>
      <div class="ticket-total">
        <br>
        <p>----------</p>
        <span>TOTAL</span>
        <span>$${total}</span>
        <p>----------</p>

      </div>
      <br>
      &nbsp;
      <p>Gracias por su compra &nbsp;</p>
      <br>
    </div>
  `;

  ticketDiv.innerHTML = html;
  window.print();

  setTimeout(() => {
    ticketDiv.innerHTML = "";
  }, 500);

  // Guardamos la venta **solo una vez antes de limpiar el carrito**
  guardarVenta(fecha);

  // Limpiamos el carrito
  carrito = [];
  renderCarrito();
}

/**********************
 * GUARDAR VENTA
 **********************/
function guardarVenta(fecha) {
  const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

  ventas.push({
    fecha: fecha,
    medioPago: medioPagoSelect.value,
    items: JSON.parse(JSON.stringify(carrito))
  });

  localStorage.setItem("ventas", JSON.stringify(ventas));
}

/**********************
 * CIERRE DE CAJA
 **********************/
function cerrarCaja() {
  const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

  if (ventas.length === 0) {
    alert("No hay ventas para cerrar la caja");
    return;
  }

  const fechaCierre = new Date().toLocaleString();
  let csv = "CIERRE DE CAJA\n";
  csv += `Fecha cierre,${fechaCierre}\n\n`;
  csv += "Fecha Venta,Producto,Cantidad,Precio Unitario,Total,Medio Pago\n";

  let totalCaja = 0;
  let totalEfectivo = 0;
  let totalTransferencia = 0;

  ventas.forEach(venta => {
    venta.items.forEach(item => {
      const totalItem = item.precio * item.cantidad;
      totalCaja += totalItem;

      if (venta.medioPago === "Efectivo") totalEfectivo += totalItem;
      else if (venta.medioPago === "Transferencia") totalTransferencia += totalItem;

      csv += `${venta.fecha},${item.nombre},${item.cantidad},${item.precio},${totalItem},${venta.medioPago}\n`;
    });
  });

  // Agregamos los totales al final
  csv += "\n";
  csv += `TOTAL GENERAL,,,,${totalCaja}\n`;
  csv += `TOTAL EFECTIVO,,,,${totalEfectivo}\n`;
  csv += `TOTAL TRANSFERENCIA,,,,${totalTransferencia}\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `cierre_caja_${fechaCierre.replace(/[/: ]/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (confirm("Caja cerrada. ¿Desea limpiar las ventas para una nueva caja?")) {
    localStorage.removeItem("ventas");
  }
}

const toggle = document.getElementById("toggleTheme");

toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if(document.body.classList.contains("dark")){
    toggle.textContent = "☀️";
  } else {
    toggle.textContent = "🌙";
  }
});

