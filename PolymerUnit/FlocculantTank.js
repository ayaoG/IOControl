/*
============================================================
POLYMER UNIT - FLOCCULANT TANK
Weintek EasyBuilder Pro JS Object

Design size: 230 x 260 px

Required subscriptions:
    levelSub       - level transmitter engineering value
    levelFaultSub  - PLC numeric fault code (0 = healthy)
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 230;
var DESIGN_HEIGHT = 260;

var config = this.config || {};

var tankName = config.tankName || "FLOCCULANT TANK";
var instrumentTag = config.instrumentTag || "LT-101";
var levelUnit = config.levelUnit || "%";
var levelMinimum = safeNumber(config.levelMinimum, 0);
var levelMaximum = safeNumber(config.levelMaximum, 100);
var levelDecimals = Math.max(
    0,
    Math.min(3, Math.round(safeNumber(config.levelDecimals, 1)))
);

if (levelMaximum <= levelMinimum) {
    levelMaximum = levelMinimum + 100;
}

var colour = {
    background: "#F7F9FA",
    surface: "#FFFFFF",
    border: "#DCE4EA",
    borderDark: "#A9B6BD",
    primary: "#2B3A43",
    secondary: "#71808A",
    muted: "#9AA7AE",
    accent: "#6F7D85",
    accentSoft: "#E8ECEF",
    liquid: "#9CA9AF",
    liquidLight: "#D5DDE1",
    warning: "#D6A800",
    warningSoft: "#FFF4BF",
    alarm: "#E67E22",
    alarmSoft: "#FCE2C8",
    danger: "#D94C4C",
    dangerSoft: "#FBE5E5"
};

var levelValue = 0;
var levelFaultCode = 0;
var faultReadError = false;
var faultHasValidValue = false;
var flashVisible = true;
var flashTick = 0;

function safeNumber(input, fallback) {
    var result = Number(input);
    return isFinite(result) ? result : fallback;
}

function clamp(input, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, input));
}

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

function getConditionType() {
    if (faultReadError) {
        return "fault";
    }

    switch (levelFaultCode) {
        case 0:
            return "normal";

        case 20:
        case 21:
            return "warning";

        case 24:
        case 25:
            return "alarm";

        default:
            return "fault";
    }
}

function hasFault() {
    return getConditionType() !== "normal";
}

function hasSignalFault() {
    return getConditionType() === "fault";
}

function getConditionColour() {
    if (
        getConditionType() !== "normal" &&
        !flashVisible
    ) {
        return colour.secondary;
    }

    switch (getConditionType()) {
        case "warning":
            return colour.warning;

        case "alarm":
            return colour.alarm;

        case "fault":
            return colour.danger;

        default:
            return colour.accent;
    }
}

function getConditionSoftColour() {
    if (
        getConditionType() !== "normal" &&
        !flashVisible
    ) {
        return "#F1F3F4";
    }

    switch (getConditionType()) {
        case "warning":
            return colour.warningSoft;

        case "alarm":
            return colour.alarmSoft;

        case "fault":
            return colour.dangerSoft;

        default:
            return colour.accentSoft;
    }
}

function getLevelFaultText() {
    switch (levelFaultCode) {
        case 0:
            return "";

        case 20:
            return "LOW";

        case 21:
            return "HIGH";

        case 24:
            return "LOW LOW";

        case 25:
            return "HIGH HIGH";

        case 32:
            return "SIGNAL FAULT";

        default:
            return "FAULT " + String(levelFaultCode);
    }
}

function getLevelFraction() {
    return clamp(
        (levelValue - levelMinimum) /
        (levelMaximum - levelMinimum),
        0,
        1
    );
}

function formatLevel() {
    if (hasSignalFault()) {
        return "---";
    }

    return levelValue.toFixed(levelDecimals);
}

function drawStatusBadge(ctx) {
    var condition = getConditionType();
    var statusText = "OK";
    var x = 95;
    var y = 270;
    var width = 110;
    var height = 24;

    if (condition === "fault") {
        statusText = "NO SIGNAL";
    } else if (condition !== "normal") {
        statusText = getLevelFaultText();
    }

    ctx.fillStyle = getConditionSoftColour();

    roundedRect(ctx, x, y, width, height, 12);
    ctx.fill();

    ctx.fillStyle = getConditionColour();

    ctx.beginPath();
    ctx.arc(x + 13, y + height / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(statusText, x + 23, y + height / 2);
}

function drawTank(ctx) {
    var tankX = 80;
    var tankY = 142;
    var tankWidth = 112;
    var tankHeight = 112;

    var innerX = tankX + 5;
    var innerY = tankY + 5;
    var innerWidth = tankWidth - 10;
    var innerHeight = tankHeight - 16;

    ctx.fillStyle = "#F0F4F6";
    ctx.fillRect(
        innerX,
        innerY,
        innerWidth,
        innerHeight
    );

    var fraction = getLevelFraction();
    var liquidHeight = innerHeight * fraction;
    var liquidY = innerY + innerHeight - liquidHeight;

    if (liquidHeight > 0) {
        ctx.fillStyle =
            getConditionType() === "normal"
                ? colour.liquidLight
                : getConditionSoftColour();

        ctx.fillRect(
            innerX,
            liquidY,
            innerWidth,
            liquidHeight
        );

        ctx.fillStyle =
            getConditionType() === "normal"
                ? colour.liquid
                : getConditionColour();

        ctx.fillRect(
            innerX,
            liquidY,
            innerWidth,
            3
        );
    }

    ctx.strokeStyle =
        hasFault() ? getConditionColour() : colour.borderDark;
    ctx.lineWidth = hasFault() ? 2 : 1.5;

    ctx.beginPath();
    ctx.moveTo(tankX, tankY);
    ctx.lineTo(tankX, tankY + tankHeight - 12);
    ctx.quadraticCurveTo(
        tankX,
        tankY + tankHeight,
        tankX + 12,
        tankY + tankHeight
    );
    ctx.lineTo(
        tankX + tankWidth - 12,
        tankY + tankHeight
    );
    ctx.quadraticCurveTo(
        tankX + tankWidth,
        tankY + tankHeight,
        tankX + tankWidth,
        tankY + tankHeight - 12
    );
    ctx.lineTo(tankX + tankWidth, tankY);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX - 5, tankY);
    ctx.lineTo(tankX + tankWidth + 5, tankY);
    ctx.stroke();

    ctx.strokeStyle = colour.borderDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX + 16, tankY + tankHeight);
    ctx.lineTo(tankX + 16, tankY + tankHeight + 12);
    ctx.moveTo(tankX + tankWidth - 16, tankY + tankHeight);
    ctx.lineTo(
        tankX + tankWidth - 16,
        tankY + tankHeight + 12
    );
    ctx.stroke();

    ctx.fillStyle = colour.secondary;
    ctx.font = "9px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    var index;
    for (index = 0; index <= 4; index++) {
        var tickFraction = index / 4;
        var tickY = innerY + innerHeight * (1 - tickFraction);
        var tickValue =
            levelMinimum +
            (levelMaximum - levelMinimum) * tickFraction;

        ctx.strokeStyle = colour.borderDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tankX + tankWidth + 5, tickY);
        ctx.lineTo(tankX + tankWidth + 11, tickY);
        ctx.stroke();

        ctx.fillText(
            String(Math.round(tickValue)),
            tankX + tankWidth + 29,
            tickY
        );
    }
}

function drawTransmitter(ctx) {
    var centreX = 174;
    var centreY = 104;
    var faulted = hasFault();
    var symbolWidth = 30;
    var symbolHeight = 22;

    ctx.strokeStyle =
        faulted ? getConditionColour() : colour.accent;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(centreX, centreY + symbolHeight / 2);
    ctx.lineTo(centreX, 142);
    ctx.stroke();

    ctx.fillStyle =
        faulted ? getConditionSoftColour() : colour.accentSoft;
    roundedRect(
        ctx,
        centreX - symbolWidth / 2,
        centreY - symbolHeight / 2,
        symbolWidth,
        symbolHeight,
        5
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
        faulted ? getConditionColour() : colour.accent;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LT", centreX, centreY);

    ctx.fillStyle = colour.secondary;
    ctx.font = "9px Arial";
    ctx.textAlign = "left";
    ctx.fillText(instrumentTag, centreX + 20, centreY);
}

function drawValueCard(ctx) {
    var centreX = 136;
    var faulted = hasFault();

    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LEVEL", centreX, 177);

    ctx.fillStyle =
        faulted ? getConditionColour() : colour.primary;
    ctx.font = "bold 21px Arial";
    ctx.fillText(
        formatLevel(),
        centreX,
        198
    );

    ctx.fillStyle = colour.secondary;
    ctx.font = "9px Arial";
    ctx.fillText(
        levelUnit,
        centreX,
        216
    );
}

function drawTankObject(ctx) {
    ctx.fillStyle = colour.secondary;
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tankName, 150, 55);

    ctx.fillStyle = colour.secondary;
    ctx.font = "9px Arial";
    ctx.fillText("POLYMER MAKE-UP", 150, 72);

    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(45, 84.5);
    ctx.lineTo(255, 84.5);
    ctx.stroke();

    drawTank(ctx);
    drawValueCard(ctx);
    drawTransmitter(ctx);
    drawStatusBadge(ctx);
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

    var offsetX = (width - DESIGN_WIDTH * scale) / 2;
    var offsetY = (height - DESIGN_HEIGHT * scale) / 2;

    canvas.save();
    canvas.translate(offsetX, offsetY);
    canvas.scale(scale, scale);
    canvas.translate(-35, -40);
    drawTankObject(canvas);
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
        console.log(description + " subscription not configured");
        errorFunction();
        draw();
        return;
    }

    subscription.onResponse(function (error, data) {
        if (error) {
            console.log(
                description + " error: " + String(error)
            );
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
    config.levelSub,
    "Flocculant tank level",
    function (input) {
        levelValue = safeNumber(input, 0);
    },
    function () {
        /*
        Retain the last valid reading after a transient subscription
        error. The independent fault-code subscription controls the
        transmitter fault indication.
        */
    }
);

bindSubscription(
    config.levelFaultSub,
    "Flocculant level transmitter fault",
    function (input) {
        levelFaultCode =
            Math.round(
                safeNumber(input, 0)
            );
        faultReadError = false;
        faultHasValidValue = true;
    },
    function () {
        /*
        Stay fail-safe until the first valid PLC response. After that,
        retain the last valid fault code through a transient
        subscription error instead of latching SIGNAL UNAVAILABLE.
        */
        if (!faultHasValidValue) {
            levelFaultCode = 32;
            faultReadError = true;
        }
    }
);

draw();

/*
LOW / HIGH pulse every 1 second.
LOW LOW / HIGH HIGH and signal faults flash every 500 ms.
*/
setInterval(function () {
    var condition = getConditionType();

    if (condition === "normal") {
        flashVisible = true;
        flashTick = 0;
        return;
    }

    flashTick += 1;

    if (
        condition === "warning" &&
        flashTick < 2
    ) {
        return;
    }

    flashTick = 0;
    flashVisible = !flashVisible;
    draw();
}, 500);
