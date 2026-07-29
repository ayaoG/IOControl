/*
============================================================
POLYMER UNIT - BOOLEAN STATUS INDICATOR
Weintek EasyBuilder Pro JS Object

Design size: 200 x 30 px
Layout: status name | ON/OFF indication
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 200;
var DESIGN_HEIGHT = 30;
var config = this.config || {};

var statusName = config.statusName || "STATUS";
var onText = config.onText || "ON";
var offText = config.offText || "OFF";

var statusValue = false;
var statusKnown = false;

var colour = {
    surface: "#FFFFFF",
    line: "#DCE4EA",
    label: "#71808A",
    unknown: "#9AA7AE",
    unknownSoft: "#EFF2F4",
    off: "#7D8A91",
    offSoft: "#E8ECEF",
    on: "#2E9B69",
    onSoft: "#DDF3E8"
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

function toBoolean(input) {
    if (typeof input === "string") {
        var text = input.toLowerCase();
        var numberValue = Number(text);
        return (
            text === "true" ||
            text === "on" ||
            (isFinite(numberValue) && numberValue !== 0)
        );
    }
    return Number(input) !== 0;
}

function drawWidget(ctx) {
    var activeColour =
        statusKnown
            ? statusValue ? colour.on : colour.off
            : colour.unknown;
    var activeSoft =
        statusKnown
            ? statusValue ? colour.onSoft : colour.offSoft
            : colour.unknownSoft;
    var activeText =
        statusKnown
            ? statusValue ? onText : offText
            : "---";

    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 1, 1, 198, 28, 6);
    ctx.fill();

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    roundedRect(ctx, 1, 1, 198, 28, 6);
    ctx.stroke();

    ctx.fillStyle = activeColour;
    ctx.beginPath();
    ctx.arc(13, 15, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colour.label;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(statusName, 24, 15);

    ctx.fillStyle = activeSoft;
    roundedRect(ctx, 142, 5, 48, 20, 10);
    ctx.fill();

    ctx.fillStyle = activeColour;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(activeText, 166, 15);
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
    config.statusSub &&
    typeof config.statusSub.onResponse === "function"
) {
    config.statusSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "Boolean status subscription error: " +
                String(error.message || error)
            );
            return;
        }
        if (data && data.values && data.values.length > 0) {
            statusValue = toBoolean(data.values[0]);
            statusKnown = true;
            draw();
        }
    });
}

draw();
