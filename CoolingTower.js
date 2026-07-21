/*
============================================================
COOLING TOWER PACKAGE - REVISED SPACED LAYOUT
Weintek EasyBuilder Pro JavaScript Canvas Object

Recommended object size:
    500 x 300

Process:
    Cooling Tower Basin -> Pump Suction -> Pump -> Discharge
============================================================
*/

const canvas = new Canvas();
this.widget.add(canvas);

const DESIGN_WIDTH = 500;
const DESIGN_HEIGHT = 300;


/* =========================================================
   COLOURS
========================================================= */

const colour = {
    text: "#C5CDD2",
    muted: "#77838B",

    border: "#5D6971",
    body: "rgba(20,27,32,0.98)",
    panel: "rgba(25,33,39,0.96)",

    pipe: "#74818A",
    pipeDark: "#48545C",

    green: "#21C45A",
    greenDark: "#117735",

    amber: "#F3A712",
    amberDark: "#9A6509",

    red: "#EF4444",
    redDark: "#8E2020",

    blue: "#38BDF8",

    grey: "#849099",
    greyDark: "#4E5961",

    water: "rgba(14,165,233,0.52)"
};


/* =========================================================
   CONFIGURATION
========================================================= */

const cfg = {
    pumpName:
        this.config.pumpName ||
        "CIRCULATION PUMP",

    fanName:
        this.config.fanName ||
        "TOWER FAN",

    valveName:
        this.config.valveName ||
        "MAKE-UP VALVE",

    pressureUnit:
        this.config.pressureUnit ||
        "kPa",

    flowUnit:
        this.config.flowUnit ||
        "m3/h",

    temperatureUnit:
        this.config.temperatureUnit ||
        "°C",

    pumpOutputUnit:
        this.config.pumpOutputUnit ||
        "%",

    fanOutputUnit:
        this.config.fanOutputUnit ||
        "%"
};


/* =========================================================
   RUNTIME VALUES
========================================================= */

let value = {
    pumpStatus: 0,
    pumpManual: false,
    pumpOutput: 0,
    pumpFault: 0,

    suctionPressure: 0,
    suctionPressureFault: false,

    dischargePressure: 0,
    dischargePressureFault: false,

    dischargeFlow: 0,
    dischargeFlowFault: false,

    pidPV: 0,
    pidSV: 0,
    pidCV: 0,

    fanStatus: 0,
    fanManual: false,
    fanOutput: 0,
    fanFault: 0,

    waterTemperature: 0,
    waterTemperatureFault: false,

    basinLowLevel: false,

    valveStatus: 0,
    valveFault: false
};


/* =========================================================
   ANIMATION
========================================================= */

let pumpAngle = 0;
let fanAngle = 0;
let waterOffset = 0;

let flashState = true;
let flashElapsed = 0;

let previousTime = Date.now();


/* =========================================================
   BASIC HELPERS
========================================================= */

function numberValue(input, fallback) {
    const result = Number(input);

    if (isNaN(result)) {
        return fallback;
    }

    return result;
}


