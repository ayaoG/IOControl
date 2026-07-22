/*
=============================================================
PLANT OVERVIEW DASHBOARD
Weintek EasyBuilder Pro JavaScript Canvas Object

REVISION 2026-07-22:
    Three-card layout only.
    Process readings are embedded in the corresponding
    Stack Fan, Cooling Tower, and Ozone Generators cards.
    The separate Critical Process Readings card is removed.
    VSD outputs use a 0-50 Hz scale.
    Cooling water flow and configurable units are added.

Dynamically resizable - scales proportionally to fit
whatever width/height the canvas object is set to in
the designer, without distorting text or shapes.

Design reference size:
    500 x 260

THREE REUSABLE COMPONENTS:
    drawEquipmentCard()
    drawOzoneUnitRow()
    drawProcessValue()

Alarm banner removed - to be handled by a separate
js object.
=============================================================
*/



var canvas = new Canvas();
this.widget.add(canvas);


/* ==========================================================
   DESIGN SIZE
========================================================== */

var DESIGN_WIDTH = 500;
var DESIGN_HEIGHT = 260;


/* ==========================================================
   COLOUR PALETTE
========================================================== */

var colour = {
    background: "#171e2400",
    panel: "#222C34",
    panelDark: "#1B242B",
    border: "#53616A",

    text: "#D6DEE3",
    muted: "#82909A",

    green: "#22C55E",
    greenDark: "#116B34",

    amber: "#F5A623",
    amberDark: "#8B5B12",

    red: "#EF4444",
    redDark: "#811F1F",

    blue: "#38BDF8",
    blueDark: "#176386",

    grey: "#7F8B94",
    greyDark: "#45515A",

    white: "#FFFFFF"
};


/* ==========================================================
   EASYBUILDER PRO OBJECT CONFIGURATION

   All entries read from the JavaScript object's Config page.
   Keep the names below when creating the object properties.
========================================================== */

var cfg = {
    /* Display units and scale */
    pressureUnit:
        this.config.pressureUnit ||
        "Pa",

    coolingPressureUnit:
        this.config.coolingPressureUnit ||
        "Pa",

    flowUnit:
        this.config.flowUnit ||
        "L/min",

    temperatureUnit:
        this.config.temperatureUnit ||
        "°C",

    outputUnit:
        this.config.outputUnit ||
        "%",

    frequencyUnit:
        this.config.frequencyUnit ||
        "Hz",

    vsdMaximum:
        toNumber(
            this.config.vsdMaximum,
            50
        ),

    /* Stack fan subscriptions */
    stackFanStatusSub:
        this.config.stackFanStatusSub,
    stackFanModeSub:
        this.config.stackFanModeSub,
    stackFanOutputSub:
        this.config.stackFanOutputSub,
    stackFanFaultSub:
        this.config.stackFanFaultSub,
    stackPressureSub:
        this.config.stackPressureSub,
    stackPressureFaultSub:
        this.config.stackPressureFaultSub,

    /* Cooling tower pump subscriptions */
    coolingPumpStatusSub:
        this.config.coolingPumpStatusSub,
    coolingPumpModeSub:
        this.config.coolingPumpModeSub,
    coolingPumpOutputSub:
        this.config.coolingPumpOutputSub,
    coolingPumpFaultSub:
        this.config.coolingPumpFaultSub,

    /* Cooling tower fan subscriptions */
    coolingFanStatusSub:
        this.config.coolingFanStatusSub,
    coolingFanModeSub:
        this.config.coolingFanModeSub,
    coolingFanOutputSub:
        this.config.coolingFanOutputSub,
    coolingFanFaultSub:
        this.config.coolingFanFaultSub,

    /* Cooling process subscriptions */
    coolingPressureSub:
        this.config.coolingPressureSub,
    coolingPressureFaultSub:
        this.config.coolingPressureFaultSub,
    coolingTemperatureSub:
        this.config.coolingTemperatureSub,
    coolingTemperatureFaultSub:
        this.config.coolingTemperatureFaultSub,
    coolingFlowSub:
        this.config.coolingFlowSub,
    coolingFlowFaultSub:
        this.config.coolingFlowFaultSub,

    /* Ozone generator 1 subscriptions */
    ozone1StatusSub:
        this.config.ozone1StatusSub,
    ozone1OutputSub:
        this.config.ozone1OutputSub,
    ozone1FaultSub:
        this.config.ozone1FaultSub,

    /* Ozone generator 2 subscriptions */
    ozone2StatusSub:
        this.config.ozone2StatusSub,
    ozone2OutputSub:
        this.config.ozone2OutputSub,
    ozone2FaultSub:
        this.config.ozone2FaultSub,

    /* Ozone generator 3 subscriptions */
    ozone3StatusSub:
        this.config.ozone3StatusSub,
    ozone3OutputSub:
        this.config.ozone3OutputSub,
    ozone3FaultSub:
        this.config.ozone3FaultSub,

    /* Ozone generator 4 subscriptions */
    ozone4StatusSub:
        this.config.ozone4StatusSub,
    ozone4OutputSub:
        this.config.ozone4OutputSub,
    ozone4FaultSub:
        this.config.ozone4FaultSub,

    /* Ozone generator 5 subscriptions */
    ozone5StatusSub:
        this.config.ozone5StatusSub,
    ozone5OutputSub:
        this.config.ozone5OutputSub,
    ozone5FaultSub:
        this.config.ozone5FaultSub
};


