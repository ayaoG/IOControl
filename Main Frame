/*
============================================================
OZONE CONTROL HMI FRAME WITH SEQUENCE PANEL
Weintek EasyBuilder Pro JS Object
============================================================

Design size:
    1024 x 600

Navigation:
    10 = Overview
    11 = Ozone
    12 = Stack Fan
    13 = Cooling Tower
    14 = Settings
    15 = Trends
    16 = Alarms

Sequence logic:

Start:
    Maintained PLC command.
    Stop command is cleared first.
    Start command is then set ON.
    Enabled when sequenceRunning = FALSE.

Stop:
    Maintained PLC command.
    Start command is cleared first.
    Stop command is then set ON.
    Enabled when sequenceRunning = TRUE.

Reset:
    Momentary PLC command.
    Enabled only when readyReset = TRUE.
    Pulse duration = 300 ms.

Step time:
    PLC tag is already in seconds.
*/


/*
============================================================
CANVAS AND TOUCH AREA
============================================================
*/

const canvas = new Canvas();
const mouseArea = new MouseArea();

this.widget.add(canvas);
this.widget.add(mouseArea);


/*
============================================================
CAPTURE CONFIGURATION
============================================================
*/

const CONFIG = this.config;


/*
Writable addresses.
*/

const ADDRESS_NAVIGATION =
    CONFIG.navigationWrite;

const ADDRESS_START_CMD =
    CONFIG.startCmdWrite;

const ADDRESS_STOP_CMD =
    CONFIG.stopCmdWrite;

const ADDRESS_RESET_CMD =
    CONFIG.resetCmdWrite;


/*
============================================================
DESIGN DIMENSIONS
============================================================
*/

const DESIGN_WIDTH = 1024;
const DESIGN_HEIGHT = 600;

const HEADER_HEIGHT = 48;
const FOOTER_HEIGHT = 38;
const NAV_WIDTH = 182;

const CONTENT_X = NAV_WIDTH;
const CONTENT_Y = HEADER_HEIGHT;

const CONTENT_WIDTH =
    DESIGN_WIDTH - NAV_WIDTH;

const CONTENT_HEIGHT =
    DESIGN_HEIGHT -
    HEADER_HEIGHT -
    FOOTER_HEIGHT;


/*
============================================================
SEQUENCE PANEL GEOMETRY
============================================================
*/

const SEQUENCE_PANEL = {
    x: NAV_WIDTH + 12,
    y: DESIGN_HEIGHT - FOOTER_HEIGHT - 110,
    width: DESIGN_WIDTH - NAV_WIDTH - 30,
    height: 100
};


const SEQUENCE_BUTTONS = [
    {
        id: "start",
        text: "START",
        x: SEQUENCE_PANEL.x + 16,
        y: SEQUENCE_PANEL.y + 43,
        width: 72,
        height: 44
    },
    {
        id: "stop",
        text: "STOP",
        x: SEQUENCE_PANEL.x + 96,
        y: SEQUENCE_PANEL.y + 43,
        width: 72,
        height: 44
    },
    {
        id: "reset",
        text: "RESET",
        x: SEQUENCE_PANEL.x + 176,
        y: SEQUENCE_PANEL.y + 43,
        width: 72,
        height: 44
    }
];


/*
============================================================
CONFIGURATION VALUES
============================================================
*/

const projectTitle =
    CONFIG.projectTitle ||
    "OZONE CONTROL SYSTEM";

const siteName =
    CONFIG.siteName ||
    "PROCESS PLANT";

const operatorName =
    CONFIG.operatorName ||
    "OPERATOR";


/*
============================================================
COLOURS
============================================================
*/

const COLOUR_BACKGROUND = "#1A2127";

const COLOUR_HEADER = "#232C33";
const COLOUR_NAV = "#232C33";
const COLOUR_FOOTER = "#232C33";
const COLOUR_CONTENT = "#1D252C";

const COLOUR_PANEL_HOVER = "#303B44";

const COLOUR_BORDER = "#56636C";
const COLOUR_BORDER_SOFT = "#44515A";

const COLOUR_TEXT_PRIMARY = "#D9E1E6";
const COLOUR_TEXT_SECONDARY = "#A1ADB6";
const COLOUR_TEXT_DARK = "#7F8B94";

