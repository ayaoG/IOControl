/*
============================================================
STACK FAN VSD WITH PRESSURE PID
SMOOTH STABLE EASYBUILDER VERSION
============================================================

Recommended JS Object size:
    320 x 210

Required subscriptions:

    vsdStatusSub
    vsdModeSub
    vsdOutputSub
    vsdFaultSub
    pressureSub
    pressureFaultSub
    pidPVSub
    pidSVSub
    pidCVSub

Optional strings:

    equipmentName
    pressureName
    pressureUnit
    vsdOutputUnit

    pidPVName
    pidSVName
    pidCVName
    pidProcessUnit
    pidCVUnit


VSD status:

    0  Unknown
    1  Stopped
    2  Run Forward
    3  Run Reverse
    5  Starting Forward
    6  Starting Reverse
    10 Stopping


VSD fault:

    0  None
    16 Fail To Start
    17 Fail To Stop
    18 Drive Fault
    32 I/O Fault


Pressure fault:

    0  None
    20 Lo
    21 Hi
    24 LoLo
    25 HiHi
    32 Fail
*/


/*
============================================================
CANVAS
============================================================
*/

const canvas = new Canvas();

this.widget.add(canvas);

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 210;


/*
============================================================
CONFIGURATION
============================================================
*/

const equipmentName =
    this.config.equipmentName ||
    "STACK EXHAUST FAN";

const pressureName =
    this.config.pressureName ||
    "DUCT PRESSURE";

const pressureUnit =
    this.config.pressureUnit ||
    "Pa";

const vsdOutputUnit =
    this.config.vsdOutputUnit ||
    "%";

const pidPVName =
    this.config.pidPVName ||
    "PV";

const pidSVName =
    this.config.pidSVName ||
    "SV";

const pidCVName =
    this.config.pidCVName ||
    "CV";

const pidProcessUnit =
    this.config.pidProcessUnit ||
    "Pa";

const pidCVUnit =
    this.config.pidCVUnit ||
    "%";


/*
============================================================
COLOURS
============================================================
*/

const COLOUR_NEUTRAL = "#7B8790";
const COLOUR_NEUTRAL_DARK = "#4F5961";

const COLOUR_TEXT = "#AEB8C0";
const COLOUR_TEXT_DARK = "#66717B";

const COLOUR_BORDER = "#56636C";
const COLOUR_BORDER_SOFT = "#364149";

const COLOUR_GREEN = "#22C55E";
const COLOUR_GREEN_DARK = "#15803D";

const COLOUR_AMBER = "#F59E0B";
const COLOUR_AMBER_DARK = "#A16207";

const COLOUR_RED = "#EF4444";
const COLOUR_RED_DARK = "#991B1B";

const COLOUR_BLUE = "#38BDF8";

const COLOUR_AUTO = "#7B8790";
const COLOUR_MANUAL = "#F59E0B";


/*
============================================================
RUNTIME VALUES
============================================================
*/

let vsdStatusValue = 0;
let vsdFaultValue = 0;
let vsdManual = false;

let vsdOutputValue = 0.0;

let pressureValue = 0.0;
let pressureFaultCode = 0;

let pidPVValue = 0.0;
let pidSVValue = 0.0;
let pidCVValue = 0.0;

let fanAngle = 0.0;

let flashVisible = true;
let flashElapsed = 0;

let lastTimerTime = Date.now();


/*
============================================================
GENERAL HELPERS
============================================================
*/

function clamp(
    value,
    minimum,
    maximum
) {
    if (
        value < minimum
    ) {
        return minimum;
    }

    if (
        value > maximum
    ) {
        return maximum;
    }

    return value;
}


function roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {
    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    ctx.beginPath();

    ctx.moveTo(
        x + r,
        y
    );

    ctx.lineTo(
        x + width - r,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + r
    );

    ctx.lineTo(
        x + width,
        y + height - r
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
    );

    ctx.lineTo(
        x + r,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - r
    );

    ctx.lineTo(
        x,
        y + r
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
    );

    ctx.closePath();
}


function safeNumber(
    value,
    defaultValue
) {
    const convertedValue =
        Number(value);

    if (
        isNaN(convertedValue)
    ) {
        return defaultValue;
    }

    return convertedValue;
}


function hasVsdFault() {
    return (
        vsdFaultValue !== 0
    );
}


function getOutputValue() {
    return safeNumber(
        vsdOutputValue,
        0.0
    );
}