/* ==========================================================
   RUNTIME VALUES
========================================================== */

var value = {
    stackFanStatus: 0,
    stackFanManual: false,
    stackFanOutput: 0,
    stackFanFault: 0,
    stackPressure: 0,
    stackPressureFault: false,

    coolingPumpStatus: 0,
    coolingPumpManual: false,
    coolingPumpOutput: 0,
    coolingPumpFault: 0,

    coolingFanStatus: 0,
    coolingFanManual: false,
    coolingFanOutput: 0,
    coolingFanFault: 0,

    coolingPressure: 0,
    coolingPressureFault: false,

    coolingTemperature: 0,
    coolingTemperatureFault: false,

    coolingFlow: 0,
    coolingFlowFault: false,

    ozone1Status: 0,
    ozone1Output: 0,
    ozone1Fault: 0,

    ozone2Status: 0,
    ozone2Output: 0,
    ozone2Fault: 0,

    ozone3Status: 0,
    ozone3Output: 0,
    ozone3Fault: 0,

    ozone4Status: 0,
    ozone4Output: 0,
    ozone4Fault: 0,

    ozone5Status: 0,
    ozone5Output: 0,
    ozone5Fault: 0
};


/* ==========================================================
   ANIMATION
========================================================== */

var flashState = true;
var flashTimer = 0;
var previousTime = Date.now();


/* ==========================================================
   BASIC HELPERS
========================================================== */

function toNumber(input, fallback) {
    var result = Number(input);

    if (isNaN(result)) {
        return fallback;
    }

    return result;
}


function clamp(input, minimum, maximum) {
    return Math.max(
        minimum,
        Math.min(
            maximum,
            input
        )
    );
}


function roundedRectangle(
    context,
    x,
    y,
    width,
    height,
    radius
) {
    var r = Math.min(
        radius,
        width / 2,
        height / 2
    );

    context.beginPath();

    context.moveTo(
        x + r,
        y
    );

    context.lineTo(
        x + width - r,
        y
    );

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + r
    );

    context.lineTo(
        x + width,
        y + height - r
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
    );

    context.lineTo(
        x + r,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - r
    );

    context.lineTo(
        x,
        y + r
    );

    context.quadraticCurveTo(
        x,
        y,
        x + r,
        y
    );

    context.closePath();
}


function drawText(
    textValue,
    x,
    y,
    font,
    fillColour,
    alignment
) {
    canvas.font = font;
    canvas.fillStyle = fillColour;
    canvas.textAlign = alignment || "center";
    canvas.textBaseline = "middle";

    canvas.fillText(
        String(textValue),
        x,
        y
    );
}


function drawPanel(
    x,
    y,
    width,
    height
) {
    canvas.fillStyle = colour.panel;

    roundedRectangle(
        canvas,
        x,
        y,
        width,
        height,
        5
    );

    canvas.fill();

    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 1;

    roundedRectangle(
        canvas,
        x,
        y,
        width,
        height,
        5
    );

    canvas.stroke();
}


function drawSeparator(
    x1,
    y1,
    x2,
    y2
) {
    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 0.8;

    canvas.beginPath();
    canvas.moveTo(x1, y1);
    canvas.lineTo(x2, y2);
    canvas.stroke();
}


