/*
============================================================
POLYMER UNIT - VSD FACEPLATE
Weintek EasyBuilder Pro JS Object

Design size: 560 x 360 px

VSD status:
    0 Unknown, 1 Stopped, 2 Running Fwd, 3 Running Rev,
    5 Starting Fwd, 6 Starting Rev, 10 Stopping

VSD fault:
    0 None, 16 Fail To Start, 17 Fail To Stop,
    18 Drive Fault, 32 I/O Fault

Command direction:
    0 Stop, 1 Forward, 2 Reverse

Mode uses one maintained write tag:
    0 Auto, 1 Manual

Native EasyBuilder overlay areas:
    Last-fault display:         x=26, y=156, w=230, h=32
    Manual-speed Numeric Input: x=72, y=232, w=138, h=36
============================================================
*/

var canvas = new Canvas();
var mouseArea = new MouseArea();
this.widget.add(canvas);
this.widget.add(mouseArea);

var DESIGN_WIDTH = 560;
var DESIGN_HEIGHT = 360;
var config = this.config || {};

var faceplateTitle = config.faceplateTitle || "VSD FACEPLATE";
var equipmentTag = config.equipmentTag || "VSD-101";
var currentUnit = config.currentUnit || "A";
var speedUnit = config.speedUnit || "Hz";
var voltageUnit = config.voltageUnit || "V";
var powerUnit = config.powerUnit || "kW";
var valueDecimals = clamp(Math.round(toNumber(config.valueDecimals, 1)), 0, 2);
var manualSpeedMinimum = toNumber(config.manualSpeedMinimum, 0);
var manualSpeedMaximum = toNumber(config.manualSpeedMaximum, 100);
var manualSpeedStep = Math.max(0.1, toNumber(config.manualSpeedStep, 0.5));
var commandPulseMs = Math.max(100, toNumber(config.commandPulseMs, 300));

var colour = {
    background: "#F7F9FA",
    surface: "#FFFFFF",
    surfacePressed: "#E8EEEF",
    line: "#DCE4EA",
    text: "#2B3A43",
    reading: "#607580",
    secondary: "#71808A",
    disabled: "#B9C3C9",
    disabledSoft: "#EFF2F4",
    blue: "#2589B8",
    blueSoft: "#DDEFF7",
    green: "#2E9B69",
    greenSoft: "#DDF3E8",
    amber: "#D08A00",
    amberSoft: "#FFF1CC",
    red: "#D94C4C",
    redSoft: "#FBE5E5",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0"
};

var vsdManual = false;
var modeKnown = false;
var commandDirection = 0;
var commandDirectionKnown = false;
var vsdStatus = 0;
var statusKnown = false;
var vsdFaultCode = 0;
var faultKnown = false;
var currentValue = null;
var speedFeedback = null;
var voltageValue = null;
var powerValue = null;
var manualSpeed = 0;
var manualSpeedKnown = false;
var readyReset = false;
var pressedButton = "";

var buttons = [
    { id: "auto", text: "AUTO", x: 27, y: 78, width: 62, height: 29 },
    { id: "manual", text: "MAN", x: 96, y: 78, width: 62, height: 29 },
    { id: "speedDown", text: "\u2212", x: 26, y: 232, width: 38, height: 36 },
    { id: "speedUp", text: "+", x: 218, y: 232, width: 38, height: 36 },
    { id: "startFwd", text: "START FWD", x: 16, y: 292, width: 164, height: 48 },
    { id: "stop", text: "STOP", x: 198, y: 292, width: 164, height: 48 },
    { id: "reset", text: "RESET", x: 380, y: 292, width: 164, height: 48 }
];

function toNumber(input, fallback) {
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
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function fillRounded(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.fillStyle = fill;
    roundedRect(ctx, x, y, width, height, radius);
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        roundedRect(ctx, x, y, width, height, radius);
        ctx.stroke();
    }
}

function drawLabel(ctx, text, x, y, align) {
    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
}

