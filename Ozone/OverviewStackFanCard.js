/*
============================================================
OVERVIEW - STACK FAN HORIZONTAL CARD
Weintek EasyBuilder Pro JS Object

Object size: 818 x 92 px
Recommended position: x = 194, y = 88
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 818;
var DESIGN_HEIGHT = 92;
var config = this.config || {};

var colour = {
    panel: "#232C33",
    panelDark: "#1B242B",
    border: "#53616A",
    text: "#D6DEE3",
    muted: "#82909A",
    green: "#22C55E",
    greenDark: "#116B34",
    amber: "#F5A623",
    red: "#EF4444",
    redDark: "#811F1F",
    grey: "#7F8B94",
    greyDark: "#45515A"
};

var value = {
    status: 0,
    manual: false,
    output: 0,
    fault: 0,
    pressure: 0,
    pressureFault: false,
    ovenStart: false
};

var flashState = true;

function numberValue(input, fallback) {
    var result = Number(input);
    return isNaN(result) ? fallback : result;
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

function drawText(ctx, text, x, y, font, fill, align) {
    ctx.fillStyle = fill;
    ctx.font = font;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(String(text), x, y);
}

function statusInformation(status) {
    switch (Math.round(numberValue(status, 0))) {
        case 1:
            return { text: "STOPPED", colour: colour.grey };
        case 2:
            return { text: "RUNNING", colour: colour.green };
        case 5:
            return { text: "STARTING", colour: colour.amber };
        case 10:
            return { text: "STOPPING", colour: colour.amber };
        default:
            return { text: "UNKNOWN", colour: colour.grey };
    }
}

function faultText(code) {
    switch (Math.round(numberValue(code, 0))) {
        case 16: return "FAIL TO START";
        case 17: return "FAIL TO STOP";
        case 18: return "DRIVE FAULT";
        case 32: return "I/O FAULT";
        default: return code ? "FAULT " + code : "";
    }
}

function drawLamp(ctx, x, y, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawDivider(ctx, x) {
    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 31);
    ctx.lineTo(x, DESIGN_HEIGHT - 12);
    ctx.stroke();
}

function drawCard(ctx) {
    var info = statusInformation(value.status);
    var equipmentColour = value.fault !== 0
        ? (flashState ? colour.red : colour.redDark)
        : info.colour;
    var pressureColour = value.pressureFault
        ? (flashState ? colour.red : colour.redDark)
        : colour.text;
    var ovenColour = value.ovenStart ? colour.green : colour.grey;

    ctx.fillStyle = colour.panel;
    roundedRect(ctx, 0.5, 0.5, DESIGN_WIDTH - 1, DESIGN_HEIGHT - 1, 9);
    ctx.fill();
    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    drawText(ctx, "STACK FAN", 16, 16, "bold 12px Arial", colour.text);
    drawText(
        ctx,
        value.manual ? "MANUAL" : "AUTO",
        DESIGN_WIDTH - 16,
        16,
        "bold 10px Arial",
        value.manual ? colour.amber : colour.muted,
        "right"
    );

    ctx.strokeStyle = colour.border;
    ctx.beginPath();
    ctx.moveTo(12, 30.5);
    ctx.lineTo(DESIGN_WIDTH - 12, 30.5);
    ctx.stroke();

    drawLamp(ctx, 27, 61, equipmentColour);
    drawText(ctx, "FAN STATUS", 42, 46, "8px Arial", colour.muted);
    drawText(
        ctx,
        value.fault ? faultText(value.fault) : info.text,
        42,
        65,
        "bold 12px Arial",
        equipmentColour
    );

    drawDivider(ctx, 245);
    drawText(ctx, "VSD OUTPUT", 271, 46, "8px Arial", colour.muted);
    drawText(
        ctx,
        numberValue(value.output, 0).toFixed(1) + " " +
            (config.frequencyUnit || "Hz"),
        271,
        66,
        "bold 15px Arial",
        colour.text
    );

    drawDivider(ctx, 445);
    drawText(ctx, "STACK PRESSURE", 471, 46, "8px Arial", colour.muted);
    drawText(
        ctx,
        value.pressureFault
            ? "FAULT"
            : numberValue(value.pressure, 0).toFixed(1) + " " +
                (config.pressureUnit || "Pa"),
        471,
        66,
        "bold 15px Arial",
        pressureColour
    );

    drawDivider(ctx, 650);
    drawLamp(ctx, 679, 61, ovenColour);
    drawText(ctx, "OVEN START SIGNAL", 695, 46, "8px Arial", colour.muted);
    drawText(
        ctx,
        value.ovenStart ? "ON" : "OFF",
        695,
        65,
        "bold 13px Arial",
        ovenColour
    );
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;
    canvas.clearRect(0, 0, width, height);
    if (width <= 0 || height <= 0) return;
    canvas.save();
    canvas.scale(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    drawCard(canvas);
    canvas.restore();
}

function bind(subscription, description, update, fallback) {
    if (!subscription || typeof subscription.onResponse !== "function") {
        console.log(description + " subscription not configured");
        return;
    }
    subscription.onResponse(function (error, data) {
        if (error) {
            console.log(description + " error: " + String(error.message || error));
            update(fallback);
        } else if (data && data.values && data.values.length > 0) {
            update(data.values[0]);
        }
        draw();
    });
}

bind(config.stackFanStatusSub, "Stack fan status", function (input) {
    value.status = Math.round(numberValue(input, 0));
}, 0);
bind(config.stackFanModeSub, "Stack fan mode", function (input) {
    value.manual = numberValue(input, 0) !== 0;
}, false);
bind(config.stackFanOutputSub, "Stack fan output", function (input) {
    value.output = numberValue(input, 0);
}, 0);
bind(config.stackFanFaultSub, "Stack fan fault", function (input) {
    value.fault = Math.round(numberValue(input, 0));
}, 0);
bind(config.stackPressureSub, "Stack pressure", function (input) {
    value.pressure = numberValue(input, 0);
}, 0);
bind(config.stackPressureFaultSub, "Stack pressure fault", function (input) {
    value.pressureFault = numberValue(input, 0) !== 0;
}, true);
bind(config.ovenStartSub, "Oven start signal", function (input) {
    value.ovenStart = numberValue(input, 0) !== 0;
}, false);

setInterval(function () {
    flashState = !flashState;
    draw();
}, 500);

draw();