const COLOUR_ACTIVE = "#22C55E";
const COLOUR_ACTIVE_DARK = "#15803D";

const COLOUR_STOP = "#EF4444";
const COLOUR_STOP_DARK = "#991B1B";

const COLOUR_RESET = "#F59E0B";
const COLOUR_RESET_DARK = "#A16207";


/*
============================================================
NAVIGATION DEFINITIONS
============================================================
*/

const navigationItems = [
    {
        window: 10,
        text: "OVERVIEW",
        icon: "home"
    },
    {
        window: 11,
        text: "OZONE",
        icon: "ozone"
    },
    {
        window: 12,
        text: "STACK FAN",
        icon: "fan"
    },
    {
        window: 13,
        text: "COOLING TOWER",
        icon: "cooling"
    },
    {
        window: 14,
        text: "SETTINGS",
        icon: "settings"
    },
    {
        window: 15,
        text: "TRENDS",
        icon: "trend"
    },
    {
        window: 16,
        text: "ALARMS",
        icon: "alarm"
    }
];


/*
============================================================
RUNTIME STATE
============================================================
*/

let activeWindow = 10;
let pressedWindow = -1;

let currentDateText = "";
let currentTimeText = "";

let sequenceRunning = false;
let readyReset = false;

let startCommand = false;
let stopCommand = false;
let resetCommand = false;

let sequenceStepNumber = 0;

/*
PLC value is already in seconds.
*/
let sequenceStepTimeSeconds = 0;

let sequencePressedButton = "";

let clockTimer = null;


/*
============================================================
GENERAL HELPERS
============================================================
*/

function roundedRect(
    ctx,
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


function padTwo(value) {
    return value < 10
        ? "0" + value
        : String(value);
}


function getActivePageName() {
    for (
        let index = 0;
        index < navigationItems.length;
        index++
    ) {
        if (
            navigationItems[index].window ===
            activeWindow
        ) {
            return navigationItems[index].text;
        }
    }

    return "";
}


/*
PLC step-time tag is already in seconds.
*/
function formatStepTime(secondsValue) {
    let totalSeconds =
        Math.max(
            0,
            Math.floor(
                Number(secondsValue)
            )
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    totalSeconds -=
        hours * 3600;

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds -
        minutes * 60;

    return (
        padTwo(hours) +
        ":" +
        padTwo(minutes) +
        ":" +
        padTwo(seconds)
    );
}


/*
============================================================
CLOCK
============================================================
*/

function updateClock() {
    const now = new Date();

    currentDateText =
        padTwo(now.getDate()) +
        "/" +
        padTwo(now.getMonth() + 1) +
        "/" +
        now.getFullYear();

    currentTimeText =
        padTwo(now.getHours()) +
        ":" +
        padTwo(now.getMinutes()) +
        ":" +
        padTwo(now.getSeconds());

    drawFrame();
}


/*
============================================================
NAVIGATION ICONS
============================================================
*/

function drawHomeIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(
        centreX - 9,
        centreY
    );

    ctx.lineTo(
        centreX,
        centreY - 8
    );

    ctx.lineTo(
        centreX + 9,
        centreY
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        centreX - 6,
        centreY - 1
    );

    ctx.lineTo(
        centreX - 6,
        centreY + 9
    );

    ctx.lineTo(
        centreX + 6,
        centreY + 9
    );

    ctx.lineTo(
        centreX + 6,
        centreY - 1
    );

    ctx.stroke();
}


function drawOzoneIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.8;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        11,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle = colour;
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "O\u2083",
        centreX,
        centreY
    );
}


function drawFanIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = 1.8;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        11,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    for (
        let index = 0;
        index < 3;
        index++
    ) {
        const angle =
            index *
            Math.PI *
            2 / 3;

        ctx.save();

        ctx.translate(
            centreX,
            centreY
        );

        ctx.rotate(angle);

        ctx.beginPath();

        ctx.moveTo(
            2,
            -1
        );

        ctx.quadraticCurveTo(
            8,
            -6,
            9,
            -1
        );

        ctx.quadraticCurveTo(
            7,
            3,
            2,
            2
        );

        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}


function drawCoolingTowerIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(
        centreX - 7,
        centreY - 10
    );

    ctx.quadraticCurveTo(
        centreX - 3,
        centreY,
        centreX - 9,
        centreY + 10
    );

    ctx.lineTo(
        centreX + 9,
        centreY + 10
    );

    ctx.quadraticCurveTo(
        centreX + 3,
        centreY,
        centreX + 7,
        centreY - 10
    );

    ctx.closePath();
    ctx.stroke();

    for (
        let index = -1;
        index <= 1;
        index++
    ) {
        const x =
            centreX +
            index * 5;

        ctx.beginPath();

        ctx.moveTo(
            x,
            centreY - 13
        );

        ctx.quadraticCurveTo(
            x - 2,
            centreY - 17,
            x,
            centreY - 21
        );

        ctx.stroke();
    }
}


function drawTrendIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(
        centreX - 11,
        centreY + 7
    );

    ctx.lineTo(
        centreX - 4,
        centreY
    );

    ctx.lineTo(
        centreX + 2,
        centreY + 3
    );

    ctx.lineTo(
        centreX + 10,
        centreY - 8
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        centreX + 4,
        centreY - 8
    );

    ctx.lineTo(
        centreX + 10,
        centreY - 8
    );

    ctx.lineTo(
        centreX + 10,
        centreY - 2
    );

    ctx.stroke();
}


function drawAlarmIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(
        centreX,
        centreY - 11
    );

    ctx.lineTo(
        centreX + 11,
        centreY + 9
    );

    ctx.lineTo(
        centreX - 11,
        centreY + 9
    );

    ctx.closePath();
    ctx.stroke();

    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "!",
        centreX,
        centreY + 3
    );
}


function drawSettingsIcon(
    ctx,
    centreX,
    centreY,
    colour
) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        8,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        3,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    for (
        let index = 0;
        index < 8;
        index++
    ) {
        const angle =
            index *
            Math.PI / 4;

        const innerX =
            centreX +
            Math.cos(angle) * 9;

        const innerY =
            centreY +
            Math.sin(angle) * 9;

        const outerX =
            centreX +
            Math.cos(angle) * 12;

        const outerY =
            centreY +
            Math.sin(angle) * 12;

        ctx.beginPath();

        ctx.moveTo(
            innerX,
            innerY
        );

        ctx.lineTo(
            outerX,
            outerY
        );

        ctx.stroke();
    }
}


function drawNavigationIcon(
    ctx,
    iconName,
    centreX,
    centreY,
    colour
) {
    switch (iconName) {
        case "home":
            drawHomeIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;

        case "ozone":
            drawOzoneIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;

        case "fan":
            drawFanIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;

        case "cooling":
            drawCoolingTowerIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;

        case "settings":
            drawSettingsIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;

        case "trend":
            drawTrendIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;

        case "alarm":
            drawAlarmIcon(
                ctx,
                centreX,
                centreY,
                colour
            );
            break;
    }
}


/*
============================================================
HEADER
============================================================
*/

function drawHeader(ctx) {
    ctx.fillStyle =
        COLOUR_HEADER;

    ctx.fillRect(
        0,
        0,
        DESIGN_WIDTH,
        HEADER_HEIGHT
    );

    ctx.strokeStyle =
        COLOUR_BORDER;

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        0,
        HEADER_HEIGHT - 0.5
    );

    ctx.lineTo(
        DESIGN_WIDTH,
        HEADER_HEIGHT - 0.5
    );

    ctx.stroke();

    ctx.strokeStyle =
        COLOUR_ACTIVE;

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        25,
        HEADER_HEIGHT / 2,
        14,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle =
        COLOUR_ACTIVE;

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "O\u2083",
        25,
        HEADER_HEIGHT / 2
    );

    ctx.fillStyle =
        COLOUR_TEXT_PRIMARY;

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign =
        "left";

    ctx.fillText(
        projectTitle,
        50,
        HEADER_HEIGHT / 2
    );

    const projectTitleWidth =
        ctx.measureText(
            projectTitle
        ).width;

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "11px Arial";

    ctx.fillText(
        siteName,
        50 +
        projectTitleWidth +
        18,
        HEADER_HEIGHT / 2 + 1
    );

    ctx.fillStyle =
        COLOUR_TEXT_SECONDARY;

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "right";

    ctx.fillText(
        currentDateText +
        "  " +
        currentTimeText,
        DESIGN_WIDTH - 20,
        HEADER_HEIGHT / 2
    );
}


