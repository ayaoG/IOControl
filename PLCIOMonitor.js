/*
============================================================
PLC I/O MONITOR
Weintek EasyBuilder Pro JavaScript Object
============================================================

Design size: 800 x 350

This is one JavaScript object with three internal tabs:
    - Discrete Inputs  (16 points)
    - Discrete Outputs (16 points)
    - Analog Inputs    (16 points)

The object is read-only. Tab changes are local to this object
and do not write to the PLC or change an EasyBuilder window.

Configuration key pattern (01 through 16):
    di01Name, di01Description, di01Sub
    do01Name, do01Description, do01Sub
    ai01Name, ai01Description, ai01Unit, ai01Decimals,
    ai01Sub
============================================================
*/


/* ==========================================================
   CANVAS AND TOUCH AREA
========================================================== */

var canvas = new Canvas();
var mouseArea = new MouseArea();

this.widget.add(canvas);
this.widget.add(mouseArea);


/* ==========================================================
   DESIGN AND CONFIGURATION
========================================================== */

var DESIGN_WIDTH = 800;
var DESIGN_HEIGHT = 350;
var CONFIG = this.config;

var colour = {
    background: "#1D252C",
    panel: "#232C33",
    panelAlternate: "#202930",
    border: "#4B5962",
    borderSoft: "#37444C",
    text: "#D9E1E6",
    muted: "#93A1AA",
    green: "#22C55E",
    greenDark: "#126B35",
    grey: "#7F8B94",
    greyDark: "#3F4B53",
    blue: "#38BDF8",
    blueDark: "#176386",
    pressed: "#34424B"
};

var pages = [
    {
        id: "di",
        title: "DISCRETE INPUT",
        valueHeading: "STATUS"
    },
    {
        id: "do",
        title: "DISCRETE OUTPUT",
        valueHeading: "STATUS"
    },
    {
        id: "ai",
        title: "ANALOG INPUT",
        valueHeading: "VALUE"
    }
];

var activePage = 0;
var pressedPage = -1;

var values = {
    di: [],
    do: [],
    ai: []
};

for (var initialIndex = 0; initialIndex < 16; initialIndex++) {
    values.di.push(null);
    values.do.push(null);
    values.ai.push(null);
}


/* ==========================================================
   HELPERS
========================================================== */

function padTwo(input) {
    return input < 10 ? "0" + input : String(input);
}


function configuredText(key, fallback) {
    var configuredValue = CONFIG[key];

    if (
        configuredValue === undefined ||
        configuredValue === null ||
        String(configuredValue).length === 0
    ) {
        return fallback;
    }

    return String(configuredValue);
}


function toNumber(input, fallback) {
    var numberValue = Number(input);

    return isNaN(numberValue) ? fallback : numberValue;
}


function roundedRectangle(
    context,
    x,
    y,
    width,
    height,
    radius
) {
    var r = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
    );
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
}


function fitText(context, textValue, maximumWidth) {
    var output = String(textValue);

    if (context.measureText(output).width <= maximumWidth) {
        return output;
    }

    while (
        output.length > 1 &&
        context.measureText(output + "...").width > maximumWidth
    ) {
        output = output.substring(0, output.length - 1);
    }

    return output + "...";
}


function getScaleGeometry() {
    var actualWidth = canvas.width || DESIGN_WIDTH;
    var actualHeight = canvas.height || DESIGN_HEIGHT;
    var scale = Math.min(
        actualWidth / DESIGN_WIDTH,
        actualHeight / DESIGN_HEIGHT
    );

    return {
        scale: scale,
        offsetX: (actualWidth - DESIGN_WIDTH * scale) / 2,
        offsetY: (actualHeight - DESIGN_HEIGHT * scale) / 2
    };
}


function screenToDesign(screenX, screenY) {
    var geometry = getScaleGeometry();

    return {
        x: (screenX - geometry.offsetX) / geometry.scale,
        y: (screenY - geometry.offsetY) / geometry.scale
    };
}


/* ==========================================================
   PAGE HEADER AND TAB DRAWING
========================================================== */

var PAGE_HEADER_HEIGHT = 20;
var TAB_Y = 27;
var TAB_HEIGHT = 39;
var TAB_GAP = 8;
var TAB_WIDTH = 196;
var TAB_START_X =
    (DESIGN_WIDTH - (TAB_WIDTH * 3 + TAB_GAP * 2)) / 2;


function getTabRectangle(index) {
    return {
        x: TAB_START_X + index * (TAB_WIDTH + TAB_GAP),
        y: TAB_Y,
        width: TAB_WIDTH,
        height: TAB_HEIGHT
    };
}


