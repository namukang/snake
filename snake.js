var kPixelWidth;
var kPixelHeight;
var kScoreHeight = 40;
var kBoxSide = 20;
var kLoopInterval = 125;
var kLineColor = "#ccc";
var kIncrement = 3;
var kSwipeThreshold = 5;

var gDrawingContext;
var gGameController;
var gTouchManager;
var gScoreboard;
var gSnake;
var gFood;

var UP = 0;
var RIGHT = 1;
var DOWN = 2;
var LEFT = 3;

window.onload = function() {
  // get viewport size
  kPixelWidth = document.documentElement.clientWidth;
  kPixelHeight = document.documentElement.clientHeight;

  // round to nearest box border
  kPixelWidth = Math.floor(kPixelWidth / kBoxSide) * kBoxSide;
  kPixelHeight = Math.floor(kPixelHeight / kBoxSide) * kBoxSide;

  gGameController = new GameController();
  gGameController.initGame();
};

function Point(x, y) {
  this.x = x;
  this.y = y;
  this.intersects = function(pt) {
    return (this.x === pt.x && this.y === pt.y);
  }
}

function Snake() {
  // head of snake is last element of this.body
  this.body = []
  this.bodyColor = "red";
  this.headColor = "green";
  this.getHead = function() {
    if (this.body.length == 0) {
      return null;
    } else {
      return this.body[this.body.length-1];
    }
  }
  this.direction = null;
  this.numAdd = 0;
  this.move = function() {
    var xDiff = 0;
    var yDiff = 0;
    switch (this.direction) {
    case UP:
      yDiff = -kBoxSide;
      break;
    case RIGHT:
      xDiff = kBoxSide;
      break;
    case DOWN:
      yDiff = kBoxSide;
      break;
    case LEFT:
      xDiff = -kBoxSide;
      break;
    }
    var curHead = this.getHead();
    var newHead = new Point(curHead.x + xDiff, curHead.y + yDiff);
    if (this.isDead(newHead)) {
      gGameController.endGame();
    } else {
      this.body.push(newHead);
      this.checkForFood();
      if (this.numAdd > 0) {
        this.numAdd -= 1;
      } else {
        var tail = this.body.shift();
        gDisplayManager.eraseBox(tail);
      }
      this.draw();
      // snake can now change directions
      document.addEventListener('touchmove', gTouchManager.touchmove);
    }
  }
  this.isDead = function(newHead) {
    var outsideBoundaries = (newHead.x < 0 ||
                             newHead.y < kScoreHeight ||
                             newHead.x == kPixelWidth ||
                             newHead.y == kPixelHeight);
    var selfCollision = this.contains(newHead);
    return (outsideBoundaries || selfCollision);
  }
  this.checkForFood = function() {
    if (this.getHead().intersects(gFood.location)) {
      this.numAdd += kIncrement;
      gDisplayManager.eraseBox(gFood.location);
      gScoreboard.score += 1;
      gScoreboard.updateScore();
      gFood.generate();
    }
  }
  this.contains = function(pt) {
    for (var i = 0; i < this.body.length; i++) {
      var snakePt = this.body[i];
      if (pt.intersects(snakePt)) {
        return true;
      }
    }
    return false;
  }
  this.draw = function() {
    gDrawingContext.fillStyle = this.bodyColor;
    for (var i = 0; i < this.body.length - 1; i++) {
      gDisplayManager.drawBox(this.body[i]);
    }
    gDrawingContext.fillStyle = this.headColor;
    gDisplayManager.drawBox(this.getHead());
  }
}

function Food() {
  this.location = null;
  this.color = "blue";
  this.generate = function() {
    var numBoxesWidth = Math.floor(kPixelWidth / kBoxSide);
    var numBoxesHeight = Math.floor((kPixelHeight - kScoreHeight) / kBoxSide);
    do {
      var randWidth = Math.floor(Math.random() * numBoxesWidth);
      var randHeight = Math.floor(Math.random() * numBoxesHeight);
      var randX = randWidth * kBoxSide;
      var randY = kScoreHeight + randHeight * kBoxSide;
      var randPt = new Point(randX, randY);
    } while (gSnake.contains(randPt));

    this.location = randPt;
    this.draw();
  }
  this.draw = function() {
    gDrawingContext.fillStyle = this.color;
    gDisplayManager.drawBox(this.location);
  }
}

