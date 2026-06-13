const size = 5; // 5x5, 7x7, 9x9...

const grid = document.getElementById("grid");

for (let row = 0; row < size; row++) {
  const rowEl = document.createElement("div");
  rowEl.className = "row";

  for (let col = 0; col < size; col++) {
    const hex = document.createElement("div");
    hex.className = "hex";

    // coordonnées logiques
    hex.dataset.row = row;
    hex.dataset.col = col;

    hex.textContent = `${col},${row}`;

    rowEl.appendChild(hex);
  }

  grid.appendChild(rowEl);
}