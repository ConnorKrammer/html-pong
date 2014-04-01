'use strict';

/* =========================
 *         Constants
 * ========================= */

var PI                  = 3.14159265;
var BALL_SPEED          = 800;
var BALL_MAX_SPEED      = 2400;
var MAX_BALL_COUNT      = 3;
var PADDLE_SPEED        = 550;
var PADDLE_BOUNCE_SPEED = 100;
var REBOUND_MULTIPLIER  = 1.05;

/* =========================
 *      Helper Objects
 * ========================= */

var clock = {
    getTime: function() { return (new Date()).getTime(); }
};

var fpsCounter = {
    sampleSize: 5000,
    times: {},
    tick: function(type) {
        if (!this.times[type]) this.reset(type);
        this.times[type].count++;
    },
    reset: function(type) {
        this.times[type] = this.times[type] || {};
        this.times[type].count = 0;
        this.times[type].time = clock.getTime();
    },
    getFramerate: function(type) {
        if (!this.times[type]) return false;
        
        var elapsed = this.getElapsed(type);
        var frames  = this.times[type].count;
        
        return Math.round(frames / (elapsed / 1000));
    },
    getElapsed: function(type) {
        if (!this.times[type]) return false;
        return clock.getTime() - this.times[type].time;
    }
};

/* =========================
 *       State Objects
 * ========================= */

var keys = {
    left: false,
    down: false,
    right: false,
    up: false,
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false
};

var score = {
    player1: 0,
    player2: 0
};

var showFps = false;

/* =========================
 *       Initialization
 * ========================= */

var renderFramerate, updateFramerate;

var canvas  = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

var world = new World();
var ballCount = 1;
var player1, player2, interval;

function init() {
    // Add the walls and center divider.
    world.addEntity(new Obstacle(-60, 0, 20, canvas.height));
    world.addEntity(new Obstacle(canvas.width + 40, 0, 20, canvas.height));
    world.addEntity(new Obstacle(-40, -20, canvas.width + 80, 20));
    world.addEntity(new Obstacle(-40, canvas.height, canvas.width + 80, 20));
    world.addEntity(new Obstacle(20, 10, canvas.width - 36, 10, 'black'));
    world.addEntity(new Obstacle(20, canvas.height - 20, canvas.width - 36, 10, 'black'));
    world.addEntity(new Entity(new PhysicsBody(canvas.width / 2 - 3, 10, 6, canvas.height - 20), new Image('black')));

    // Add the paddles and a ball.
    player1 = new Paddle(20, 50, Player1Controller);
    player2 = new Paddle(canvas.width - 36, 50, ComputerController);
    world.addEntity(player1);
    world.addEntity(player2);
    world.addEntity(new Ball(player1));
    
    interval = setInterval(function() {
        ballCount++;
        world.addEntity(Math.random() > 0.5 ? new Ball(player1) : new Ball(player2));
        if (ballCount >= MAX_BALL_COUNT) clearInterval(interval);
    }, 30000);

    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 16) keys.shift = true;
        else if (event.keyCode === 32) keys.space = true;
        else if (event.keyCode === 37) keys.left  = true;
        else if (event.keyCode === 38) keys.up    = true;
        else if (event.keyCode === 39) keys.right = true;
        else if (event.keyCode === 40) keys.down  = true;
        else if (event.keyCode === 65) keys.a     = true;
        else if (event.keyCode === 68) keys.d     = true;
        else if (event.keyCode === 83) keys.s     = true;
        else if (event.keyCode === 87) keys.w     = true;
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.keyCode === 16) keys.shift = false;
        else if (event.keyCode === 32) keys.space = false;
        else if (event.keyCode === 37) keys.left  = false;
        else if (event.keyCode === 38) keys.up    = false;
        else if (event.keyCode === 39) keys.right = false;
        else if (event.keyCode === 40) keys.down  = false;
        else if (event.keyCode === 65) keys.a     = false;
        else if (event.keyCode === 68) keys.d     = false;
        else if (event.keyCode === 83) keys.s     = false;
        else if (event.keyCode === 87) keys.w     = false;
    });
    
    document.addEventListener('keydown', function(event) {
        // The 't' character.
        if (event.keyCode === 84) showFps = !showFps; 
    });
    
    // Start everything. 
    render(clock.getTime());
    update(clock.getTime());
}

/* =========================
 *         Game Loop
 * ========================= */