function statusInformation() {
    if (!statusKnown) {
        return { text: "---", colour: colour.secondary, soft: colour.disabledSoft };
    }
    switch (vsdStatus) {
        case 1:
            return { text: "STOPPED", colour: colour.secondary, soft: colour.disabledSoft };
        case 2:
            return { text: "RUNNING FWD", colour: colour.green, soft: colour.greenSoft };
        case 3:
            return { text: "RUNNING REV", colour: colour.green, soft: colour.greenSoft };
        case 5:
            return { text: "STARTING FWD", colour: colour.blue, soft: colour.blueSoft };
        case 6:
            return { text: "STARTING REV", colour: colour.blue, soft: colour.blueSoft };
        case 10:
            return { text: "STOPPING", colour: colour.amber, soft: colour.amberSoft };
        default:
            return { text: "UNKNOWN " + String(vsdStatus), colour: colour.amber, soft: colour.amberSoft };
    }
}

function directionInformation() {
    if (!commandDirectionKnown) {
        return { text: "---", colour: colour.secondary, soft: colour.disabledSoft };
    }
    switch (commandDirection) {
        case 0:
            return { text: "STOP", colour: colour.secondary, soft: colour.disabledSoft };
        case 1:
            return { text: "FORWARD", colour: colour.blue, soft: colour.blueSoft };
        case 2:
            return { text: "REVERSE", colour: colour.blue, soft: colour.blueSoft };
        default:
            return {
                text: "UNKNOWN " + String(commandDirection),
                colour: colour.amber,
                soft: colour.amberSoft
            };
    }
}

function faultInformation() {
    if (!faultKnown) {
        return {
            text: "FAULT: ---",
            colour: colour.secondary,
            soft: colour.disabledSoft
        };
    }
    switch (vsdFaultCode) {
        case 0:
            return {
                text: "FAULT: NONE",
                colour: colour.secondary,
                soft: colour.disabledSoft
            };
        case 16:
            return {
                text: "FAIL TO START",
                colour: colour.red,
                soft: colour.redSoft
            };
        case 17:
            return {
                text: "FAIL TO STOP",
                colour: colour.red,
                soft: colour.redSoft
            };
        case 18:
            return {
                text: "DRIVE FAULT",
                colour: colour.red,
                soft: colour.redSoft
            };
        case 32:
            return {
                text: "I/O FAULT",
                colour: colour.red,
                soft: colour.redSoft
            };
        default:
            return {
                text: "FAULT " + String(vsdFaultCode),
                colour: colour.red,
                soft: colour.redSoft
            };
    }
}

function formatValue(input, unit) {
    if (input === null || !isFinite(Number(input))) {
        return "---";
    }
    return Number(input).toFixed(valueDecimals) + " " + unit;
}

function drawStatusPanel(ctx, x, width, label, information) {
    fillRounded(ctx, x, 55, width, 64, 8, colour.surface, colour.line);
    drawLabel(ctx, label, x + 11, 70);
    fillRounded(
        ctx,
        x + 9,
        80,
        width - 18,
        27,
        6,
        information.soft,
        null
    );
    ctx.fillStyle = information.colour;
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(information.text, x + width / 2, 94);
}

function drawMeasurement(ctx, x, y, label, value) {
    fillRounded(ctx, x, y, 131, 68, 8, colour.surface, colour.line);
    drawLabel(ctx, label, x + 10, y + 16);
    ctx.fillStyle = colour.reading;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x + 65.5, y + 43);
}

function isButtonEnabled(buttonId) {
    if (buttonId === "startFwd") {
        return (
            modeKnown &&
            vsdManual &&
            statusKnown &&
            vsdStatus === 1
        );
    }
    if (buttonId === "stop") {
        return (
            modeKnown &&
            vsdManual &&
            statusKnown &&
            vsdStatus !== 1
        );
    }
    if (buttonId === "reset") {
        return modeKnown && vsdManual && readyReset;
    }
    if (buttonId === "speedDown" || buttonId === "speedUp") {
        return modeKnown && vsdManual;
    }
    return buttonId === "auto" || buttonId === "manual";
}

function buttonColours(buttonId) {
    var active =
        (buttonId === "auto" && modeKnown && !vsdManual) ||
        (buttonId === "manual" && modeKnown && vsdManual);

    if (!isButtonEnabled(buttonId)) {
        return {
            fill: colour.disabledSoft,
            border: colour.line,
            text: colour.disabled
        };
    }
    if (pressedButton === buttonId) {
        return {
            fill: colour.surfacePressed,
            border: colour.secondary,
            text: colour.text
        };
    }
    if (active) {
        return {
            fill: colour.accentSoft,
            border: colour.accent,
            text: colour.accent
        };
    }
    if (buttonId === "startFwd") {
        return {
            fill: colour.greenSoft,
            border: colour.green,
            text: colour.green
        };
    }
    if (buttonId === "stop") {
        return {
            fill: colour.redSoft,
            border: colour.red,
            text: colour.red
        };
    }
    if (buttonId === "reset") {
        return {
            fill: colour.amberSoft,
            border: colour.amber,
            text: colour.amber
        };
    }
    return {
        fill: colour.surface,
        border: colour.line,
        text: colour.text
    };
}