/*
============================================================
NAVIGATION
============================================================
*/

function getNavigationGeometry(index) {
    const firstY =
        HEADER_HEIGHT + 11;

    const tabHeight = 62;
    const tabGap = 5;

    return {
        x: 11,

        y:
            firstY +
            index *
            (tabHeight + tabGap),

        width:
            NAV_WIDTH - 22,

        height:
            tabHeight
    };
}


function drawNavigationTab(
    ctx,
    item,
    index
) {
    const geometry =
        getNavigationGeometry(index);

    const isActive =
        item.window === activeWindow;

    const isPressed =
        item.window === pressedWindow;

    let backgroundColour =
        "rgba(0,0,0,0)";

    let borderColour =
        COLOUR_BORDER_SOFT;

    let textColour =
        COLOUR_TEXT_SECONDARY;

    let iconColour =
        COLOUR_TEXT_SECONDARY;

    if (isPressed) {
        backgroundColour =
            COLOUR_PANEL_HOVER;

        borderColour =
            COLOUR_BORDER;

        textColour =
            COLOUR_TEXT_PRIMARY;

        iconColour =
            COLOUR_TEXT_PRIMARY;
    } else if (isActive) {
        backgroundColour =
            "rgba(34,197,94,0.10)";

        borderColour =
            COLOUR_ACTIVE_DARK;

        textColour =
            COLOUR_ACTIVE;

        iconColour =
            COLOUR_ACTIVE;
    }

    ctx.fillStyle =
        backgroundColour;

    roundedRect(
        ctx,
        geometry.x,
        geometry.y,
        geometry.width,
        geometry.height,
        8
    );

    ctx.fill();

    ctx.strokeStyle =
        borderColour;

    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        geometry.x,
        geometry.y,
        geometry.width,
        geometry.height,
        8
    );

    ctx.stroke();

    if (
        isActive &&
        !isPressed
    ) {
        ctx.fillStyle =
            COLOUR_ACTIVE;

        roundedRect(
            ctx,
            geometry.x,
            geometry.y + 9,
            4,
            geometry.height - 18,
            2
        );

        ctx.fill();
    }

    drawNavigationIcon(
        ctx,
        item.icon,
        geometry.x + 27,
        geometry.y +
        geometry.height / 2,
        iconColour
    );

    ctx.fillStyle =
        textColour;

    ctx.font =
        "bold 12px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        item.text,
        geometry.x + 51,
        geometry.y +
        geometry.height / 2
    );
}


function drawNavigation(ctx) {
    ctx.fillStyle =
        COLOUR_NAV;

    ctx.fillRect(
        0,
        HEADER_HEIGHT,
        NAV_WIDTH,
        DESIGN_HEIGHT -
        HEADER_HEIGHT -
        FOOTER_HEIGHT
    );

    ctx.strokeStyle =
        COLOUR_BORDER;

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        NAV_WIDTH - 0.5,
        HEADER_HEIGHT
    );

    ctx.lineTo(
        NAV_WIDTH - 0.5,
        DESIGN_HEIGHT -
        FOOTER_HEIGHT
    );

    ctx.stroke();

    for (
        let index = 0;
        index < navigationItems.length;
        index++
    ) {
        drawNavigationTab(
            ctx,
            navigationItems[index],
            index
        );
    }
}


/*
============================================================
MAIN CONTENT AREA
============================================================
*/

function drawContentArea(ctx) {
    ctx.fillStyle =
        COLOUR_CONTENT;

    ctx.fillRect(
        CONTENT_X,
        CONTENT_Y,
        CONTENT_WIDTH,
        CONTENT_HEIGHT
    );

    const upperContentHeight =
        SEQUENCE_PANEL.y -
        CONTENT_Y -
        12;

    ctx.strokeStyle =
        "rgba(86,99,108,0.45)";

    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        CONTENT_X + 17,
        CONTENT_Y + 17,
        CONTENT_WIDTH - 34,
        upperContentHeight - 17,
        10
    );

    ctx.stroke();

    ctx.fillStyle =
        COLOUR_ACTIVE;

    roundedRect(
        ctx,
        CONTENT_X + 19,
        CONTENT_Y + 27,
        4,
        15,
        2
    );

    ctx.fill();

    ctx.fillStyle =
        COLOUR_TEXT_SECONDARY;

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        getActivePageName(),
        CONTENT_X + 31,
        CONTENT_Y + 34
    );
}


