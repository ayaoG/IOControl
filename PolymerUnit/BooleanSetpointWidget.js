/*
============================================================
POLYMER UNIT - BOOLEAN ENABLE SETPOINT
Weintek EasyBuilder Pro JS Object

Design size: 220 x 44 px
OFF and ON write 0 and 1 to one maintained Boolean setpoint.
============================================================
*/

var canvas = new Canvas();
var mouseArea = new MouseArea();
this.widget.add(canvas);
this.widget.add(mouseArea);

var DESIGN_WIDTH = 220;
var DESIGN_HEIGHT = 44;
var config = this.config || {};
var setpointName = config.setpointName || "ENABLE";
var onText = config.onText || "ON";
var offText = config.offText || "OFF";

var setpointValue = false;
var setpointKnown = false;
var privilegeEnabled = false;
var pressedButton = "";

var colour = {
    surface: "#FFFFFF",
    pressed: "#E8EEEF",
    line: "#DCE4EA",
    label: "#71808A",
    disabled: "#B9C3C9",
    disabledSoft: "#EFF2F4",
    grey: "#7D8A91",
    greySoft: "#E8ECEF",
    green: "#2E9B69",
    greenSoft: "#DDF3E8"
};

var buttons = [
    { id: "off", text: offText, x: 96, y: 7, width: 55, height: 30 },
    { id: "on", text: onText, x: 157, y: 7, width: 54, height: 30 }
];

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

function drawButton(ctx, button) {
    var active =
        setpointKnown &&
        (
            (button.id === "on" && setpointValue) ||
            (button.id === "off" && !setpointValue)
        );
    var buttonColour =
        button.id === "on" ? colour.green : colour.grey;
    var buttonSoft =
        button.id === "on" ? colour.greenSoft : colour.greySoft;
    var fill =
        privilegeEnabled
            ? pressedButton === button.id
                ? colour.pressed
                : active ? buttonSoft : colour.surface
            : colour.disabledSoft;

    fillRounded(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        6,
        fill,
        privilegeEnabled && active ? buttonColour : colour.line
    );
    ctx.fillStyle =
        privilegeEnabled
            ? active ? buttonColour : colour.label
            : colour.disabled;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        fitText(ctx, button.text, button.width - 8),
        button.x + button.width / 2,
        button.y + button.height / 2
    );
}

function drawWidget(ctx) {
    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 1, 1, 218, 42, 7);
    ctx.fill();
    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    roundedRect(ctx, 1, 1, 218, 42, 7);
    ctx.stroke();

    ctx.fillStyle = colour.label;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, setpointName, 78), 9, 22);

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
        console.log("Boolean setpoint write address is not configured");
        return;
    }
    driver.setData(config.setpointWrite, value ? 1 : 0, function (error) {
        if (error) {
            console.log(
                "Boolean setpoint write error: " +
                String(error.message || error)
            );
        }
    });
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
    if (selected === "off") {
        writeSetpoint(false);
    } else if (selected === "on") {
        writeSetpoint(true);
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
                "Boolean setpoint subscription error: " +
                String(error.message || error)
            );
            return;
        }
        if (data && data.values && data.values.length > 0) {
            setpointValue = toBoolean(data.values[0]);
            setpointKnown = true;
            draw();
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
                "Boolean setpoint privilege subscription error: " +
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
