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
    renderProductos();
  })
  .catch(err => {
    console.error("Error cargando productos:", err);
    alert("No se pudieron cargar los productos");
  });

function renderProductos() {
  const container = document.getElementById("productosContainer");
  container.innerHTML = "";

  Object.values(productos).forEach(producto => {

    const card = document.createElement("div");
    card.className = "producto-card";

    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}">
      <div class="producto-nombre">${producto.nombre}</div>
      <div class="producto-precio">$${producto.precio}</div>
    `;

    card.addEventListener("click", () => {
      agregarDesdeCard(producto.codigo);
    });

    container.appendChild(card);
  });
}
function agregarDesdeCard(codigo) {
  const producto = productos[codigo];

  const existente = carrito.find(p => p.codigo === codigo);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      nombre: producto.nombre,
      codigo: producto.codigo,
      precio: producto.precio,
      cantidad: 1
    });
  }

  renderCarrito();
}

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
      <span class="trash" onclick="eliminarProducto(${index})"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg></span>
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
  const medioPago = medioPagoSelect.value;

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  const ticketDiv = document.getElementById("ticket-print");

  let html = `
    <div class="ticket-container">
      <div class="center"><strong>GG BEACH HOUSE</strong></div>
      <div class="center">Costanera Este - Santa Fe</div>
      <div class="ticket-line"></div>
      <div>Fecha: ${fecha}</div>
      <div>Pago: ${medioPago}</div>
      <div class="ticket-line"></div>
  `;

  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;

    html += `
      <div class="ticket-item">
        <span>${item.nombre} x${item.cantidad}</span>
        <span>$${subtotal}</span>
      </div>
    `;
  });

  html += `
      <div class="ticket-line"></div>
      <div class="ticket-total">
        <span>TOTAL</span>
        <span>$${total}</span>
      </div>
      <div class="ticket-line"></div>
      <div class="center">Gracias por su compra</div>
    </div>
  `;

  ticketDiv.innerHTML = html;

  window.print();

  setTimeout(() => {
    ticketDiv.innerHTML = "";
  }, 500);

  guardarVenta(fecha);

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