/*
============================================================
SEQUENCE BUTTON LOGIC
============================================================
*/

function isSequenceButtonEnabled(buttonId) {
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


function isSequenceButtonActive(buttonId) {
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


function drawSequenceButton(
    ctx,
    button,
    normalColour,
    activeFillColour,
    pressedFillColour
) {
    const enabled =
        isSequenceButtonEnabled(
            button.id
        );

    const active =
        isSequenceButtonActive(
            button.id
        );

    const pressed =
        sequencePressedButton ===
        button.id &&
        enabled;

    let fillColour =
        "rgba(48,59,68,0.70)";

    let borderColour =
        COLOUR_BORDER;

    let textColour =
        normalColour;

    if (!enabled) {
        fillColour =
            "rgba(28,35,41,0.60)";

        borderColour =
            COLOUR_BORDER_SOFT;

        textColour =
            COLOUR_TEXT_DARK;
    }

    if (active) {
        fillColour =
            activeFillColour;

        borderColour =
            normalColour;

        textColour =
            normalColour;
    }

    if (pressed) {
        fillColour =
            pressedFillColour;

        borderColour =
            pressedFillColour;

        textColour =
            "#FFFFFF";
    }

    ctx.fillStyle =
        fillColour;

    roundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        7
    );

    ctx.fill();

    ctx.strokeStyle =
        borderColour;

    ctx.lineWidth =
        active || pressed
            ? 2
            : 1;

    roundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        7
    );

    ctx.stroke();

    ctx.fillStyle =
        textColour;

    ctx.font =
        "bold 11px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        button.text,
        button.x +
        button.width / 2,
        button.y +
        button.height / 2
    );
}


/*
============================================================
SEQUENCE PANEL
============================================================
*/

function drawSequencePanel(ctx) {
    const panel =
        SEQUENCE_PANEL;

    ctx.fillStyle =
        "rgba(35,44,51,0.97)";

    roundedRect(
        ctx,
        panel.x,
        panel.y,
        panel.width,
        panel.height,
        10
    );

    ctx.fill();

    ctx.strokeStyle =
        "rgba(105,118,128,0.80)";

    ctx.lineWidth = 1.5;

    roundedRect(
        ctx,
        panel.x,
        panel.y,
        panel.width,
        panel.height,
        10
    );

    ctx.stroke();

    ctx.fillStyle =
        sequenceRunning
            ? COLOUR_ACTIVE
            : COLOUR_TEXT_DARK;

    roundedRect(
        ctx,
        panel.x + 13,
        panel.y + 11,
        4,
        18,
        2
    );

    ctx.fill();

    ctx.fillStyle =
        COLOUR_TEXT_SECONDARY;

    ctx.font =
        "bold 12px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "SEQUENCE CONTROL",
        panel.x + 26,
        panel.y + 20
    );

    /*
    Step number.
    */
    const stepInfoX =
        panel.x + 270;

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "10px Arial";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "STEP NO.",
        stepInfoX,
        panel.y + 20
    );

    ctx.fillStyle =
        COLOUR_TEXT_PRIMARY;

    ctx.font =
        "bold 16px Arial";

    ctx.fillText(
        String(
            sequenceStepNumber
        ),
        stepInfoX + 58,
        panel.y + 20
    );

    /*
    Step time.
    */
    const timeInfoX =
        panel.x + 390;

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "10px Arial";

    ctx.fillText(
        "STEP TIME",
        timeInfoX,
        panel.y + 20
    );

    ctx.fillStyle =
        COLOUR_TEXT_PRIMARY;

    ctx.font =
        "bold 15px Arial";

    ctx.fillText(
        formatStepTime(
            sequenceStepTimeSeconds
        ),
        timeInfoX + 67,
        panel.y + 20
    );

    /*
    Running status.
    */
    ctx.fillStyle =
        sequenceRunning
            ? COLOUR_ACTIVE
            : COLOUR_TEXT_DARK;

    ctx.font =
        "bold 10px Arial";

    ctx.textAlign =
        "right";

    ctx.fillText(
        sequenceRunning
            ? "RUNNING"
            : "STOPPED",
        panel.x +
        panel.width -
        15,
        panel.y + 20
    );

    /*
    Divider.
    */
    ctx.strokeStyle =
        "rgba(105,118,128,0.35)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        panel.x + 13,
        panel.y + 34
    );

    ctx.lineTo(
        panel.x +
        panel.width -
        13,
        panel.y + 34
    );

    ctx.stroke();

    drawSequenceButton(
        ctx,
        SEQUENCE_BUTTONS[0],
        COLOUR_ACTIVE,
        "rgba(34,197,94,0.17)",
        COLOUR_ACTIVE_DARK
    );

    drawSequenceButton(
        ctx,
        SEQUENCE_BUTTONS[1],
        COLOUR_STOP,
        "rgba(239,68,68,0.17)",
        COLOUR_STOP_DARK
    );

    drawSequenceButton(
        ctx,
        SEQUENCE_BUTTONS[2],
        COLOUR_RESET,
        "rgba(245,158,11,0.17)",
        COLOUR_RESET_DARK
    );

    /*
    Step message area.
    */
    const messageLabelX =
        panel.x + 265;

    const messageBoxX =
        panel.x + 355;

    const messageBoxY =
        panel.y + 47;

    const messageBoxWidth =
        panel.x +
        panel.width -
        messageBoxX -
        14;

    const messageBoxHeight = 36;

    ctx.fillStyle =
        COLOUR_TEXT_DARK;

    ctx.font =
        "bold 10px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "STEP MESSAGE",
        messageLabelX,
        messageBoxY +
        messageBoxHeight / 2
    );

    ctx.fillStyle =
        "rgba(29,37,44,0.95)";

    roundedRect(
        ctx,
        messageBoxX,
        messageBoxY,
        messageBoxWidth,
        messageBoxHeight,
        5
    );

    ctx.fill();

    ctx.strokeStyle =
        COLOUR_BORDER_SOFT;

    ctx.lineWidth = 1;

    roundedRect(
        ctx,
        messageBoxX,
        messageBoxY,
        messageBoxWidth,
        messageBoxHeight,
        5
    );

    ctx.stroke();
}