function render(lastTick) {
    var time = clock.getTime();
    var ms   = time - lastTick;
    fpsCounter.tick('render');

    context.clearRect(0, 0, canvas.width, canvas.height);
    world.render();
    
    if (fpsCounter.getElapsed('render') > 1000) {
        renderFramerate = fpsCounter.getFramerate('render');
        fpsCounter.reset('render');
    }
    
    if (fpsCounter.getElapsed('update') > 1000) {
        updateFramerate = fpsCounter.getFramerate('update');
        fpsCounter.reset('update');
    }
    
    context.font = '80px consolas';
    
    context.textAlign = 'end';
    context.fillText(score.player1, canvas.width / 2 - 20, canvas.height - 35);
    
    context.textAlign = 'start';
    context.fillText(score.player2, canvas.width / 2 + 20, canvas.height - 35);
    
    if (showFps) {
        context.font = 'bold 12px lato';
        context.fillText('Framerate:', 35, 40); 
        
        context.font = '12px lato';
        context.fillText('render: ' + renderFramerate + ' fps', 35, 60);
        context.fillText('update: ' + updateFramerate + ' fps', 35, 80);
    }
    
    setTimeout(render, 0, time);
}

function update(lastTick) {
    var time = clock.getTime();
    var ms   = time - lastTick;
    fpsCounter.tick('update');

    world.update(ms);
    
    setTimeout(update, 0, time);
}

/* =========================
 *          World
 * ========================= */

function World() {
    this.entityList = [];
        
    return this;
}

World.prototype.update = function(ms) {
    this.entityList.forEach(function(entity) {
        entity.update(ms);
    });
};

World.prototype.render = function() {
    this.entityList.forEach(function(entity) {
        if (!entity.image) return;
        
        context.fillStyle = entity.image.color;
        
        if (entity.image.shape === 'rectangle') {
        context.fillRect(entity.body.position.x, entity.body.position.y,
                        entity.body.size.width, entity.body.size.height);
        }
        else if (entity.image.shape === 'circle') {
            context.beginPath();
            context.arc(entity.body.position.x, entity.body.position.y,
                        entity.body.size.width, 0, PI * 2);
            context.closePath();
            context.fill();
        }
    });
};

World.prototype.filter = function(type) {
    return this.entityList.filter(function(entity) {
        return entity.body.collisionType === type;
    });
};

World.prototype.addEntity = function(entity) {
    if (this.entityList.indexOf(entity) !== -1) return;
    
    this.entityList.push(entity);
    entity.world = this;
};

World.prototype.removeEntity = function(entity) {
    var index = this.entityList.indexOf(entity);
    if (index === -1) return;
    
    this.entityList.splice(index, 1);
    entity.world = null;
};

/* =========================
 *       PhysicsBody
 * ========================= */

function PhysicsBody(x, y, width, height, options) {
    options = options || {};
    
    this.velocity = {
        x: 0,
        y: 0
    };
    
    this.position = {
        x: x,
        y: y
    };
    
    this.size = {
        width: width,
        height: height
    };
    
    this.collisionType = options.collisionType || '';
    this.collisionMask = options.collisionMask ? [].concat(options.collisionMask) : [];
    this.isSolid       = options.isSolid || true;
    
    return this;
}

/* =========================
 *           Image
 * ========================= */

function Image(color, shape) {
    this.color = color || 'black';
    this.shape = shape || 'rectangle';
    
    return this;
}

/* =========================
 *          Entity
 * ========================= */

function Entity(body, image, controller) {
    this.body       = body;
    this.image      = image;
    this.controller = controller;
    this.world      = null;
    
    return this;
}

Entity.prototype.collide = function(x, y) {
    var width  = this.body.size.width;
    var height = this.body.size.height;
    var entity, e, collision;
    
    for (var i = 0; i < this.world.entityList.length; i++) {
        entity = this.world.entityList[i];
        if (entity === this) continue;
        if (this.body.collisionMask.indexOf(entity.body.collisionType) === -1) continue;

        e = {
            x: entity.body.position.x,
            y: entity.body.position.y,
            height: entity.body.size.height,
            width: entity.body.size.width
        };
        
        // Look for existance of separating axis.
        collision = !(x + width  < e.x || x > e.x + e.width ||
                      y + height < e.y || y > e.y + e.height);
        
        if (collision) return entity;
    }
    
    return false;
};

Entity.prototype.handleCollision = function(entity, side) {
    if (entity.body.collisionType === 'obstacle') {
        if (side === 'left' || side === 'right') {
            this.body.velocity.x *= -1;
        }
        else if (side === 'top' || side === 'bottom') {
            this.body.velocity.y *= -1;
        }
    }
};