/* ==========================================================
   EQUIPMENT STATUS
========================================================== */

function getEquipmentStatus(status) {
    switch (Math.round(toNumber(status, 0))) {
        case 1:
            return {
                text: "STOPPED",
                colour: colour.grey,
                darkColour: colour.greyDark,
                flashing: false
            };

        case 2:
            return {
                text: "RUNNING",
                colour: colour.green,
                darkColour: colour.greenDark,
                flashing: false
            };

        case 5:
            return {
                text: "STARTING",
                colour: colour.amber,
                darkColour: colour.amberDark,
                flashing: true
            };

        case 10:
            return {
                text: "STOPPING",
                colour: colour.amber,
                darkColour: colour.amberDark,
                flashing: true
            };

        default:
            return {
                text: "UNKNOWN",
                colour: colour.grey,
                darkColour: colour.greyDark,
                flashing: false
            };
    }
}


function getFaultText(faultCode) {
    switch (Math.round(toNumber(faultCode, 0))) {
        case 16:
            return "FAIL TO START";

        case 17:
            return "FAIL TO STOP";

        case 18:
            return "DRIVE FAULT";

        case 32:
            return "I/O FAULT";

        default:
            if (toNumber(faultCode, 0) !== 0) {
                return "FAULT " + String(faultCode);
            }

            return "";
    }
}


function getDisplayColour(statusInformation, faultCode) {
    if (toNumber(faultCode, 0) !== 0) {
        return flashState
            ? colour.red
            : colour.redDark;
    }

    if (
        statusInformation.flashing &&
        !flashState
    ) {
        return statusInformation.darkColour;
    }

    return statusInformation.colour;
}


/* ==========================================================
   STATUS INDICATOR
========================================================== */

function drawStatusLamp(
    x,
    y,
    lampColour
) {
    canvas.fillStyle = lampColour;

    canvas.beginPath();

    canvas.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
    );

    canvas.fill();

    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 0.8;
    canvas.stroke();
}


/* ==========================================================
   OUTPUT BAR
========================================================== */

function drawOutputBar(
    x,
    y,
    width,
    height,
    output,
    barColour,
    maximum
) {
    var maximumValue =
        toNumber(maximum, 100);

    if (maximumValue <= 0) {
        maximumValue = 100;
    }

    var percentage = clamp(
        toNumber(output, 0) /
            maximumValue *
            100,
        0,
        100
    );

    canvas.fillStyle = colour.panelDark;

    roundedRectangle(
        canvas,
        x,
        y,
        width,
        height,
        height / 2
    );

    canvas.fill();

    var fillWidth =
        width *
        percentage /
        100;

    if (fillWidth >= 2) {
        canvas.fillStyle = barColour;

        roundedRectangle(
            canvas,
            x,
            y,
            fillWidth,
            height,
            height / 2
        );

        canvas.fill();
    }

    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 0.7;

    roundedRectangle(
        canvas,
        x,
        y,
        width,
        height,
        height / 2
    );

    canvas.stroke();
}


/* ==========================================================
   COMPONENT 1
   GENERIC EQUIPMENT CARD

   Used for:
       Stack Fan
       Cooling Tower
========================================================== */

