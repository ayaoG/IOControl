/*
============================================================
POLYMER UNIT - POTABLE WATER CONTROL VALVE
Weintek EasyBuilder Pro JS Object

Design size: 180 x 175 px
Standalone equipment object - no pipeline is drawn.

Required subscriptions:
    valveStatusSub  0 off, 1 on, 2 pulse off, 3 pulse on,
                    4 pulse continuous, 5 turning on,
                    6 turning off
    valveModeSub    0 automatic, nonzero manual
    valveInterlockSub  0 clear, nonzero interlocked
    valveFaultSub   0 healthy, nonzero fault
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 180;
var DESIGN_HEIGHT = 175;

var config = this.config || {};
var valveName = config.valveName || "POTABLE WATER VALVE";
var valveTag = config.valveTag || "XV-101";

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
    blue: "#3B82C4",
    blueSoft: "#E1EEF8",
    yellow: "#D6A800",
    yellowSoft: "#FFF4BF",
    red: "#D94C4C",
    redSoft: "#FBE5E5"
};

var valveStatus = 0;
var valveManual = false;
var valveInterlocked = false;
var valveFault = true;
var flashVisible = true;

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

function getValveInformation() {
    switch (valveStatus) {
        case 0:
            return {
                text: "OFF",
                colour: colour.grey,
                soft: colour.greySoft,
                flashing: false
            };

        case 1:
            return {
                text: "ON",
                colour: colour.green,
                soft: colour.greenSoft,
                flashing: false
            };

        case 2:
            return {
                text: "PULSE OFF",
                colour: colour.yellow,
                soft: colour.yellowSoft,
                flashing: true
            };

        case 3:
            return {
                text: "PULSE ON",
                colour: colour.blue,
                soft: colour.blueSoft,
                flashing: true
            };

        case 4:
            return {
                text: "PULSE CONT",
                colour: colour.blue,
                soft: colour.blueSoft,
                flashing: true
            };

        case 5:
            return {
                text: "TURNING ON",
                colour: colour.blue,
                soft: colour.blueSoft,
                flashing: true
            };

        case 6:
            return {
                text: "TURNING OFF",
                colour: colour.blue,
                soft: colour.blueSoft,
                flashing: true
            };

        default:
            return {
                text: "UNKNOWN",
                colour: colour.grey,
                soft: colour.greySoft,
                flashing: false
            };
    }
}

function isOnPosition() {
    return (
        valveStatus === 1 ||
        valveStatus === 3 ||
        valveStatus === 4 ||
        valveStatus === 5
    );
}

function getActiveColour() {
    var information = getValveInformation();

    if (valveFault) {
        return flashVisible ? colour.red : colour.grey;
    }

    if (information.flashing && !flashVisible) {
        return colour.grey;
    }

    return information.colour;
}

function getActiveSoftColour() {
    var information = getValveInformation();

    if (valveFault) {
        return flashVisible ? colour.redSoft : colour.greySoft;
    }

    if (information.flashing && !flashVisible) {
        return colour.greySoft;
    }

    return information.soft;
}

function drawActuator(ctx, centreX, valveY) {
    var activeColour = getActiveColour();
    var actuatorX = centreX - 21;
    var actuatorY = 53;
    var actuatorWidth = 42;
    var actuatorHeight = 25;

    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centreX, actuatorY + actuatorHeight);
    ctx.lineTo(centreX, valveY - 6);
    ctx.stroke();

    ctx.fillStyle = getActiveSoftColour();
    roundedRect(
        ctx,
        actuatorX,
        actuatorY,
        actuatorWidth,
        actuatorHeight,
        5
    );
    ctx.fill();

    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 1.5;
    roundedRect(
        ctx,
        actuatorX,
        actuatorY,
        actuatorWidth,
        actuatorHeight,
        5
    );
    ctx.stroke();

    ctx.fillStyle = activeColour;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ACT", centreX, actuatorY + 9);

    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centreX - 10, actuatorY + 17);
    ctx.lineTo(centreX + 10, actuatorY + 17);
    ctx.stroke();

    ctx.fillStyle = activeColour;
    ctx.beginPath();
    ctx.arc(
        isOnPosition()
            ? centreX + 8
            : centreX - 8,
        actuatorY + 17,
        2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawValveBody(ctx) {
    var centreX = 100;
    var centreY = 111;
    var activeColour = getActiveColour();

    ctx.fillStyle = colour.surface;
    ctx.strokeStyle = activeColour;
    ctx.lineWidth = 2.2;

    /*
    Compact flanged ends belonging to the valve symbol.
    */
    ctx.strokeRect(58, centreY - 10, 7, 20);
    ctx.strokeRect(135, centreY - 10, 7, 20);

    /*
    Opposed valve-body halves.
    */
    ctx.beginPath();
    ctx.moveTo(65, centreY - 18);
    ctx.lineTo(100, centreY);
    ctx.lineTo(65, centreY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(135, centreY - 18);
    ctx.lineTo(100, centreY);
    ctx.lineTo(135, centreY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = getActiveSoftColour();
    ctx.beginPath();
    ctx.arc(100, centreY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = activeColour;
    ctx.beginPath();
    ctx.arc(100, centreY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    drawActuator(ctx, centreX, centreY);
}

function drawModeIndication(ctx) {
    if (!valveInterlocked && !valveManual) {
        return;
    }

    var x = 145;
    var y = 53;
    var width = 44;
    var height = 30;
    var modeColour =
        valveInterlocked ? colour.red : colour.yellow;
    var modeSoft =
        valveInterlocked ? colour.redSoft : colour.yellowSoft;

    ctx.fillStyle = modeSoft;
    roundedRect(ctx, x, y, width, height, 6);
    ctx.fill();

    ctx.strokeStyle = modeColour;
    ctx.lineWidth = 1.4;
    roundedRect(ctx, x, y, width, height, 6);
    ctx.stroke();

    ctx.fillStyle = modeColour;
    ctx.font =
        valveInterlocked ? "bold 8px Arial" : "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        valveInterlocked ? "INTLK" : "MAN",
        x + width / 2,
        y + height / 2
    );
}

function drawLabels(ctx) {
    var information = getValveInformation();
    var positionColour = information.colour;

    if (information.flashing && !flashVisible) {
        positionColour = colour.grey;
    }

    ctx.fillStyle = colour.muted;
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(valveName, 100, 27);

    /*
    Valve position state replaces the old top tag location.
    */
    ctx.fillStyle = positionColour;
    ctx.font = "bold 9px Arial";
    ctx.fillText(information.text, 100, 43);

    /*
    Equipment tag sits between the valve symbol and fault area.
    */
    ctx.fillStyle = colour.muted;
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(valveTag, 100, 137);

    /*
    No healthy fault indicator is drawn.
    */
    if (valveFault) {
        ctx.fillStyle = getActiveSoftColour();
        roundedRect(ctx, 61, 148, 78, 22, 11);
        ctx.fill();

        ctx.fillStyle = getActiveColour();
        ctx.beginPath();
        ctx.arc(75, 159, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 9px Arial";
        ctx.textAlign = "left";
        ctx.fillText("FAULT", 85, 159);
    }
}

function drawValveObject(ctx) {
    drawValveBody(ctx);
    drawModeIndication(ctx);
    drawLabels(ctx);
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
    canvas.translate(-10, 0);
    drawValveObject(canvas);
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
    config.valveStatusSub,
    "Potable water valve status",
    function (input) {
        valveStatus = Math.round(safeNumber(input, 0));
    }
);

bindSubscription(
    config.valveModeSub,
    "Potable water valve mode",
    function (input) {
        valveManual = safeNumber(input, 0) !== 0;
    }
);

bindSubscription(
    config.valveInterlockSub,
    "Potable water valve interlock",
    function (input) {
        valveInterlocked = safeNumber(input, 0) !== 0;
    }
);

bindSubscription(
    config.valveFaultSub,
    "Potable water valve fault",
    function (input) {
        valveFault = safeNumber(input, 0) !== 0;
    }
);

draw();

setInterval(function () {
    var information = getValveInformation();

    if (information.flashing || valveFault) {
        flashVisible = !flashVisible;
        draw();
    } else {
        flashVisible = true;
    }
}, 500);