/*
============================================================
FOOTER
============================================================
*/

function drawFooter(ctx) {
    const footerY =
        DESIGN_HEIGHT -
        FOOTER_HEIGHT;

    ctx.fillStyle =
        COLOUR_FOOTER;

    ctx.fillRect(
        0,
        footerY,
        DESIGN_WIDTH,
        FOOTER_HEIGHT
    );

    ctx.strokeStyle =
        COLOUR_BORDER;

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        0,
        footerY + 0.5
    );

    ctx.lineTo(
        DESIGN_WIDTH,
        footerY + 0.5
    );

    ctx.stroke();

    ctx.fillStyle =
        COLOUR_TEXT_SECONDARY;

    ctx.font =
        "10px Arial";

    ctx.textAlign =
        "right";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "USER: " +
        operatorName,
        DESIGN_WIDTH - 19,
        footerY + 19
    );
}


/*
============================================================
MAIN DRAW
============================================================
*/

function drawFrame() {
    const actualWidth =
        canvas.width;

    const actualHeight =
        canvas.height;

    canvas.clearRect(
        0,
        0,
        actualWidth,
        actualHeight
    );

    if (
        actualWidth <= 0 ||
        actualHeight <= 0
    ) {
        return;
    }

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

    const scaledWidth =
        DESIGN_WIDTH *
        scaleFactor;

    const scaledHeight =
        DESIGN_HEIGHT *
        scaleFactor;

    const offsetX =
        (
            actualWidth -
            scaledWidth
        ) / 2;

    const offsetY =
        (
            actualHeight -
            scaledHeight
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

    canvas.fillStyle =
        COLOUR_BACKGROUND;

    canvas.fillRect(
        0,
        0,
        DESIGN_WIDTH,
        DESIGN_HEIGHT
    );

    drawHeader(canvas);
    drawNavigation(canvas);
    drawContentArea(canvas);
    drawSequencePanel(canvas);
    drawFooter(canvas);

    canvas.restore();
}


/*
============================================================
COORDINATE CONVERSION
============================================================
*/

function screenToDesignCoordinates(
    mouseX,
    mouseY
) {
    const actualWidth =
        canvas.width;

    const actualHeight =
        canvas.height;

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

    const scaledWidth =
        DESIGN_WIDTH *
        scaleFactor;

    const scaledHeight =
        DESIGN_HEIGHT *
        scaleFactor;

    const offsetX =
        (
            actualWidth -
            scaledWidth
        ) / 2;

    const offsetY =
        (
            actualHeight -
            scaledHeight
        ) / 2;

    return {
        x:
            (
                mouseX -
                offsetX
            ) /
            scaleFactor,

        y:
            (
                mouseY -
                offsetY
            ) /
            scaleFactor
    };
}


/*
============================================================
HIT TESTING
============================================================
*/

function getWindowAtPosition(
    designX,
    designY
) {
    for (
        let index = 0;
        index < navigationItems.length;
        index++
    ) {
        const geometry =
            getNavigationGeometry(index);

        const insideX =
            designX >= geometry.x &&
            designX <=
            geometry.x +
            geometry.width;

        const insideY =
            designY >= geometry.y &&
            designY <=
            geometry.y +
            geometry.height;

        if (
            insideX &&
            insideY
        ) {
            return navigationItems[index].window;
        }
    }

    return -1;
}


function getSequenceButtonAtPosition(
    designX,
    designY
) {
    for (
        let index = 0;
        index < SEQUENCE_BUTTONS.length;
        index++
    ) {
        const button =
            SEQUENCE_BUTTONS[index];

        const inside =
            designX >= button.x &&
            designX <=
            button.x +
            button.width &&
            designY >= button.y &&
            designY <=
            button.y +
            button.height;

        if (inside) {
            return button.id;
        }
    }

    return "";
}


/*
============================================================
PLC WRITE HELPERS
============================================================
*/

function writeAddress(
    address,
    value,
    description,
    callback
) {
    driver.setData(
        address,
        value,
        (err) => {
            if (err) {
                console.log(
                    description +
                    " error:",
                    err.message
                );

                return;
            }

            if (
                typeof callback ===
                "function"
            ) {
                callback();
            }
        }
    );
}


/*
============================================================
MAINTAINED START / STOP
============================================================
*/

function writeMaintainedSequenceCommand(
    startValue,
    stopValue
) {
    const startData =
        startValue ? 1 : 0;

    const stopData =
        stopValue ? 1 : 0;

    if (startValue) {
        writeAddress(
            ADDRESS_STOP_CMD,
            0,
            "Stop command clear",
            () => {
                writeAddress(
                    ADDRESS_START_CMD,
                    startData,
                    "Start command set"
                );
            }
        );

        return;
    }

    writeAddress(
        ADDRESS_START_CMD,
        0,
        "Start command clear",
        () => {
            writeAddress(
                ADDRESS_STOP_CMD,
                stopData,
                "Stop command set"
            );
        }
    );
}


/*
============================================================
RESET PULSE
============================================================
*/

function pulseResetCommand() {
    writeAddress(
        ADDRESS_RESET_CMD,
        1,
        "Reset command set",
        () => {
            setTimeout(
                () => {
                    writeAddress(
                        ADDRESS_RESET_CMD,
                        0,
                        "Reset command clear"
                    );
                },
                300
            );
        }
    );
}


/*
============================================================
TOUCH EVENTS
============================================================
*/

mouseArea.on(
    "mousedown",
    (mouseEvent) => {
        const designPosition =
            screenToDesignCoordinates(
                mouseEvent.x,
                mouseEvent.y
            );

        const sequenceButton =
            getSequenceButtonAtPosition(
                designPosition.x,
                designPosition.y
            );

        if (
            sequenceButton !== "" &&
            isSequenceButtonEnabled(
                sequenceButton
            )
        ) {
            sequencePressedButton =
                sequenceButton;

            pressedWindow = -1;

            drawFrame();

            return;
        }

        sequencePressedButton = "";

        pressedWindow =
            getWindowAtPosition(
                designPosition.x,
                designPosition.y
            );

        drawFrame();
    }
);


mouseArea.on(
    "mouseup",
    () => {
        pressedWindow = -1;
        sequencePressedButton = "";

        drawFrame();
    }
);


mouseArea.on(
    "click",
    (mouseEvent) => {
        const designPosition =
            screenToDesignCoordinates(
                mouseEvent.x,
                mouseEvent.y
            );

        const sequenceButton =
            getSequenceButtonAtPosition(
                designPosition.x,
                designPosition.y
            );

        if (
            sequenceButton !== ""
        ) {
            sequencePressedButton = "";

            if (
                !isSequenceButtonEnabled(
                    sequenceButton
                )
            ) {
                drawFrame();

                return;
            }

            switch (sequenceButton) {
                case "start":
                    writeMaintainedSequenceCommand(
                        true,
                        false
                    );
                    break;

                case "stop":
                    writeMaintainedSequenceCommand(
                        false,
                        true
                    );
                    break;

                case "reset":
                    pulseResetCommand();
                    break;
            }

            drawFrame();

            return;
        }

        const selectedWindow =
            getWindowAtPosition(
                designPosition.x,
                designPosition.y
            );

        pressedWindow = -1;

        if (
            selectedWindow < 0
        ) {
            drawFrame();

            return;
        }

        activeWindow =
            selectedWindow;

        drawFrame();

        writeAddress(
            ADDRESS_NAVIGATION,
            selectedWindow,
            "Window command write"
        );
    }
);


/*
============================================================
CURRENT WINDOW SUBSCRIPTION
============================================================
*/

CONFIG.activePageSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Current base window read error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            const value =
                Number(
                    data.values[0]
                );

            if (
                Number.isFinite(value)
            ) {
                activeWindow =
                    Math.round(value);

                pressedWindow = -1;

                drawFrame();
            }
        }
    }
);


