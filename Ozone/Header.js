/*
============================================================
OZONE CONTROL - HEADER
Weintek EasyBuilder Pro JS Object

Object size: 1024 x 48 px
Configuration: projectTitle, siteName
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 1024;
var DESIGN_HEIGHT = 48;
var config = this.config || {};
var projectTitle = config.projectTitle || "OZONE CONTROL SYSTEM";
var siteName = config.siteName || "PROCESS PLANT";
var dateText = "";
var timeText = "";

var colour = {
    background: "#232C33",
    border: "#56636C",
    primary: "#D9E1E6",
    secondary: "#A1ADB6",
    muted: "#7F8B94",
    active: "#22C55E"
};

function padTwo(value) {
    return value < 10 ? "0" + value : String(value);
}

function updateClock() {
    var now = new Date();
    dateText =
        padTwo(now.getDate()) + "/" +
        padTwo(now.getMonth() + 1) + "/" +
        now.getFullYear();
    timeText =
        padTwo(now.getHours()) + ":" +
        padTwo(now.getMinutes()) + ":" +
        padTwo(now.getSeconds());
    draw();
}

function drawHeader(ctx) {
    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.strokeStyle = colour.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, DESIGN_HEIGHT - 0.5);
    ctx.lineTo(DESIGN_WIDTH, DESIGN_HEIGHT - 0.5);
    ctx.stroke();

    ctx.strokeStyle = colour.active;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(25, DESIGN_HEIGHT / 2, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = colour.active;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("O\u2083", 25, DESIGN_HEIGHT / 2);

    ctx.fillStyle = colour.primary;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(projectTitle, 50, DESIGN_HEIGHT / 2);

    var titleWidth = ctx.measureText(projectTitle).width;
    ctx.fillStyle = colour.muted;
    ctx.font = "11px Arial";
    ctx.fillText(siteName, 68 + titleWidth, DESIGN_HEIGHT / 2 + 1);

    ctx.fillStyle = colour.secondary;
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
        dateText + "  " + timeText,
        DESIGN_WIDTH - 20,
        DESIGN_HEIGHT / 2
    );
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
    drawHeader(canvas);
    canvas.restore();
}

updateClock();
setInterval(updateClock, 1000);
