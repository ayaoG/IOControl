/*
============================================================
POLYMER UNIT - PLAIN STATUS / INSTRUMENT PANEL
Weintek EasyBuilder Pro JS Object

Design size: 437 x 150 px

Blank light-theme panel for native EasyBuilder status indicators,
labels, numeric displays, and instrument readings.
No configuration or subscriptions are required.
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 437;
var DESIGN_HEIGHT = 150;

var colour = {
    surface: "#FFFFFF",
    line: "#DCE4EA"
};

function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
    );
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawPanel(ctx) {
    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 5, 3, 427, 144, 9);
    ctx.fill();

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, 5, 3, 427, 144, 9);
    ctx.stroke();
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;

    canvas.clearRect(0, 0, width, height);

    if (width <= 0 || height <= 0) {
        return;
    }

    canvas.save();
    canvas.scale(
        width / DESIGN_WIDTH,
        height / DESIGN_HEIGHT
    );
    drawPanel(canvas);
    canvas.restore();
}

draw();