function getOutputPercent() {
    return clamp(
        getOutputValue(),
        0.0,
        100.0
    );
}


function getPressureValue() {
    return safeNumber(
        pressureValue,
        0.0
    );
}


/*
============================================================
VSD STATUS
============================================================
*/

function getVsdStatusInfo(
    status
) {
    switch (status) {
        case 0:
            return {
                text: "UNKNOWN",
                colour: COLOUR_NEUTRAL,
                dark: COLOUR_NEUTRAL_DARK,
                rotate: false,
                flash: false
            };

        case 1:
            return {
                text: "STOPPED",
                colour: COLOUR_NEUTRAL,
                dark: COLOUR_NEUTRAL_DARK,
                rotate: false,
                flash: false
            };

        case 2:
            return {
                text: "RUN FWD",
                colour: COLOUR_GREEN,
                dark: COLOUR_GREEN_DARK,
                rotate: true,
                flash: false
            };

        case 3:
            return {
                text: "RUN REV",
                colour: COLOUR_GREEN,
                dark: COLOUR_GREEN_DARK,
                rotate: true,
                flash: false
            };

        case 5:
            return {
                text: "STARTING FWD",
                colour: COLOUR_AMBER,
                dark: COLOUR_AMBER_DARK,
                rotate: true,
                flash: true
            };

        case 6:
            return {
                text: "STARTING REV",
                colour: COLOUR_AMBER,
                dark: COLOUR_AMBER_DARK,
                rotate: true,
                flash: true
            };

        case 10:
            return {
                text: "STOPPING",
                colour: COLOUR_AMBER,
                dark: COLOUR_AMBER_DARK,
                rotate: true,
                flash: true
            };

        default:
            return {
                text: "UNKNOWN",
                colour: COLOUR_NEUTRAL,
                dark: COLOUR_NEUTRAL_DARK,
                rotate: false,
                flash: false
            };
    }
}


function getStatusColour(
    statusInfo
) {
    if (
        hasVsdFault()
    ) {
        if (
            flashVisible
        ) {
            return COLOUR_RED;
        }

        return COLOUR_RED_DARK;
    }

    if (
        statusInfo.flash &&
        !flashVisible
    ) {
        return statusInfo.dark;
    }

    return statusInfo.colour;
}


/*
============================================================
FAULT TEXT
============================================================
*/

function getVsdFaultText(
    faultCode
) {
    switch (faultCode) {
        case 0:
            return "";

        case 16:
            return "FAIL TO START";

        case 17:
            return "FAIL TO STOP";

        case 18:
            return "DRIVE FAULT";

        case 32:
            return "I/O FAULT";

        default:
            return (
                "FAULT " +
                String(faultCode)
            );
    }
}


function hasPressureFault() {
    return (
        pressureFaultCode !== 0
    );
}


function getPressureFaultText(
    faultCode
) {
    switch (faultCode) {
        case 0:
            return "";

        case 20:
            return "LOW";

        case 21:
            return "HIGH";

        case 24:
            return "LOW LOW";

        case 25:
            return "HIGH HIGH";

        case 32:
            return "SIGNAL FAULT";

        default:
            return (
                "FAULT " +
                String(faultCode)
            );
    }
}


/*
============================================================
MODE BADGE
============================================================
*/

function drawModeBadge(
    ctx,
    x,
    y,
    manual
) {
    const text =
        manual
            ? "M"
            : "A";

    const colour =
        manual
            ? COLOUR_MANUAL
            : COLOUR_AUTO;

    if (
        manual
    ) {
        ctx.fillStyle =
            "rgba(245,158,11,0.15)";
    } else {
        ctx.fillStyle =
            "rgba(123,135,144,0.14)";
    }

    roundedRect(
        ctx,
        x,
        y,
        24,
        19,
        5
    );

    ctx.fill();

    ctx.strokeStyle = colour;
    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        x,
        y,
        24,
        19,
        5
    );

    ctx.stroke();

    ctx.fillStyle = colour;
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        x + 12,
        y + 9
    );
}


/*
============================================================
DUCT
============================================================
*/

function drawDuctSection(
    ctx,
    startX,
    endX,
    centreY
) {
    const halfHeight = 15;

    ctx.strokeStyle = COLOUR_BORDER;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        startX,
        centreY - halfHeight
    );

    ctx.lineTo(
        endX,
        centreY - halfHeight
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        startX,
        centreY + halfHeight
    );

    ctx.lineTo(
        endX,
        centreY + halfHeight
    );

    ctx.stroke();
}


