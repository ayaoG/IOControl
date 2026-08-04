/*
============================================================
POLYMER UNIT - HEADER WITH CELLULAR SIGNAL
Weintek EasyBuilder Pro JS Object

Object size: 1024 x 35 px

Cellular input:
    signalSub          raw signal-strength subscription
    signalRawMinimum   default 0
    signalRawMaximum   default 65535

The raw signal is scaled to 0...100%.
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

function scaleSignal(rawValue) {
    var span = signalRawMaximum - signalRawMinimum;

    if (!isFinite(span) || span <= 0) {
        return 0;
    }

    return clamp(
        (rawValue - signalRawMinimum) * 100 / span,
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

function drawHeader(ctx) {
    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    /*
    Project indicator, title, and site name.
    */
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
    CELLULAR SIGNAL ICON - FIVE BARS IN THE HEADER
    ========================================================
    */
    var noSignal = signalKnown && signalPercent <= 0;
    var activeBars;

    if (!signalKnown) {
        activeBars = 0;
    } else if (noSignal) {
        activeBars = 1;
    } else {
        activeBars = Math.min(
            5,
            Math.ceil(signalPercent / 20)
        );
    }

    var activeSignalColour = getSignalColour();
    var barIndex;

    for (barIndex = 0; barIndex < 5; barIndex++) {
        var barHeight = 4 + barIndex * 3;
        var barX = 930 + barIndex * 7;
        var barY = 25 - barHeight;
        var barActive = barIndex < activeBars;

        ctx.fillStyle =
            barActive
                ? activeSignalColour
                : colour.signalInactiveSoft;
        ctx.fillRect(barX, barY, 4, barHeight);

        ctx.strokeStyle =
            barActive
                ? activeSignalColour
                : colour.signalInactive;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, 4, barHeight);
    }

    ctx.fillStyle =
        noSignal ? colour.signalLow : colour.secondary;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (!signalKnown) {
        ctx.fillText("---", 976, 17.5);
    } else if (noSignal) {
        ctx.fillText("NO SIG", 976, 17.5);
    } else {
        ctx.fillText(
            String(Math.round(signalPercent)) + "%",
            976,
            17.5
        );
    }

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(914.5, 8);
    ctx.lineTo(914.5, 27);
    ctx.stroke();

    /*
    Date and clock.
    */
    ctx.fillStyle = colour.secondary;
    ctx.textAlign = "right";
    ctx.font = "11px Arial";
    ctx.fillText(
        dateText + "   " + timeText,
        898,
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

updateClock();
setInterval(updateClock, 1000);
