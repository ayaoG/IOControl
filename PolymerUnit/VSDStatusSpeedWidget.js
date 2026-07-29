/*
============================================================
POLYMER UNIT - VSD STATUS AND SPEED WIDGET
Weintek EasyBuilder Pro JS Object

Design size: 200 x 30 px
Layout: running dot | VSD name | speed reading | unit
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 200;
var DESIGN_HEIGHT = 30;
var config = this.config || {};

var vsdName = config.vsdName || "VSD";
var speedUnit = config.speedUnit || "Hz";
var speedDecimals = Math.max(
    0,
    Math.min(3, Math.round(safeNumber(config.speedDecimals, 1)))
);

var running = false;
var runningKnown = false;
var speedValue = 0;
var speedKnown = false;

var colour = {
    surface: "#FFFFFF",
    line: "#DCE4EA",
    label: "#71808A",
    reading: "#607580",
    unit: "#87959D",
    on: "#2E9B69",
    off: "#7D8A91",
    unknown: "#B9C3C9"
};

function safeNumber(input, fallback) {
    var result = Number(input);
    return isFinite(result) ? result : fallback;
}

function toBoolean(input) {
    if (typeof input === "string") {
        var text = input.toLowerCase();
        var numberValue = Number(text);
        return (
            text === "true" ||
            text === "on" ||
            text === "running" ||
            (isFinite(numberValue) && numberValue !== 0)
        );
    }
    return Number(input) !== 0;
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
    var dotColour =
        runningKnown
            ? running ? colour.on : colour.off
            : colour.unknown;
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

    ctx.fillStyle = dotColour;
    ctx.beginPath();
    ctx.arc(13, 15, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colour.label;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(vsdName, 24, 15);

    ctx.fillStyle = colour.unit;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "right";
    ctx.fillText(speedUnit, unitRight, 15);
    unitWidth = ctx.measureText(speedUnit).width;

    ctx.fillStyle = colour.reading;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
        speedKnown
            ? speedValue.toFixed(speedDecimals)
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
    config.runningSub &&
    typeof config.runningSub.onResponse === "function"
) {
    config.runningSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "VSD running subscription error: " +
                String(error.message || error)
            );
            return;
        }
        if (data && data.values && data.values.length > 0) {
            running = toBoolean(data.values[0]);
            runningKnown = true;
            draw();
        }
    });
}

if (
    config.speedSub &&
    typeof config.speedSub.onResponse === "function"
) {
    config.speedSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "VSD speed subscription error: " +
                String(error.message || error)
            );
            return;
        }
        if (data && data.values && data.values.length > 0) {
            var value = Number(data.values[0]);
            if (isFinite(value)) {
                speedValue = value;
                speedKnown = true;
                draw();
            }
        }
    });
}

draw();