function drawFanTransitions(
    ctx,
    fanX,
    fanY
) {
    const radius = 43;
    const transitionLength = 14;
    const ductHalfHeight = 15;

    ctx.strokeStyle = COLOUR_BORDER;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        fanX -
        radius -
        transitionLength,
        fanY -
        ductHalfHeight
    );

    ctx.lineTo(
        fanX -
        radius,
        fanY -
        24
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        fanX -
        radius -
        transitionLength,
        fanY +
        ductHalfHeight
    );

    ctx.lineTo(
        fanX -
        radius,
        fanY +
        24
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        fanX +
        radius,
        fanY -
        24
    );

    ctx.lineTo(
        fanX +
        radius +
        transitionLength,
        fanY -
        ductHalfHeight
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        fanX +
        radius,
        fanY +
        24
    );

    ctx.lineTo(
        fanX +
        radius +
        transitionLength,
        fanY +
        ductHalfHeight
    );

    ctx.stroke();
}


/*
============================================================
AIRFLOW ARROW
============================================================
*/

function drawAirflowArrow(
    ctx,
    x,
    y,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = 1.8;

    ctx.beginPath();

    ctx.moveTo(
        x - 13,
        y
    );

    ctx.lineTo(
        x + 5,
        y
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x + 10,
        y
    );

    ctx.lineTo(
        x,
        y - 6
    );

    ctx.lineTo(
        x,
        y + 6
    );

    ctx.closePath();

    ctx.fill();
}


/*
============================================================
PRESSURE TRANSMITTER
============================================================
*/

function drawPressureTransmitter(
    ctx,
    centreX,
    ductY
) {
    const transmitterY =
        ductY - 49;

    let colour =
        COLOUR_NEUTRAL;

    if (
        hasPressureFault()
    ) {
        if (
            flashVisible
        ) {
            colour = COLOUR_RED;
        } else {
            colour = COLOUR_RED_DARK;
        }
    }

    if (
        hasPressureFault()
    ) {
        ctx.strokeStyle = colour;
    } else {
        ctx.strokeStyle = COLOUR_BORDER;
    }

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        centreX,
        ductY - 15
    );

    ctx.lineTo(
        centreX,
        transmitterY + 16
    );

    ctx.stroke();

    ctx.fillStyle = colour;

    ctx.beginPath();

    ctx.arc(
        centreX,
        ductY - 15,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "rgba(17,23,28,0.96)";

    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        centreX,
        transmitterY,
        16,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colour;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "PT",
        centreX,
        transmitterY
    );

    ctx.fillStyle = COLOUR_TEXT_DARK;
    ctx.font = "bold 9px Arial";

    ctx.fillText(
        pressureName,
        centreX,
        transmitterY - 25
    );

    ctx.fillStyle =
        hasPressureFault()
            ? colour
            : COLOUR_TEXT;

    ctx.font = "bold 15px Arial";

    ctx.fillText(
        getPressureValue()
            .toFixed(1) +
        " " +
        pressureUnit,
        centreX,
        ductY + 35
    );

    if (
        hasPressureFault()
    ) {
        ctx.fillStyle = colour;
        ctx.font = "bold 10px Arial";

        ctx.fillText(
            getPressureFaultText(
                pressureFaultCode
            ),
            centreX,
            ductY + 49
        );
    }
}


/*
============================================================
ROTATED POINT
============================================================
*/

function rotatedPoint(
    centreX,
    centreY,
    localX,
    localY,
    angle
) {
    const cosine =
        Math.cos(angle);

    const sine =
        Math.sin(angle);

    return {
        x:
            centreX +
            localX *
            cosine -
            localY *
            sine,

        y:
            centreY +
            localX *
            sine +
            localY *
            cosine
    };
}


/*
============================================================
FAN PADDLE
============================================================
*/

function drawPaddle(
    ctx,
    centreX,
    centreY,
    angle,
    colour
) {
    const point1 =
        rotatedPoint(
            centreX,
            centreY,
            -5,
            -10,
            angle
        );

    const point2 =
        rotatedPoint(
            centreX,
            centreY,
            -10,
            -24,
            angle
        );

    const point3 =
        rotatedPoint(
            centreX,
            centreY,
            -8,
            -33,
            angle
        );

    const point4 =
        rotatedPoint(
            centreX,
            centreY,
            1,
            -36,
            angle
        );

    const point5 =
        rotatedPoint(
            centreX,
            centreY,
            11,
            -29,
            angle
        );

    const point6 =
        rotatedPoint(
            centreX,
            centreY,
            8,
            -13,
            angle
        );

    ctx.fillStyle = colour;

    ctx.beginPath();

    ctx.moveTo(
        point1.x,
        point1.y
    );

    ctx.lineTo(
        point2.x,
        point2.y
    );

    ctx.lineTo(
        point3.x,
        point3.y
    );

    ctx.lineTo(
        point4.x,
        point4.y
    );

    ctx.lineTo(
        point5.x,
        point5.y
    );

    ctx.lineTo(
        point6.x,
        point6.y
    );

    ctx.closePath();

    ctx.fill();
}


