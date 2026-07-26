/*
============================================================
POLYMER UNIT - POLYMER BATCH TANK
Weintek EasyBuilder Pro JS Object

Design size: 190 x 280 px
Standalone transparent object.

Required subscriptions:
    lowLevelSub   - low switch wet/active status
    highLevelSub  - batch-start high switch wet/active status
    mixerStatusSub - DOL mixer operating status
    mixerFaultSub  - DOL mixer numeric fault code

Switch interpretation:
    low = 0, high = 0  -> low level
    low = 1, high = 0  -> filling / operating level
    low = 1, high = 1  -> batch ready
    low = 0, high = 1  -> switch conflict
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 190;
var DESIGN_HEIGHT = 280;

var config = this.config || {};
var tankName = config.tankName || "POLYMER TANK";
var lowSwitchTag = config.lowSwitchTag || "LSL-201";
var highSwitchTag = config.highSwitchTag || "LSH-201";
var mixerName = config.mixerName || "MIXER";
var mixerTag = config.mixerTag || "M-201";

var colour = {
    surface: "#FFFFFF",
    border: "#DCE4EA",
    borderDark: "#A9B6BD",
    text: "#2B3A43",
    muted: "#71808A",
    grey: "#6F7D85",
    greySoft: "#E8ECEF",
    liquid: "#9CA9AF",
    liquidSoft: "#D5DDE1",
    green: "#2E9B69",
    greenSoft: "#DDF3E8",
    blue: "#3B82C4",
    blueSoft: "#E1EEF8",
    yellow: "#D6A800",
    yellowSoft: "#FFF4BF",
    red: "#D94C4C",
    redSoft: "#FBE5E5"
};

var lowLevelActive = false;
var highLevelActive = false;
var lowHasValidValue = false;
var highHasValidValue = false;

var mixerStatus = 0;
var mixerFaultCode = 0;

var levelFlashVisible = true;
var levelFlashTick = 0;
var mixerFlashVisible = true;
var mixerFlashElapsed = 0;
var mixerAngle = 0;
var lastMixerTimerTime = Date.now();

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

function getCondition() {
    if (!lowHasValidValue || !highHasValidValue) {
        return "fault";
    }

    if (highLevelActive && !lowLevelActive) {
        return "conflict";
    }

    if (highLevelActive) {
        return "ready";
    }

    if (!lowLevelActive) {
        return "low";
    }

    return "filling";
}

function getStatusText() {
    switch (getCondition()) {
        case "ready":
            return "BATCH READY";

        case "low":
            return "LOW LEVEL";

        case "filling":
            return "FILLING";

        case "conflict":
            return "SWITCH CONFLICT";

        default:
            return "SIGNAL FAULT";
    }
}

function getConditionColour() {
    var condition = getCondition();

    if (
        (condition === "low" ||
         condition === "fault" ||
         condition === "conflict") &&
        !levelFlashVisible
    ) {
        return colour.grey;
    }

    switch (condition) {
        case "ready":
            return colour.green;

        case "low":
            return colour.yellow;

        case "filling":
            return colour.grey;

        default:
            return colour.red;
    }
}

function getConditionSoftColour() {
    var condition = getCondition();

    if (
        (condition === "low" ||
         condition === "fault" ||
         condition === "conflict") &&
        !levelFlashVisible
    ) {
        return colour.greySoft;
    }

    switch (condition) {
        case "ready":
            return colour.greenSoft;

        case "low":
            return colour.yellowSoft;

        case "filling":
            return colour.greySoft;

        default:
            return colour.redSoft;
    }
}

function getMixerStatusInformation() {
    switch (mixerStatus) {
        case 0:
            return {
                text: "OFF",
                colour: colour.grey,
                soft: colour.greySoft,
                rotating: false,
                flashing: false
            };

        case 1:
            return {
                text: "ON",
                colour: colour.green,
                soft: colour.greenSoft,
                rotating: true,
                flashing: false
            };

        case 2:
            return {
                text: "PULSE OFF",
                colour: colour.yellow,
                soft: colour.yellowSoft,
                rotating: false,
                flashing: true
            };

        case 3:
            return {
                text: "PULSE ON",
                colour: colour.green,
                soft: colour.greenSoft,
                rotating: true,
                flashing: true
            };

        case 4:
            return {
                text: "PULSE CONT",
                colour: colour.green,
                soft: colour.greenSoft,
                rotating: true,
                flashing: true
            };

        case 5:
            return {
                text: "TURNING ON",
                colour: colour.blue,
                soft: colour.blueSoft,
                rotating: true,
                flashing: true
            };

        case 6:
            return {
                text: "TURNING OFF",
                colour: colour.blue,
                soft: colour.blueSoft,
                rotating: true,
                flashing: true
            };

        default:
            return {
                text: "UNKNOWN",
                colour: colour.grey,
                soft: colour.greySoft,
                rotating: false,
                flashing: false
            };
    }
}

function getMixerFaultText() {
    switch (mixerFaultCode) {
        case 0:
            return "";

        case 16:
            return "ON/OFF FAIL";

        case 32:
            return "I/O FAULT";

        case 34:
            return "CONFIG ERROR";

        default:
            return "FAULT " + String(mixerFaultCode);
    }
}

function hasMixerFault() {
    return mixerFaultCode !== 0;
}

function getMixerColour() {
    var information = getMixerStatusInformation();

    if (hasMixerFault()) {
        return mixerFlashVisible ? colour.red : colour.grey;
    }

    if (information.flashing && !mixerFlashVisible) {
        return colour.grey;
    }

    return information.colour;
}

function getMixerSoftColour() {
    var information = getMixerStatusInformation();

    if (hasMixerFault()) {
        return mixerFlashVisible ? colour.redSoft : colour.greySoft;
    }

    if (information.flashing && !mixerFlashVisible) {
        return colour.greySoft;
    }

    return information.soft;
}

function getInferredLevelFraction() {
    if (highLevelActive && lowLevelActive) {
        return 0.68;
    }

    if (lowLevelActive) {
        return 0.40;
    }

    return 0.10;
}

function drawTank(ctx) {
    var tankX = 55;
    var tankY = 82;
    var tankWidth = 75;
    var tankHeight = 122;

    var innerX = tankX + 5;
    var innerY = tankY + 5;
    var innerWidth = tankWidth - 10;
    var innerHeight = tankHeight - 16;

    ctx.fillStyle = "#F0F4F6";
    ctx.fillRect(innerX, innerY, innerWidth, innerHeight);

    var fraction = getInferredLevelFraction();
    var liquidHeight = innerHeight * fraction;
    var liquidY = innerY + innerHeight - liquidHeight;
    var condition = getCondition();

    ctx.fillStyle =
        condition === "ready"
            ? colour.greenSoft
            : condition === "low"
                ? colour.yellowSoft
                : colour.liquidSoft;
    ctx.fillRect(
        innerX,
        liquidY,
        innerWidth,
        liquidHeight
    );

    ctx.fillStyle =
        condition === "ready"
            ? colour.green
            : condition === "low"
                ? colour.yellow
                : colour.liquid;
    ctx.fillRect(innerX, liquidY, innerWidth, 3);

    ctx.strokeStyle = colour.borderDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tankX, tankY);
    ctx.lineTo(tankX, tankY + tankHeight - 11);
    ctx.quadraticCurveTo(
        tankX,
        tankY + tankHeight,
        tankX + 11,
        tankY + tankHeight
    );
    ctx.lineTo(
        tankX + tankWidth - 11,
        tankY + tankHeight
    );
    ctx.quadraticCurveTo(
        tankX + tankWidth,
        tankY + tankHeight,
        tankX + tankWidth,
        tankY + tankHeight - 11
    );
    ctx.lineTo(tankX + tankWidth, tankY);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX - 4, tankY);
    ctx.lineTo(tankX + tankWidth + 4, tankY);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tankX + 14, tankY + tankHeight);
    ctx.lineTo(tankX + 14, tankY + tankHeight + 9);
    ctx.moveTo(
        tankX + tankWidth - 14,
        tankY + tankHeight
    );
    ctx.lineTo(
        tankX + tankWidth - 14,
        tankY + tankHeight + 9
    );
    ctx.stroke();
}

function mixerPoint(
    centreX,
    centreY,
    radius,
    angle
) {
    return {
        x: centreX + Math.cos(angle) * radius,
        y: centreY + Math.sin(angle) * radius
    };
}

function drawMixerImpeller(
    ctx,
    centreX,
    centreY,
    angle,
    impellerColour
) {
    var blade;

    ctx.fillStyle = impellerColour;
    ctx.strokeStyle = impellerColour;
    ctx.lineWidth = 1.2;

    for (blade = 0; blade < 3; blade++) {
        var bladeAngle =
            angle + blade * Math.PI * 2 / 3;

        var rootLeading = mixerPoint(
            centreX,
            centreY,
            3,
            bladeAngle - 0.30
        );

        var leadingControl = mixerPoint(
            centreX,
            centreY,
            10,
            bladeAngle - 0.48
        );

        var tip = mixerPoint(
            centreX,
            centreY,
            16,
            bladeAngle - 0.10
        );

        var trailingControl = mixerPoint(
            centreX,
            centreY,
            12,
            bladeAngle + 0.38
        );

        var rootTrailing = mixerPoint(
            centreX,
            centreY,
            3,
            bladeAngle + 0.30
        );

        ctx.beginPath();
        ctx.moveTo(rootLeading.x, rootLeading.y);
        ctx.quadraticCurveTo(
            leadingControl.x,
            leadingControl.y,
            tip.x,
            tip.y
        );
        ctx.quadraticCurveTo(
            trailingControl.x,
            trailingControl.y,
            rootTrailing.x,
            rootTrailing.y
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /*
    Central shaft hub.
    */
    ctx.fillStyle = colour.surface;
    ctx.strokeStyle = impellerColour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(
        centreX,
        centreY,
        4,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = impellerColour;
    ctx.beginPath();
    ctx.arc(
        centreX,
        centreY,
        1.8,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawMixer(ctx) {
    var motorX = 72;
    var motorY = 55;
    var motorWidth = 42;
    var motorHeight = 22;
    var shaftX = 93;
    var impellerY = 164;
    var mixerColour = getMixerColour();
    var information = getMixerStatusInformation();
    var statusColour = information.colour;

    if (information.flashing && !mixerFlashVisible) {
        statusColour = colour.grey;
    }

    /*
    DOL motor body and cooling ribs.
    */
    ctx.fillStyle = getMixerSoftColour();
    roundedRect(
        ctx,
        motorX,
        motorY,
        motorWidth,
        motorHeight,
        5
    );
    ctx.fill();

    ctx.strokeStyle = mixerColour;
    ctx.lineWidth = 1.7;
    roundedRect(
        ctx,
        motorX,
        motorY,
        motorWidth,
        motorHeight,
        5
    );
    ctx.stroke();

    ctx.lineWidth = 1;
    var ribX;
    for (ribX = motorX + 8; ribX < motorX + 36; ribX += 7) {
        ctx.beginPath();
        ctx.moveTo(ribX, motorY + 4);
        ctx.lineTo(ribX, motorY + motorHeight - 4);
        ctx.stroke();
    }

    ctx.fillStyle = mixerColour;
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", shaftX, motorY + motorHeight / 2);

    /*
    Mixer shaft and rotating impeller.
    */
    ctx.strokeStyle = mixerColour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shaftX, motorY + motorHeight);
    ctx.lineTo(shaftX, impellerY);
    ctx.stroke();

    drawMixerImpeller(
        ctx,
        shaftX,
        impellerY,
        mixerAngle,
        mixerColour
    );

    /*
    Operating state is separate from fault status.
    */
    ctx.fillStyle = colour.muted;
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "left";
    ctx.fillText(mixerName, 120, 55);

    ctx.fillStyle = statusColour;
    ctx.font = "bold 7px Arial";
    ctx.fillText(information.text, 120, 65);

    ctx.fillStyle = colour.muted;
    ctx.font = "7px Arial";
    ctx.fillText(mixerTag, 120, 75);

    if (hasMixerFault()) {
        ctx.fillStyle = getMixerSoftColour();
        roundedRect(ctx, 35, 252, 120, 22, 11);
        ctx.fill();

        ctx.fillStyle = mixerColour;
        ctx.beginPath();
        ctx.arc(48, 263, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 8px Arial";
        ctx.textAlign = "left";
        ctx.fillText(getMixerFaultText(), 58, 263);
    }
}

function drawLevelSwitch(
    ctx,
    centreY,
    tag,
    description,
    active,
    alarm
) {
    var tankRight = 130;
    var centreX = 142;
    var switchColour =
        alarm
            ? getConditionColour()
            : active
                ? colour.green
                : colour.grey;

    ctx.strokeStyle = switchColour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tankRight, centreY);
    ctx.lineTo(centreX - 7, centreY);
    ctx.stroke();

    ctx.fillStyle = colour.surface;
    ctx.beginPath();
    ctx.arc(centreX, centreY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = switchColour;
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        tag.indexOf("LSH") === 0 ? "H" : "L",
        centreX,
        centreY
    );

    ctx.fillStyle = colour.muted;
    ctx.font = "7px Arial";
    ctx.textAlign = "left";
    ctx.fillText(tag, 152, centreY - 4);
    ctx.fillText(description, 152, centreY + 5);
}

function drawStatus(ctx) {
    ctx.fillStyle = getConditionSoftColour();
    roundedRect(ctx, 35, 222, 120, 23, 11);
    ctx.fill();

    ctx.fillStyle = getConditionColour();
    ctx.beginPath();
    ctx.arc(48, 233.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 8px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(getStatusText(), 58, 233.5);
}

function drawPolymerTank(ctx) {
    ctx.fillStyle = colour.text;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tankName, 95, 20);

    ctx.fillStyle = colour.muted;
    ctx.font = "8px Arial";
    ctx.fillText("BATCH MAKE-UP", 95, 36);

    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(25, 49.5);
    ctx.lineTo(165, 49.5);
    ctx.stroke();

    drawTank(ctx);
    drawMixer(ctx);

    /*
    High switch is deliberately around 65% of vessel height,
    leaving headspace above the batch-start level.
    */
    drawLevelSwitch(
        ctx,
        124,
        highSwitchTag,
        "BATCH START",
        highLevelActive,
        false
    );

    drawLevelSwitch(
        ctx,
        178,
        lowSwitchTag,
        "LOW LEVEL",
        lowLevelActive,
        !lowLevelActive
    );

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
    drawPolymerTank(canvas);
    canvas.restore();
}

function bindSwitch(
    subscription,
    description,
    updateFunction,
    validFunction
) {
    if (
        !subscription ||
        typeof subscription.onResponse !== "function"
    ) {
        console.log(description + " subscription not configured");
        draw();
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
            updateFunction(
                safeNumber(data.values[0], 0) !== 0
            );
            validFunction();
            draw();
        }
    });
}