function drawEquipmentCard(
    x,
    y,
    width,
    height,
    title,
    primaryStatus,
    primaryFault,
    manualMode,
    primaryLabel,
    primaryOutput,
    secondaryStatus,
    secondaryFault,
    secondaryLabel,
    secondaryOutput
) {
    drawPanel(
        x,
        y,
        width,
        height
    );

    drawText(
        title,
        x + 9,
        y + 12,
        "bold 10px Arial",
        colour.text,
        "left"
    );

    drawText(
        manualMode
            ? "MANUAL"
            : "AUTO",
        x + width - 9,
        y + 12,
        "7px Arial",
        manualMode
            ? colour.amber
            : colour.blue,
        "right"
    );

    drawSeparator(
        x + 7,
        y + 23,
        x + width - 7,
        y + 23
    );

    var primaryInformation =
        getEquipmentStatus(
            primaryStatus
        );

    var primaryColour =
        getDisplayColour(
            primaryInformation,
            primaryFault
        );

    drawStatusLamp(
        x + 12,
        y + 35,
        primaryColour
    );

    drawText(
        primaryLabel,
        x + 22,
        y + 35,
        "7px Arial",
        colour.muted,
        "left"
    );

    drawText(
        toNumber(primaryFault, 0) !== 0
            ? getFaultText(primaryFault)
            : primaryInformation.text,
        x + width - 8,
        y + 35,
        "7px Arial",
        primaryColour,
        "right"
    );

    drawText(
        toNumber(
            primaryOutput,
            0
        ).toFixed(1) +
        " " +
        cfg.frequencyUnit,
        x + width - 8,
        y + 50,
        "bold 10px Arial",
        primaryColour,
        "right"
    );

    drawOutputBar(
        x + 9,
        y + 58,
        width - 18,
        5,
        primaryOutput,
        primaryColour,
        cfg.vsdMaximum
    );

    if (
        secondaryStatus !== null &&
        secondaryStatus !== undefined
    ) {
        var secondaryInformation =
            getEquipmentStatus(
                secondaryStatus
            );

        var secondaryColour =
            getDisplayColour(
                secondaryInformation,
                secondaryFault
            );

        drawSeparator(
            x + 7,
            y + 72,
            x + width - 7,
            y + 72
        );

        drawStatusLamp(
            x + 12,
            y + 84,
            secondaryColour
        );

        drawText(
            secondaryLabel,
            x + 22,
            y + 84,
            "7px Arial",
            colour.muted,
            "left"
        );

        drawText(
            toNumber(
                secondaryFault,
                0
            ) !== 0
                ? getFaultText(
                    secondaryFault
                )
                : secondaryInformation.text,
            x + width - 8,
            y + 84,
            "7px Arial",
            secondaryColour,
            "right"
        );

        drawText(
            toNumber(
                secondaryOutput,
                0
            ).toFixed(1) +
            " " +
            cfg.frequencyUnit,
            x + width - 8,
            y + 99,
            "bold 10px Arial",
            secondaryColour,
            "right"
        );

        drawOutputBar(
            x + 9,
            y + 107,
            width - 18,
            5,
            secondaryOutput,
            secondaryColour,
            cfg.vsdMaximum
        );
    }
}


/* ==========================================================
   COMPONENT 2
   OZONE UNIT ROW
========================================================== */

function drawOzoneUnitRow(
    x,
    y,
    width,
    unitNumber,
    status,
    output,
    fault
) {
    var information =
        getEquipmentStatus(status);

    var displayColour =
        getDisplayColour(
            information,
            fault
        );

    drawStatusLamp(
        x + 7,
        y,
        displayColour
    );

    drawText(
        "U" + String(unitNumber),
        x + 16,
        y,
        "7px Arial",
        colour.text,
        "left"
    );

    drawOutputBar(
        x + 37,
        y - 3,
        width - 83,
        6,
        output,
        displayColour
    );

    drawText(
        toNumber(output, 0).toFixed(0) +
        " " +
        cfg.outputUnit,
        x + width - 5,
        y,
        "8px Arial",
        displayColour,
        "right"
    );

    if (toNumber(fault, 0) !== 0) {
        drawText(
            "!",
            x + 28,
            y,
            "bold 10px Arial",
            displayColour
        );
    }
}


/* ==========================================================
   COMPONENT 3
   PROCESS VALUE DISPLAY
========================================================== */

function drawProcessValue(
    x,
    y,
    width,
    label,
    reading,
    unit,
    fault,
    decimals
) {
    var displayColour =
        fault
            ? (
                flashState
                    ? colour.red
                    : colour.redDark
            )
            : colour.blue;

    drawText(
        label,
        x,
        y,
        "7px Arial",
        colour.muted,
        "left"
    );

    var valueText;

    if (fault) {
        valueText = "FAULT";
    } else {
        valueText =
            toNumber(
                reading,
                0
            ).toFixed(decimals) +
            " " +
            unit;
    }

    drawText(
        valueText,
        x + width,
        y,
        fault
            ? "8px Arial"
            : "bold 10px Arial",
        displayColour,
        "right"
    );

    drawSeparator(
        x,
        y + 11,
        x + width,
        y + 11
    );
}


/* ==========================================================
   OZONE SYSTEM PANEL
========================================================== */