/*
============================================================
FAN SYMBOL
============================================================
*/

function drawFanSymbol(
    ctx,
    centreX,
    centreY,
    statusInfo
) {
    const colour =
        getStatusColour(
            statusInfo
        );

    ctx.fillStyle =
        "rgba(17,23,28,0.98)";

    ctx.strokeStyle = colour;
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        43,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle =
        COLOUR_BORDER_SOFT;

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        36,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    let bladeIndex;

    for (
        bladeIndex = 0;
        bladeIndex < 6;
        bladeIndex++
    ) {
        drawPaddle(
            ctx,
            centreX,
            centreY,
            fanAngle +
            bladeIndex *
            Math.PI /
            3,
            colour
        );
    }

    ctx.fillStyle =
        "rgba(17,23,28,1.0)";

    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        11,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colour;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/*
============================================================
OUTPUT BAR
============================================================
*/

function drawOutputBar(
    ctx,
    x,
    y,
    width,
    height,
    colour
) {
    const percentage =
        getOutputPercent();

    ctx.fillStyle =
        "rgba(90,100,110,0.30)";

    roundedRect(
        ctx,
        x,
        y,
        width,
        height,
        height / 2
    );

    ctx.fill();

    const fillWidth =
        width *
        percentage /
        50.0;

    if (
        fillWidth >= 2
    ) {
        ctx.fillStyle = colour;

        roundedRect(
            ctx,
            x,
            y,
            fillWidth,
            height,
            height / 2
        );

        ctx.fill();
    }

    ctx.strokeStyle =
        "rgba(130,145,155,0.75)";

    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        x,
        y,
        width,
        height,
        height / 2
    );

    ctx.stroke();
}


/*
============================================================
VSD OUTPUT
============================================================
*/

function drawVsdOutput(
    ctx,
    centreX,
    topY,
    statusInfo
) {
    const colour =
        getStatusColour(
            statusInfo
        );

    ctx.fillStyle =
        "rgba(25,32,38,0.95)";

    roundedRect(
        ctx,
        centreX - 63,
        topY,
        126,
        57,
        7
    );

    ctx.fill();

    ctx.strokeStyle =
        "rgba(105,118,128,0.65)";

    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        centreX - 63,
        topY,
        126,
        57,
        7
    );

    ctx.stroke();

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "bold 9px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "VSD OUTPUT",
        centreX,
        topY + 10
    );

    ctx.fillStyle = colour;

    ctx.font =
        "bold 21px Arial";

    ctx.fillText(
        getOutputValue()
            .toFixed(1) +
        " " +
        vsdOutputUnit,
        centreX,
        topY + 31
    );

    drawOutputBar(
        ctx,
        centreX - 51,
        topY + 46,
        102,
        7,
        colour
    );
}


/*
============================================================
PID VALUES DISPLAY
============================================================
*/

