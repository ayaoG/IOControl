/*
============================================================
POLYMER UNIT - FLOCCULANT VSD PUMP
Weintek EasyBuilder Pro JS Object

Design size: 180 x 220 px

Required subscriptions:
    pumpStatusSub  1 stopped, 2 run fwd, 3 run rev,
                   5 starting fwd, 6 starting rev, 10 stopping
    pumpModeSub    0 automatic, nonzero manual
    pumpInterlockSub  0 clear, nonzero interlocked
    pumpOutputSub  VSD output engineering value
    pumpFaultSub   0 healthy, 16/17/18/32 fault codes
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 180;
var DESIGN_HEIGHT = 220;

var config = this.config || {};
var pumpName = config.pumpName || "FLOCCULANT PUMP";
var vsdTag = config.vsdTag || "P-101";
var outputUnit = config.outputUnit || "%";
var outputDecimals = Math.max(
    0,
    Math.min(
        2,
        Math.round(safeNumber(config.outputDecimals, 1))
    )
);

var colour = {
    background: "#F7F9FA",
    surface: "#FFFFFF",
    border: "#DCE4EA",
    borderDark: "#A9B6BD",
    text: "#2B3A43",
    muted: "#71808A",
    grey: "#7D8A91",
    greySoft: "#E8ECEF",
    green: "#2E9B69",
    greenSoft: "#DDF3E8",
    yellow: "#D6A800",
    yellowSoft: "#FFF4BF",
    red: "#D94C4C",
    redSoft: "#FBE5E5"
};

var pumpStatus = 0;
var pumpManual = false;
var pumpInterlocked = false;
var pumpOutput = 0;
var pumpFaultCode = 32;

var pumpAngle = 0;
var flashVisible = true;
var flashElapsed = 0;
var lastTimerTime = Date.now();

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

function getStatusInformation() {
    switch (pumpStatus) {
        case 1:
            return {
                text: "STOPPED",
                colour: colour.grey,
                soft: colour.greySoft,
                rotating: false,
                direction: 0,
                flashing: false
            };

        case 2:
            return {
                text: "RUNNING FWD",
                colour: colour.green,
                soft: colour.greenSoft,
                rotating: true,
                direction: 1,
                flashing: false
            };

        case 3:
            return {
                text: "RUNNING REV",
                colour: colour.green,
                soft: colour.greenSoft,
                rotating: true,
                direction: -1,
                flashing: false
            };

        case 5:
            return {
                text: "STARTING FWD",
                colour: colour.yellow,
                soft: colour.yellowSoft,
                rotating: true,
                direction: 1,
                flashing: true
            };

        case 6:
            return {
                text: "STARTING REV",
                colour: colour.yellow,
                soft: colour.yellowSoft,
                rotating: true,
                direction: -1,
                flashing: true
            };

        case 10:
            return {
                text: "STOPPING",
                colour: colour.yellow,
                soft: colour.yellowSoft,
                rotating: true,
                direction: 1,
                flashing: true
            };

        default:
            return {
                text: "UNKNOWN",
                colour: colour.grey,
                soft: colour.greySoft,
                rotating: false,
                direction: 0,
                flashing: false
            };
    }
}

function getFaultText() {
    switch (pumpFaultCode) {
        case 0:
            return "";

        case 16:
            return "FAIL TO START";

        case 17:
            return "FAIL TO STOP";

        case 18:
            return "DRIVE FAULT";

        case 32:
            return "I/O FAULT";

        default:
            return "FAULT " + String(pumpFaultCode);
    }
}

function hasFault() {
    return pumpFaultCode !== 0;
}

function getActiveColour() {
    var information = getStatusInformation();

    if (hasFault()) {
        return flashVisible ? colour.red : colour.grey;
    }

    if (information.flashing && !flashVisible) {
        return colour.grey;
    }

    return information.colour;
}

function getActiveSoftColour() {
    var information = getStatusInformation();

    if (hasFault()) {
        return flashVisible ? colour.redSoft : colour.greySoft;
    }

    if (information.flashing && !flashVisible) {
        return colour.greySoft;
    }

    return information.soft;
}

function drawPumpBlade(ctx, centreX, centreY, angle, bladeColour) {
    ctx.save();
    ctx.translate(centreX, centreY);
    ctx.rotate(angle);
    ctx.fillStyle = bladeColour;
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.quadraticCurveTo(13, -8, 15, -1);
    ctx.quadraticCurveTo(12, 5, 3, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawPump(ctx) {
    var centreX = 85;
    var centreY = 125;
    var activeColour = getActiveColour();

    ctx.fillStyle = colour.surface;
    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(centreX, centreY, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colour.surface;
    ctx.beginPath();
    ctx.moveTo(centreX + 25, centreY - 7);
    ctx.lineTo(centreX + 37, centreY - 7);
    ctx.lineTo(centreX + 37, centreY + 7);
    ctx.lineTo(centreX + 25, centreY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centreX, centreY, 22, 0, Math.PI * 2);
    ctx.stroke();

    var index;
    for (index = 0; index < 5; index++) {
        drawPumpBlade(
            ctx,
            centreX,
            centreY,
            pumpAngle + index * Math.PI * 2 / 5,
            activeColour
        );
    }

    ctx.fillStyle = colour.surface;
    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centreX, centreY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = activeColour;
    ctx.beginPath();
    ctx.arc(centreX, centreY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colour.borderDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centreX - 21, centreY + 31);
    ctx.lineTo(centreX - 21, centreY + 37);
    ctx.moveTo(centreX + 21, centreY + 31);
    ctx.lineTo(centreX + 21, centreY + 37);
    ctx.moveTo(centreX - 29, centreY + 37);
    ctx.lineTo(centreX + 29, centreY + 37);
    ctx.stroke();
}

function drawVsd(ctx) {
    var x = 51;
    var y = 50;
    var width = 68;
    var height = 40;
    var activeColour = getActiveColour();

    ctx.strokeStyle = colour.borderDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(85, y + height);
    ctx.lineTo(85, 95);
    ctx.stroke();

    ctx.fillStyle = getActiveSoftColour();
    roundedRect(ctx, x, y, width, height, 6);
    ctx.fill();

    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, x, y, width, height, 6);
    ctx.stroke();

    ctx.fillStyle = colour.muted;
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VSD", x + width / 2, y + 10);

    ctx.fillStyle = activeColour;
    ctx.font = "bold 15px Arial";
    ctx.fillText(
        pumpOutput.toFixed(outputDecimals) + " " + outputUnit,
        x + width / 2,
        y + 27
    );
}

function drawModeIndication(ctx) {
    if (!pumpInterlocked && !pumpManual) {
        return;
    }

    var x = 126;
    var y = 50;
    var width = 42;
    var height = 40;
    var modeColour =
        pumpInterlocked ? colour.red : colour.yellow;
    var modeSoft =
        pumpInterlocked ? colour.redSoft : colour.yellowSoft;

    ctx.fillStyle = modeSoft;
    roundedRect(ctx, x, y, width, height, 6);
    ctx.fill();

    ctx.strokeStyle = modeColour;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, x, y, width, height, 6);
    ctx.stroke();

    ctx.fillStyle = colour.muted;
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        pumpInterlocked ? "STATUS" : "MODE",
        x + width / 2,
        y + 10
    );

    ctx.fillStyle = modeColour;
    ctx.font =
        pumpInterlocked ? "bold 8px Arial" : "bold 10px Arial";
    ctx.fillText(
        pumpInterlocked ? "INTLK" : "MAN",
        x + width / 2,
        y + 26
    );
}

function drawStatus(ctx) {
    var information = getStatusInformation();
    var statusColour = information.colour;

    if (information.flashing && !flashVisible) {
        statusColour = colour.grey;
    }

    ctx.fillStyle = colour.muted;
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pumpName, 85, 28);

    /*
    Operating state centred below the equipment title.
    */
    ctx.fillStyle = statusColour;
    ctx.font = "bold 10px Arial";
    ctx.fillText(information.text, 85, 42);

    /*
    Equipment tag restored below the pump.
    */
    ctx.fillStyle = colour.muted;
    ctx.font = "9px Arial";
    ctx.fillText(vsdTag, 84, 174);

    /*
    Fault status is only drawn while a real fault is active.
    */
    if (hasFault()) {
        ctx.fillStyle = getActiveSoftColour();
        roundedRect(ctx, 10, 183, 160, 20, 10);
        ctx.fill();

        ctx.fillStyle = getActiveColour();
        ctx.beginPath();
        ctx.arc(24, 193, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 9px Arial";
        ctx.textAlign = "left";
        ctx.fillText(getFaultText(), 34, 193);
    }
}

