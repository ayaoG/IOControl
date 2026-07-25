/*
============================================================
POLYMER UNIT - FOOTER
Weintek EasyBuilder Pro JS Object

Object size: 1024 x 35 px
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 1024;
var DESIGN_HEIGHT = 35;

var config = this.config || {};
var footerText = config.footerText || "POLYMER PROCESS CONTROL";
var operatorName = config.operatorName || "OPERATOR";
var revision = config.revision || "REV 1.0";

var colour = {
    background: "#F7F9FA",
    line: "#DCE4EA",
    primary: "#35454F",
    secondary: "#7A8992",
    accent: "#0F9D8A"
};

function drawFooter(ctx) {
    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.strokeStyle = colour.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.lineTo(DESIGN_WIDTH, 0.5);
    ctx.stroke();

    ctx.fillStyle = colour.accent;
    ctx.fillRect(16, 14, 6, 6);

    ctx.fillStyle = colour.primary;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(footerText, 30, 17.5);

    ctx.fillStyle = colour.secondary;
    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
        "USER: " + operatorName + "   |   " + revision,
        DESIGN_WIDTH - 16,
        17.5
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
    canvas.scale(
        width / DESIGN_WIDTH,
        height / DESIGN_HEIGHT
    );
    drawFooter(canvas);
    canvas.restore();
}

draw();