function drawOzonePanel(
    x,
    y,
    width,
    height
) {
    drawPanel(
        x,
        y,
        width,
        height
    );

    drawText(
        "OZONE GENERATORS",
        x + 9,
        y + 12,
        "bold 10px Arial",
        colour.text,
        "left"
    );

    drawText(
        "5 UNITS",
        x + width - 9,
        y + 12,
        "7px Arial",
        colour.muted,
        "right"
    );

    drawSeparator(
        x + 7,
        y + 23,
        x + width - 7,
        y + 23
    );

    drawOzoneUnitRow(
        x + 7,
        y + 36,
        width - 14,
        1,
        value.ozone1Status,
        value.ozone1Output,
        value.ozone1Fault
    );

    drawOzoneUnitRow(
        x + 7,
        y + 52,
        width - 14,
        2,
        value.ozone2Status,
        value.ozone2Output,
        value.ozone2Fault
    );

    drawOzoneUnitRow(
        x + 7,
        y + 68,
        width - 14,
        3,
        value.ozone3Status,
        value.ozone3Output,
        value.ozone3Fault
    );

    drawOzoneUnitRow(
        x + 7,
        y + 84,
        width - 14,
        4,
        value.ozone4Status,
        value.ozone4Output,
        value.ozone4Fault
    );

    drawOzoneUnitRow(
        x + 7,
        y + 100,
        width - 14,
        5,
        value.ozone5Status,
        value.ozone5Output,
        value.ozone5Fault
    );

    drawSeparator(
        x + 7,
        y + 128,
        x + width - 7,
        y + 128
    );

    drawText(
        "PROCESS",
        x + 9,
        y + 143,
        "7px Arial",
        colour.muted,
        "left"
    );

    var ozoneTotal =
        clamp(value.ozone1Output, 0, 100) +
        clamp(value.ozone2Output, 0, 100) +
        clamp(value.ozone3Output, 0, 100) +
        clamp(value.ozone4Output, 0, 100) +
        clamp(value.ozone5Output, 0, 100);

    var ozoneFault =
        value.ozone1Fault !== 0 ||
        value.ozone2Fault !== 0 ||
        value.ozone3Fault !== 0 ||
        value.ozone4Fault !== 0 ||
        value.ozone5Fault !== 0;

    drawProcessValue(
        x + 9,
        y + 169,
        width - 18,
        "Combined",
        ozoneTotal,
        cfg.outputUnit,
        ozoneFault,
        0
    );

    var unitsRunning = 0;

    if (value.ozone1Status === 2) {
        unitsRunning++;
    }

    if (value.ozone2Status === 2) {
        unitsRunning++;
    }

    if (value.ozone3Status === 2) {
        unitsRunning++;
    }

    if (value.ozone4Status === 2) {
        unitsRunning++;
    }

    if (value.ozone5Status === 2) {
        unitsRunning++;
    }

    drawText(
        "Units Running",
        x + 9,
        y + 207,
        "7px Arial",
        colour.muted,
        "left"
    );

    drawText(
        String(unitsRunning) + " / 5",
        x + width - 9,
        y + 207,
        "bold 10px Arial",
        unitsRunning > 0
            ? colour.green
            : colour.grey,
        "right"
    );

    drawSeparator(
        x + 9,
        y + 220,
        x + width - 9,
        y + 220
    );
}


/* ==========================================================
   MAIN DASHBOARD
========================================================== */

function drawDashboard() {
    canvas.fillStyle = colour.background;

    canvas.fillRect(
        0,
        0,
        DESIGN_WIDTH,
        DESIGN_HEIGHT
    );

    drawEquipmentCard(
        8,
        8,
        145,
        244,
        "STACK FAN",

        value.stackFanStatus,
        value.stackFanFault,
        value.stackFanManual,

        "FAN",
        value.stackFanOutput,

        null,
        null,
        null,
        null
    );

    drawSeparator(
        15,
        136,
        146,
        136
    );

    drawText(
        "PROCESS",
        17,
        151,
        "7px Arial",
        colour.muted,
        "left"
    );

    drawProcessValue(
        17,
        177,
        127,
        "Pressure",
        value.stackPressure,
        cfg.pressureUnit,
        value.stackPressureFault,
        1
    );

    drawEquipmentCard(
        160,
        8,
        155,
        244,
        "COOLING TOWER",

        value.coolingPumpStatus,
        value.coolingPumpFault,
        value.coolingPumpManual,

        "PUMP",
        value.coolingPumpOutput,

        value.coolingFanStatus,
        value.coolingFanFault,

        "FAN",
        value.coolingFanOutput
    );

    drawSeparator(
        167,
        136,
        308,
        136
    );

    drawText(
        "PROCESS",
        169,
        151,
        "7px Arial",
        colour.muted,
        "left"
    );

    drawProcessValue(
        169,
        174,
        137,
        "Discharge Pressure",
        value.coolingPressure,
        cfg.coolingPressureUnit,
        value.coolingPressureFault,
        1
    );

    drawProcessValue(
        169,
        205,
        137,
        "Temperature",
        value.coolingTemperature,
        cfg.temperatureUnit,
        value.coolingTemperatureFault,
        1
    );

    drawProcessValue(
        169,
        236,
        137,
        "Water Flow",
        value.coolingFlow,
        cfg.flowUnit,
        value.coolingFlowFault,
        1
    );

    drawOzonePanel(
        322,
        8,
        170,
        244
    );
}


