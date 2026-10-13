/*
============================================================
OVERVIEW - OZONE GENERATORS HORIZONTAL CARD
Weintek EasyBuilder Pro JS Object

Object size: 818 x 244 px
Recommended position: x = 194, y = 308

Each unit displays status, output percentage, output current,
and output flow. Units and decimal places are configurable.
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 818;
var DESIGN_HEIGHT = 244;
var config = this.config || {};
var outputUnit = config.ozoneOutputUnit || "%";
var currentUnit = config.ozoneCurrentUnit || "A";
var flowUnit = config.ozoneFlowUnit || "g/h";
var outputDecimals = boundedDecimals(config.ozoneOutputDecimals, 0);
var currentDecimals = boundedDecimals(config.ozoneCurrentDecimals, 1);
var flowDecimals = boundedDecimals(config.ozoneFlowDecimals, 1);

var colour = {
    panel: "#232C33", panelDark: "#1B242B", border: "#53616A",
    text: "#D6DEE3", muted: "#82909A", green: "#22C55E",
    amber: "#F5A623", red: "#EF4444", redDark: "#811F1F",
    grey: "#7F8B94"
};

var units = [];
var flashState = true;
var index;
for (index = 0; index < 5; index++) {
    units.push({ status: 0, fault: 0, output: 0, current: 0, flow: 0 });
}

function numberValue(input, fallback) {
    var result = Number(input);
    return isNaN(result) ? fallback : result;
}

function boundedDecimals(input, fallback) {
    return Math.max(0, Math.min(3, Math.round(numberValue(input, fallback))));
}

function clamp(input, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, input));
}

function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function text(ctx, input, x, y, font, fill, align) {
    ctx.fillStyle = fill; ctx.font = font; ctx.textAlign = align || "left";
    ctx.textBaseline = "middle"; ctx.fillText(String(input), x, y);
}

function statusInfo(input) {
    switch (Math.round(numberValue(input, 0))) {
        case 1: return { text: "STOPPED", colour: colour.grey };
        case 2: return { text: "RUNNING", colour: colour.green };
        case 5: return { text: "STARTING", colour: colour.amber };
        case 10: return { text: "STOPPING", colour: colour.amber };
        default: return { text: "UNKNOWN", colour: colour.grey };
    }
}

function drawLamp(ctx, x, y, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill(); ctx.strokeStyle = colour.border; ctx.lineWidth = 1; ctx.stroke();
}

function drawOutputBar(ctx, x, y, width, output, fill, faulted) {
    ctx.fillStyle = "#45515A";
    roundedRect(ctx, x, y, width, 5, 2.5);
    ctx.fill();

    if (faulted) {
        return;
    }

    var fillWidth = width * clamp(numberValue(output, 0), 0, 100) / 100;

    if (fillWidth > 0) {
        ctx.fillStyle = fill;
        roundedRect(ctx, x, y, fillWidth, 5, 2.5);
        ctx.fill();
    }
}

function drawUnit(ctx, unitIndex) {
    var unit = units[unitIndex];
    var x = 14 + unitIndex * 160;
    var width = 150;
    var info = statusInfo(unit.status);
    var faulted = numberValue(unit.fault, 0) !== 0;
    var statusColour = faulted
        ? (flashState ? colour.red : colour.redDark)
        : info.colour;
    var readingColour = faulted
        ? (flashState ? colour.red : colour.redDark)
        : colour.text;

    ctx.fillStyle = colour.panelDark;
    roundedRect(ctx, x, 39, width, 191, 7);
    ctx.fill(); ctx.strokeStyle = colour.border; ctx.stroke();

    text(
        ctx,
        "OZONE UNIT " + String(unitIndex + 1),
        x + width / 2,
        57,
        "bold 10px Arial",
        colour.text,
        "center"
    );

    drawLamp(ctx, x + 24, 82, statusColour);
    text(
        ctx,
        faulted ? "FAULT" : info.text,
        x + 36,
        82,
        "bold 9px Arial",
        statusColour
    );

    ctx.strokeStyle = colour.border;
    ctx.beginPath(); ctx.moveTo(x + 10, 99.5); ctx.lineTo(x + width - 10, 99.5);
    ctx.stroke();

    text(ctx, "OUTPUT", x + 12, 114, "8px Arial", colour.muted);
    text(
        ctx,
        faulted ? "--" : numberValue(unit.output, 0).toFixed(outputDecimals),
        x + 12,
        133,
        "bold 15px Arial",
        readingColour
    );
    text(ctx, outputUnit, x + width - 12, 133, "9px Arial", colour.muted, "right");

    drawOutputBar(
        ctx,
        x + 12,
        143,
        width - 24,
        unit.output,
        statusColour,
        faulted
    );

    text(ctx, "OUTPUT CURRENT", x + 12, 158, "8px Arial", colour.muted);
    text(
        ctx,
        faulted ? "--" : numberValue(unit.current, 0).toFixed(currentDecimals),
        x + 12,
        175,
        "bold 15px Arial",
        readingColour
    );
    text(ctx, currentUnit, x + width - 12, 175, "9px Arial", colour.muted, "right");

    text(ctx, "OUTPUT FLOW", x + 12, 196, "8px Arial", colour.muted);
    text(
        ctx,
        faulted ? "--" : numberValue(unit.flow, 0).toFixed(flowDecimals),
        x + 12,
        215,
        "bold 15px Arial",
        readingColour
    );
    text(ctx, flowUnit, x + width - 12, 215, "9px Arial", colour.muted, "right");
}

function drawCard(ctx) {
    ctx.fillStyle = colour.panel;
    roundedRect(ctx, 0.5, 0.5, DESIGN_WIDTH - 1, DESIGN_HEIGHT - 1, 9);
    ctx.fill(); ctx.strokeStyle = colour.border; ctx.stroke();
    text(ctx, "OZONE GENERATORS", 16, 17, "bold 12px Arial", colour.text);
    text(
        ctx,
        "OUTPUT: " + outputUnit + "   CURRENT: " + currentUnit +
            "   FLOW: " + flowUnit,
        DESIGN_WIDTH - 16,
        17,
        "9px Arial",
        colour.muted,
        "right"
    );
    ctx.strokeStyle = colour.border; ctx.beginPath();
    ctx.moveTo(12, 32.5); ctx.lineTo(DESIGN_WIDTH - 12, 32.5); ctx.stroke();
    for (var unitIndex = 0; unitIndex < 5; unitIndex++) {
        drawUnit(ctx, unitIndex);
    }
}

function draw() {
    var width = canvas.width, height = canvas.height;
    canvas.clearRect(0, 0, width, height);
    if (width <= 0 || height <= 0) return;
    canvas.save(); canvas.scale(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    drawCard(canvas); canvas.restore();
}

function bind(subscription, description, update, fallback) {
    if (!subscription || typeof subscription.onResponse !== "function") {
        console.log(description + " subscription not configured"); return;
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

function bindUnit(unitIndex) {
    var number = String(unitIndex + 1);
    bind(config["ozone" + number + "StatusSub"], "Ozone " + number + " status", function (x) {
        units[unitIndex].status = Math.round(numberValue(x, 0));
    }, 0);
    bind(config["ozone" + number + "FaultSub"], "Ozone " + number + " fault", function (x) {
        units[unitIndex].fault = Math.round(numberValue(x, 0));
    }, 0);
    bind(config["ozone" + number + "OutputSub"], "Ozone " + number + " output", function (x) {
        units[unitIndex].output = numberValue(x, 0);
    }, 0);
    bind(config["ozone" + number + "CurrentSub"], "Ozone " + number + " current", function (x) {
        units[unitIndex].current = numberValue(x, 0);
    }, 0);
    bind(config["ozone" + number + "FlowSub"], "Ozone " + number + " flow", function (x) {
        units[unitIndex].flow = numberValue(x, 0);
    }, 0);
}

for (index = 0; index < 5; index++) bindUnit(index);
setInterval(function () { flashState = !flashState; draw(); }, 500);
draw();