function drawPidValues(
    ctx,
    centreX,
    topY
) {
    const panelWidth = 126;
    const panelHeight = 57;

    const panelX =
        centreX -
        panelWidth / 2;

    const pvX =
        panelX + 21;

    const svX =
        panelX + 63;

    const cvX =
        panelX + 105;

    ctx.fillStyle =
        "rgba(25,32,38,0.95)";

    roundedRect(
        ctx,
        panelX,
        topY,
        panelWidth,
        panelHeight,
        7
    );

    ctx.fill();

    ctx.strokeStyle =
        "rgba(105,118,128,0.65)";

    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        panelX,
        topY,
        panelWidth,
        panelHeight,
        7
    );

    ctx.stroke();

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "bold 9px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "PRESSURE PID",
        centreX,
        topY + 10
    );

    ctx.fillStyle =
        COLOUR_GREEN;

    ctx.font =
        "bold 9px Arial";

    ctx.fillText(
        pidPVName,
        pvX,
        topY + 24
    );

    ctx.fillStyle =
        COLOUR_TEXT;

    ctx.font =
        "bold 11px Arial";

    ctx.fillText(
        safeNumber(
            pidPVValue,
            0.0
        ).toFixed(1),
        pvX,
        topY + 39
    );

    ctx.fillStyle =
        COLOUR_BLUE;

    ctx.font =
        "bold 9px Arial";

    ctx.fillText(
        pidSVName,
        svX,
        topY + 24
    );

    ctx.fillStyle =
        COLOUR_TEXT;

    ctx.font =
        "bold 11px Arial";

    ctx.fillText(
        safeNumber(
            pidSVValue,
            0.0
        ).toFixed(1),
        svX,
        topY + 39
    );

    ctx.fillStyle =
        COLOUR_AMBER;

    ctx.font =
        "bold 9px Arial";

    ctx.fillText(
        pidCVName,
        cvX,
        topY + 24
    );

    ctx.fillStyle =
        COLOUR_TEXT;

    ctx.font =
        "bold 11px Arial";

    ctx.fillText(
        safeNumber(
            pidCVValue,
            0.0
        ).toFixed(1),
        cvX,
        topY + 39
    );

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "bold 7px Arial";

    ctx.fillText(
        pidProcessUnit,
        pvX,
        topY + 51
    );

    ctx.fillText(
        pidProcessUnit,
        svX,
        topY + 51
    );

    ctx.fillText(
        pidCVUnit,
        cvX,
        topY + 51
    );
}


/*
============================================================
MAIN DRAWING
============================================================
*/

function drawContent() {
    const ductY = 88;

    const pressureX = 70;
    const fanX = 220;

    const statusInfo =
        getVsdStatusInfo(
            vsdStatusValue
        );

    const statusColour =
        getStatusColour(
            statusInfo
        );

    canvas.fillStyle =
        COLOUR_TEXT_DARK;

    canvas.font =
        "bold 11px Arial";

    canvas.textAlign =
        "center";

    canvas.textBaseline =
        "middle";

    canvas.fillText(
        equipmentName,
        fanX,
        17
    );

    drawModeBadge(
        canvas,
        DESIGN_WIDTH - 32,
        10,
        vsdManual
    );

    drawDuctSection(
        canvas,
        17,
        fanX - 57,
        ductY
    );

    drawDuctSection(
        canvas,
        fanX + 57,
        DESIGN_WIDTH - 18,
        ductY
    );

    drawFanTransitions(
        canvas,
        fanX,
        ductY
    );

    drawPressureTransmitter(
        canvas,
        pressureX,
        ductY
    );

    drawAirflowArrow(
        canvas,
        133,
        ductY,
        COLOUR_BORDER
    );

    drawFanSymbol(
        canvas,
        fanX,
        ductY,
        statusInfo
    );

    drawAirflowArrow(
        canvas,
        298,
        ductY,
        statusColour
    );

    canvas.fillStyle =
        statusColour;

    canvas.font =
        "bold 10px Arial";

    canvas.textAlign =
        "center";

    canvas.textBaseline =
        "middle";

    if (
        hasVsdFault()
    ) {
        canvas.fillText(
            getVsdFaultText(
                vsdFaultValue
            ),
            fanX,
            139
        );
    } else {
        canvas.fillText(
            statusInfo.text,
            fanX,
            139
        );
    }

    drawPidValues(
        canvas,
        pressureX,
        147
    );

    drawVsdOutput(
        canvas,
        fanX,
        147,
        statusInfo
    );
}


/*
============================================================
SCALED DRAW
============================================================
*/

function drawAssembly() {
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

    try {
        canvas.clearRect(
            0,
            0,
            actualWidth,
            actualHeight
        );

        const scaleX =
            actualWidth /
            DESIGN_WIDTH;

        const scaleY =
            actualHeight /
            DESIGN_HEIGHT;

        const scaleFactor =
            Math.min(
                scaleX,
                scaleY
            );

        const offsetX =
            (
                actualWidth -
                DESIGN_WIDTH *
                scaleFactor
            ) / 2;

        const offsetY =
            (
                actualHeight -
                DESIGN_HEIGHT *
                scaleFactor
            ) / 2;

        canvas.save();

        canvas.translate(
            offsetX,
            offsetY
        );

        canvas.scale(
            scaleFactor,
            scaleFactor
        );

        drawContent();

        canvas.restore();
    } catch (
        drawError
    ) {
        try {
            canvas.restore();
        } catch (
            restoreError
        ) {
        }

        console.log(
            "Stack fan draw error:",
            drawError.message
        );
    }
}


