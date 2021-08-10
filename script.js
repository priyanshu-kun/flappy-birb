const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")
let frames = 0;
const DEGREE = Math.PI / 180

// load sprite or image
const sprite = new Image()
sprite.src = "./image/sprite.png"

const SCORE_S = new Audio()
SCORE_S.src = "./audio/sfx_point.wav"
const FLAP_S = new Audio()
FLAP_S.src = "./audio/sfx_flap.wav"
const HIT_S = new Audio()
HIT_S.src = "./audio/sfx_hit.wav"
const SWOOSHING_S = new Audio()
SWOOSHING_S.src = "./audio/sfx_swooshing.wav"
const DIE_S = new Audio()
DIE_S.src = "./audio/sfx_die.wav"


const gameState = {
    current: 0,
    gameStart: 0,
    game: 1,
    gameEnd: -1
}

// start btn cordinates
const startBtn = {
    x: 120,
    y: 263,
    w: 83,
    h: 29
}

const score = {
    best: parseInt(localStorage.getItem("best") || 0),
    value: 0,
    draw: function () {
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#000"

        if (gameState.current === gameState.game) {
            ctx.lineWidth = 1
            ctx.font = "36px Teko"
            ctx.fillText(this.value, canvas.width / 2, 50)
            ctx.strokeText(this.value, canvas.width / 2, 50)
        }
        else if (gameState.current === gameState.gameEnd) {
            ctx.font = "25px Teko"
            ctx.fillText(this.value, 244, 186)
            ctx.strokeText(this.value, 244, 186)
            ctx.fillText(this.best, 244, 228)
            ctx.strokeText(this.best, 244, 228)
        }
    },
    reset: function () {
        this.value = 0;
    }
}

// background
const bg = {
    sx: 0,
    sy: 0,
    w: 275,
    h: 226,
    dx: 0,
    dy: canvas.height - 226,
    draw: function () {
        ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.dx, this.dy, this.w, this.h)
        ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.dx + this.w, this.dy, this.w, this.h)
    }
}

// foreground
const fg = {
    sx: 276,
    sy: 0,
    w: 224,
    h: 112,
    dx: 0,
    dy: canvas.height - 112,
    deltaX: 2,

    draw: function () {
        ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.dx, this.dy, this.w, this.h)
        ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.dx + this.w, this.dy, this.w, this.h)
    },

    // move foreground to create a illusion of that birb is flying
    update: function () {
        /**
         * Here deltaX is speed for moving foreground
         * Here is how this eq evaluate
         * dx     -   deltaX  (dx-deltaX)  %     w/2          =      Ans
         * 0      -      2        -2       %    224/4(56)     =     -2
         * -2     -      2        -4       %    224/4(56)     =     -4
         * -4     -      2        -6       %    224/4(56)     =     -6
         * -6     -      2        -8       %    224/4(56)     =     -8
         * -8     -      2        -10      %    224/4(56)     =     -10
         * -10    -      2        -12      %    224/4(56)     =     -12
         * -12    -      2        -14      %    224/4(56)     =     -14
         *  .            .        .        .     .
         *  .            .        .        .     .
         *  .            .        .        .     .
         *  .            .        .        .     .
         *  .            .        .        .     .
         * -56    -      2        -56      %    224/4(56)     =      0
         * -0     -      2        -2       %    224/4(56)     =      -2
         * -2     -      2        -4       %    224/4(56)     =      -4
         * and so on after 112 it will repeat itself and create a illusion of moving foreground
         */
        if (gameState.current === gameState.game) {
            this.dx = (this.dx - this.deltaX) % (this.w / 4)
        }
    }
}


const pips = {
    positions: [],
    top: {
        sx: 553,
        sy: 0
    },
    bottom: {
        sx: 502,
        sy: 0
    },
    w: 53,
    h: 400,
    gap: 85,

    maxYpos: -150,
    deltaX: 2,
    draw: function () {
        for (let i = 0; i < this.positions.length; i++) {
            let p = this.positions[i]

            let topYPos = p.y
            let bottomYPos = p.y + this.h + this.gap

            ctx.drawImage(sprite, this.top.sx, this.top.sy, this.w, this.h, p.x, topYPos, this.w, this.h)
            ctx.drawImage(sprite, this.bottom.sx, this.bottom.sy, this.w, this.h, p.x, bottomYPos, this.w, this.h)
        }
    },

    update: function () {
        if (gameState.current !== gameState.game) return
        if (frames % 100 === 0) {
            this.positions.push({
                x: canvas.width,
                y: this.maxYpos * (Math.random() + 1)
            })
        }
        for (let i = 0; i < this.positions.length; i++) {
            let p = this.positions[i]

            let bottomPipeYPos = p.y + this.h + this.gap

            // collision detection
            // top pipe
            if (birb.dx + birb.radius > p.x && birb.dx - birb.radius < p.x + this.w && birb.dy + birb.radius > p.y && birb.dy - birb.radius < p.y + this.h) {
                gameState.current = gameState.gameEnd
                HIT_S.play()
            }
            // bottom pipe
            if (birb.dx + birb.radius > p.x && birb.dx - birb.radius < p.x + this.w && birb.dy + birb.radius > bottomPipeYPos && birb.dy - birb.radius < bottomPipeYPos + this.h) {
                gameState.current = gameState.gameEnd
                HIT_S.play()

            }

            p.x -= this.deltaX


            // if the pipes go beyond canas, then we delete them from the array
            if (p.x + this.w <= 0) {
                SCORE_S.play()
                this.positions.shift()
                score.value += 1;
                score.best = Math.max(score.value, score.best)
                localStorage.setItem("best", score.best)
            }
        }
    },
    reset: function () {
        this.positions = []
    }
}