function limit(input, minimum, maximum) {
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
    const r = Math.min(
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
    align
) {
    canvas.font = font;
    canvas.fillStyle = fillColour;
    canvas.textAlign = align || "center";
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


function drawPipe(
    points,
    width
) {
    if (!points || points.length < 2) {
        return;
    }

    canvas.lineCap = "round";
    canvas.lineJoin = "round";

    canvas.strokeStyle = colour.pipeDark;
    canvas.lineWidth = width + 1.5;

    canvas.beginPath();
    canvas.moveTo(points[0].x, points[0].y);

    for (
        let index = 1;
        index < points.length;
        index++
    ) {
        canvas.lineTo(
            points[index].x,
            points[index].y
        );
    }

    canvas.stroke();

    canvas.strokeStyle = colour.pipe;
    canvas.lineWidth = width;

    canvas.beginPath();
    canvas.moveTo(points[0].x, points[0].y);

    for (
        let index = 1;
        index < points.length;
        index++
    ) {
        canvas.lineTo(
            points[index].x,
            points[index].y
        );
    }

    canvas.stroke();
}


function rotatedPoint(
    centreX,
    centreY,
    localX,
    localY,
    angle
) {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    return {
        x:
            centreX +
            localX * cosine -
            localY * sine,

        y:
            centreY +
            localX * sine +
            localY * cosine
    };
}


/* =========================================================
   STATUS HELPERS
========================================================= */

function equipmentStatus(status) {
    switch (status) {
        case 1:
            return {
                text: "STOPPED",
                colour: colour.grey,
                dark: colour.greyDark,
                rotating: false,
                flashing: false
            };

        case 2:
            return {
                text: "RUNNING",
                colour: colour.green,
                dark: colour.greenDark,
                rotating: true,
                flashing: false
            };

        case 5:
            return {
                text: "STARTING",
                colour: colour.amber,
                dark: colour.amberDark,
                rotating: true,
                flashing: true
            };

        case 10:
            return {
                text: "STOPPING",
                colour: colour.amber,
                dark: colour.amberDark,
                rotating: true,
                flashing: true
            };

        default:
            return {
                text: "UNKNOWN",
                colour: colour.grey,
                dark: colour.greyDark,
                rotating: false,
                flashing: false
            };
    }
}


function faultDescription(code) {
    switch (code) {
        case 16:
            return "FAIL TO START";

        case 17:
            return "FAIL TO STOP";

        case 18:
            return "DRIVE FAULT";

        case 32:
            return "I/O FAULT";

        default:
            if (code) {
                return "FAULT " + String(code);
            }

            return "";
    }
}


function activeColour(
    statusInformation,
    faultActive
) {
    if (faultActive) {
        return flashState
            ? colour.red
            : colour.redDark;
    }

    if (
        statusInformation.flashing &&
        !flashState
    ) {
        return statusInformation.dark;
    }

    return statusInformation.colour;
}


function valveInformation(status) {
    switch (status) {
        case 1:
            return {
                text: "CLOSED",
                open: false,
                flashing: false,
                colour: colour.grey,
                dark: colour.greyDark
            };

        case 2:
            return {
                text: "OPEN",
                open: true,
                flashing: false,
                colour: colour.green,
                dark: colour.greenDark
            };

        case 6:
            return {
                text: "OPENING",
                open: true,
                flashing: true,
                colour: colour.amber,
                dark: colour.amberDark
            };

        case 5:
            return {
                text: "CLOSING",
                open: true,
                flashing: true,
                colour: colour.amber,
                dark: colour.amberDark
            };

        default:
            return {
                text: "UNKNOWN",
                open: false,
                flashing: false,
                colour: colour.grey,
                dark: colour.greyDark
            };
    }
}


function currentValveColour(information) {
    if (value.valveFault) {
        return flashState
            ? colour.red
            : colour.redDark;
    }

    if (
        information.flashing &&
        !flashState
    ) {
        return information.dark;
    }

    return information.colour;
}


/* =========================================================
   MODE BADGE
========================================================= */

function drawModeBadge(
    x,
    y,
    manual
) {
    const badgeColour = manual
        ? colour.amber
        : colour.grey;

    canvas.fillStyle = manual
        ? "rgba(243,167,18,0.15)"
        : "rgba(132,144,153,0.14)";

    roundedRectangle(
        canvas,
        x,
        y,
        19,
        15,
        4
    );

    canvas.fill();

    canvas.strokeStyle = badgeColour;
    canvas.lineWidth = 1;

    roundedRectangle(
        canvas,
        x,
        y,
        19,
        15,
        4
    );

    canvas.stroke();

    drawText(
        manual ? "M" : "A",
        x + 9.5,
        y + 7.5,
        "bold 9px Arial",
        badgeColour
    );
}


/* =========================================================
   OUTPUT BAR
========================================================= */

function drawOutputBar(
    x,
    y,
    width,
    height,
    output,
    barColour
) {
    const percentage = limit(
        numberValue(output, 0),
        0,
        100
    );

    canvas.fillStyle =
        "rgba(100,112,120,0.28)";

    roundedRectangle(
        canvas,
        x,
        y,
        width,
        height,
        height / 2
    );

    canvas.fill();

    const fillWidth =
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
    canvas.lineWidth = 0.8;

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


/* =========================================================
   SMALL PT SYMBOL
========================================================= */

function drawPressureTransmitter(
    x,
    y,
    label,
    reading,
    fault
) {
    const displayColour = fault
        ? (
            flashState
                ? colour.red
                : colour.redDark
        )
        : colour.grey;

    /*
    Label and value are above the symbol so the branch line
    cannot block the value.
    */

    drawText(
        label,
        x,
        y - 36,
        "bold 6px Arial",
        colour.muted
    );

    drawText(
        fault
            ? "FAULT"
            : numberValue(
                reading,
                0
            ).toFixed(1) +
              " " +
              cfg.pressureUnit,
        x,
        y - 24,
        fault
            ? "bold 7px Arial"
            : "bold 9px Arial",
        fault
            ? displayColour
            : colour.text
    );

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = displayColour;
    canvas.lineWidth = 1.5;

    canvas.beginPath();

    canvas.arc(
        x,
        y,
        9,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();

    drawText(
        "PT",
        x,
        y,
        "bold 6px Arial",
        displayColour
    );
}


/* =========================================================
   SMALL DISCHARGE FT SYMBOL
========================================================= */

function drawDischargeFlowTransmitter(
    x,
    y
) {
    const displayColour =
        value.dischargeFlowFault
            ? (
                flashState
                    ? colour.red
                    : colour.redDark
            )
            : colour.blue;

    drawText(
        "DISCHARGE FLOW",
        x,
        y - 36,
        "bold 6px Arial",
        colour.muted
    );

    drawText(
        value.dischargeFlowFault
            ? "FAULT"
            : numberValue(
                value.dischargeFlow,
                0
            ).toFixed(1) +
              " " +
              cfg.flowUnit,
        x,
        y - 24,
        value.dischargeFlowFault
            ? "bold 7px Arial"
            : "bold 9px Arial",
        value.dischargeFlowFault
            ? displayColour
            : colour.text
    );

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = displayColour;
    canvas.lineWidth = 1.5;

    canvas.beginPath();

    canvas.arc(
        x,
        y,
        9,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();

    drawText(
        "FT",
        x,
        y,
        "bold 6px Arial",
        displayColour
    );
}


/* =========================================================
   SMALLER CENTRIFUGAL PUMP
========================================================= */

function drawPumpBlade(
    centreX,
    centreY,
    angle,
    bladeColour
) {
    const p1 = rotatedPoint(
        centreX,
        centreY,
        2,
        -2,
        angle
    );

    const p2 = rotatedPoint(
        centreX,
        centreY,
        6,
        -6,
        angle
    );

    const p3 = rotatedPoint(
        centreX,
        centreY,
        11,
        -7,
        angle
    );

    const p4 = rotatedPoint(
        centreX,
        centreY,
        13,
        -3,
        angle
    );

    const p5 = rotatedPoint(
        centreX,
        centreY,
        7,
        -1,
        angle
    );

    canvas.fillStyle = bladeColour;

    canvas.beginPath();
    canvas.moveTo(p1.x, p1.y);

    canvas.quadraticCurveTo(
        p2.x,
        p2.y,
        p3.x,
        p3.y
    );

    canvas.lineTo(p4.x, p4.y);

    canvas.quadraticCurveTo(
        p5.x,
        p5.y,
        p1.x,
        p1.y
    );

    canvas.closePath();
    canvas.fill();
}


function drawPump(
    centreX,
    centreY
) {
    const information =
        equipmentStatus(
            value.pumpStatus
        );

    const pumpColour =
        activeColour(
            information,
            value.pumpFault !== 0
        );

    const impellerX =
        centreX + 1;

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = pumpColour;
    canvas.lineWidth = 2.5;

    canvas.beginPath();

    canvas.arc(
        impellerX,
        centreY,
        19,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();

    /*
    Discharge nozzle
    */

    canvas.beginPath();

    canvas.moveTo(
        centreX - 16,
        centreY - 8
    );

    canvas.lineTo(
        centreX - 32,
        centreY - 8
    );

    canvas.lineTo(
        centreX - 32,
        centreY + 8
    );

    canvas.lineTo(
        centreX - 16,
        centreY + 8
    );

    canvas.closePath();
    canvas.fill();
    canvas.stroke();

    /*
    Suction nozzle
    */

    canvas.beginPath();

    canvas.moveTo(
        centreX + 19,
        centreY - 7
    );

    canvas.lineTo(
        centreX + 34,
        centreY - 7
    );

    canvas.lineTo(
        centreX + 34,
        centreY + 7
    );

    canvas.lineTo(
        centreX + 19,
        centreY + 7
    );

    canvas.closePath();
    canvas.fill();
    canvas.stroke();

    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 1;

    canvas.beginPath();

    canvas.arc(
        impellerX,
        centreY,
        14,
        0,
        Math.PI * 2
    );

    canvas.stroke();

    for (
        let blade = 0;
        blade < 5;
        blade++
    ) {
        drawPumpBlade(
            impellerX,
            centreY,
            pumpAngle +
            blade *
            Math.PI *
            2 /
            5,
            pumpColour
        );
    }

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = pumpColour;
    canvas.lineWidth = 1.2;

    canvas.beginPath();

    canvas.arc(
        impellerX,
        centreY,
        5,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();

    canvas.fillStyle = pumpColour;

    canvas.beginPath();

    canvas.arc(
        impellerX,
        centreY,
        2,
        0,
        Math.PI * 2
    );

    canvas.fill();

    /*
    Pump base
    */

    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 1.5;

    canvas.beginPath();

    canvas.moveTo(
        centreX - 15,
        centreY + 20
    );

    canvas.lineTo(
        centreX - 15,
        centreY + 24
    );

    canvas.moveTo(
        centreX + 15,
        centreY + 20
    );

    canvas.lineTo(
        centreX + 15,
        centreY + 24
    );

    canvas.moveTo(
        centreX - 21,
        centreY + 24
    );

    canvas.lineTo(
        centreX + 21,
        centreY + 24
    );

    canvas.stroke();

    drawText(
        cfg.pumpName,
        centreX,
        centreY - 29,
        "bold 7px Arial",
        colour.muted
    );

    drawText(
        value.pumpFault
            ? faultDescription(
                value.pumpFault
            )
            : information.text,
        centreX,
        centreY + 33,
        "bold 7px Arial",
        pumpColour
    );
}


/* =========================================================
   TOWER FAN
========================================================= */

function drawFanBlade(
    centreX,
    centreY,
    angle,
    bladeColour
) {
    const p1 = rotatedPoint(
        centreX,
        centreY,
        3,
        -2,
        angle
    );

    const p2 = rotatedPoint(
        centreX,
        centreY,
        7,
        -4,
        angle
    );

    const p3 = rotatedPoint(
        centreX,
        centreY,
        16,
        -4,
        angle
    );

    const p4 = rotatedPoint(
        centreX,
        centreY,
        18,
        1,
        angle
    );

    const p5 = rotatedPoint(
        centreX,
        centreY,
        7,
        3,
        angle
    );

    canvas.fillStyle = bladeColour;

    canvas.beginPath();
    canvas.moveTo(p1.x, p1.y);

    canvas.quadraticCurveTo(
        p2.x,
        p2.y,
        p3.x,
        p3.y
    );

    canvas.lineTo(p4.x, p4.y);

    canvas.quadraticCurveTo(
        p5.x,
        p5.y,
        p1.x,
        p1.y
    );

    canvas.closePath();
    canvas.fill();
}


function drawTowerFan(
    centreX,
    centreY
) {
    const information =
        equipmentStatus(
            value.fanStatus
        );

    const fanColour =
        activeColour(
            information,
            value.fanFault !== 0
        );

    /*
    Smaller downward-facing motor
    */

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = fanColour;
    canvas.lineWidth = 1.7;

    roundedRectangle(
        canvas,
        centreX - 9,
        centreY - 30,
        18,
        17,
        3
    );

    canvas.fill();
    canvas.stroke();

    canvas.lineWidth = 2.5;

    canvas.beginPath();

    canvas.moveTo(
        centreX,
        centreY - 13
    );

    canvas.lineTo(
        centreX,
        centreY - 5
    );

    canvas.stroke();

    canvas.fillStyle =
        "rgba(17,23,28,0.72)";

    canvas.lineWidth = 1.8;

    canvas.beginPath();

    canvas.arc(
        centreX,
        centreY + 8,
        20,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();

    for (
        let blade = 0;
        blade < 4;
        blade++
    ) {
        drawFanBlade(
            centreX,
            centreY + 8,
            fanAngle +
            blade *
            Math.PI /
            2,
            fanColour
        );
    }

    canvas.fillStyle = colour.body;

    canvas.beginPath();

    canvas.arc(
        centreX,
        centreY + 8,
        5,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();
}


/* =========================================================
   COOLING TOWER AND BASIN
========================================================= */

function drawCoolingTower(
    x,
    y,
    width,
    height
) {
    const right =
        x + width;

    const basinTop =
        y + height - 34;

    const basinBottom =
        y + height;

    /*
    Tower body
    */

    canvas.fillStyle =
        "rgba(45,55,62,0.36)";

    canvas.strokeStyle =
        colour.border;

    canvas.lineWidth = 1.7;

    canvas.beginPath();

    canvas.moveTo(
        x + 13,
        y + 7
    );

    canvas.quadraticCurveTo(
        x + 23,
        y + 40,
        x + 20,
        y + 66
    );

    canvas.quadraticCurveTo(
        x + 16,
        basinTop - 12,
        x + 6,
        basinTop
    );

    canvas.lineTo(
        right - 6,
        basinTop
    );

    canvas.quadraticCurveTo(
        right - 16,
        basinTop - 12,
        right - 20,
        y + 66
    );

    canvas.quadraticCurveTo(
        right - 23,
        y + 40,
        right - 13,
        y + 7
    );

    canvas.closePath();
    canvas.fill();
    canvas.stroke();


    /*
    Distribution pipe
    */

    canvas.strokeStyle = colour.pipe;
    canvas.lineWidth = 2;

    canvas.beginPath();

    canvas.moveTo(
        x + 23,
        y + 34
    );

    canvas.lineTo(
        right - 23,
        y + 34
    );

    canvas.stroke();

    /*
    Falling water
    */

    canvas.strokeStyle =
        "rgba(56,189,248,0.58)";

    canvas.lineWidth = 1.1;

    const dropOffset =
        waterOffset % 11;

    for (
        let dropX = x + 27;
        dropX <= right - 27;
        dropX += 9
    ) {
        for (
            let dropY =
                y + 40 + dropOffset;
            dropY < basinTop - 5;
            dropY += 13
        ) {
            canvas.beginPath();

            canvas.moveTo(
                dropX,
                dropY
            );

            canvas.lineTo(
                dropX,
                Math.min(
                    dropY + 5,
                    basinTop - 4
                )
            );

            canvas.stroke();
        }
    }

    /*
    Basin
    */

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = colour.border;
    canvas.lineWidth = 1.7;

    roundedRectangle(
        canvas,
        x,
        basinTop,
        width,
        basinBottom - basinTop,
        4
    );

    canvas.fill();
    canvas.stroke();

    const waterTop =
        value.basinLowLevel
            ? basinBottom - 10
            : basinBottom - 23;

    canvas.fillStyle =
        value.basinLowLevel
            ? "rgba(243,167,18,0.43)"
            : colour.water;

    roundedRectangle(
        canvas,
        x + 3,
        waterTop,
        width - 6,
        basinBottom -
        waterTop -
        3,
        2
    );

    canvas.fill();

    canvas.strokeStyle =
        value.basinLowLevel
            ? colour.amber
            : colour.blue;

    canvas.lineWidth = 1;

    canvas.beginPath();

    canvas.moveTo(
        x + 5,
        waterTop
    );

    canvas.lineTo(
        right - 5,
        waterTop
    );

    canvas.stroke();

    /*
    Basin level indication inside the basin.
    No surrounding panel.
    */

    const levelColour =
        value.basinLowLevel
            ? (
                flashState
                    ? colour.red
                    : colour.redDark
            )
            : colour.green;

    drawText(
        value.basinLowLevel
            ? "LOW LEVEL"
            : "LEVEL OK",
        x + width / 2,
        basinBottom - 10,
        "bold 7px Arial",
        levelColour
    );

    /*
    Basin suction connection
    */

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = colour.pipe;
    canvas.lineWidth = 2;

    canvas.beginPath();

    canvas.arc(
        x,
        basinBottom - 9,
        4,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();

    /*
    Make-up connection
    */

    canvas.beginPath();

    canvas.arc(
        right,
        basinTop + 14,
        4,
        0,
        Math.PI * 2
    );

    canvas.fill();
    canvas.stroke();
}


/* =========================================================
   MAKE-UP VALVE
========================================================= */

function drawMakeUpValve(
    centreX,
    centreY
) {
    const information =
        valveInformation(
            value.valveStatus
        );

    const valveColour =
        currentValveColour(
            information
        );

    canvas.fillStyle = colour.body;
    canvas.strokeStyle = valveColour;
    canvas.lineWidth = 1.7;

    canvas.beginPath();

    canvas.moveTo(
        centreX - 9,
        centreY - 7
    );

    canvas.lineTo(
        centreX,
        centreY
    );

    canvas.lineTo(
        centreX - 9,
        centreY + 7
    );

    canvas.closePath();
    canvas.fill();
    canvas.stroke();

    canvas.beginPath();

    canvas.moveTo(
        centreX + 9,
        centreY - 7
    );

    canvas.lineTo(
        centreX,
        centreY
    );

    canvas.lineTo(
        centreX + 9,
        centreY + 7
    );

    canvas.closePath();
    canvas.fill();
    canvas.stroke();

    canvas.beginPath();

    canvas.moveTo(
        centreX,
        centreY - 1
    );

    canvas.lineTo(
        centreX,
        centreY - 12
    );

    canvas.stroke();

    canvas.fillStyle = valveColour;

    canvas.beginPath();

    canvas.arc(
        centreX,
        centreY - 15,
        3.5,
        0,
        Math.PI * 2
    );

    canvas.fill();

    drawText(
        cfg.valveName,
        centreX,
        centreY - 25,
        "bold 6px Arial",
        colour.muted
    );

    drawText(
        value.valveFault
            ? "FAULT"
            : information.text,
        centreX,
        centreY + 16,
        "bold 6px Arial",
        valveColour
    );
}


/* =========================================================
   MAKE-UP WATER ANIMATION
========================================================= */

function drawPipeWaterFlow(
    startX,
    endX,
    y
) {
    const spacing = 11;

    const offset =
        waterOffset %
        spacing;

    canvas.strokeStyle = colour.blue;
    canvas.lineWidth = 1.5;
    canvas.lineCap = "round";

    for (
        let x =
            startX -
            offset;
        x < endX;
        x += spacing
    ) {
        canvas.beginPath();

        canvas.moveTo(
            Math.max(
                x,
                startX
            ),
            y
        );

        canvas.lineTo(
            Math.min(
                x + 4,
                endX
            ),
            y
        );

        canvas.stroke();
    }
}


/* =========================================================
   PUMP OUTPUT PANEL
========================================================= */

function drawPumpOutputPanel(
    centreX,
    y
) {
    const information =
        equipmentStatus(
            value.pumpStatus
        );

    const displayColour =
        activeColour(
            information,
            value.pumpFault !== 0
        );

    const width = 94;
    const height = 38;

    const x =
        centreX -
        width / 2;

    drawPanel(
        x,
        y,
        width,
        height
    );

    drawText(
        "PUMP OUTPUT",
        centreX,
        y + 7,
        "bold 6px Arial",
        colour.muted
    );

    drawText(
        numberValue(
            value.pumpOutput,
            0
        ).toFixed(1) +
        " " +
        cfg.pumpOutputUnit,
        centreX,
        y + 21,
        "bold 13px Arial",
        displayColour
    );

    drawOutputBar(
        x + 9,
        y + 31,
        width - 18,
        4,
        value.pumpOutput,
        displayColour
    );
}


/* =========================================================
   PRESSURE PID PANEL ABOVE PUMP
========================================================= */

function drawPIDPanel(
    x,
    y
) {
    const width = 150;
    const height = 47;

    drawPanel(
        x,
        y,
        width,
        height
    );

    drawText(
        "PRESSURE PID",
        x + width / 2,
        y + 8,
        "bold 7px Arial",
        colour.muted
    );

    const labels = [
        "PV",
        "SV",
        "CV"
    ];

    const values = [
        numberValue(
            value.pidPV,
            0
        ).toFixed(1) +
        " " +
        cfg.pressureUnit,

        numberValue(
            value.pidSV,
            0
        ).toFixed(1) +
        " " +
        cfg.pressureUnit,

        numberValue(
            value.pidCV,
            0
        ).toFixed(1) +
        " " +
        cfg.pumpOutputUnit
    ];

    for (
        let index = 0;
        index < 3;
        index++
    ) {
        const sectionCentre =
            x +
            25 +
            index *
            50;

        drawText(
            labels[index],
            sectionCentre,
            y + 22,
            "bold 6px Arial",
            colour.muted
        );

        drawText(
            values[index],
            sectionCentre,
            y + 36,
            "bold 9px Arial",
            index === 2
                ? colour.green
                : colour.text
        );
    }
}


/* =========================================================
   FAN OUTPUT AND WATER TEMPERATURE PANEL
========================================================= */

function drawFanTemperaturePanel(
    x,
    y
) {
    const fanInformation =
        equipmentStatus(
            value.fanStatus
        );

    const fanColour =
        activeColour(
            fanInformation,
            value.fanFault !== 0
        );

    const temperatureColour =
        value.waterTemperatureFault
            ? (
                flashState
                    ? colour.red
                    : colour.redDark
            )
            : colour.text;

    const panelWidth = 106;
    const panelHeight = 61;

    drawPanel(
        x,
        y,
        panelWidth,
        panelHeight
    );

    /*
    Fan output
    */

    drawText(
        "FAN OUTPUT",
        x + 7,
        y + 9,
        "bold 6px Arial",
        colour.muted,
        "left"
    );

    drawText(
        numberValue(
            value.fanOutput,
            0
        ).toFixed(1) +
        " " +
        cfg.fanOutputUnit,
        x + panelWidth - 7,
        y + 9,
        "bold 9px Arial",
        fanColour,
        "right"
    );

    drawOutputBar(
        x + 7,
        y + 17,
        panelWidth - 14,
        4,
        value.fanOutput,
        fanColour
    );

    /*
    Fan status or fan fault
    */

    drawText(
        value.fanFault !== 0
            ? faultDescription(
                value.fanFault
            )
            : fanInformation.text,
        x + panelWidth / 2,
        y + 29,
        "bold 6px Arial",
        fanColour
    );

    /*
    Water temperature
    */

    drawText(
        "WATER TEMP",
        x + 7,
        y + 43,
        "bold 6px Arial",
        colour.muted,
        "left"
    );

    drawText(
        value.waterTemperatureFault
            ? "FAULT"
            : numberValue(
                value.waterTemperature,
                0
            ).toFixed(1) +
              " " +
              cfg.temperatureUnit,
        x + panelWidth - 7,
        y + 43,
        value.waterTemperatureFault
            ? "bold 7px Arial"
            : "bold 9px Arial",
        temperatureColour,
        "right"
    );
}


/* =========================================================
   MAIN LAYOUT
========================================================= */

function drawScene() {
    const pumpX = 170;
    const pumpY = 211;

    const dischargePressureX = 49;
    const dischargePressureY = 181;

    const dischargeFlowX = 102;
    const dischargeFlowY = 181;

    const suctionPressureX = 273;
    const suctionPressureY = 181;

    const towerX = 354;
    const towerY = 112;
    const towerWidth = 80;
    const towerHeight = 121;

    const basinBottom =
        towerY +
        towerHeight;

    const basinTop =
        basinBottom -
        34;

    const suctionPipeY =
        basinBottom -
        9;

    const makeUpPipeY =
        basinTop +
        14;

    const valveX = 463;
    const valveY =
        makeUpPipeY;

    /*
    No package title is drawn.
    */

    drawPIDPanel(
        95,
        56
    );

    /*
    Narrower fan panel positioned away from the motor.
    */

    drawFanTemperaturePanel(
        340,
        6
    );

    /*
    Pump discharge pipe
    */

    drawPipe(
        [
            {
                x: pumpX - 32,
                y: pumpY
            },
            {
                x: 17,
                y: pumpY
            }
        ],
        3
    );

    /*
    Pump suction pipe
    */

    drawPipe(
        [
            {
                x: pumpX + 34,
                y: pumpY
            },
            {
                x: 310,
                y: pumpY
            },
            {
                x: 310,
                y: suctionPipeY
            },
            {
                x: towerX,
                y: suctionPipeY
            }
        ],
        3
    );

    /*
    Instrument branch lines stop below each symbol.
    */

    drawPipe(
        [
            {
                x: dischargePressureX,
                y: pumpY
            },
            {
                x: dischargePressureX,
                y:
                    dischargePressureY +
                    9
            }
        ],
        1
    );

    drawPipe(
        [
            {
                x: dischargeFlowX,
                y: pumpY
            },
            {
                x: dischargeFlowX,
                y:
                    dischargeFlowY +
                    9
            }
        ],
        1
    );

    drawPipe(
        [
            {
                x: suctionPressureX,
                y: pumpY
            },
            {
                x: suctionPressureX,
                y:
                    suctionPressureY +
                    9
            }
        ],
        1
    );

    /*
    Make-up water pipe
    */

    drawPipe(
        [
            {
                x: DESIGN_WIDTH - 4,
                y: valveY
            },
            {
                x: towerX + towerWidth,
                y: valveY
            }
        ],
        2.5
    );

    /*
    Cooling tower
    */

    drawCoolingTower(
        towerX,
        towerY,
        towerWidth,
        towerHeight
    );

    /*
    Fan is below the monitoring panel.
    */

    drawTowerFan(
        towerX +
        towerWidth /
        2,
        towerY -
        6
    );

    /*
    Pump
    */

    drawPump(
        pumpX,
        pumpY
    );

    /*
    Pump mode beside symbol
    */

    drawModeBadge(
    pumpX + 21,
    pumpY - 29,
    value.pumpManual
);

    /*
    Fan mode beside tower fan
    */

    drawModeBadge(
    towerX +
    towerWidth -
    5,
    towerY -
    24,
    value.fanManual
);

    /*
    Instruments
    */

    drawPressureTransmitter(
        dischargePressureX,
        dischargePressureY,
        "DISCHARGE PT",
        value.dischargePressure,
        value.dischargePressureFault
    );

    drawDischargeFlowTransmitter(
        dischargeFlowX,
        dischargeFlowY
    );

    drawPressureTransmitter(
        suctionPressureX,
        suctionPressureY,
        "SUCTION PT",
        value.suctionPressure,
        value.suctionPressureFault
    );

    /*
    Make-up valve
    */

    drawMakeUpValve(
        valveX,
        valveY
    );

    const makeUpValve =
        valveInformation(
            value.valveStatus
        );

    if (
        makeUpValve.open &&
        !value.valveFault
    ) {
        drawPipeWaterFlow(
            towerX +
            towerWidth,
            DESIGN_WIDTH - 4,
            valveY
        );
    }

    /*
    Pump output centred directly beneath pump.
    */

    drawPumpOutputPanel(
        pumpX,
        255
    );
}


/* =========================================================
   SCALED DRAWING
========================================================= */

function draw() {
    const actualWidth =
        canvas.width;

    const actualHeight =
        canvas.height;

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

    const scale =
        Math.min(
            actualWidth /
            DESIGN_WIDTH,

            actualHeight /
            DESIGN_HEIGHT
        );

    const offsetX =
        (
            actualWidth -
            DESIGN_WIDTH *
            scale
        ) /
        2;

    const offsetY =
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

    drawScene();

    canvas.restore();
}


/* =========================================================
   ANIMATION TIMER
========================================================= */

setInterval(
    function () {
        const currentTime =
            Date.now();

        let elapsed =
            currentTime -
            previousTime;

        previousTime =
            currentTime;

        if (
            elapsed < 0 ||
            elapsed > 250
        ) {
            elapsed = 30;
        }

        const pumpInformation =
            equipmentStatus(
                value.pumpStatus
            );

        const fanInformation =
            equipmentStatus(
                value.fanStatus
            );

        if (
            pumpInformation.rotating &&
            !value.pumpFault
        ) {
            let pumpSpeed;

            if (
                value.pumpStatus === 5
            ) {
                pumpSpeed = 0.45;
            } else if (
                value.pumpStatus === 10
            ) {
                pumpSpeed = 0.25;
            } else {
                pumpSpeed =
                    0.35 +
                    limit(
                        value.pumpOutput,
                        0,
                        100
                    ) *
                    0.007;
            }

            pumpAngle -=
                pumpSpeed *
                Math.PI *
                2 *
                elapsed /
                1000;

            if (
                pumpAngle <
                -Math.PI *
                2
            ) {
                pumpAngle +=
                    Math.PI *
                    2;
            }
        }

        if (
            fanInformation.rotating &&
            !value.fanFault
        ) {
            let fanSpeed;

            if (
                value.fanStatus === 5
            ) {
                fanSpeed = 0.55;
            } else if (
                value.fanStatus === 10
            ) {
                fanSpeed = 0.30;
            } else {
                fanSpeed =
                    0.45 +
                    limit(
                        value.fanOutput,
                        0,
                        100
                    ) *
                    0.009;
            }

            fanAngle +=
                fanSpeed *
                Math.PI *
                2 *
                elapsed /
                1000;

            if (
                fanAngle >
                Math.PI *
                2
            ) {
                fanAngle -=
                    Math.PI *
                    2;
            }
        }

        waterOffset +=
            elapsed *
            0.025;

        if (
            waterOffset >
            1000
        ) {
            waterOffset = 0;
        }

        flashElapsed += elapsed;

        if (
            flashElapsed >= 500
        ) {
            flashElapsed = 0;

            const flashRequired =
                pumpInformation.flashing ||
                value.pumpFault !== 0 ||
                fanInformation.flashing ||
                value.fanFault !== 0 ||
                value.suctionPressureFault ||
                value.dischargePressureFault ||
                value.dischargeFlowFault ||
                value.basinLowLevel ||
                value.valveFault ||
                value.waterTemperatureFault;

            flashState =
                flashRequired
                    ? !flashState
                    : true;
        }

        draw();
    },
    30
);


/* =========================================================
   SUBSCRIPTION HELPER
========================================================= */

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
            " subscription is not configured"
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

                updateFunction(
                    errorValue
                );

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


/* =========================================================
   PUMP SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.pumpStatusSub,
    "Pump status",
    function (input) {
        value.pumpStatus =
            Math.round(
                numberValue(
                    input,
                    0
                )
            );
    },
    0
);


bindSubscription(
    this.config.pumpModeSub,
    "Pump mode",
    function (input) {
        value.pumpManual =
            Boolean(input);
    },
    false
);


bindSubscription(
    this.config.pumpOutputSub,
    "Pump output",
    function (input) {
        value.pumpOutput =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.pumpFaultSub,
    "Pump fault",
    function (input) {
        value.pumpFault =
            Math.round(
                numberValue(
                    input,
                    0
                )
            );
    },
    0
);


/* =========================================================
   PRESSURE SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.suctionPressureSub,
    "Suction pressure",
    function (input) {
        value.suctionPressure =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.suctionPressureFaultSub,
    "Suction pressure fault",
    function (input) {
        value.suctionPressureFault =
            Boolean(input);
    },
    true
);


bindSubscription(
    this.config.dischargePressureSub,
    "Discharge pressure",
    function (input) {
        value.dischargePressure =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.dischargePressureFaultSub,
    "Discharge pressure fault",
    function (input) {
        value.dischargePressureFault =
            Boolean(input);
    },
    true
);


/* =========================================================
   DISCHARGE FLOW SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.waterFlowSub,
    "Pump discharge flow",
    function (input) {
        value.dischargeFlow =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.waterFlowFaultSub,
    "Pump discharge flow fault",
    function (input) {
        value.dischargeFlowFault =
            Boolean(input);
    },
    true
);


/* =========================================================
   PID SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.pidPVSub,
    "Pressure PID PV",
    function (input) {
        value.pidPV =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.pidSVSub,
    "Pressure PID SV",
    function (input) {
        value.pidSV =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.pidCVSub,
    "Pressure PID CV",
    function (input) {
        value.pidCV =
            numberValue(
                input,
                0
            );
    },
    0
);


/* =========================================================
   FAN SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.fanStatusSub,
    "Tower fan status",
    function (input) {
        value.fanStatus =
            Math.round(
                numberValue(
                    input,
                    0
                )
            );
    },
    0
);


bindSubscription(
    this.config.fanModeSub,
    "Tower fan mode",
    function (input) {
        value.fanManual =
            Boolean(input);
    },
    false
);


bindSubscription(
    this.config.fanOutputSub,
    "Tower fan output",
    function (input) {
        value.fanOutput =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.fanFaultSub,
    "Tower fan fault",
    function (input) {
        value.fanFault =
            Math.round(
                numberValue(
                    input,
                    0
                )
            );
    },
    0
);


/* =========================================================
   TEMPERATURE SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.waterTempSub,
    "Cooling tower water temperature",
    function (input) {
        value.waterTemperature =
            numberValue(
                input,
                0
            );
    },
    0
);


bindSubscription(
    this.config.waterTempFaultSub,
    "Cooling tower water temperature fault",
    function (input) {
        value.waterTemperatureFault =
            Boolean(input);
    },
    true
);


/* =========================================================
   BASIN LEVEL SUBSCRIPTION
========================================================= */

bindSubscription(
    this.config.basinLevelLowSub,
    "Basin low level",
    function (input) {
        value.basinLowLevel =
            Boolean(input);
    },
    true
);


/* =========================================================
   MAKE-UP VALVE SUBSCRIPTIONS
========================================================= */

bindSubscription(
    this.config.valveStatusSub,
    "Make-up valve status",
    function (input) {
        value.valveStatus =
            Math.round(
                numberValue(
                    input,
                    0
                )
            );
    },
    0
);


bindSubscription(
    this.config.valveFaultSub,
    "Make-up valve fault",
    function (input) {
        value.valveFault =
            Boolean(input);
    },
    true
);


/* =========================================================
   INITIAL DRAW
========================================================= */

draw();