/*
============================================================
SEQUENCE RUNNING SUBSCRIPTION
============================================================
*/

CONFIG.sequenceRunningSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Sequence running status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            sequenceRunning =
                Boolean(
                    data.values[0]
                );

            if (
                sequencePressedButton !== "" &&
                !isSequenceButtonEnabled(
                    sequencePressedButton
                )
            ) {
                sequencePressedButton = "";
            }

            drawFrame();
        }
    }
);


/*
============================================================
READY RESET SUBSCRIPTION
============================================================
*/

CONFIG.readyResetSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Ready reset status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            readyReset =
                Boolean(
                    data.values[0]
                );

            if (
                sequencePressedButton ===
                "reset" &&
                !isSequenceButtonEnabled(
                    "reset"
                )
            ) {
                sequencePressedButton = "";
            }

            drawFrame();
        }
    }
);


/*
============================================================
START COMMAND SUBSCRIPTION
============================================================
*/

CONFIG.startCmdSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Start command status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            startCommand =
                Boolean(
                    data.values[0]
                );

            drawFrame();
        }
    }
);


/*
============================================================
STOP COMMAND SUBSCRIPTION
============================================================
*/

CONFIG.stopCmdSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Stop command status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            stopCommand =
                Boolean(
                    data.values[0]
                );

            drawFrame();
        }
    }
);


