/*
============================================================
OVERVIEW - COOLING TOWER HORIZONTAL CARD
Weintek EasyBuilder Pro JS Object

Object size: 818 x 112 px
Recommended position: x = 194, y = 188
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 818;
var DESIGN_HEIGHT = 112;
var config = this.config || {};
var colour = {
    panel: "#232C33", border: "#53616A", text: "#D6DEE3",
    muted: "#82909A", green: "#22C55E", amber: "#F5A623",
    red: "#EF4444", redDark: "#811F1F", grey: "#7F8B94"
};
var value = {
    pumpStatus: 0, pumpManual: false, pumpOutput: 0, pumpFault: 0,
    fanStatus: 0, fanManual: false, fanOutput: 0, fanFault: 0,
    pressure: 0, pressureFault: false,
    temperature: 0, temperatureFault: false,
    flow: 0, flowFault: false
};
var flashState = true;

function numberValue(input, fallback) {
    var result = Number(input);
    return isNaN(result) ? fallback : result;
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

function equipmentInfo(input) {
    switch (Math.round(numberValue(input, 0))) {
        case 1: return { text: "STOPPED", colour: colour.grey };
        case 2: return { text: "RUNNING", colour: colour.green };
        case 5: return { text: "STARTING", colour: colour.amber };
        case 10: return { text: "STOPPING", colour: colour.amber };
        default: return { text: "UNKNOWN", colour: colour.grey };
    }
}

function equipmentColour(status, fault) {
    return fault !== 0
        ? (flashState ? colour.red : colour.redDark)
        : equipmentInfo(status).colour;
}

function lamp(ctx, x, y, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.strokeStyle = colour.border; ctx.stroke();
}

function divider(ctx, x) {
    ctx.strokeStyle = colour.border; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(x, 33); ctx.lineTo(x, DESIGN_HEIGHT - 10); ctx.stroke();
}

function processReading(ctx, x, label, reading, unit, fault) {
    var displayColour = fault
        ? (flashState ? colour.red : colour.redDark)
        : colour.text;
    text(ctx, label, x, 49, "8px Arial", colour.muted);
    text(
        ctx,
        fault ? "FAULT" : numberValue(reading, 0).toFixed(1) + " " + unit,
        x,
        73,
        "bold 14px Arial",
        displayColour
    );
}

function drawCard(ctx) {
    var pumpInfo = equipmentInfo(value.pumpStatus);
    var fanInfo = equipmentInfo(value.fanStatus);
    var pumpColour = equipmentColour(value.pumpStatus, value.pumpFault);
    var fanColour = equipmentColour(value.fanStatus, value.fanFault);

    ctx.fillStyle = colour.panel;
    roundedRect(ctx, 0.5, 0.5, DESIGN_WIDTH - 1, DESIGN_HEIGHT - 1, 9);
    ctx.fill(); ctx.strokeStyle = colour.border; ctx.stroke();

    text(ctx, "COOLING TOWER", 16, 17, "bold 12px Arial", colour.text);
    ctx.strokeStyle = colour.border; ctx.beginPath();
    ctx.moveTo(12, 32.5); ctx.lineTo(DESIGN_WIDTH - 12, 32.5); ctx.stroke();

    lamp(ctx, 27, 65, pumpColour);
    text(ctx, "PUMP", 42, 47, "8px Arial", colour.muted);
    text(
        ctx,
        value.pumpFault ? "FAULT" : pumpInfo.text,
        42, 66, "bold 10px Arial", pumpColour
    );
    text(
        ctx,
        numberValue(value.pumpOutput, 0).toFixed(1) + " " +
            (config.frequencyUnit || "Hz"),
        42, 87, "bold 12px Arial", colour.text
    );
    text(
        ctx,
        value.pumpManual ? "MANUAL" : "AUTO",
        185, 47, "bold 8px Arial",
        value.pumpManual ? colour.amber : colour.muted,
        "right"
    );

    divider(ctx, 205);
    lamp(ctx, 231, 65, fanColour);
    text(ctx, "FAN", 246, 47, "8px Arial", colour.muted);
    text(
        ctx,
        value.fanFault ? "FAULT" : fanInfo.text,
        246, 66, "bold 10px Arial", fanColour
    );
    text(
        ctx,
        numberValue(value.fanOutput, 0).toFixed(1) + " " +
            (config.frequencyUnit || "Hz"),
        246, 87, "bold 12px Arial", colour.text
    );
    text(
        ctx,
        value.fanManual ? "MANUAL" : "AUTO",
        389, 47, "bold 8px Arial",
        value.fanManual ? colour.amber : colour.muted,
        "right"
    );

    divider(ctx, 409);
    processReading(
        ctx, 431, "DISCHARGE PRESSURE", value.pressure,
        config.coolingPressureUnit || "Pa", value.pressureFault
    );
    divider(ctx, 548);
    processReading(
        ctx, 570, "WATER TEMPERATURE", value.temperature,
        config.temperatureUnit || "\u00B0C", value.temperatureFault
    );
    divider(ctx, 683);
    processReading(
        ctx, 705, "WATER FLOW", value.flow,
        config.flowUnit || "L/min", value.flowFault
    );
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
        if (error) { update(fallback); console.log(description + " error"); }
        else if (data && data.values && data.values.length > 0) update(data.values[0]);
        draw();
    });
}

bind(config.coolingPumpStatusSub, "Cooling pump status", function (x) { value.pumpStatus = Math.round(numberValue(x, 0)); }, 0);
bind(config.coolingPumpModeSub, "Cooling pump mode", function (x) { value.pumpManual = numberValue(x, 0) !== 0; }, false);
bind(config.coolingPumpOutputSub, "Cooling pump output", function (x) { value.pumpOutput = numberValue(x, 0); }, 0);
bind(config.coolingPumpFaultSub, "Cooling pump fault", function (x) { value.pumpFault = Math.round(numberValue(x, 0)); }, 0);
bind(config.coolingFanStatusSub, "Cooling fan status", function (x) { value.fanStatus = Math.round(numberValue(x, 0)); }, 0);
bind(config.coolingFanModeSub, "Cooling fan mode", function (x) { value.fanManual = numberValue(x, 0) !== 0; }, false);
bind(config.coolingFanOutputSub, "Cooling fan output", function (x) { value.fanOutput = numberValue(x, 0); }, 0);
bind(config.coolingFanFaultSub, "Cooling fan fault", function (x) { value.fanFault = Math.round(numberValue(x, 0)); }, 0);
bind(config.coolingPressureSub, "Cooling pressure", function (x) { value.pressure = numberValue(x, 0); }, 0);
bind(config.coolingPressureFaultSub, "Cooling pressure fault", function (x) { value.pressureFault = numberValue(x, 0) !== 0; }, true);
bind(config.coolingTemperatureSub, "Cooling temperature", function (x) { value.temperature = numberValue(x, 0); }, 0);
bind(config.coolingTemperatureFaultSub, "Cooling temperature fault", function (x) { value.temperatureFault = numberValue(x, 0) !== 0; }, true);
bind(config.coolingFlowSub, "Cooling flow", function (x) { value.flow = numberValue(x, 0); }, 0);
bind(config.coolingFlowFaultSub, "Cooling flow fault", function (x) { value.flowFault = numberValue(x, 0) !== 0; }, true);

setInterval(function () { flashState = !flashState; draw(); }, 500);
draw();
