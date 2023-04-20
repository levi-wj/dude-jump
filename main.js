const g = .98;
let frame = 0;
let gameStarted = false;

let score = {
    num: 0,
    oldNum: 0,
    init: function() {
        this.counter = document.getElementById('score');
        this.hiScoreEle = document.getElementById('hiscore');
        this.hiScore = localStorage.getItem('hiScore') ?? 0;
        this.updateHighScoreEle();
    },
    updateScore: function (score) {
        this.oldNum = this.num;
        this.num = score;
    },
    updateHighScore: function () {
        if (this.num > this.hiScore) {
            this.hiScore = this.num;
            localStorage.setItem('hiScore', this.hiScore);
            this.updateHighScoreEle();
            return true;
        } else {
            return false;
        }
    },
    updateScoreEle: function () {
        if (this.num !== this.oldNum) {
            this.counter.innerText = 'Score: ' + this.num;
        }
    },
    updateHighScoreEle: function () {
        this.hiScoreEle.innerText = 'High Score: ' + this.hiScore;
    },
    resetHighScore: function () {
        this.hiScore = 0;
        localStorage.setItem('hiScore', this.hiScore);
        this.updateHighScoreEle();
    }
}

let area = {
    size: { w: 500, h: 600 },
    init: function() {
        this.canvas = document.getElementById('game');
        this.canvas.width = this.size.w;
        this.canvas.height = this.size.h;
        this.ctx = this.canvas.getContext('2d');
    },
    clear: function () {
        this.ctx.reset();
        this.ctx.imageSmoothingEnabled = false;
    },
    centerObjH: function (w) {
        return (area.size.w / 2) - (w / 2);
    },
    drawMsgBanner: function (title, subtitle) {
        // Background box
        this.ctx.rect(0, (area.size.h / 2) - 100 / 2, area.size.w, 100);
        this.ctx.fillStyle = '#e8f9ff';
        this.ctx.fill();

        // Title
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = "center";
        this.ctx.font = '25px monospace';
        this.ctx.fillText(title, (area.size.w / 2), (area.size.h / 2) - (subtitle ? 2 : -5));

        // Subtitle
        if (subtitle) {
            this.ctx.font = '15px monospace';
            this.ctx.fillText(subtitle, (area.size.w / 2), (area.size.h / 2) + 18);
        }
    },
    intersectRects: function (r1pos, r1size, r2pos, r2size) {
        return (
            r1pos.x < r2pos.x + r2size.w &&
            r1pos.x + r1size.w > r2pos.x &&
            r1pos.y < r2pos.y + r2size.h &&
            r1pos.y + r1size.h > r2pos.y
        );
    }
}

let camera = {
    moveSpeed: 1,
    position: { x: 0, y: 0 },
    getDrawnPos: function (obj) {
        return {
            x: obj.position.x - this.position.x,
            y: area.size.h - (obj.position.y - this.position.y)
        };
    },
    draw: function (obj) {
        const drawnPos = this.getDrawnPos(obj);
        area.ctx.drawImage(
            obj.sprite,
            drawnPos.x,
            drawnPos.y,
            obj.size.w,
            obj.size.h
        );
    }
}

