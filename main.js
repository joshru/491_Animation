function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, drawY, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.drawY = drawY;
    this.frameDuration = frameDuration;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1; //sets scaleBy to 1 if it is 0 or null ("falsey")
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
    if (this.isDone()) this.elapsedTime = 0;
};

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
};

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
};

function Background(game) {
    //first param tells the entity to attach this call to the background object
    Entity.call(this, game, 0, 400);
    this.radius = 200;
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
};

Background.prototype.draw = function (ctx) {
    ctx.fillStyle = "#173A15";
    ctx.fillRect(0,500,800,300);
    Entity.prototype.draw.call(this);
};

function Unicorn(game) {
    this.animation = new Animation(ASSET_MANAGER.getAsset("./img/RobotUnicorn.png"), 0, 0, 206, 110, 0.02, 30, true, false);
    this.jumpAnimation = new Animation(ASSET_MANAGER.getAsset("./img/RobotUnicorn.png"), 618, 334, 174, 138, 0.02, 40, false, true);
    this.jumping = false;
    this.radius = 100;
    this.ground = 300;
    Entity.call(this, game, 0, 300);
}

Unicorn.prototype = new Entity();
Unicorn.prototype.constructor = Unicorn;

Unicorn.prototype.update = function () {
    if (this.game.space) this.jumping = true;
    if (this.jumping) {
        if (this.jumpAnimation.isDone()) {
            this.jumpAnimation.elapsedTime = 0;
            this.jumping = false;
        }
        var jumpDistance = this.jumpAnimation.elapsedTime / this.jumpAnimation.totalTime;
        var totalHeight = 200;

        if (jumpDistance > 0.5)
            jumpDistance = 1 - jumpDistance;

        //var height = jumpDistance * 2 * totalHeight;
        var height = totalHeight*(-4 * (jumpDistance * jumpDistance - jumpDistance));
        this.y = this.ground - height;
    }
    Entity.prototype.update.call(this);
};

Unicorn.prototype.draw = function (ctx) {
    if (this.jumping) {
        this.jumpAnimation.drawFrame(this.game.clockTick, ctx, this.x + 17, this.y - 34);
    }
    else {
        this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    }
    Entity.prototype.draw.call(this);
};
function Snake(game) {
    this.game = game;
    //store all our animations in Snake so we don't have to make new ones all the time
    this.animations = {};
    //                                                           sprite sheet path            X      Y     W     H     D    Dur  #  loop   reverse
    this.animations.idle = new Animation(ASSET_MANAGER.getAsset("./img/snake.png"),           18,    81,   32,   52,   448, 0.1, 1, true,  false);
    this.animations.runRight = new Animation(ASSET_MANAGER.getAsset("./img/snake.png"),       10,    143,  35.5, 49,   451, 0.1, 6, true,  false);
    this.animations.runLeft = new Animation(ASSET_MANAGER.getAsset("./img/snake_rev.png"),    331.5, 143,  35.5, 49,   451, 0.1, 6, true,  true);
    this.animations.enterBox = new Animation(ASSET_MANAGER.getAsset("./img/snake.png"),       65,    1763, 43,   67,   448, 0.1, 8, false, false);
    this.animations.exitBox = new Animation(ASSET_MANAGER.getAsset("./img/snake.png"),        22,    1859, 42,   57,   448, 0.1, 6, false, false);
    this.animations.inBoxIdle = new Animation(ASSET_MANAGER.getAsset("./img/snake.png"),      388,   1801, 41,   27.5, 473, 0.1, 1, true,  false);
    this.animations.boxRunLeft = new Animation(ASSET_MANAGER.getAsset("./img/snake_rev.png"), 137,   1920, 42,   46,   454, 0.1, 6, true,  true);
    this.animations.boxRunRight = new Animation(ASSET_MANAGER.getAsset("./img/snake.png"),    167,   1920, 42,   46,   454, 0.1, 6, true,  false);
    this.animation = this.animations.idle;
    //this.boxAnimation =
    this.idle = true;
    this.enteringBox = false;
    this.exitingBox = false;
    this.inBox = false;
    this.movingLeft = false;
    this.movingRight = false;
    this.radius = 100;
    this.ground = 448;
    Entity.call(this, game, 0, this.ground);
}
Snake.prototype = new Entity();
Snake.prototype.constructor = Snake;