function GameController() {
  this.gameOver = false;
  this.initGame = function() {
    gScoreboard = new Scoreboard();

    var canvasElement = document.createElement("canvas");
    canvasElement.id = "canvas";
    document.body.appendChild(canvasElement);

    canvasElement.width = kPixelWidth;
    canvasElement.height = kPixelHeight;

    gTouchManager = new TouchManager();
    document.addEventListener('touchstart', gTouchManager.touchstart);
    document.addEventListener('touchmove', gTouchManager.touchmove);

    gDisplayManager = new DisplayManager();

    gDrawingContext = canvasElement.getContext("2d");

    var self = this;
    setInterval(function() { self.update(); }, kLoopInterval);
    this.newGame();
  }
  this.newGame = function() {
    gSnake = new Snake();
    gSnake.body.push(new Point(5 * kBoxSide, kScoreHeight + 5 * kBoxSide));
    gSnake.direction = RIGHT;
    gDisplayManager.drawBoard();
    gSnake.draw();
    gFood = new Food();
    gFood.generate();
    gScoreboard.score = 0;
    gScoreboard.updateScore();
    this.gameOver = false;
  }
  this.update = function() {
    if (!this.gameOver) {
      gSnake.move();
    }
  }
  this.endGame = function() {
    this.gameOver = true;
    var setNewTopScore = gScoreboard.submitScore();
    this.showFinalScore(setNewTopScore);
  }
  this.showFinalScore = function(topScoreChanged) {
    gDrawingContext.fillStyle = "black";
    gDrawingContext.fillRect(kPixelWidth / 4,
                             kPixelHeight / 4,
                             kPixelWidth / 2,
                             kPixelHeight / 6);

    gDrawingContext.fillStyle = "gray";
    gDrawingContext.fillRect(kPixelWidth / 4 + 30,
                             kPixelHeight / 4 + 60,
                             kPixelWidth / 2 - 60,
                             40);

    gDrawingContext.fillStyle = "white";
    gDrawingContext.textBaseline = "top";
    gDrawingContext.textAlign = "center";

    gDrawingContext.font = "bold 18px sans-serif";
    var scoreText = "Final Score: ";
    if (topScoreChanged) {
      gDrawingContext.fillStyle = "red";
      scoreText = "New Top Score: ";
    }
    gDrawingContext.fillText(scoreText + gScoreboard.score,
                             kPixelWidth / 2,
                             kPixelHeight / 4 + 20);

    gDrawingContext.fillStyle = "white";
    gDrawingContext.font = "bold 16px sans-serif";
    gDrawingContext.fillText("Tap To Play",
                             kPixelWidth / 2,
                             kPixelHeight / 4 + 70);
  }
}

function Scoreboard() {
  this.score = 0;
  this.supportsLocalStorage = ('localStorage' in window &&
                               window['localStorage'] !== null);
  this.storage = window['localStorage'];
  this.getTopScore = function() {
    if (this.supportsLocalStorage) {
      if ("snake.top" in this.storage) {
        return this.storage["snake.top"];
      } else {
        return 0;
      }
    }
    return null;
  }
  this.submitScore = function() {
    if (this.supportsLocalStorage && this.score > this.getTopScore()) {
      this.storage["snake.top"] = this.score;
      return true;
    }
    return false;
  }
  this.updateScore = function() {
    gDrawingContext.clearRect(10, 10, kPixelWidth, 20);

    gDrawingContext.fillStyle = "black";
    gDrawingContext.font = "bold 20px sans-serif";
    gDrawingContext.textBaseline = "top";
    gDrawingContext.textAlign = "left";
    gDrawingContext.fillText("Score: " + this.score, 10, 10);

    if (this.supportsLocalStorage) {
      gDrawingContext.textAlign = "right";
      gDrawingContext.fillText("Top Score: " + this.getTopScore(), kPixelWidth - 10, 10);
    }
  }

}

