class Tetris {
    constructor(element) {
        this.canvas = element;
        this.context = this.canvas.getContext('2d');
        this.context.scale(20, 20);

        this.arena = this.createMatrix(12, 20);
        this.player = {
            pos: {x: 0, y: 0},
            matrix: null,
            score: 0
        };

        this.colors = [
            null,
            '#FF0D72',
            '#0DC2FF',
            '#0DFF72',
            '#F538FF',
            '#FF8E0D',
            '#FFE138',
            '#3877FF'
        ];

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.isPlaying = true;

        this.playerReset();
        this.updateScore();
        this.update();

        document.addEventListener('keydown', event => this.handleKeydown(event));

        document.getElementById('play').addEventListener('click', () => this.start());

        document.getElementById('pause').addEventListener('click', () => this.pause());

    }

    createMatrix(width, height){
        const matrix = [];
        while(height--){
            matrix.push(new Array(width).fill(0));
        }
        return matrix;
    }

    createPiece(type){
        switch (type) {
           case 'T': 
                return [
                    [0,0,0],
                    [1,1,1],
                    [0,1,0]
                ];
            case 'O': 
                return [
                    [2,2],
                    [2,2],
                ];
            case 'L' : 
                return [
                    [0,3,0],
                    [0,3,0],
                    [0,3,3]
                ];
            case 'J' : 
                return [
                    [0,4,0],
                    [0,4,0],
                    [4,4,0]
                ];
            case 'I' : 
                return [
                    [0,5,0,0],
                    [0,5,0,0],
                    [0,5,0,0],
                    [0,5,0,0]
                ];
            case 'S' : 
                return [
                    [0,6,6],
                    [6,6,0],
                    [0,0,0]
                ];
            case 'Z': 
                return [
                    [7,7,0],
                    [0,7,7],
                    [0,0,0]
                ];
        }
    }

    collide(arena, player){
        const [m,o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if(m[y][x] !== 0 &&
                    (arena[y + o.y] &&
                        arena[y + o.y][x + o.x]) !== 0) {
                            return true
                        }
            }
            
        }
        return false;
    }

    merge(arena, player){
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value !== 0){
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    rotate(matrix, dir){
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }  
        }

        if(dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    playerReset(){
        const pieces = 'TJLOSZI';
        this.player.matrix = this.createPiece(pieces[pieces.length * Math.random() | 0]);
        this.player.pos.y = 0;
        this.player.pos.x = (this.arena[0].length / 2 | 0) - (this.player.matrix[0].length /2 | 0);

        if(this.collide(this.arena, this.player)){
            this.arena.forEach(row => row.fill(0));
            this.player.score = 0;
            this.updateScore();
        }
    }

    playerDrop(){
        this.player.pos.y++;
        if(this.collide(this.arena, this.player)) {
            this.player.pos.y--;
            this.merge(this.arena, this.player);
            this.playerReset();
            this.arenaSweep();
            this.updateScore();
        }
        this.dropCounter = 0;
    }

    playerMove(offset){
        this.player.pos.x += offset;
        if(this.collide(this.arena, this.player)){
            this.player.pos.x -= offset;
        }
    }

    playerRotate(dir){
        const pos = this.player.pos.x;
        let offset = -1;
        this.rotate(this.player.matrix, dir);
        while (this.collide(this.arena, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if(offset > this.player.matrix[0].length){
                this.rotate(this.player.matrix, -dir);
                this.player.pos.x = pos;
                return;
            }
        }
    }

    handleKeydown(event){
        switch (event.key) {
            case 'a':
                this.playerMove(-1);
                break;
            case 'd' :
                this.playerMove(1);
                break;
            case 's' : 
                this.playerDrop();
                break;
            case 'q' :
                this.playerRotate(-1)
                break;
            case 'e' : 
                this.playerRotate(1);
                break;
        }
    }

    arenaSweep() {
        let rowCount = 1;
        outer: for (let y = this.arena.length -1; y > 0; --y) {
            for (let x = 0; x < this.arena[y].length; ++x) {
                if(this.arena[y][x] === 0){
                    continue outer;
                }
            }

            const row = this.arena.splice(y, 1)[0].fill(0);
            this.arena.unshift(row);
            ++y;

            this.player.score += rowCount * 10;
        }
    }

    drawMatrix(matrix, offset){
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value !== 0){
                    this.context.fillStyle = this.colors[value];
                    this.context.fillRect(x + offset.x, y + offset.y, 1, 1);

                    //Agregar Sombra 
                    this.context.fillStyle = 'rgba(0,0,0,0.3)';
                    this.context.fillRect(x + offset.x + 0.05, y + offset.y + 0.05, 1,1);

                    // Agregar efecto de iluminacion
                    this.context.fillStyle = 'rgba(255,255,255, 0.2)';
                    this.context.fillRect(x + offset.x - 0.05, y + offset.y - 0.05, 1,1);
                }
            });
        });
    }

    draw(){
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawMatrix(this.arena, {x: 0, y:0});
        this.drawMatrix(this.player.matrix, this.player.pos);
    }

    update(time = 0){
        if(this.isPlaying) {
            const deltaTime = time - this.lastTime;
            this.lastTime = time;

            this.dropCounter += deltaTime;
            if(this.dropCounter > this.dropInterval){
                this.playerDrop();
            }

            this.draw();
        }
        requestAnimationFrame(time => this.update(time));
    }

    start() {
        this.isPlaying = true; 
        this.update();
    }

    pause() {
        this.isPlaying = false;
    }

    updateScore(){
        document.getElementById('score').innerText = 'Score: ' + this.player.score;
    }

}

const tetris = new Tetris(document.getElementById('tetris'));