function bindNumeric(
    subscription,
    description,
    updateFunction,
    errorValue
) {
    if (
        !subscription ||
        typeof subscription.onResponse !== "function"
    ) {
        console.log(description + " subscription not configured");
        updateFunction(errorValue);
        draw();
        return;
    }

    subscription.onResponse(function (error, data) {
        if (error) {
            console.log(description + " error: " + String(error));
            updateFunction(errorValue);
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

bindSwitch(
    config.lowLevelSub,
    "Polymer tank low-level switch",
    function (input) {
        lowLevelActive = input;
    },
    function () {
        lowHasValidValue = true;
    }
);

bindSwitch(
    config.highLevelSub,
    "Polymer tank high-level switch",
    function (input) {
        highLevelActive = input;
    },
    function () {
        highHasValidValue = true;
    }
);

bindNumeric(
    config.mixerStatusSub,
    "Polymer tank mixer status",
    function (input) {
        mixerStatus = Math.round(safeNumber(input, 0));
    },
    0
);

bindNumeric(
    config.mixerFaultSub,
    "Polymer tank mixer fault",
    function (input) {
        mixerFaultCode = Math.round(safeNumber(input, 0));
    },
    32
);

draw();

setInterval(function () {
    var condition = getCondition();

    if (
        condition !== "low" &&
        condition !== "fault" &&
        condition !== "conflict"
    ) {
        levelFlashVisible = true;
        levelFlashTick = 0;
        return;
    }

    levelFlashTick += 1;

    if (condition === "low" && levelFlashTick < 2) {
        return;
    }

    levelFlashTick = 0;
    levelFlashVisible = !levelFlashVisible;
    draw();
}, 500);

setInterval(function () {
    var now = Date.now();
    var delta = Math.min(200, now - lastMixerTimerTime);
    var information = getMixerStatusInformation();
    var redraw = false;

    lastMixerTimerTime = now;

    if (information.rotating && !hasMixerFault()) {
        mixerAngle += delta * 0.006;
        redraw = true;
    }

    mixerFlashElapsed += delta;

    if (mixerFlashElapsed >= 500) {
        mixerFlashElapsed = 0;

        if (information.flashing || hasMixerFault()) {
            mixerFlashVisible = !mixerFlashVisible;
            redraw = true;
        } else {
            mixerFlashVisible = true;
        }
    }

    if (redraw) {
        draw();
    }
}, 100);