/*
============================================================
RESET COMMAND SUBSCRIPTION
============================================================
*/

CONFIG.resetCmdSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Reset command status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            resetCommand =
                Boolean(
                    data.values[0]
                );

            drawFrame();
        }
    }
);


/*
============================================================
STEP NUMBER SUBSCRIPTION
============================================================
*/

CONFIG.stepNumberSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Step number status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            const value =
                Number(
                    data.values[0]
                );

            sequenceStepNumber =
                Number.isFinite(value)
                    ? Math.round(value)
                    : 0;

            drawFrame();
        }
    }
);


/*
============================================================
STEP TIME SUBSCRIPTION
============================================================
*/

CONFIG.stepTimeSub.onResponse(
    (err, data) => {
        if (err) {
            console.log(
                "Step time status error:",
                err.message
            );

            return;
        }

        if (
            data &&
            data.values &&
            data.values.length > 0
        ) {
            const value =
                Number(
                    data.values[0]
                );

            /*
            Store directly as seconds.
            No division by 1000.
            */
            sequenceStepTimeSeconds =
                Number.isFinite(value)
                    ? value
                    : 0;

            drawFrame();
        }
    }
);


/*
============================================================
INITIALISATION
============================================================
*/

updateClock();

clockTimer =
    setInterval(
        updateClock,
        1000
    );