/*
============================================================
SMOOTH STABLE TIMER
============================================================
*/

setInterval(
    function () {
        const currentTime =
            Date.now();

        let deltaTime =
            currentTime -
            lastTimerTime;

        lastTimerTime =
            currentTime;

        if (
            deltaTime < 0 ||
            deltaTime > 200
        ) {
            deltaTime = 30;
        }

        const statusInfo =
            getVsdStatusInfo(
                vsdStatusValue
            );

        if (
            statusInfo.rotate &&
            !hasVsdFault()
        ) {
            const output =
                getOutputPercent();

            let revolutionsPerSecond;

            if (
                vsdStatusValue === 5 ||
                vsdStatusValue === 6
            ) {
                revolutionsPerSecond =
                    0.45;
            } else if (
                vsdStatusValue === 10
            ) {
                revolutionsPerSecond =
                    0.25;
            } else {
                revolutionsPerSecond =
                    0.35 +
                    output *
                    0.0085;
            }

            const angleStep =
                revolutionsPerSecond *
                Math.PI *
                2 *
                (
                    deltaTime /
                    1000
                );

            if (
                vsdStatusValue === 3 ||
                vsdStatusValue === 6
            ) {
                fanAngle -=
                    angleStep;
            } else {
                fanAngle +=
                    angleStep;
            }

            if (
                fanAngle >
                Math.PI * 2
            ) {
                fanAngle -=
                    Math.PI * 2;
            }

            if (
                fanAngle <
                -Math.PI * 2
            ) {
                fanAngle +=
                    Math.PI * 2;
            }
        }

        flashElapsed +=
            deltaTime;

        if (
            flashElapsed >= 500
        ) {
            flashElapsed = 0;

            if (
                statusInfo.flash ||
                hasVsdFault() ||
                hasPressureFault()
            ) {
                flashVisible =
                    !flashVisible;
            } else {
                flashVisible = true;
            }
        }

        drawAssembly();
    },
    30
);


/*
============================================================
SUBSCRIPTIONS
============================================================
*/


this.config.vsdStatusSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "VSD status error:",
                err.message
            );

            vsdStatusValue = 0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            vsdStatusValue =
                Math.round(
                    safeNumber(
                        data.values[0],
                        0
                    )
                );

            drawAssembly();
        }
    }
);


this.config.vsdModeSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "VSD mode error:",
                err.message
            );

            vsdManual = false;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            vsdManual =
                Boolean(
                    data.values[0]
                );

            drawAssembly();
        }
    }
);


this.config.vsdOutputSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "VSD output error:",
                err.message
            );

            vsdOutputValue = 0.0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            vsdOutputValue =
                safeNumber(
                    data.values[0],
                    0.0
                );

            drawAssembly();
        }
    }
);


this.config.vsdFaultSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "VSD fault error:",
                err.message
            );

            vsdFaultValue = 0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            vsdFaultValue =
                Math.round(
                    safeNumber(
                        data.values[0],
                        0
                    )
                );

            drawAssembly();
        }
    }
);


this.config.pressureSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "Pressure value error:",
                err.message
            );

            pressureValue = 0.0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            pressureValue =
                safeNumber(
                    data.values[0],
                    0.0
                );

            drawAssembly();
        }
    }
);


this.config.pressureFaultSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "Pressure fault error:",
                err.message
            );

            pressureFaultCode = 32;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            pressureFaultCode =
                Math.round(
                    safeNumber(
                        data.values[0],
                        0
                    )
                );

            drawAssembly();
        }
    }
);


this.config.pidPVSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "PID PV error:",
                err.message
            );

            pidPVValue = 0.0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            pidPVValue =
                safeNumber(
                    data.values[0],
                    0.0
                );

            drawAssembly();
        }
    }
);


this.config.pidSVSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "PID SV error:",
                err.message
            );

            pidSVValue = 0.0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            pidSVValue =
                safeNumber(
                    data.values[0],
                    0.0
                );

            drawAssembly();
        }
    }
);


this.config.pidCVSub.onResponse(
    function (
        err,
        data
    ) {
        if (
            err
        ) {
            console.log(
                "PID CV error:",
                err.message
            );

            pidCVValue = 0.0;
            drawAssembly();

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            pidCVValue =
                safeNumber(
                    data.values[0],
                    0.0
                );

            drawAssembly();
        }
    }
);


/*
============================================================
INITIAL DRAW
============================================================
*/

drawAssembly();