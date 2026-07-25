/*
============================================================
POLYMER UNIT - HEADER
Weintek EasyBuilder Pro JS Object

Object size: 1024 x 35 px
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 1024;
var DESIGN_HEIGHT = 35;

var config = this.config || {};
var projectTitle = config.projectTitle || "POLYMER UNIT";
var siteName = config.siteName || "PROCESS CONTROL";

var colour = {
    background: "#FFFFFF",
    line: "#DCE4EA",
    primary: "#22313A",
    secondary: "#71808A",
    accent: "#0F9D8A",
    accentSoft: "#DDF4F0"
};

var dateText = "";
var timeText = "";

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

    ctx.fillStyle = colour.accentSoft;
    ctx.beginPath();
    ctx.arc(20, 17.5, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colour.accent;
    ctx.beginPath();
    ctx.arc(20, 17.5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colour.primary;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(projectTitle, 40, 17.5);

    var titleWidth = ctx.measureText(projectTitle).width;

    ctx.fillStyle = colour.secondary;
    ctx.font = "10px Arial";
    ctx.fillText(siteName, 54 + titleWidth, 18);

    ctx.textAlign = "right";
    ctx.font = "11px Arial";
    ctx.fillText(
        dateText + "   " + timeText,
        DESIGN_WIDTH - 16,
        17.5
    );

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, DESIGN_HEIGHT - 0.5);
    ctx.lineTo(DESIGN_WIDTH, DESIGN_HEIGHT - 0.5);
    ctx.stroke();
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
    drawHeader(canvas);
    canvas.restore();
}

updateClock();
setInterval(updateClock, 1000);
