/*
============================================================
POLYMER UNIT - STATIC MIXER
Weintek EasyBuilder Pro JS Object

Design size: 180 x 120 px
Standalone equipment object - no pipeline is drawn.
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 180;
var DESIGN_HEIGHT = 120;

var config = this.config || {};
var mixerName = config.mixerName || "STATIC MIXER";
var mixerTag = config.mixerTag || "MX-101";

var colour = {
    surface: "#FFFFFF",
    border: "#A9B6BD",
    text: "#2B3A43",
    muted: "#71808A",
    element: "#6F7D85",
    elementSoft: "#E8ECEF"
};

function drawMixer(ctx) {
    var x = 43;
    var y = 43;
    var width = 94;
    var height = 37;

    ctx.fillStyle = colour.elementSoft;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = colour.element;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    /*
    Alternating internal baffles.
    */
    ctx.strokeStyle = colour.element;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 7);
    ctx.lineTo(x + 24, y + height - 7);
    ctx.lineTo(x + 40, y + 7);
    ctx.lineTo(x + 56, y + height - 7);
    ctx.lineTo(x + 72, y + 7);
    ctx.lineTo(x + 86, y + height - 7);
    ctx.stroke();

    ctx.fillStyle = colour.surface;
    ctx.strokeStyle = colour.element;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 6, y + 8, 6, height - 16);
    ctx.strokeRect(x - 6, y + 8, 6, height - 16);
    ctx.fillRect(x + width, y + 8, 6, height - 16);
    ctx.strokeRect(x + width, y + 8, 6, height - 16);
}

function drawMixerObject(ctx) {
    ctx.fillStyle = colour.text;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mixerName, 90, 18);

    ctx.fillStyle = colour.muted;
    ctx.font = "9px Arial";
    ctx.fillText(mixerTag, 90, 96);

    drawMixer(ctx);
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;

    canvas.clearRect(0, 0, width, height);

    if (width <= 0 || height <= 0) {
        return;
    }

    var scale = Math.min(
        width / DESIGN_WIDTH,
        height / DESIGN_HEIGHT
    );

    canvas.save();
    canvas.translate(
        (width - DESIGN_WIDTH * scale) / 2,
        (height - DESIGN_HEIGHT * scale) / 2
    );
    canvas.scale(scale, scale);
    drawMixerObject(canvas);
    canvas.restore();
}

draw();
