/*
============================================================
POLYMER UNIT - NUMERIC SETPOINT WIDGET
Weintek EasyBuilder Pro JS Object

Design size: 360 x 44 px

Native EasyBuilder Numeric Input overlay:
    x=213, y=7, width=60, height=30

Configure the native Numeric Input and this JS object to the same
setpoint tag. The JS field is intentionally blank.
============================================================
*/

var canvas = new Canvas();
var mouseArea = new MouseArea();
this.widget.add(canvas);
this.widget.add(mouseArea);

var DESIGN_WIDTH = 360;
var DESIGN_HEIGHT = 44;
var config = this.config || {};

var setpointName = config.setpointName || "SETPOINT";
var setpointUnit = config.setpointUnit || "";
var setpointMinimum = safeNumber(config.setpointMinimum, 0);
var setpointMaximum = safeNumber(config.setpointMaximum, 100);
var setpointIncrement = Math.max(
    0.001,
    safeNumber(config.setpointIncrement, 0.5)
);

var setpointValue = 0;
var setpointKnown = false;
var privilegeEnabled = false;
var pressedButton = "";

var colour = {
    surface: "#FFFFFF",
    pressed: "#E8EEEF",
    field: "#F7F9FA",
    line: "#DCE4EA",
    label: "#71808A",
    unit: "#87959D",
    disabled: "#B9C3C9",
    disabledSoft: "#EFF2F4",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0"
};

var buttons = [
    { id: "down", text: "\u2212", x: 174, y: 7, width: 32, height: 30 },
    { id: "up", text: "+", x: 318, y: 7, width: 32, height: 30 }
];

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

function fitText(ctx, input, maximumWidth) {
    var output = String(input);

    if (ctx.measureText(output).width <= maximumWidth) {
        return output;
    }

    while (
        output.length > 0 &&
        ctx.measureText(output + "...").width > maximumWidth
    ) {
        output = output.substring(0, output.length - 1);
    }

    return output + "...";
}

function toBoolean(input) {
    if (typeof input === "string") {
        var text = input.toLowerCase();
        var numberValue = Number(text);
        return (
            text === "true" ||
            text === "on" ||
            (isFinite(numberValue) && numberValue !== 0)
        );
    }
    return Number(input) !== 0;
}

function drawButton(ctx, button) {
    var pressed = pressedButton === button.id;
    fillRounded(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        6,
        privilegeEnabled
            ? pressed ? colour.accentSoft : colour.surface
            : colour.disabledSoft,
        privilegeEnabled && pressed ? colour.accent : colour.line
    );
    ctx.fillStyle =
        privilegeEnabled ? colour.accent : colour.disabled;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2
    );
}

function drawWidget(ctx) {
    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 1, 1, 358, 42, 7);
    ctx.fill();
    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    roundedRect(ctx, 1, 1, 358, 42, 7);
    ctx.stroke();

    ctx.fillStyle = colour.label;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, setpointName, 155), 9, 22);

    fillRounded(
        ctx,
        213,
        7,
        60,
        30,
        6,
        privilegeEnabled ? colour.field : colour.disabledSoft,
        colour.line
    );

    ctx.fillStyle = colour.unit;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(setpointUnit, 294, 22);

    drawButton(ctx, buttons[0]);
    drawButton(ctx, buttons[1]);
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
    drawWidget(canvas);
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

function writeSetpoint(value) {
    if (!config.setpointWrite) {
        console.log("Numeric setpoint write address is not configured");
        return;
    }
    driver.setData(config.setpointWrite, value, function (error) {
        if (error) {
            console.log(
                "Numeric setpoint write error: " +
                String(error.message || error)
            );
        }
    });
}

function adjustSetpoint(direction) {
    if (!privilegeEnabled) {
        return;
    }

    if (!setpointKnown) {
        setpointValue = setpointMinimum;
        setpointKnown = true;
    }
    setpointValue = clamp(
        setpointValue + direction * setpointIncrement,
        setpointMinimum,
        setpointMaximum
    );
    writeSetpoint(setpointValue);
}

mouseArea.on("mousedown", function (mouseEvent) {
    var position = screenToDesign(mouseEvent.x, mouseEvent.y);
    pressedButton =
        privilegeEnabled
            ? getButtonAtPosition(position.x, position.y)
            : "";
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
    if (!privilegeEnabled) {
        draw();
        return;
    }
    if (selected === "down") {
        adjustSetpoint(-1);
    } else if (selected === "up") {
        adjustSetpoint(1);
    }
    draw();
});

if (
    config.setpointSub &&
    typeof config.setpointSub.onResponse === "function"
) {
    config.setpointSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "Numeric setpoint subscription error: " +
                String(error.message || error)
            );
            return;
        }
        if (data && data.values && data.values.length > 0) {
            var value = Number(data.values[0]);
            if (isFinite(value)) {
                setpointValue = clamp(
                    value,
                    setpointMinimum,
                    setpointMaximum
                );
                setpointKnown = true;
            }
        }
    });
}

if (
    config.privilegeSub &&
    typeof config.privilegeSub.onResponse === "function"
) {
    config.privilegeSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "Numeric setpoint privilege subscription error: " +
                String(error.message || error)
            );
            privilegeEnabled = false;
            pressedButton = "";
            draw();
            return;
        }
        if (data && data.values && data.values.length > 0) {
            privilegeEnabled = toBoolean(data.values[0]);
            if (!privilegeEnabled) {
                pressedButton = "";
            }
            draw();
        }
    });
}

draw();
