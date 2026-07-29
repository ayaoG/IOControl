/*
============================================================
POLYMER UNIT - HORIZONTAL INSTRUMENT READING
Weintek EasyBuilder Pro JS Object

Design size: 200 x 30 px
Layout: instrument name | reading | unit
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 200;
var DESIGN_HEIGHT = 30;
var config = this.config || {};

var instrumentName = config.instrumentName || "INSTRUMENT";
var readingUnit = config.readingUnit || "";
var readingDecimals = Math.max(
    0,
    Math.min(3, Math.round(safeNumber(config.readingDecimals, 1)))
);

var readingValue = 0;
var readingKnown = false;

var colour = {
    surface: "#FFFFFF",
    line: "#DCE4EA",
    label: "#71808A",
    reading: "#607580",
    unit: "#87959D"
};

function safeNumber(input, fallback) {
    var result = Number(input);
    return isFinite(result) ? result : fallback;
}

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

function drawWidget(ctx) {
    var unitRight = 189;
    var unitGap = 4;
    var unitWidth;

    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 1, 1, 198, 28, 6);
    ctx.fill();

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    roundedRect(ctx, 1, 1, 198, 28, 6);
    ctx.stroke();

    ctx.fillStyle = colour.label;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(instrumentName, 10, 15);

    ctx.fillStyle = colour.unit;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "right";
    ctx.fillText(readingUnit, unitRight, 15);
    unitWidth = ctx.measureText(readingUnit).width;

    ctx.fillStyle = colour.reading;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
        readingKnown
            ? readingValue.toFixed(readingDecimals)
            : "---",
        unitRight - unitWidth - unitGap,
        15
    );
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

if (
    config.readingSub &&
    typeof config.readingSub.onResponse === "function"
) {
    config.readingSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "Instrument reading subscription error: " +
                String(error.message || error)
            );
            return;
        }
        if (data && data.values && data.values.length > 0) {
            var value = Number(data.values[0]);
            if (isFinite(value)) {
                readingValue = value;
                readingKnown = true;
                draw();
            }
        }
    });
}

draw();
