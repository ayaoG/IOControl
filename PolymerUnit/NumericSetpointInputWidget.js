/*
============================================================
POLYMER UNIT - NUMERIC SETPOINT INPUT
Weintek EasyBuilder Pro JS Object

Design size: 360 x 44 px
Layout: setpoint name | native Numeric Input | unit

Native EasyBuilder Numeric Input overlay:
    x=213, y=7, width=60, height=30

The JS field is intentionally blank. Configure the native Numeric
Input with the PLC address, format, limits, and popup keypad.
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 360;
var DESIGN_HEIGHT = 44;
var config = this.config || {};

var setpointName = config.setpointName || "SETPOINT";
var setpointUnit = config.setpointUnit || "";

var colour = {
    surface: "#FFFFFF",
    field: "#F7F9FA",
    line: "#DCE4EA",
    label: "#71808A",
    unit: "#87959D"
};

function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function fillRounded(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.fillStyle = fill;
    roundedRect(ctx, x, y, width, height, radius);
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        roundedRect(ctx, x, y, width, height, radius);
        ctx.stroke();
    }
}

function fitText(ctx, input, maximumWidth) {
    var output = String(input);

    if (ctx.measureText(output).width <= maximumWidth) {
        return output;
    }

    while (
        output.length > 0 &&
        ctx.measureText(output + "...").width > maximumWidth
    ) {
        output = output.substring(0, output.length - 1);
    }

    return output + "...";
}

function drawWidget(ctx) {
    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 1, 1, 358, 42, 7);
    ctx.fill();

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    roundedRect(ctx, 1, 1, 358, 42, 7);
    ctx.stroke();

    ctx.fillStyle = colour.label;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, setpointName, 194), 9, 22);

    fillRounded(ctx, 213, 7, 60, 30, 6, colour.field, colour.line);

    ctx.fillStyle = colour.unit;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(setpointUnit, 294, 22);
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;
    canvas.clearRect(0, 0, width, height);
    if (width <= 0 || height <= 0) {
        return;
    }
    canvas.save();
    canvas.scale(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    drawWidget(canvas);
    canvas.restore();
}

draw();