Snake.prototype.update = function() {
    console.log("idle: " + this.idle + " | move left: " + this.movingLeft + " | move right: " + this.movingRight + " | entering box: " + this.enteringBox + " | in box: " + this.inBox + " | exiting box: " + this.exitingBox);
    if (Key.isDown(Key.LEFT)) {
        if (!this.movingLeft) {
            this.idle ^= true;
            this.movingLeft = true;
            this.movingRight = false;
            if (!this.inBox) {
                this.animation = this.animations.runLeft;
                this.y = this.animation.drawY;
                console.log(this.y);
            } else {
                this.animation = this.animations.boxRunLeft;
                this.y = this.animation.drawY;
                console.log(this.y);
            }

            //this.ground = 451;
        }
        this.moveLeft();
        Entity.prototype.draw.call(this);
    } else if (Key.isDown(Key.RIGHT)) {
        if (!this.movingRight) {
            this.idle ^= true;
            this.movingRight = true;
            this.movingLeft = false;
            if (!this.inBox) {
                this.animation = this.animations.runRight;
                this.y = this.animation.drawY;
            } else {
                this.animation = this.animations.boxRunRight;
                this.y = this.animation.drawY;
            }
            //this.ground = 451;
        }
        this.moveRight();
        //Entity.prototype.draw.call(this, this.ground);
    } else if (Key.isDown(Key.DOWN)) {
        if (!this.inBox) {
            //this.animation = this.animations.enterBox;
            this.inBox = true;
            this.animation = this.animations.enterBox;
            if (this.animation.isDone()) this.animation = this.animations.inBoxIdle;
            //if (this.animation.isDone()) {
            //    this.animation = this.animations.inBoxIdle;
            //} else {
            //    this.animation = this.animations.enterBox;
            //}
            //Entity.prototype.draw.call(this);
            //Entity.prototype.draw.call(this);
        } else {
            this.inBox = false;
            this.animation = this.animations.exitBox;
            if (this.animation.isDone()) this.animation = this.animations.idle;
            //this.animation = this.animations.idle;
            //Entity.prototype.draw.call(this);
        }

    } else {
        this.idle = true;
        this.movingLeft = false;
        this.movingRight = false;

        if (!this.inBox && this.animation !== this.animations.exitBox) {
            this.animation = this.animations.idle;
            this.y = this.animation.drawY;
        } else if (this.inBox && this.animation !== this.animations.enterBox) {
            this.animation = this.animations.inBoxIdle;
            this.y = this.animation.drawY;
        }
    }


    //this.x += 1;

    //if (this.game.space) {
    //    this.box ^= true;
    //    console.log(this.box);
    //}
    //if (this.box) {
    //    if (this.boxAnimation.isDone()) {
    //        this.boxAnimation.elapsedTime = 0;
    //        this.box ^= true;
    //    }
    //    Entity.prototype.draw.call(this);
    //}
    //if (this.game.space) this.jumping = true;
    //if (this.jumping) {
    //    if (this.jumpAnimation.isDone()) {
    //        this.jumpAnimation.elapsedTime = 0;
    //        this.jumping = false;
    //    }
    //    var jumpDistance = this.jumpAnimation.elapsedTime / this.jumpAnimation.totalTime;
    //    var totalHeight = 200;
    //
    //    if (jumpDistance > 0.5) {
    //        jumpDistance = 1 - jumpDistance;
    //    }
    //    var height = totalHeight * (-4 * (jumpDistance * jumpDistance - jumpDistance));
    //    this.y = this.ground - height;
    //}
    Entity.prototype.draw.call(this);

};


Snake.prototype.draw = function(ctx) {
    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    Entity.prototype.draw.call(this);
};

Snake.prototype.moveLeft = function() {

    this.x -= 4;
};

Snake.prototype.moveRight = function() {
    this.x += 4;
};

Snake.prototype.moveDown = function() {
    this.animation = this.animations.enterBox;
    //this.ground -= 23;

};
//
//Snake.prototype.moveLeft = function() {
//    this.x -= 1;
//};

var Key = {
    _pressed: {},

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    isDown: function(keyCode) {
        return this._pressed[keyCode];
    },
    onKeyDown: function(event) {
        this._pressed[event.keyCode] = true;
    },
    onKeyUp: function(event) {
        delete this._pressed[event.keyCode];
    }
};

window.addEventListener('keyup', function(event) { Key.onKeyUp(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeyDown(event); }, false);

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/snake.png");
ASSET_MANAGER.queueDownload("./img/snake_rev.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    var bg = new Background(gameEngine);
    //var unicorn = new Unicorn(gameEngine);
    var snake = new Snake(gameEngine);
    gameEngine.addEntity(bg);
    //gameEngine.addEntity(unicorn);
    gameEngine.addEntity(snake);

    gameEngine.init(ctx);
    gameEngine.start();
});