Entity.prototype.update = function(ms) {
    var sign = {
        x: this.body.velocity.x < 0 ? -1 : 1,
        y: this.body.velocity.y < 0 ? -1 : 1
    };
    
    var newPosition = {
        x: this.body.position.x + this.body.velocity.x * (ms / 1000),
        y: this.body.position.y + this.body.velocity.y * (ms / 1000)
    };

    var delta = {
        x: (newPosition.x - this.body.position.x) * sign.x,
        y: (newPosition.y - this.body.position.y) * sign.y
    };
    
    var step, e, side;
    
    while (delta.x > 0) {
        step = delta.x > this.body.size.width ? this.body.size.width : 1;
        e = this.collide(this.body.position.x + step * sign.x, this.body.position.y);
        
        if (!e) {
            this.body.position.x += step * sign.x;
            delta.x -= step;
        } else {
            side = sign.x < 0 ? 'left' : 'right';
            this.handleCollision(e, side);
            if (e.body.isSolid && this.body.isSolid) break;
        }
    }

    while (delta.y > 0) {
        step = delta.y > this.body.size.height ? this.body.size.height : 1;
        e = this.collide(this.body.position.x, this.body.position.y + step * sign.y);
        
        if (!e) {
            this.body.position.y += step * sign.y;
            delta.y -= step;
        } else {
            side = sign.y < 0 ? 'top' : 'bottom';
            this.handleCollision(e, side);
            if (e.body.isSolid && this.body.isSolid) break;
        }
    }
    
    if (this.controller) this.controller.update(this, ms);
};

/* =========================
 *          Obstacle
 * ========================= */

Obstacle.prototype = Object.create(Entity.prototype);
Obstacle.prototype.constructor = Entity;

function Obstacle(x, y, width, height, color) {
    var body = new PhysicsBody(x, y, width, height, {
        collisionType: 'obstacle'
    });
    var image = new Image(color || 'rgba(0, 0, 0, 0)');
    
    return Entity.call(this, body, image);
}

/* =========================
 *          Paddle
 * ========================= */

Paddle.prototype = Object.create(Entity.prototype);
Paddle.prototype.constructor = Entity;

function Paddle(x, y, controller) {
    var body = new PhysicsBody(x, y, 16, 90, {
        collisionType: 'paddle',
        collisionMask: 'obstacle',
    });
    var image = new Image('black');
    
    this.restPosition = x;
    
    return Entity.call(this, body, image, controller);
}

Paddle.prototype.update = function(ms) {
    var displacement = Math.abs(this.restPosition - this.body.position.x);
    var sign = this.body.position.x > this.restPosition ? -1 : 1;
    
    this.body.velocity.x += 0.001 * ms * displacement * displacement * sign;
    this.body.velocity.x *= 0.8;

    if (displacement < 2 && Math.abs(this.body.velocity.x) < 1) {
        this.body.position.x = this.restPosition;
        this.body.velocity.x = 0;
    }
    
    return Entity.prototype.update.call(this, ms);
};

Paddle.prototype.handleCollision = function(entity, side) {
    if (entity.body.collisionType === 'ball') {
        if (side === 'top') {
            entity.body.position.y = this.body.position.y - entity.body.size.height - 1;
        }
        else if (side === 'bottom') {
            entity.body.position.y = this.body.position.y + this.body.size.height + 1;
        }
    }
    
    return Entity.prototype.handleCollision.call(this, entity, side);
};

/* =========================
 *           Ball
 * ========================= */

Ball.prototype = Object.create(Entity.prototype);
Ball.prototype.constructor = Entity;

function Ball(startEntity) {
    var body  = new PhysicsBody(0, 0, 8, 8, {
        collisionType: 'ball',
        collisionMask: ['obstacle', 'paddle'],
    });
    var image = new Image('black', 'circle');
    
    Entity.call(this, body, image);
    
    this.reset(startEntity);
    
    return this;
}

Ball.prototype.reset = function(entity, delay) {
    var _this = this;
    
    this.launchEntity = entity;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    
    // This will delay before resetting position.
    setTimeout(function() {
        _this.launched = false;
        _this.alignToEntity(_this.launchEntity);
    }, delay || 0);    
};

Ball.prototype.launch = function(delay) {
    var _this = this;
    var angle;
    
    if (this.launched) return;
    
    setTimeout(function() {
        if (_this.launchEntity.body.position.x > _this.body.position.x) {
            angle = PI + (Math.random() * PI / 3) - PI / 6;
        } else {
            angle = (Math.random() * PI / 3) - PI / 6;
        }

        _this.body.velocity.x = BALL_SPEED * Math.cos(angle);
        _this.body.velocity.y = BALL_SPEED * Math.sin(angle);
    }, delay || 0);
    
    this.launched = true;   
};

