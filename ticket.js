const pedido = JSON.parse(localStorage.getItem("pedidoTicket"));

const itemsDiv = document.getElementById("items");
const totalDiv = document.getElementById("total");
const fechaDiv = document.getElementById("fecha");

fechaDiv.innerText = `Fecha: ${pedido.fecha}`;

pedido.items.forEach(p => {
  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <span>${p.nombre} x${p.cantidad}</span>
    <span>$${p.precio * p.cantidad}</span>
  `;

  itemsDiv.appendChild(div);
});

totalDiv.innerText = `$${pedido.total}`;

window.onload = () => {
  window.print();
};
