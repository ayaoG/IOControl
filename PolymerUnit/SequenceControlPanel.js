/*
============================================================
POLYMER UNIT - SEQUENCE CONTROL PANEL
Weintek EasyBuilder Pro JS Object

Object size: 437 x 150 px
Two objects fill the 874 px Polymer content width.

Command logic matches Ozone/Main Frame.js:
    START - clear STOP, then maintain START at 1
    STOP  - clear START, then maintain STOP at 1
    RESET - pulse RESET from 1 to 0 over 300 ms

Step time is supplied as a PLC TIME value in milliseconds and is
converted to seconds before display.
============================================================
*/

var canvas = new Canvas();
var mouseArea = new MouseArea();

this.widget.add(canvas);
this.widget.add(mouseArea);

var DESIGN_WIDTH = 437;
var DESIGN_HEIGHT = 150;

var config = this.config || {};
var panelTitle = config.panelTitle || "SEQUENCE CONTROL";
var stepTimeDivisor = Math.max(
    1,
    safeNumber(config.stepTimeDivisor, 1000)
);

var startCmdWrite = config.startCmdWrite;
var stopCmdWrite = config.stopCmdWrite;
var resetCmdWrite = config.resetCmdWrite;

var colour = {
    surface: "#FFFFFF",
    surfacePressed: "#E8EEEF",
    line: "#DCE4EA",
    primary: "#2B3A43",
    secondary: "#71808A",
    muted: "#9AA7AE",
    disabled: "#C6CED3",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0",
    stop: "#D94C4C",
    stopSoft: "#FBE5E5",
    reset: "#D08A00",
    resetSoft: "#FFF1CC",
    standby: "#2589B8",
    manual: "#B58B00",
    minorFault: "#E67E22"
};

var sequenceRunning = false;
var sequenceStatusWord = 0;
var readyReset = false;

var startCommand = false;
var stopCommand = false;
var resetCommand = false;

var stepNumber = 0;
var stepTimeSeconds = 0;
var stepMessage = "";
var pressedButton = "";

var buttons = [
    {
        id: "start",
        text: "START",
        x: 14,
        y: 100,
        width: 129,
        height: 37
    },
    {
        id: "stop",
        text: "STOP",
        x: 154,
        y: 100,
        width: 129,
        height: 37
    },
    {
        id: "reset",
        text: "RESET",
        x: 294,
        y: 100,
        width: 129,
        height: 37
    }
];

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

function padTwo(input) {
    return input < 10 ? "0" + String(input) : String(input);
}

function formatStepTime(input) {
    var totalSeconds = Math.max(
        0,
        Math.floor(safeNumber(input, 0))
    );
    var hours = Math.floor(totalSeconds / 3600);
    var minutes;
    var seconds;

    totalSeconds -= hours * 3600;
    minutes = Math.floor(totalSeconds / 60);
    seconds = totalSeconds - minutes * 60;

    return (
        padTwo(hours) +
        ":" +
        padTwo(minutes) +
        ":" +
        padTwo(seconds)
    );
}

function getStatusText() {
    switch (sequenceStatusWord) {
        case 1:
            return "ACTIVE";
        case 2:
            return "IDLE";
        case 3:
            return "STANDBY";
        case 4:
            return "RUNNING";
        case 5:
            return "HOLD";
        case 6:
            return "DEVICE IN MANUAL";
        case 7:
            return "Warning FAULT";
        case 8:
            return "POWERUP HOLD";
        case 9:
            return "POWERUP";
        case 10:
            return "LATCH FAULT";
        default:
            return "UNKNOWN";
    }
}

function getStatusColour() {
    switch (sequenceStatusWord) {
        case 1:
        case 4:
            return colour.accent;
        case 2:
            return colour.secondary;
        case 3:
        case 9:
            return colour.standby;
        case 5:
        case 8:
            return colour.reset;
        case 6:
            return colour.manual;
        case 7:
            return colour.minorFault;
        case 10:
            return colour.stop;
        default:
            return colour.muted;
    }
}

function getMessageText() {
    var text = String(stepMessage || "");
    var maximumLength = 58;

    if (text.length > maximumLength) {
        return text.substring(0, maximumLength - 3) + "...";
    }

    return text || "No step message";
}

function isButtonEnabled(buttonId) {
    switch (buttonId) {
        case "start":
            return !sequenceRunning;
        case "stop":
            return sequenceRunning;
        case "reset":
            return readyReset;
        default:
            return false;
    }
}

function isButtonActive(buttonId) {
    switch (buttonId) {
        case "start":
            return startCommand;
        case "stop":
            return stopCommand;
        case "reset":
            return resetCommand;
        default:
            return false;
    }
}

function getButtonColours(buttonId) {
    if (buttonId === "stop") {
        return {
            normal: colour.stop,
            soft: colour.stopSoft
        };
    }

    if (buttonId === "reset") {
        return {
            normal: colour.reset,
            soft: colour.resetSoft
        };
    }

    return {
        normal: colour.accent,
        soft: colour.accentSoft
    };
}

function drawButton(ctx, button) {
    var enabled = isButtonEnabled(button.id);
    var active = isButtonActive(button.id);
    var pressed = pressedButton === button.id && enabled;
    var buttonColour = getButtonColours(button.id);
    var fill = buttonColour.soft;
    var border = buttonColour.normal;
    var text = buttonColour.normal;

    if (!enabled) {
        fill = "#F3F5F6";
        border = colour.line;
        text = colour.disabled;
    } else if (pressed) {
        fill = buttonColour.normal;
        text = colour.surface;
    }

    ctx.fillStyle = fill;
    roundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        6
    );
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = active || pressed ? 2 : 1;
    roundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        6
    );
    ctx.stroke();

    if (active && enabled && !pressed) {
        ctx.fillStyle = buttonColour.normal;
        ctx.beginPath();
        ctx.arc(button.x + 14, button.y + 18.5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = text;
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2
    );
}