Ball.prototype.handleCollision = function(entity, side) {
    var vx, vy;
    if (entity.body.collisionType === 'paddle') {
        if (side === 'left' || side === 'right') {
            entity.body.velocity.x = (this.body.velocity.x < 0)
                ? -PADDLE_BOUNCE_SPEED 
                :  PADDLE_BOUNCE_SPEED;

            vx = this.body.velocity.x;
            vy = this.body.velocity.y;
            
            if (vx * vx + vy * vy < BALL_MAX_SPEED * BALL_MAX_SPEED) {
                this.body.velocity.x *= -REBOUND_MULTIPLIER;
            } else {
                this.body.velocity.x *= -1;
            }
        }
        else if (side === 'top' || side === 'bottom') {            
            this.body.velocity.y *= -1;
        }
    }
    
    if (entity.body.collisionType === 'obstacle') {
        if (side === 'left') {
            score.player2++;
            this.reset(player1, 200);
        }
        else if (side === 'right') {
            score.player1++;
            this.reset(player2, 200);
        }
    }
    
    return Entity.prototype.handleCollision.call(this, entity, side);
};

Ball.prototype.update = function(ms) {
    if (!this.launched) this.alignToEntity(this.launchEntity);
    
    Entity.prototype.update.call(this, ms);
};

Ball.prototype.alignToEntity = function(entity) {
    if (entity.body.position.x < canvas.width / 2) {
        this.body.position.x = entity.body.position.x + entity.body.size.width + 20;
    } else {
        this.body.position.x = entity.body.position.x - this.body.size.width - 20;
    }
                         
    this.body.position.y = entity.body.position.y + (entity.body.size.height / 2);  
};

/* =========================
 *            AI
 * ========================= */

function Player1Controller() {}

Player1Controller.update = function(entity, ms) {
    var balls = entity.world.filter('ball');

    if (keys.up) {
        entity.body.velocity.y = -PADDLE_SPEED;
    }
    else if (keys.down) {
        entity.body.velocity.y = PADDLE_SPEED;
    }
    else {
        entity.body.velocity.y = 0;
    }

    if (keys.space) {
        balls.forEach(function(ball) {
            if (ball.launched === false && ball.launchEntity === entity) {
                ball.launch();
            }
        });
    }
};

function Player2Controller() {}

Player2Controller.update = function(entity, ms) {
    var balls = entity.world.filter('ball');

    if (keys.w) {
        entity.body.velocity.y = -PADDLE_SPEED;
    }
    else if (keys.s) {
        entity.body.velocity.y = PADDLE_SPEED;
    }
    else {
        entity.body.velocity.y = 0;
    }

    if (keys.shift) {
        balls.forEach(function(ball) {
            if (ball.launched === false && ball.launchEntity === entity) {
                ball.launch();
            }
        });
    }
};

function ComputerController() {}

ComputerController.update = function(entity, ms) {
    var _this           = this;
    var balls           = entity.world.filter('ball');
    var closestDistance = Infinity;
    var closestBall     = null;
    var signY           = entity.body.velocity.y < 0 ? -1 : 1;
    var entityX, entityY, ballX, ballY, distance;
    
    balls.forEach(function(ball) {
        if (ball.launched === false && ball.launchEntity === entity) {
            ball.launch(300);
            return;
        }
        
        if (ball.body.position.x < entity.body.position.x + entity.body.size.width && ball.body.velocity.x < 0) return;
        if (ball.body.position.x + ball.body.size.width > entity.body.position.x && ball.body.velocity.x > 0) return;
        
        entityX  = entity.body.position.x + entity.body.size.width / 2;
        ballX    = ball.body.position.x + ball.body.size.width / 2;
        distance = Math.abs(entityX - ballX);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestBall = ball;
        }
    });
    
    if (closestBall) {
        entityY = entity.body.position.y + entity.body.size.height / 2;
        ballY   = closestBall.body.position.y + closestBall.body.size.height / 2;

        if (entityY - 20 > ballY) {
            entity.body.velocity.y = -PADDLE_SPEED;
        }
        else if (entityY + 20 < ballY) {
            entity.body.velocity.y = PADDLE_SPEED;
        }
        else {
            entity.body.velocity.y = 0;
        }
    }
};

/* =========================
 *      Start the game!
 * ========================= */

init();
                    