/*
============================================================
OZONE CONTROL - FOOTER
Weintek EasyBuilder Pro JS Object

Object size: 1024 x 38 px
Configuration: operatorName
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 1024;
var DESIGN_HEIGHT = 38;
var config = this.config || {};
var operatorName = config.operatorName || "OPERATOR";

function draw() {
    var width = canvas.width;
    var height = canvas.height;
    canvas.clearRect(0, 0, width, height);
    if (width <= 0 || height <= 0) {
        return;
    }

    canvas.save();
    canvas.scale(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    canvas.fillStyle = "#232C33";
    canvas.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    canvas.strokeStyle = "#56636C";
    canvas.lineWidth = 1;
    canvas.beginPath();
    canvas.moveTo(0, 0.5);
    canvas.lineTo(DESIGN_WIDTH, 0.5);
    canvas.stroke();
    canvas.fillStyle = "#A1ADB6";
    canvas.font = "10px Arial";
    canvas.textAlign = "right";
    canvas.textBaseline = "middle";
    canvas.fillText(
        "USER: " + operatorName,
        DESIGN_WIDTH - 19,
        DESIGN_HEIGHT / 2
    );
    canvas.restore();
}

draw();