/* ==========================================================
   CANVAS DRAW
========================================================== */

function draw() {
    var actualWidth = canvas.width;
    var actualHeight = canvas.height;

    if (
        actualWidth <= 0 ||
        actualHeight <= 0
    ) {
        return;
    }

    canvas.clearRect(
        0,
        0,
        actualWidth,
        actualHeight
    );

    var scale = Math.min(
        actualWidth / DESIGN_WIDTH,
        actualHeight / DESIGN_HEIGHT
    );

    var offsetX =
        (
            actualWidth -
            DESIGN_WIDTH *
            scale
        ) /
        2;

    var offsetY =
        (
            actualHeight -
            DESIGN_HEIGHT *
            scale
        ) /
        2;

    canvas.save();

    canvas.translate(
        offsetX,
        offsetY
    );

    canvas.scale(
        scale,
        scale
    );

    drawDashboard();

    canvas.restore();
}


/* ==========================================================
   SUBSCRIPTION BINDING
========================================================== */

function bindSubscription(
    subscription,
    description,
    updateFunction,
    errorValue
) {
    if (
        !subscription ||
        typeof subscription.onResponse !==
        "function"
    ) {
        console.log(
            description +
            " subscription not configured"
        );

        return;
    }

    subscription.onResponse(
        function (
            error,
            data
        ) {
            if (error) {
                console.log(
                    description +
                    " error: " +
                    String(error)
                );

                updateFunction(errorValue);
                draw();
                return;
            }

            if (
                data &&
                data.values &&
                data.values.length > 0
            ) {
                updateFunction(
                    data.values[0]
                );

                draw();
            }
        }
    );
}


/* ==========================================================
   STACK FAN SUBSCRIPTIONS
========================================================== */