function drawPageHeader(context) {
    context.fillStyle = colour.panel;
    context.fillRect(0, 0, DESIGN_WIDTH, PAGE_HEADER_HEIGHT);

    context.strokeStyle = colour.borderSoft;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, PAGE_HEADER_HEIGHT - 0.5);
    context.lineTo(DESIGN_WIDTH, PAGE_HEADER_HEIGHT - 0.5);
    context.stroke();

    context.fillStyle = colour.text;
    context.font = "bold 13px Arial";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText("I/O MONITOR", 16, PAGE_HEADER_HEIGHT / 2);
}


function drawTabs(context) {
    for (var index = 0; index < pages.length; index++) {
        var rectangle = getTabRectangle(index);
        var isActive = index === activePage;
        var isPressed = index === pressedPage;

        roundedRectangle(
            context,
            rectangle.x,
            rectangle.y,
            rectangle.width,
            rectangle.height,
            5
        );

        context.fillStyle = isPressed
            ? colour.pressed
            : (isActive ? colour.blueDark : colour.panel);
        context.fill();

        context.strokeStyle = isActive ? colour.blue : colour.border;
        context.lineWidth = isActive ? 2 : 1;
        context.stroke();

        context.fillStyle = isActive ? "#FFFFFF" : colour.muted;
        context.font = "bold 13px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
            pages[index].title,
            rectangle.x + rectangle.width / 2,
            rectangle.y + rectangle.height / 2
        );
    }
}


/* ==========================================================
   I/O TABLE DRAWING
========================================================== */

var TABLE_X = 8;
var TABLE_Y = 74;
var TABLE_WIDTH = 784;
var COLUMN_GAP = 8;
var GROUP_WIDTH = (TABLE_WIDTH - COLUMN_GAP) / 2;
var HEADER_HEIGHT = 25;
var ROW_HEIGHT = 31;


function drawColumnHeader(context, x, page) {
    context.fillStyle = colour.panel;
    context.fillRect(x, TABLE_Y, GROUP_WIDTH, HEADER_HEIGHT);

    context.strokeStyle = colour.border;
    context.lineWidth = 1;
    context.strokeRect(x, TABLE_Y, GROUP_WIDTH, HEADER_HEIGHT);

    context.fillStyle = colour.muted;
    context.font = "bold 10px Arial";
    context.textBaseline = "middle";
    context.textAlign = "left";

    context.fillText(page.valueHeading, x + 10, TABLE_Y + 13);
    context.fillText("I/O NAME", x + 74, TABLE_Y + 13);
    context.fillText("DESCRIPTION", x + 184, TABLE_Y + 13);
}


function drawDiscreteStatus(context, x, centerY, input) {
    var isKnown = input !== null;
    var isOn = isKnown && toNumber(input, 0) !== 0;

    context.beginPath();
    context.arc(x + 22, centerY, 7, 0, Math.PI * 2);
    context.fillStyle = isOn
        ? colour.green
        : (isKnown ? colour.grey : colour.greyDark);
    context.fill();

    context.strokeStyle = isOn ? "#9AF0B7" : colour.border;
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = isOn ? colour.green : colour.muted;
    context.font = "bold 10px Arial";
    context.textAlign = "left";
    context.fillText(
        isKnown ? (isOn ? "ON" : "OFF") : "--",
        x + 34,
        centerY
    );
}


function drawAnalogValue(context, x, centerY, index, input) {
    var number = Number(input);
    var isKnown = input !== null && !isNaN(number);
    var keyNumber = padTwo(index + 1);
    var decimals = Math.round(
        toNumber(CONFIG["ai" + keyNumber + "Decimals"], 1)
    );

    decimals = Math.max(0, Math.min(4, decimals));

    var unit = configuredText("ai" + keyNumber + "Unit", "");
    var display = isKnown ? number.toFixed(decimals) : "--";

    if (isKnown && unit.length > 0) {
        display += " " + unit;
    }

    context.fillStyle = isKnown ? colour.blue : colour.muted;
    context.font = "bold 11px Arial";
    context.textAlign = "left";
    context.fillText(fitText(context, display, 58), x + 9, centerY);
}


