const g = .98;
let frame = 0;
let gameStarted = false;

let score = {
    num: 0,
    oldNum: 0,
    init: function() {
        this.counter = document.getElementById('score');
    },
    updateScore: function (score) {
        this.oldNum = this.num;
        this.num = score;
    },
    updateEle: function () {
        if (this.num !== this.oldNum) {
            this.counter.innerText = 'Score: ' + this.num;
        }
    }
}

let area = {
    size: { w: 500, h: 600 },
    init: function() {
        this.canvas = document.getElementById('game');
        this.canvas.width = this.size.w;
        this.canvas.height = this.size.h;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.font = '48px serif';
        this.ctx.fillStyle = "black";
    },
    centerObjH: function (w) {
        return (area.size.w / 2) - (w / 2);
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

        if (this.velocity.y <= 0) {
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
    gap: 125,
    curHeight: 150,
    objs: [],
    init: function () {
        this.sprite.src = 'img/platform.png';

        // Create first two platforms 
        this.createPlatform(area.centerObjH(this.size.w), 50);
        this.createPlatform(area.centerObjH(this.size.w), 50 + this.gap);

        for (this.curHeight = 50 + (this.gap * 2); this.curHeight <= (area.size.h + 50 + (this.gap * 2)); this.curHeight += this.gap) {
            this.createPlatform(Math.floor(Math.random() * area.size.w), this.curHeight);
        }
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
            if (camera.getDrawnPos(this.objs[i]).y > area.size.h + this.objs[i].size.h) {
                this.objs.shift();
                this.createPlatform(Math.floor(Math.random() * area.size.w), this.curHeight);
                this.curHeight += this.gap;
            } else {
                // They're in order of height, we know there are no more
                break;
            }
        }
    }
}

function startGame() {
    // Main game loop!
    const gameLoop = window.setInterval(() => {
        player.doPhysics();
        platforms.deleteOffscreen();
        if (frame > 50) {
            camera.position.y += camera.moveSpeed;
        }

        // Game difficulty increase
        camera.moveSpeed += .005;
        player.moveSpeed += .005;
        player.jumpVelocity += .01;
        player.fallMultiplier += .0004;

        // Check if the player fell offscreen
        if (camera.getDrawnPos(player).y > area.size.h) {
            window.clearInterval(gameLoop);
            // area.ctx.fillText('Game over!', area.size.w / 2, area.size.h / 2);
            area.ctx.fillText('Game over!', 50, 50);
        }

        score.updateScore(Math.floor(frame / 20));
        score.updateEle();
        drawFrame();
        frame++;
    }, 20);
};

function drawFrame() {
    area.ctx.reset();
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

    setTimeout(drawFrame, 100);
});