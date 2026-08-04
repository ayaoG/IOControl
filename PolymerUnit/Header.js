/*
============================================================
POLYMER UNIT - HEADER
Weintek EasyBuilder Pro JS Object

Object size: 1024 x 35 px
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 1024;
var DESIGN_HEIGHT = 35;

var config = this.config || {};
var projectTitle = config.projectTitle || "POLYMER UNIT";
var siteName = config.siteName || "PROCESS CONTROL";
var signalRawMinimum = safeNumber(config.signalRawMinimum, 0);
var signalRawMaximum = safeNumber(config.signalRawMaximum, 65535);

var colour = {
    background: "#FFFFFF",
    line: "#DCE4EA",
    primary: "#22313A",
    secondary: "#71808A",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0",
    signalInactive: "#A9B6BD",
    signalInactiveSoft: "#E8ECEF",
    signalLow: "#D94C4C",
    signalMedium: "#D6A800",
    signalGood: "#2E9B69"
};

var dateText = "";
var timeText = "";
var signalPercent = 0;
var signalKnown = false;

function safeNumber(input, fallback) {
    var result = Number(input);
    return isFinite(result) ? result : fallback;
}

function clamp(input, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, input));
}

function padTwo(value) {
    return value < 10 ? "0" + value : String(value);
}

function updateClock() {
    var now = new Date();

    dateText =
        padTwo(now.getDate()) + "/" +
        padTwo(now.getMonth() + 1) + "/" +
        now.getFullYear();

    timeText =
        padTwo(now.getHours()) + ":" +
        padTwo(now.getMinutes()) + ":" +
        padTwo(now.getSeconds());

    draw();
}

function scaleSignal(input) {
    var span = signalRawMaximum - signalRawMinimum;

    if (!isFinite(span) || span <= 0) {
        return 0;
    }

    return clamp(
        (input - signalRawMinimum) * 100 / span,
        0,
        100
    );
}

function getSignalColour() {
    if (!signalKnown) {
        return colour.signalInactive;
    }
    if (signalPercent < 20) {
        return colour.signalLow;
    }
    if (signalPercent < 40) {
        return colour.signalMedium;
    }
    return colour.signalGood;
}

function drawHeader(ctx) {
    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.fillStyle = colour.accentSoft;
    ctx.beginPath();
    ctx.arc(20, 17.5, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colour.accent;
    ctx.beginPath();
    ctx.arc(20, 17.5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colour.primary;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(projectTitle, 40, 17.5);

    var titleWidth = ctx.measureText(projectTitle).width;

    ctx.fillStyle = colour.secondary;
    ctx.font = "10px Arial";
    ctx.fillText(siteName, 54 + titleWidth, 18);

    /*
    ========================================================
    CELLULAR SIGNAL BARS - DRAWN DIRECTLY IN THE HEADER
    ========================================================
    */
    var noSignal = signalKnown && signalPercent <= 0;
    var activeBars =
        !signalKnown
            ? 0
            : noSignal
                ? 1
                : Math.min(5, Math.ceil(signalPercent / 20));
    var activeColour = getSignalColour();
    var signalBarIndex;

    for (signalBarIndex = 0; signalBarIndex < 5; signalBarIndex++) {
        var signalBarHeight = 4 + signalBarIndex * 3;
        var signalBarX = 790 + signalBarIndex * 7;
        var signalBarY = 25 - signalBarHeight;
        var signalBarActive = signalBarIndex < activeBars;

        ctx.fillStyle =
            signalBarActive
                ? activeColour
                : colour.signalInactiveSoft;
        ctx.fillRect(
            signalBarX,
            signalBarY,
            4,
            signalBarHeight
        );

        ctx.strokeStyle =
            signalBarActive
                ? activeColour
                : colour.signalInactive;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(
            signalBarX + 0.4,
            signalBarY + 0.4,
            3.2,
            signalBarHeight - 0.8
        );
    }

    ctx.fillStyle =
        noSignal ? colour.signalLow : colour.secondary;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
        signalKnown
            ? noSignal
                ? "NO SIG"
                : String(Math.round(signalPercent)) + "%"
            : "---",
        846,
        17.5
    );

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(860.5, 8);
    ctx.lineTo(860.5, 27);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.font = "11px Arial";
    ctx.fillText(
        dateText + "   " + timeText,
        DESIGN_WIDTH - 16,
        17.5
    );

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, DESIGN_HEIGHT - 0.5);
    ctx.lineTo(DESIGN_WIDTH, DESIGN_HEIGHT - 0.5);
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
    drawHeader(canvas);
    canvas.restore();
}

updateClock();

if (
    config.signalSub &&
    typeof config.signalSub.onResponse === "function"
) {
    config.signalSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "Header cellular signal subscription error: " +
                String(error.message || error)
            );
            return;
        }

        if (data && data.values && data.values.length > 0) {
            var rawValue = Number(data.values[0]);

            if (isFinite(rawValue)) {
                signalPercent = scaleSignal(rawValue);
                signalKnown = true;
                draw();
            }
        }
    });
}

setInterval(updateClock, 1000);
