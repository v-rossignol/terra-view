hexWidth = 100
hexHeight = 86
verticalStep = 64.5

for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {

        const screenX =
            x * hexWidth +
            (y % 2) * (hexWidth / 2);

        const screenY =
            y * (hexHeight * 0.75);

        drawHex(screenX, screenY);
    }
}