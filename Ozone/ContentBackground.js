/*
============================================================
OZONE CONTROL - CONTENT BACKGROUND
Weintek EasyBuilder Pro JS Object

Object size: 842 x 514 px
Place at: x = 182, y = 48

Configuration:
    pageTitle      fallback title when no subscription is set
    activePageSub  current EasyBuilder page/window number

Keep this object behind all page content and the sequence
control object in the EasyBuilder Pro object order.
============================================================
*/

var canvas = new Canvas();
this.widget.add(canvas);

var DESIGN_WIDTH = 842;
var DESIGN_HEIGHT = 514;
var BACKGROUND_COLOUR = "#1D252C";
var config = this.config || {};
var configuredTitle = config.pageTitle || "OVERVIEW";
var activeWindow = null;

var pageNames = {
    10: "OVERVIEW",
    11: "OZONE",
    12: "STACK FAN",
    13: "COOLING TOWER",
    14: "SETTINGS",
    15: "TRENDS",
    16: "ALARMS"
};

function getPageTitle() {
    return activeWindow !== null && pageNames[activeWindow]
        ? pageNames[activeWindow]
        : configuredTitle;
}

function draw() {
    var width = canvas.width;
    var height = canvas.height;

    canvas.clearRect(0, 0, width, height);

    if (width <= 0 || height <= 0) {
        return;
    }

    canvas.fillStyle = BACKGROUND_COLOUR;
    canvas.fillRect(0, 0, width, height);

    var scaleX = width / DESIGN_WIDTH;
    var scaleY = height / DESIGN_HEIGHT;

    canvas.save();
    canvas.scale(scaleX, scaleY);

    canvas.fillStyle = "#232C33";
    canvas.fillRect(0, 0, DESIGN_WIDTH, 32);

    canvas.strokeStyle = "#44515A";
    canvas.lineWidth = 1;
    canvas.beginPath();
    canvas.moveTo(0, 31.5);
    canvas.lineTo(DESIGN_WIDTH, 31.5);
    canvas.stroke();

    canvas.fillStyle = "#22C55E";
    canvas.fillRect(12, 9, 4, 14);

    canvas.fillStyle = "#D9E1E6";
    canvas.font = "bold 13px Arial";
    canvas.textAlign = "left";
    canvas.textBaseline = "middle";
    canvas.fillText(getPageTitle(), 26, 16);

    canvas.restore();
}

if (
    config.activePageSub &&
    typeof config.activePageSub.onResponse === "function"
) {
    config.activePageSub.onResponse(function (error, data) {
        if (error) {
            console.log(
                "Content background active page error: " +
                String(error.message || error)
            );
            return;
        }

        if (data && data.values && data.values.length > 0) {
            var pageValue = Number(data.values[0]);

            if (isFinite(pageValue)) {
                activeWindow = Math.round(pageValue);
                draw();
            }
        }
    });
}

draw();
