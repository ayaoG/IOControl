/*
============================================================
POLYMER UNIT - CONTENT BACKGROUND
Weintek EasyBuilder Pro JS Object

Object size: 874 x 530 px
Place at: x = 150, y = 35

Keep this object behind all page-content objects.
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 874;
var DESIGN_HEIGHT = 530;

var colour = {
    background: "#F7F9FA"
};

function drawBackground(ctx) {
    ctx.fillStyle = colour.background;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
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
    drawBackground(canvas);
    canvas.restore();
}

draw();
