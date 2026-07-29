/*
POLYMER UNIT - SETTINGS CONTENT BACKGROUND
Object size: 865 x 370 px
Place at: x=150, y=35
Keep behind all Settings content objects.
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 865;
var DESIGN_HEIGHT = 370;
var BACKGROUND_COLOUR = "#F7F9FA";
var OUTLINE_COLOUR = "#DCE4EA";
var TITLE_COLOUR = "#2B3A43";
var ACCENT_COLOUR = "#0F9D8A";
var PAGE_NAME = "SETTINGS";

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

function drawHeaderFade(ctx) {
    var fadeWidth = 420;
    var stripWidth = 3;
    var x;

    for (x = 8; x < fadeWidth; x += stripWidth) {
        var ratio = Math.min(1, (x - 8) / (fadeWidth - 8));
        var red = Math.round(221 + (247 - 221) * ratio);
        var green = Math.round(244 + (249 - 244) * ratio);
        var blue = Math.round(240 + (250 - 240) * ratio);

        ctx.fillStyle =
            "rgb(" + red + "," + green + "," + blue + ")";
        ctx.fillRect(x, 1, stripWidth, 34);
    }
}

function drawBackground(ctx) {
    ctx.fillStyle = BACKGROUND_COLOUR;
    roundedRect(ctx, 0.5, 0.5, DESIGN_WIDTH - 1, DESIGN_HEIGHT - 1, 8);
    ctx.fill();

    drawHeaderFade(ctx);

    ctx.fillStyle = ACCENT_COLOUR;
    ctx.fillRect(10, 8, 4, 18);

    ctx.fillStyle = TITLE_COLOUR;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(PAGE_NAME, 22, 17);

    ctx.strokeStyle = OUTLINE_COLOUR;
    ctx.lineWidth = 1;
    roundedRect(ctx, 0.5, 0.5, DESIGN_WIDTH - 1, DESIGN_HEIGHT - 1, 8);
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
    canvas.scale(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    drawBackground(canvas);
    canvas.restore();
}

draw();