const birb = {
    animation: [
        { sx: 276, sy: 112 },
        { sx: 276, sy: 139 },
        { sx: 276, sy: 164 },
        { sx: 276, sy: 139 }
    ],
    dx: 50,
    dy: 150,
    w: 34,
    h: 26,
    frame: 0,
    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation: 0,
    radius: 12,
    draw: function () {
        let birb = this.animation[this.frame]
        ctx.save()
        ctx.translate(this.dx, this.dy)
        ctx.rotate(this.rotation)
        ctx.drawImage(sprite, birb.sx, birb.sy, this.w, this.h, - this.w / 2, -this.h / 2, this.w, this.h)
        ctx.restore()
    },
    flap: function () {
        this.speed = -this.jump
    },
    update: function () {
        // if the game is in gameStart state,than our birb must flap slowely and the period is just for handle birb flapping speed 
        this.period = gameState.current === gameState.gameStart ? 10 : 5
        // we increment the frame by 1, each period
        this.frame += frames % this.period === 0 ? 1 : 0
        // if the frames variable is goes to 0 to 4, then again make it to zero
        this.frame = this.frame % this.animation.length

        if (gameState.current === gameState.gameStart) {
            this.dy = 150 // Reset birb position
            this.rotation = 0 * DEGREE
            // pips.positions = []
        }
        else {
            this.speed += this.gravity
            this.dy += this.speed
           
            if (this.dy + this.h / 2 >= canvas.height - fg.h) {
                this.dy = canvas.height - fg.h - this.h / 2
                if (gameState.current === gameState.game) {
                    gameState.current = gameState.gameEnd
                    DIE_S.play()
                    
                }
            }

            // if the speed is greater than jump which means the birb is falling down
            if (this.speed >= this.jump) {
                this.rotation = 90 * DEGREE
                this.frame = 1
            } else {
                this.rotation = -25 * DEGREE
            }
        }
    },
    reset: function () {
        this.speed = 0
    }
}

// get ready
const getReady = {
    sx: 0,
    sy: 228,
    w: 173,
    h: 152,
    dx: canvas.width / 2 - 173 / 2,
    dy: 80,

    draw: function () {
        if (gameState.current === gameState.gameStart) {
            ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.dx, this.dy, this.w, this.h)
        }
    }
}


// game over
const gameOver = {
    sx: 175,
    sy: 228,
    w: 225,
    h: 202,
    dx: canvas.width / 2 - 225 / 2,
    dy: 90,

    draw: function () {
        if (gameState.current === gameState.gameEnd) {
            ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.dx, this.dy, this.w, this.h)
        }
    }
}



const draw = () => {
    // ctx.fillStyle = "#00586B"
    ctx.fillStyle = "#70c5ce"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    bg.draw()
    pips.draw()
    fg.draw()
    birb.draw()
    getReady.draw()
    gameOver.draw()
    score.draw()
}

const update = () => {
    birb.update()
    fg.update()
    pips.update()
}

const gameLoop = () => {
    draw()
    update()
    frames++
    // frames > 100 ? frames = 0: frames++;
    requestAnimationFrame(gameLoop)
}


canvas.addEventListener("click", (e) => {
    switch (gameState.current) {
        case gameState.gameStart:
            gameState.current = gameState.game
            SWOOSHING_S.play()
            break;
        case gameState.game:
            birb.flap()
            FLAP_S.play()
            break;
        case gameState.gameEnd:
            let rect = canvas.getBoundingClientRect()
            let clickX = e.clientX - rect.left
            let clickY = e.clientY - rect.top

            if (clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h) {
                pips.reset()
                birb.reset()
                score.reset()
                gameState.current = gameState.gameStart
            }
            break;
    }
})
document.addEventListener("keyup", (e) => {

    if (e.keyCode === 38) {
        switch (gameState.current) {
            case gameState.gameStart:
                SWOOSHING_S.play()
                gameState.current = gameState.game
                break;
            case gameState.game:
                birb.flap()
                FLAP_S.play()
                break;
            case gameState.gameEnd:
                pips.reset()
                birb.reset()
                score.reset()
                gameState.current = gameState.gameStart
                break;
        }
    }
})


gameLoop()