function DisplayManager() {
  this.drawBoard = function() {
    gDrawingContext.clearRect(0, 0, kPixelWidth, kPixelHeight);

    gDrawingContext.beginPath();

    // vertical lines
    for (var x = 0; x <= kPixelWidth; x += kBoxSide) {
      gDrawingContext.moveTo(x, kScoreHeight);
      gDrawingContext.lineTo(x, kPixelHeight);
    }

    // horizontal lines
    for (var y = kScoreHeight; y <= kPixelHeight; y += kBoxSide) {
      gDrawingContext.moveTo(0, y);
      gDrawingContext.lineTo(kPixelWidth, y);
    }

    // draw board
    gDrawingContext.strokeStyle = kLineColor;
    gDrawingContext.stroke();
  }
  this.drawBox = function(pt) {
    gDrawingContext.fillRect(pt.x, pt.y, kBoxSide, kBoxSide);
  }
  this.eraseBox = function(pt) {
    gDrawingContext.strokeStyle = kLineColor;
    gDrawingContext.clearRect(pt.x, pt.y, kBoxSide, kBoxSide);
    gDrawingContext.strokeRect(pt.x, pt.y, kBoxSide, kBoxSide);
  }
}

function TouchManager() {
  this.oldPoint = null;
  this.touchstart = function(e) {
    gTouchManager.oldPoint = gTouchManager.getCursorPosition(e);

    // listen for replay if game is over
    if (gTouchManager.oldPoint !== null && gGameController.gameOver) {
      var xBoxStart = (kPixelWidth / 4 + 30);
      var xBoxEnd = xBoxStart + (kPixelWidth / 2 - 60);

      var yBoxStart = (kPixelHeight / 4 + 60);
      var yBoxEnd = yBoxStart + 40;

      var inBox = (gTouchManager.oldPoint.x > xBoxStart &&
                   gTouchManager.oldPoint.x < xBoxEnd &&
                   gTouchManager.oldPoint.y > yBoxStart &&
                   gTouchManager.oldPoint.y < yBoxEnd);
      if (inBox) {
        gGameController.newGame();
      }
    }
  }
  this.touchmove = function(e) {
    // snake must move at least once before changing direction again
    document.removeEventListener('touchmove', gTouchManager.touchmove);

    var newPoint = gTouchManager.getCursorPosition(e);
    if (newPoint === null) {
      return;
    }
    var xDiff = newPoint.x - gTouchManager.oldPoint.x;
    var yDiff = newPoint.y - gTouchManager.oldPoint.y;

    var xAbsDiff = Math.abs(xDiff);
    var yAbsDiff = Math.abs(yDiff);

    var swipeTooSmall = xAbsDiff < kSwipeThreshold && yAbsDiff < kSwipeThreshold;
    if (swipeTooSmall) {
      return;
    }

    gSnake.direction = gTouchManager.getDirection(xDiff, yDiff);
    gTouchManager.oldPoint = newPoint;
  }
  this.getDirection = function(xDiff, yDiff) {
    var xAbsDiff = Math.abs(xDiff);
    var yAbsDiff = Math.abs(yDiff);

    if (xAbsDiff > yAbsDiff) {
      if (xDiff > 0) {
        if (gSnake.direction !== LEFT) {
          return RIGHT;
        }
      } else {
        if (gSnake.direction !== RIGHT) {
          return LEFT;
        }
      }
    } else {
      if (yDiff > 0) {
        if (gSnake.direction !== UP) {
          return DOWN;
        }
      } else {
        if (gSnake.direction !== DOWN) {
          return UP;
        }
      }
    }
    return gSnake.direction;
  }
  this.getCursorPosition = function(e) {
    if (e.touches === undefined) {
      return null;
    }
    var x = e.touches[0].pageX;
    var y = e.touches[0].pageY;
    return new Point(x, y);
  }
}