function drawPumpObject(ctx) {
    drawPump(ctx);
    drawVsd(ctx);
    drawModeIndication(ctx);
    drawStatus(ctx);
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
    drawPumpObject(canvas);
    canvas.restore();
}

function bindSubscription(
    subscription,
    description,
    updateFunction
) {
    if (
        !subscription ||
        typeof subscription.onResponse !== "function"
    ) {
        console.log(description + " subscription not configured");
        return;
    }

    subscription.onResponse(function (error, data) {
        if (error) {
            console.log(description + " error: " + String(error));
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
    config.pumpStatusSub,
    "Flocculant pump status",
    function (input) {
        pumpStatus = Math.round(safeNumber(input, 0));
    }
);

bindSubscription(
    config.pumpModeSub,
    "Flocculant pump mode",
    function (input) {
        pumpManual = safeNumber(input, 0) !== 0;
    }
);

bindSubscription(
    config.pumpInterlockSub,
    "Flocculant pump interlock",
    function (input) {
        pumpInterlocked = safeNumber(input, 0) !== 0;
    }
);

bindSubscription(
    config.pumpOutputSub,
    "Flocculant pump VSD output",
    function (input) {
        pumpOutput = safeNumber(input, 0);
    }
);

bindSubscription(
    config.pumpFaultSub,
    "Flocculant pump fault",
    function (input) {
        pumpFaultCode = Math.round(safeNumber(input, 0));
    }
);

draw();

setInterval(function () {
    var now = Date.now();
    var delta = Math.min(200, now - lastTimerTime);
    var information = getStatusInformation();
    var redraw = false;

    lastTimerTime = now;

    if (information.rotating && !hasFault()) {
        pumpAngle +=
            delta *
            0.006 *
            information.direction;
        redraw = true;
    }

    flashElapsed += delta;

    if (flashElapsed >= 500) {
        flashElapsed = 0;

        if (information.flashing || hasFault()) {
            flashVisible = !flashVisible;
            redraw = true;
        } else {
            flashVisible = true;
        }
    }

    if (redraw) {
        draw();
    }
}, 50);
