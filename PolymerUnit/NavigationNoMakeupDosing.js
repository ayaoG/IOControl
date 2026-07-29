/*
POLYMER UNIT - NAVIGATION WITHOUT MAKE-UP OR DOSING
Weintek EasyBuilder Pro JS Object
Object size: 150 x 530 px; place at x=0, y=35.
*/

var canvas = new Canvas();
var mouseArea = new MouseArea();
this.widget.add(canvas);
this.widget.add(mouseArea);

var DESIGN_WIDTH = 150;
var DESIGN_HEIGHT = 530;
var config = this.config || {};
var navigationWrite = config.navigationWrite;

var colour = {
    background: "#F7F9FA",
    surface: "#FFFFFF",
    pressed: "#E8EEEF",
    line: "#DCE4EA",
    primary: "#2B3A43",
    secondary: "#71808A",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0"
};

// Windows 11 and 12 remain reserved but are not shown.
var navigationItems = [
    { window: 10, text: "OVERVIEW", icon: "overview" },
    { window: 13, text: "SETPOINTS", icon: "setpoint" },
    { window: 14, text: "TRENDS", icon: "trend" },
    { window: 15, text: "ALARMS", icon: "alarm" },
    { window: 16, text: "SETTINGS", icon: "settings" }
];

var activeWindow = 10;
var pressedWindow = -1;

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

function getTabGeometry(index) {
    return { x: 8, y: 10 + index * 65, width: 134, height: 58 };
}

function drawIcon(ctx, name, x, y, iconColour) {
    ctx.strokeStyle = iconColour;
    ctx.fillStyle = iconColour;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (name === "overview") {
        ctx.strokeRect(x - 8, y - 8, 6, 6);
        ctx.strokeRect(x + 2, y - 8, 6, 6);
        ctx.strokeRect(x - 8, y + 2, 6, 6);
        ctx.strokeRect(x + 2, y + 2, 6, 6);
        return;
    }

    if (name === "mix") {
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.lineTo(x + 8, y - 8);
        ctx.lineTo(x + 6, y + 8);
        ctx.lineTo(x - 6, y + 8);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.moveTo(x - 4, y + 2);
        ctx.lineTo(x, y + 5);
        ctx.lineTo(x + 4, y + 2);
        ctx.stroke();
        return;
    }

    if (name === "setpoint") {
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 7);
        ctx.lineTo(x + 9, y - 7);
        ctx.moveTo(x - 9, y);
        ctx.lineTo(x + 9, y);
        ctx.moveTo(x - 9, y + 7);
        ctx.lineTo(x + 9, y + 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - 3, y - 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 1, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    if (name === "trend") {
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 7);
        ctx.lineTo(x - 4, y + 1);
        ctx.lineTo(x + 1, y + 4);
        ctx.lineTo(x + 9, y - 7);
        ctx.stroke();
        return;
    }

    if (name === "alarm") {
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + 10, y + 9);
        ctx.lineTo(x - 10, y + 9);
        ctx.closePath();
        ctx.stroke();
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", x, y + 3);
        return;
    }

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.stroke();
    var index;
    for (index = 0; index < 8; index++) {
        var angle = index * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 9, y + Math.sin(angle) * 9);
        ctx.lineTo(x + Math.cos(angle) * 11, y + Math.sin(angle) * 11);
        ctx.stroke();
    }
}

function drawTab(ctx, item, index) {
    var geometry = getTabGeometry(index);
    var isActive = item.window === activeWindow;
    var isPressed = item.window === pressedWindow;
    var fill = colour.surface;
    var border = colour.line;
    var text = colour.secondary;

    if (isPressed) {
        fill = colour.pressed;
        text = colour.primary;
    } else if (isActive) {
        fill = colour.accentSoft;
        border = colour.accent;
        text = colour.accent;
    }

    ctx.fillStyle = fill;
    roundedRect(ctx, geometry.x, geometry.y, geometry.width, geometry.height, 7);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    roundedRect(ctx, geometry.x, geometry.y, geometry.width, geometry.height, 7);
    ctx.stroke();

    if (isActive) {
        ctx.fillStyle = colour.accent;
        roundedRect(ctx, geometry.x, geometry.y + 10, 4, geometry.height - 20, 2);
        ctx.fill();
    }

    drawIcon(
        ctx,
        item.icon,
        geometry.x + 25,
        geometry.y + geometry.height / 2,
        text
    );
    ctx.fillStyle = text;
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(item.text, geometry.x + 47, geometry.y + geometry.height / 2);
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
    canvas.fillStyle = colour.background;
    canvas.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    canvas.strokeStyle = colour.line;
    canvas.lineWidth = 1;
    canvas.beginPath();
    canvas.moveTo(DESIGN_WIDTH - 0.5, 0);
    canvas.lineTo(DESIGN_WIDTH - 0.5, DESIGN_HEIGHT);
    canvas.stroke();

    var index;
    for (index = 0; index < navigationItems.length; index++) {
        drawTab(canvas, navigationItems[index], index);
    }
    canvas.restore();
}

function screenToDesign(mouseX, mouseY) {
    return {
        x: mouseX * DESIGN_WIDTH / canvas.width,
        y: mouseY * DESIGN_HEIGHT / canvas.height
    };
}

function getWindowAtPosition(x, y) {
    var index;
    for (index = 0; index < navigationItems.length; index++) {
        var geometry = getTabGeometry(index);
        if (
            x >= geometry.x &&
            x <= geometry.x + geometry.width &&
            y >= geometry.y &&
            y <= geometry.y + geometry.height
        ) {
            return navigationItems[index].window;
        }
    }
    return -1;
}

function writeNavigation(windowNumber) {
    if (!navigationWrite) {
        console.log("Navigation write address is not configured");
        return;
    }
    driver.setData(navigationWrite, windowNumber, function (err) {
        if (err) {
            console.log("Navigation write error:", err.message);
        }
    });
}

mouseArea.on("mousedown", function (mouseEvent) {
    var position = screenToDesign(mouseEvent.x, mouseEvent.y);
    pressedWindow = getWindowAtPosition(position.x, position.y);
    draw();
});

mouseArea.on("mouseup", function () {
    pressedWindow = -1;
    draw();
});

mouseArea.on("click", function (mouseEvent) {
    var position = screenToDesign(mouseEvent.x, mouseEvent.y);
    var selectedWindow = getWindowAtPosition(position.x, position.y);
    pressedWindow = -1;
    if (selectedWindow < 0) {
        draw();
        return;
    }
    activeWindow = selectedWindow;
    draw();
    writeNavigation(selectedWindow);
});

if (
    config.activePageSub &&
    typeof config.activePageSub.onResponse === "function"
) {
    config.activePageSub.onResponse(function (err, data) {
        if (err) {
            console.log("Active page subscription error:", err.message);
            return;
        }
        if (data && data.values && data.values.length > 0) {
            var value = Number(data.values[0]);
            if (isFinite(value)) {
                activeWindow = Math.round(value);
                pressedWindow = -1;
                draw();
            }
        }
    });
}

draw();