bindSubscription(
    cfg.stackFanStatusSub,
    "Stack fan status",
    function (input) {
        value.stackFanStatus =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.stackFanModeSub,
    "Stack fan mode",
    function (input) {
        value.stackFanManual =
            Boolean(input);
    },
    false
);


bindSubscription(
    cfg.stackFanOutputSub,
    "Stack fan output",
    function (input) {
        value.stackFanOutput =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.stackFanFaultSub,
    "Stack fan fault",
    function (input) {
        value.stackFanFault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.stackPressureSub,
    "Stack pressure",
    function (input) {
        value.stackPressure =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.stackPressureFaultSub,
    "Stack pressure fault",
    function (input) {
        value.stackPressureFault =
            Boolean(input);
    },
    true
);


/* ==========================================================
   COOLING TOWER PUMP SUBSCRIPTIONS
========================================================== */

bindSubscription(
    cfg.coolingPumpStatusSub,
    "Cooling pump status",
    function (input) {
        value.coolingPumpStatus =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.coolingPumpModeSub,
    "Cooling pump mode",
    function (input) {
        value.coolingPumpManual =
            Boolean(input);
    },
    false
);


bindSubscription(
    cfg.coolingPumpOutputSub,
    "Cooling pump output",
    function (input) {
        value.coolingPumpOutput =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.coolingPumpFaultSub,
    "Cooling pump fault",
    function (input) {
        value.coolingPumpFault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   COOLING TOWER FAN SUBSCRIPTIONS
========================================================== */

bindSubscription(
    cfg.coolingFanStatusSub,
    "Cooling fan status",
    function (input) {
        value.coolingFanStatus =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.coolingFanModeSub,
    "Cooling fan mode",
    function (input) {
        value.coolingFanManual =
            Boolean(input);
    },
    false
);


bindSubscription(
    cfg.coolingFanOutputSub,
    "Cooling fan output",
    function (input) {
        value.coolingFanOutput =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.coolingFanFaultSub,
    "Cooling fan fault",
    function (input) {
        value.coolingFanFault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   COOLING PROCESS SUBSCRIPTIONS
========================================================== */

bindSubscription(
    cfg.coolingPressureSub,
    "Cooling water pressure",
    function (input) {
        value.coolingPressure =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.coolingPressureFaultSub,
    "Cooling water pressure fault",
    function (input) {
        value.coolingPressureFault =
            Boolean(input);
    },
    true
);


bindSubscription(
    cfg.coolingTemperatureSub,
    "Cooling water temperature",
    function (input) {
        value.coolingTemperature =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.coolingTemperatureFaultSub,
    "Cooling water temperature fault",
    function (input) {
        value.coolingTemperatureFault =
            Boolean(input);
    },
    true
);


bindSubscription(
    cfg.coolingFlowSub,
    "Cooling water flow",
    function (input) {
        value.coolingFlow =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.coolingFlowFaultSub,
    "Cooling water flow fault",
    function (input) {
        value.coolingFlowFault =
            Boolean(input);
    },
    true
);


/* ==========================================================
   OZONE UNIT 1
========================================================== */

bindSubscription(
    cfg.ozone1StatusSub,
    "Ozone unit 1 status",
    function (input) {
        value.ozone1Status =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.ozone1OutputSub,
    "Ozone unit 1 output",
    function (input) {
        value.ozone1Output =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.ozone1FaultSub,
    "Ozone unit 1 fault",
    function (input) {
        value.ozone1Fault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   OZONE UNIT 2
========================================================== */

bindSubscription(
    cfg.ozone2StatusSub,
    "Ozone unit 2 status",
    function (input) {
        value.ozone2Status =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.ozone2OutputSub,
    "Ozone unit 2 output",
    function (input) {
        value.ozone2Output =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.ozone2FaultSub,
    "Ozone unit 2 fault",
    function (input) {
        value.ozone2Fault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   OZONE UNIT 3
========================================================== */

bindSubscription(
    cfg.ozone3StatusSub,
    "Ozone unit 3 status",
    function (input) {
        value.ozone3Status =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.ozone3OutputSub,
    "Ozone unit 3 output",
    function (input) {
        value.ozone3Output =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.ozone3FaultSub,
    "Ozone unit 3 fault",
    function (input) {
        value.ozone3Fault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   OZONE UNIT 4
========================================================== */

bindSubscription(
    cfg.ozone4StatusSub,
    "Ozone unit 4 status",
    function (input) {
        value.ozone4Status =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.ozone4OutputSub,
    "Ozone unit 4 output",
    function (input) {
        value.ozone4Output =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.ozone4FaultSub,
    "Ozone unit 4 fault",
    function (input) {
        value.ozone4Fault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   OZONE UNIT 5
========================================================== */

bindSubscription(
    cfg.ozone5StatusSub,
    "Ozone unit 5 status",
    function (input) {
        value.ozone5Status =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


bindSubscription(
    cfg.ozone5OutputSub,
    "Ozone unit 5 output",
    function (input) {
        value.ozone5Output =
            toNumber(input, 0);
    },
    0
);


bindSubscription(
    cfg.ozone5FaultSub,
    "Ozone unit 5 fault",
    function (input) {
        value.ozone5Fault =
            Math.round(
                toNumber(input, 0)
            );
    },
    0
);


/* ==========================================================
   ANIMATION TIMER
========================================================== */

setInterval(
    function () {
        var currentTime = Date.now();

        var elapsed =
            currentTime -
            previousTime;

        previousTime =
            currentTime;

        if (
            elapsed < 0 ||
            elapsed > 1000
        ) {
            elapsed = 100;
        }

        flashTimer += elapsed;

        if (flashTimer >= 500) {
            flashTimer = 0;
            flashState = !flashState;
        }

        draw();
    },
    100
);


/* ==========================================================
   INITIAL DRAW
========================================================== */

draw();