let player = {
    sprite: new Image(),
    moveSpeed: 9,
    jumpVelocity: 22,
    fallMultiplier: 1,
    size: { h: 40, w: 30 },
    init: function () {
        this.sprite.src = 'img/player.png';
        this.position = { x: area.centerObjH(this.size.w), y: 50 + this.size.h };
        this.velocity = { x: 0, y: this.jumpVelocity };
    },
    doPhysics: function () {
        this.velocity.y -= g * this.fallMultiplier;

        // If we're falling and the player isn't too high off the screen, check for bounce
        if (this.velocity.y <= 0 && camera.getDrawnPos(this).y > -5) {
            // Check collision
            platforms.objs.every(platform => {
                if (area.intersectRects(player.position, player.size, platform.position, platform.size)) {
                    player.bounce();
                    return false;
                }
                return true;
            });
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    },
    bounce: function () {
        this.velocity.y = this.jumpVelocity;
    }
}

let platforms = {
    sprite: new Image(),
    size: { w: 60, h: 15 },
    gap: 150,
    padding: 100,
    curHeight: 200,
    objs: [],
    init: function () {
        this.sprite.src = 'img/platform.png';

        // Create first two platforms
        this.createPlatform(area.centerObjH(this.size.w), 50);
        this.createPlatform(area.centerObjH(this.size.w), 50 + this.gap);

        // Create more platforms at random positions
        for (this.curHeight = 50 + (this.gap * 2); this.curHeight <= (area.size.h + 50 + (this.gap * 2)); this.curHeight += this.gap) {
            this.createPlatform(this.getRandomX(), this.curHeight);
        }
    },
    getRandomX: function () {
        return Math.floor(Math.random() * (area.size.w - this.padding)) + (this.padding / 2);
    },
    createPlatform: function(x, y) {
        this.objs.push({
            sprite: this.sprite,
            position: { x: x, y: y },
            size: this.size
        });
    },
    drawPlatforms: function () {
        this.objs.forEach(obj => camera.draw(obj));
    },
    deleteOffscreen: function () {
        for (let i = 0; i < this.objs.length; i++) {
            // If the platform is too far down, delete it and create a new one
            if (camera.getDrawnPos(this.objs[i]).y > area.size.h + this.objs[i].size.h) {
                this.objs.shift();
                this.createPlatform(this.getRandomX(), this.curHeight);
                this.curHeight += this.gap;
            } else {
                // They're in order of height, we know there are no more
                break;
            }
        }
    }
}

function startGame() {
    let gameOverMsg = 'Game over!';

    // Main game loop!
    const gameLoop = window.setInterval(() => {
        player.doPhysics();
        platforms.deleteOffscreen();
        if (frame > 50) {
            camera.position.y += camera.moveSpeed;
        }

        // Game difficulty increase
        camera.moveSpeed += .005;
        platforms.gap += .03;
        player.moveSpeed += .005;
        player.jumpVelocity += .01;
        player.fallMultiplier += .0004;

        // Check if the player fell offscreen
        if (camera.getDrawnPos(player).y > area.size.h) {
            window.clearInterval(gameLoop);
            if (score.updateHighScore()) {
                gameOverMsg = 'New high score!!';
            }
            setTimeout(() => {
                area.drawMsgBanner(gameOverMsg, 'Reload to play again');
            }, 200);
        }

        score.updateScore(Math.floor(frame / 20));
        score.updateScoreEle();
        drawFrame();
        frame++;
    }, 20);
};

function drawFrame() {
    area.clear();
    camera.draw(player);
    platforms.drawPlatforms();
}

window.addEventListener('keydown', key => {
    if (!gameStarted) {
        gameStarted = true;
        startGame();
    }

    if (key.code === 'KeyA' || key.code === 'ArrowLeft') {
        player.velocity.x = player.moveSpeed * -1;
    } else if (key.code === 'KeyD' || key.code === 'ArrowRight') {
        player.velocity.x = player.moveSpeed;
    }
});
window.addEventListener('keyup', key => {
    if (key.code === 'KeyA' || key.code === 'ArrowLeft') {
        if (player.velocity.x < 0) {
            player.velocity.x = 0;
        }
    } else if (key.code === 'KeyD' || key.code === 'ArrowRight') {
        if (player.velocity.x > 0) {
            player.velocity.x = 0;
        }
    }
});
window.addEventListener('load', () => {
    // Initilize everything!
    area.init();
    player.init();
    platforms.init();
    score.init();

    setTimeout(() => {
        drawFrame();
        area.drawMsgBanner('Press any key to start');
    }, 100);
});