function drawIORow(context, page, index) {
    var column = index < 8 ? 0 : 1;
    var row = index % 8;
    var x = TABLE_X + column * (GROUP_WIDTH + COLUMN_GAP);
    var y = TABLE_Y + HEADER_HEIGHT + row * ROW_HEIGHT;
    var centerY = y + ROW_HEIGHT / 2;
    var keyNumber = padTwo(index + 1);
    var prefix = page.id;
    var name = configuredText(
        prefix + keyNumber + "Name",
        prefix.toUpperCase() + keyNumber
    );
    var description = configuredText(
        prefix + keyNumber + "Description",
        "Not configured"
    );

    context.fillStyle = row % 2 === 0
        ? colour.panelAlternate
        : colour.background;
    context.fillRect(x, y, GROUP_WIDTH, ROW_HEIGHT);

    context.strokeStyle = colour.borderSoft;
    context.lineWidth = 1;
    context.strokeRect(x, y, GROUP_WIDTH, ROW_HEIGHT);

    context.textBaseline = "middle";

    if (page.id === "ai") {
        drawAnalogValue(context, x, centerY, index, values.ai[index]);
    } else {
        drawDiscreteStatus(
            context,
            x,
            centerY,
            values[page.id][index]
        );
    }

    context.fillStyle = colour.text;
    context.font = "bold 11px Arial";
    context.textAlign = "left";
    context.fillText(fitText(context, name, 102), x + 74, centerY);

    context.fillStyle = colour.muted;
    context.font = "11px Arial";
    context.fillText(
        fitText(context, description, GROUP_WIDTH - 192),
        x + 184,
        centerY
    );
}


function drawTable(context) {
    var page = pages[activePage];

    drawColumnHeader(context, TABLE_X, page);
    drawColumnHeader(
        context,
        TABLE_X + GROUP_WIDTH + COLUMN_GAP,
        page
    );

    for (var index = 0; index < 16; index++) {
        drawIORow(context, page, index);
    }
}


/* ==========================================================
   MAIN DRAW
========================================================== */

function draw() {
    var actualWidth = canvas.width || DESIGN_WIDTH;
    var actualHeight = canvas.height || DESIGN_HEIGHT;
    var geometry = getScaleGeometry();

    canvas.clearRect(0, 0, actualWidth, actualHeight);
    canvas.save();
    canvas.translate(geometry.offsetX, geometry.offsetY);
    canvas.scale(geometry.scale, geometry.scale);

    canvas.fillStyle = colour.background;
    canvas.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    drawPageHeader(canvas);
    drawTabs(canvas);
    drawTable(canvas);

    canvas.restore();
}


/* ==========================================================
   TOUCH HANDLING
========================================================== */

function tabAtPosition(x, y) {
    for (var index = 0; index < pages.length; index++) {
        var rectangle = getTabRectangle(index);

        if (
            x >= rectangle.x &&
            x <= rectangle.x + rectangle.width &&
            y >= rectangle.y &&
            y <= rectangle.y + rectangle.height
        ) {
            return index;
        }
    }

    return -1;
}


mouseArea.on(
    "mousedown",
    function (mouseEvent) {
        var point = screenToDesign(mouseEvent.x, mouseEvent.y);
        pressedPage = tabAtPosition(point.x, point.y);
        draw();
    }
);


mouseArea.on(
    "mouseup",
    function () {
        pressedPage = -1;
        draw();
    }
);


mouseArea.on(
    "click",
    function (mouseEvent) {
        var point = screenToDesign(mouseEvent.x, mouseEvent.y);
        var selectedPage = tabAtPosition(point.x, point.y);

        pressedPage = -1;

        if (selectedPage >= 0) {
            activePage = selectedPage;
        }

        draw();
    }
);


/* ==========================================================
   PLC SUBSCRIPTIONS
========================================================== */

function bindSubscription(subscription, description, updateFunction) {
    if (
        !subscription ||
        typeof subscription.onResponse !== "function"
    ) {
        console.log(description + " subscription not configured");
        return;
    }

    subscription.onResponse(
        function (error, data) {
            if (error) {
                console.log(description + " error: " + String(error));
                updateFunction(null);
                draw();
                return;
            }

            if (data && data.values && data.values.length > 0) {
                updateFunction(data.values[0]);
                draw();
            }
        }
    );
}


function bindAllPoints() {
    for (var typeIndex = 0; typeIndex < pages.length; typeIndex++) {
        (function (type) {
            for (var pointIndex = 0; pointIndex < 16; pointIndex++) {
                (function (capturedIndex) {
                    var pointNumber = padTwo(capturedIndex + 1);
                    var description =
                        type.toUpperCase() + " " + pointNumber;

                    bindSubscription(
                        CONFIG[type + pointNumber + "Sub"],
                        description,
                        function (input) {
                            values[type][capturedIndex] = input;
                        }
                    );
                }(pointIndex));
            }
        }(pages[typeIndex].id));
    }
}


bindAllPoints();
draw();