function drawPanel(ctx) {
    ctx.fillStyle = colour.surface;
    roundedRect(ctx, 5, 3, 427, 144, 9);
    ctx.fill();

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, 5, 3, 427, 144, 9);
    ctx.stroke();

    ctx.fillStyle =
        sequenceRunning ? colour.accent : colour.muted;
    roundedRect(ctx, 14, 10, 4, 17, 2);
    ctx.fill();

    ctx.fillStyle = colour.primary;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(panelTitle, 27, 19);

    ctx.fillStyle = getStatusColour();
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "right";
    ctx.fillText(getStatusText(), 421, 19);

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14, 31.5);
    ctx.lineTo(423, 31.5);
    ctx.stroke();

    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "left";
    ctx.fillText("STEP NO.", 15, 44);
    ctx.fillText("STEP TIME", 145, 44);

    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 12px Arial";
    ctx.fillText(String(stepNumber), 72, 44);
    ctx.fillText(formatStepTime(stepTimeSeconds), 205, 44);

    ctx.fillStyle = colour.secondary;
    ctx.font = "bold 8px Arial";
    ctx.fillText("STEP MESSAGE", 15, 59);

    ctx.fillStyle = "#F7F9FA";
    roundedRect(ctx, 15, 66, 408, 27, 5);
    ctx.fill();

    ctx.strokeStyle = colour.line;
    roundedRect(ctx, 15, 66, 408, 27, 5);
    ctx.stroke();

    ctx.fillStyle =
        stepMessage ? colour.primary : colour.muted;
    ctx.font = "10px Arial";
    ctx.fillText(getMessageText(), 24, 80);

    drawButton(ctx, buttons[0]);
    drawButton(ctx, buttons[1]);
    drawButton(ctx, buttons[2]);
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
    drawPanel(canvas);
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

    driver.setData(
        address,
        value,
        function (err) {
            if (err) {
                console.log(
                    description + " error: " + String(err.message || err)
                );
                return;
            }

            if (typeof callback === "function") {
                callback();
            }
        }
    );
}

function writeMaintainedCommand(startValue, stopValue) {
    if (startValue) {
        writeAddress(
            stopCmdWrite,
            0,
            "Stop command clear",
            function () {
                writeAddress(
                    startCmdWrite,
                    1,
                    "Start command set"
                );
            }
        );
        return;
    }

    writeAddress(
        startCmdWrite,
        0,
        "Start command clear",
        function () {
            writeAddress(
                stopCmdWrite,
                stopValue ? 1 : 0,
                "Stop command set"
            );
        }
    );
}

function pulseResetCommand() {
    writeAddress(
        resetCmdWrite,
        1,
        "Reset command set",
        function () {
            setTimeout(function () {
                writeAddress(
                    resetCmdWrite,
                    0,
                    "Reset command clear"
                );
            }, 300);
        }
    );
}

mouseArea.on("mousedown", function (mouseEvent) {
    var position = screenToDesign(mouseEvent.x, mouseEvent.y);
    var selected = getButtonAtPosition(position.x, position.y);

    pressedButton =
        isButtonEnabled(selected) ? selected : "";
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

    if (!isButtonEnabled(selected)) {
        draw();
        return;
    }

    if (selected === "start") {
        writeMaintainedCommand(true, false);
    } else if (selected === "stop") {
        writeMaintainedCommand(false, true);
    } else if (selected === "reset") {
        pulseResetCommand();
    }

    draw();
});

function bindSubscription(
    subscription,
    description,
    updateFunction
) {
    if (
        !subscription ||
        typeof subscription.onResponse !== "function"
    ) {
        console.log(description + " subscription is not configured");
        return;
    }

    subscription.onResponse(function (err, data) {
        if (err) {
            console.log(
                description + " error: " + String(err.message || err)
            );
            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            updateFunction(data.values[0]);

            if (
                pressedButton !== "" &&
                !isButtonEnabled(pressedButton)
            ) {
                pressedButton = "";
            }

            draw();
        }
    });
}

bindSubscription(
    config.sequenceRunningSub,
    "Sequence running status",
    function (input) {
        sequenceRunning = Boolean(input);
    }
);

bindSubscription(
    config.sequenceStatusSub,
    "Sequence status word",
    function (input) {
        sequenceStatusWord =
            Math.round(safeNumber(input, 0));
    }
);

bindSubscription(
    config.readyResetSub,
    "Ready reset status",
    function (input) {
        readyReset = Boolean(input);
    }
);

bindSubscription(
    config.startCmdSub,
    "Start command status",
    function (input) {
        startCommand = Boolean(input);
    }
);

bindSubscription(
    config.stopCmdSub,
    "Stop command status",
    function (input) {
        stopCommand = Boolean(input);
    }
);

bindSubscription(
    config.resetCmdSub,
    "Reset command status",
    function (input) {
        resetCommand = Boolean(input);
    }
);

bindSubscription(
    config.stepNumberSub,
    "Step number",
    function (input) {
        stepNumber = Math.round(safeNumber(input, 0));
    }
);

bindSubscription(
    config.stepTimeSub,
    "Step time",
    function (input) {
        stepTimeSeconds =
            safeNumber(input, 0) /
            stepTimeDivisor;
    }
);

bindSubscription(
    config.stepMessageSub,
    "Step message",
    function (input) {
        stepMessage = input === null || input === undefined
            ? ""
            : String(input);
    }
);

draw();