function drawButton(ctx, button) {
    var colours = buttonColours(button.id);
    fillRounded(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        7,
        colours.fill,
        colours.border
    );
    ctx.fillStyle = colours.text;
    ctx.font =
        button.id === "speedDown" || button.id === "speedUp"
            ? "bold 19px Arial"
            : "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2
    );
}

function drawLeftPanels(ctx) {
    fillRounded(ctx, 16, 130, 250, 68, 8, colour.surface, colour.line);
    drawLabel(ctx, "LAST FAULT CODE", 26, 146);
    fillRounded(
        ctx,
        26,
        156,
        230,
        32,
        6,
        "#FFFFFF",
        colour.line
    );

    fillRounded(ctx, 16, 206, 250, 72, 8, colour.surface, colour.line);
    drawLabel(ctx, "MANUAL SPEED", 26, 222);
    fillRounded(
        ctx,
        72,
        232,
        138,
        36,
        6,
        modeKnown && vsdManual ? "#FFFFFF" : colour.disabledSoft,
        modeKnown && vsdManual ? colour.accent : colour.line
    );
}

function drawFaceplate(ctx) {
    var driveInformation = statusInformation();
    var direction = directionInformation();
    var fault = faultInformation();

    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    fillRounded(ctx, 6, 6, 548, 348, 10, colour.surface, colour.line);

    ctx.fillStyle = colour.text;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(faceplateTitle, 18, 26);
    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "right";
    ctx.fillText(equipmentTag, 370, 26);
    fillRounded(ctx, 386, 13, 156, 26, 6, fault.soft, null);
    ctx.fillStyle = fault.colour;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(fault.text, 464, 26);
    ctx.strokeStyle = colour.line;
    ctx.beginPath();
    ctx.moveTo(16, 44.5);
    ctx.lineTo(544, 44.5);
    ctx.stroke();

    fillRounded(ctx, 16, 55, 150, 64, 8, colour.surface, colour.line);
    drawLabel(ctx, "CONTROL MODE", 27, 70);
    drawStatusPanel(ctx, 178, 174, "CMD DIRECTION", direction);
    drawStatusPanel(ctx, 364, 180, "VSD STATUS", driveInformation);

    drawLeftPanels(ctx);
    drawMeasurement(ctx, 274, 130, "CURRENT", formatValue(currentValue, currentUnit));
    drawMeasurement(ctx, 413, 130, "SPEED FEEDBACK", formatValue(speedFeedback, speedUnit));
    drawMeasurement(ctx, 274, 206, "VOLTAGE", formatValue(voltageValue, voltageUnit));
    drawMeasurement(ctx, 413, 206, "POWER", formatValue(powerValue, powerUnit));

    var index;
    for (index = 0; index < buttons.length; index++) {
        drawButton(ctx, buttons[index]);
    }
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;
    canvas.clearRect(0, 0, width, height);
    if (width <= 0 || height <= 0) {
        return;
    }
    canvas.save();
    canvas.scale(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    drawFaceplate(canvas);
    canvas.restore();
}

function screenToDesign(mouseX, mouseY) {
    return {
        x: mouseX * DESIGN_WIDTH / canvas.width,
        y: mouseY * DESIGN_HEIGHT / canvas.height
    };
}

function getButtonAtPosition(x, y) {
    var index;
    for (index = 0; index < buttons.length; index++) {
        var button = buttons[index];
        if (
            x >= button.x &&
            x <= button.x + button.width &&
            y >= button.y &&
            y <= button.y + button.height
        ) {
            return button.id;
        }
    }
    return "";
}

function writeAddress(address, value, description, callback) {
    if (!address) {
        console.log(description + " address is not configured");
        return;
    }
    driver.setData(address, value, function (err) {
        if (err) {
            console.log(description + " error: " + String(err.message || err));
            return;
        }
        if (typeof callback === "function") {
            callback();
        }
    });
}

function pulseAddress(address, description) {
    writeAddress(address, 1, description + " set", function () {
        setTimeout(function () {
            writeAddress(address, 0, description + " clear");
        }, commandPulseMs);
    });
}

function adjustManualSpeed(direction) {
    if (!modeKnown || !vsdManual) {
        return;
    }
    if (!manualSpeedKnown) {
        manualSpeed = manualSpeedMinimum;
        manualSpeedKnown = true;
    }
    manualSpeed = clamp(
        manualSpeed + direction * manualSpeedStep,
        manualSpeedMinimum,
        manualSpeedMaximum
    );
    writeAddress(
        config.manualSpeedWrite,
        manualSpeed,
        "Manual speed write"
    );
}

function executeButton(buttonId) {
    if (buttonId === "auto") {
        writeAddress(config.modeWrite, 0, "Auto mode write");
    } else if (buttonId === "manual") {
        writeAddress(config.modeWrite, 1, "Manual mode write");
    } else if (buttonId === "speedDown") {
        adjustManualSpeed(-1);
    } else if (buttonId === "speedUp") {
        adjustManualSpeed(1);
    } else if (buttonId === "startFwd") {
        pulseAddress(config.startFwdCmdWrite, "Start forward command");
    } else if (buttonId === "stop") {
        pulseAddress(config.stopCmdWrite, "Stop command");
    } else if (buttonId === "reset") {
        pulseAddress(config.resetCmdWrite, "Reset command");
    }
}

mouseArea.on("mousedown", function (mouseEvent) {
    var position = screenToDesign(mouseEvent.x, mouseEvent.y);
    var selected = getButtonAtPosition(position.x, position.y);
    pressedButton = isButtonEnabled(selected) ? selected : "";
    draw();
});

mouseArea.on("mouseup", function () {
    pressedButton = "";
    draw();
});

mouseArea.on("click", function (mouseEvent) {
    var position = screenToDesign(mouseEvent.x, mouseEvent.y);
    var selected = getButtonAtPosition(position.x, position.y);
    pressedButton = "";
    if (selected && isButtonEnabled(selected)) {
        executeButton(selected);
    }
    draw();
});

function bindSubscription(subscription, description, updateFunction) {
    if (!subscription || typeof subscription.onResponse !== "function") {
        return;
    }
    subscription.onResponse(function (err, data) {
        if (err) {
            console.log(description + " error: " + String(err.message || err));
            return;
        }
        if (data && data.values && data.values.length > 0) {
            updateFunction(data.values[0]);
            draw();
        }
    });
}

bindSubscription(config.modeSub, "VSD mode subscription", function (input) {
    vsdManual = toNumber(input, 0) !== 0;
    modeKnown = true;
});
bindSubscription(config.commandDirectionSub, "Command direction subscription", function (input) {
    commandDirection = Math.round(toNumber(input, 0));
    commandDirectionKnown = true;
});
bindSubscription(config.vsdStatusSub, "VSD status subscription", function (input) {
    vsdStatus = Math.round(toNumber(input, 0));
    statusKnown = true;
});
bindSubscription(config.vsdFaultSub, "VSD fault subscription", function (input) {
    vsdFaultCode = Math.round(toNumber(input, 0));
    faultKnown = true;
});
bindSubscription(config.currentSub, "Current subscription", function (input) {
    currentValue = toNumber(input, 0);
});
bindSubscription(config.speedFeedbackSub, "Speed feedback subscription", function (input) {
    speedFeedback = toNumber(input, 0);
});
bindSubscription(config.voltageSub, "Voltage subscription", function (input) {
    voltageValue = toNumber(input, 0);
});
bindSubscription(config.powerSub, "Power subscription", function (input) {
    powerValue = toNumber(input, 0);
});
bindSubscription(config.manualSpeedSub, "Manual speed subscription", function (input) {
    manualSpeed = clamp(
        toNumber(input, manualSpeedMinimum),
        manualSpeedMinimum,
        manualSpeedMaximum
    );
    manualSpeedKnown = true;
});
bindSubscription(config.readyResetSub, "Ready reset subscription", function (input) {
    readyReset = toNumber(input, 0) !== 0;
});

draw();
