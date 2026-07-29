/*
============================================================
POLYMER UNIT - DIGITAL OUTPUT FACEPLATE
Weintek EasyBuilder Pro JS Object

Design size: 480 x 230 px

Device status:
    0 Off, 1 On, 2 Pulse Off, 3 Pulse On,
    4 Pulse Continuous, 5 Turning On, 6 Turning Off

Fault:
    0 None, 16 On/Off Fail, 32 I/O Fault, 34 Config Error

Mode write:
    0 Auto, 1 Manual

Output command writes:
    onCmdWrite  - momentary ON command
    offCmdWrite - momentary OFF command
============================================================
*/

var canvas = new Canvas();
var mouseArea = new MouseArea();
this.widget.add(canvas);
this.widget.add(mouseArea);

var DESIGN_WIDTH = 480;
var DESIGN_HEIGHT = 230;
var config = this.config || {};

var commandPulseMs = Math.max(100, toNumber(config.commandPulseMs, 300));

var colour = {
    background: "#F7F9FA",
    surface: "#FFFFFF",
    pressed: "#E8EEEF",
    line: "#DCE4EA",
    text: "#2B3A43",
    secondary: "#71808A",
    disabled: "#B9C3C9",
    disabledSoft: "#EFF2F4",
    green: "#2E9B69",
    greenSoft: "#DDF3E8",
    blue: "#2589B8",
    blueSoft: "#DDEFF7",
    yellow: "#D6A800",
    yellowSoft: "#FFF4BF",
    amber: "#D08A00",
    amberSoft: "#FFF1CC",
    red: "#D94C4C",
    redSoft: "#FBE5E5",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0"
};

var deviceManual = false;
var modeKnown = false;
var deviceStatus = 0;
var statusKnown = false;
var faultCode = 0;
var faultKnown = false;
var readyReset = false;
var pressedButton = "";

var buttons = [
    { id: "auto", text: "AUTO", x: 27, y: 82, width: 60, height: 30 },
    { id: "manual", text: "MAN", x: 94, y: 82, width: 60, height: 30 },
    { id: "on", text: "ON", x: 16, y: 153, width: 138, height: 56 },
    { id: "off", text: "OFF", x: 171, y: 153, width: 138, height: 56 },
    { id: "reset", text: "RESET", x: 326, y: 153, width: 138, height: 56 }
];

function toNumber(input, fallback) {
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

function statusInformation() {
    if (!statusKnown) {
        return { text: "---", colour: colour.secondary, soft: colour.disabledSoft };
    }
    switch (deviceStatus) {
        case 0:
            return { text: "OFF", colour: colour.secondary, soft: colour.disabledSoft };
        case 1:
            return { text: "ON", colour: colour.green, soft: colour.greenSoft };
        case 2:
            return { text: "PULSE OFF", colour: colour.yellow, soft: colour.yellowSoft };
        case 3:
            return { text: "PULSE ON", colour: colour.green, soft: colour.greenSoft };
        case 4:
            return { text: "PULSE CONT", colour: colour.green, soft: colour.greenSoft };
        case 5:
            return { text: "TURNING ON", colour: colour.blue, soft: colour.blueSoft };
        case 6:
            return { text: "TURNING OFF", colour: colour.blue, soft: colour.blueSoft };
        default:
            return {
                text: "UNKNOWN " + String(deviceStatus),
                colour: colour.yellow,
                soft: colour.yellowSoft
            };
    }
}

function faultInformation() {
    if (!faultKnown) {
        return { text: "FAULT: ---", colour: colour.secondary, soft: colour.disabledSoft };
    }
    switch (faultCode) {
        case 0:
            return { text: "FAULT: NONE", colour: colour.secondary, soft: colour.disabledSoft };
        case 16:
            return { text: "ON/OFF FAIL", colour: colour.red, soft: colour.redSoft };
        case 32:
            return { text: "I/O FAULT", colour: colour.red, soft: colour.redSoft };
        case 34:
            return { text: "CONFIG ERROR", colour: colour.red, soft: colour.redSoft };
        default:
            return {
                text: "FAULT " + String(faultCode),
                colour: colour.red,
                soft: colour.redSoft
            };
    }
}

function isButtonEnabled(buttonId) {
    if (buttonId === "on") {
        return (
            modeKnown &&
            deviceManual &&
            statusKnown &&
            deviceStatus === 0
        );
    }
    if (buttonId === "off") {
        return (
            modeKnown &&
            deviceManual &&
            statusKnown &&
            deviceStatus !== 0
        );
    }
    if (buttonId === "reset") {
        return modeKnown && deviceManual && readyReset;
    }
    return buttonId === "auto" || buttonId === "manual";
}

function buttonColours(buttonId) {
    var active =
        (buttonId === "auto" && modeKnown && !deviceManual) ||
        (buttonId === "manual" && modeKnown && deviceManual);

    if (!isButtonEnabled(buttonId)) {
        return {
            fill: colour.disabledSoft,
            border: colour.line,
            text: colour.disabled
        };
    }
    if (pressedButton === buttonId) {
        return {
            fill: colour.pressed,
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
    if (buttonId === "on") {
        return {
            fill: colour.greenSoft,
            border: colour.green,
            text: colour.green
        };
    }
    if (buttonId === "off") {
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
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2
    );
}

function drawFaceplate(ctx) {
    var deviceInformation = statusInformation();
    var fault = faultInformation();

    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    fillRounded(ctx, 6, 6, 468, 218, 10, colour.surface, colour.line);

    fillRounded(ctx, 304, 13, 160, 26, 6, fault.soft, null);
    ctx.fillStyle = fault.colour;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fault.text, 384, 26);

    ctx.strokeStyle = colour.line;
    ctx.beginPath();
    ctx.moveTo(16, 44.5);
    ctx.lineTo(464, 44.5);
    ctx.stroke();

    fillRounded(ctx, 16, 55, 150, 74, 8, colour.surface, colour.line);
    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.fillText("CONTROL MODE", 27, 70);

    fillRounded(ctx, 178, 55, 286, 74, 8, colour.surface, colour.line);
    ctx.fillStyle = colour.secondary;
    ctx.fillText("DEVICE STATUS", 189, 70);
    fillRounded(
        ctx,
        188,
        82,
        266,
        30,
        6,
        deviceInformation.soft,
        null
    );
    ctx.fillStyle = deviceInformation.colour;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(deviceInformation.text, 321, 97);

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

function executeButton(buttonId) {
    if (buttonId === "auto") {
        writeAddress(config.modeWrite, 0, "Auto mode write");
    } else if (buttonId === "manual") {
        writeAddress(config.modeWrite, 1, "Manual mode write");
    } else if (buttonId === "on") {
        pulseAddress(config.onCmdWrite, "ON command");
    } else if (buttonId === "off") {
        pulseAddress(config.offCmdWrite, "OFF command");
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

bindSubscription(config.modeSub, "Device mode subscription", function (input) {
    deviceManual = toNumber(input, 0) !== 0;
    modeKnown = true;
});
bindSubscription(config.deviceStatusSub, "Device status subscription", function (input) {
    deviceStatus = Math.round(toNumber(input, 0));
    statusKnown = true;
});
bindSubscription(config.faultSub, "Device fault subscription", function (input) {
    faultCode = Math.round(toNumber(input, 0));
    faultKnown = true;
});
bindSubscription(config.readyResetSub, "Ready reset subscription", function (input) {
    readyReset = toNumber(input, 0) !== 0;
});

draw();
