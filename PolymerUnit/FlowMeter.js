/*
============================================================
POLYMER UNIT - FLOW METER
Weintek EasyBuilder Pro JS Object

Design size: 180 x 120 px

Required subscriptions:
    waterFlowSub       - flow engineering value
    waterFlowFaultSub  - flow meter fault (0 = healthy)
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 180;
var DESIGN_HEIGHT = 120;

var config = this.config || {};
var meterName = config.meterName || "WATER FLOW";
var instrumentTag = config.instrumentTag || "FT-101";
var flowUnit = config.flowUnit || "L/min";
var flowDecimals = Math.max(
    0,
    Math.min(3, Math.round(safeNumber(config.flowDecimals, 1)))
);

var colour = {
    surface: "#FFFFFF",
    text: "#2B3A43",
    muted: "#71808A",
    normal: "#38A3D1",
    fault: "#D94C4C",
    faultDark: "#9F2F2F"
};

var flowValue = 0;
var flowFault = false;
var flashVisible = true;

function safeNumber(input, fallback) {
    var result = Number(input);
    return isFinite(result) ? result : fallback;
}

function drawFlowMeter(ctx) {
    var centreX = 90;
    var centreY = 68;
    var displayColour =
        flowFault && !flashVisible
            ? colour.faultDark
            : (flowFault ? colour.fault : colour.normal);

    ctx.fillStyle = colour.muted;
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meterName, centreX, 22);

    ctx.fillStyle = flowFault ? displayColour : colour.text;
    ctx.font = flowFault ? "bold 10px Arial" : "bold 15px Arial";
    ctx.fillText(
        flowFault
            ? "FAULT"
            : flowValue.toFixed(flowDecimals) + " " + flowUnit,
        centreX,
        40
    );

    ctx.fillStyle = colour.surface;
    ctx.strokeStyle = displayColour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centreX, centreY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = displayColour;
    ctx.font = "bold 10px Arial";
    ctx.fillText("FT", centreX, centreY);

    ctx.fillStyle = colour.muted;
    ctx.font = "9px Arial";
    ctx.fillText(instrumentTag, centreX, 99);
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;

    canvas.clearRect(0, 0, width, height);

    if (width <= 0 || height <= 0) {
        return;
    }

    var scale = Math.min(
        width / DESIGN_WIDTH,
        height / DESIGN_HEIGHT
    );

    canvas.save();
    canvas.translate(
        (width - DESIGN_WIDTH * scale) / 2,
        (height - DESIGN_HEIGHT * scale) / 2
    );
    canvas.scale(scale, scale);
    drawFlowMeter(canvas);
    canvas.restore();
}

function bindSubscription(
    subscription,
    description,
    updateFunction,
    errorFunction
) {
    if (
        !subscription ||
        typeof subscription.onResponse !== "function"
    ) {
        console.log(description + " subscription is not configured");
        errorFunction();
        draw();
        return;
    }

    subscription.onResponse(function (error, data) {
        if (error) {
            console.log(description + " error: " + String(error));
            errorFunction();
            draw();
            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            updateFunction(data.values[0]);
            draw();
        }
    });
}

bindSubscription(
    config.waterFlowSub,
    "Water flow",
    function (input) {
        flowValue = safeNumber(input, 0);
    },
    function () {
        /*
        Retain the last valid engineering value if the value
        subscription is temporarily unavailable.
        */
    }
);

bindSubscription(
    config.waterFlowFaultSub,
    "Water flow fault",
    function (input) {
        flowFault = Boolean(input);
    },
    function () {
        flowFault = true;
    }
);

draw();

setInterval(function () {
    if (!flowFault) {
        flashVisible = true;
        return;
    }

    flashVisible = !flashVisible;
    draw();
}, 500);
