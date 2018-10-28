var arrowCanvas = $('#arrowCanvas');
var arrowCanvasDOM = document.getElementById('arrowCanvas');
var context = arrowCanvasDOM.getContext('2d');
context.strokeStyle = '#000000';
context.fillStyle = '#000000';

var _lightGreenStr = '#16D754';
var _lightRedStr = '#FF4141';

var arrowHeadLength = 20;
var circleLineWidth = 1;
var arrowLineWidth = 6;

// The radius of normal circles
var normalCircleRadius = 10;

var mouseHeldDown = false;

var initialMouseX;
var initialMouseY;

// touchend doesn't provide coordinates, so we have to use the last stored touch event instead
var lastTouchMove = null;

var hostname = 'https://twitchplayshs.xyz/web-client';

// We draw a circle when the lineLength is below this value
var minLineLength = 40;


$(document).ready(function() {

    $(window).resize(function() {
        positionCanvasOverStream();
    });

     var socket = io.connect(hostname);

     socket.on('connect', function() {
     $('#netStatus').css('background', _lightGreenStr);
     });

     socket.on('disconnect', function() {
     $('#netStatus').css('background', _lightRedStr);
     });

    if ('ontouchstart' in window){
        $(arrowCanvasDOM).on('touchstart', function(event) {
            lastTouchMove = event.originalEvent.touches[0];
            handleMouseDown(event.originalEvent.touches[0]);
        });

        $(document).on('touchmove', function(event) {
            lastTouchMove = event.originalEvent.touches[0];
            handleMouseMove(event.originalEvent.touches[0]);
        });

        $(document).on('touchend', function(event) {
            handleMouseUp(lastTouchMove);
        });
    }

    // Normal event listeners should get added in any case (e.g. hybrid tablets)
    $(document).on('mousedown', function(event) {
        handleMouseDown(event);
    });

    $(document).on('mousemove', function(event) {
        handleMouseMove(event);
    });

    $(document).on('mouseup', function(event) {
        handleMouseUp(event);
    });

    positionCanvasOverStream();

    function handleMouseDown(event) {
        context.clearRect(0, 0, arrowCanvasDOM.width, arrowCanvasDOM.height);
        initialMouseX = event.pageX;
        initialMouseY = event.pageY;
        drawCircle(initialMouseX, initialMouseY, normalCircleRadius, true);
        drawCircle(initialMouseX, initialMouseY, minLineLength, false);
        mouseHeldDown = true;
    }

    function handleMouseMove(event) {
        if (mouseHeldDown) {
            context.clearRect(0, 0, arrowCanvasDOM.width, arrowCanvasDOM.height);

            // Check if the mouse is outside the minLineLength circle
            if (Math.abs(event.pageX - initialMouseX) > minLineLength || Math.abs(event.pageY - initialMouseY) > minLineLength) {
                drawArrow(initialMouseX, initialMouseY, event.pageX, event.pageY);
            } else {
                // Inner circle
                drawCircle(initialMouseX, initialMouseY, normalCircleRadius, true);

                // Outer circle
                drawCircle(initialMouseX, initialMouseY, minLineLength, false);
            }
        }
    }

    function handleMouseUp(event) {
        // Check that the input wasn't canceled in the meantime
        if(mouseHeldDown) {
            var circle;
            mouseHeldDown = false;

            context.clearRect(0, 0, arrowCanvasDOM.width, arrowCanvasDOM.height);

            // Check if the mouse is outside the minLineLength circle
            if (Math.abs(event.pageX - initialMouseX) > minLineLength || Math.abs(event.pageY - initialMouseY) > minLineLength) {
                circle = false;
            } else {
                // Save initial mouse data as the data to send
                event.pageX = initialMouseX;
                event.pageY = initialMouseY;

                circle = true;
            }

            // Normalize line data (0-1)
            var initialXNormalized = initialMouseX / arrowCanvasDOM.width;
            var initialYNormalized = initialMouseY / arrowCanvasDOM.height;
            var xNormalized = event.pageX / arrowCanvasDOM.width;
            var yNormalized = event.pageY / arrowCanvasDOM.height;

            // Keyboard presses should not be used for twitch extensions
            // So we give the user the option to cancel his input by dragging outside of the stream window
            var maxInputValue = Math.max(initialXNormalized, initialYNormalized, xNormalized, yNormalized);
            var minInputValue = Math.min(initialXNormalized, initialYNormalized, xNormalized, yNormalized);

            if(maxInputValue > 1 || minInputValue < 0) {
                // Don't send the input
            } else {
                socket.emit('userInput', {line: [initialXNormalized, initialYNormalized, xNormalized, yNormalized, circle]});
            }
        }
    }
});

function positionCanvasOverStream() {
    arrowCanvasDOM.width = arrowCanvas.width();
    arrowCanvasDOM.height = arrowCanvas.height();
}

function drawCircle(xpos, ypos, circleRadius, fill) {
    context.lineWidth = circleLineWidth;
    context.beginPath();
    context.arc(xpos, ypos, circleRadius, 0, 2 * Math.PI);
    context.stroke();

    if (fill) {
        context.fill();
    }
}

function drawArrow(fromx, fromy, tox, toy) {
    drawCircle(fromx, fromy, normalCircleRadius, true);

    context.lineWidth = arrowLineWidth;
    var angle = Math.atan2(toy - fromy, tox - fromx);

    //starting path of the arrow from the start square to the end square and drawing the stroke
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    context.beginPath();
    context.moveTo(tox, toy);
    context.lineTo(tox - (arrowHeadLength * Math.cos(angle + Math.PI / 7)), toy - (arrowHeadLength * Math.sin(angle + Math.PI / 7)));
    context.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    context.beginPath();
    context.moveTo(tox, toy);
    context.lineTo(tox - (arrowHeadLength * Math.cos(angle - Math.PI / 7)), toy - (arrowHeadLength * Math.sin(angle - Math.PI / 7)));

    context.stroke();
}