const PLAYFIELD_WIDTH = 40;
const PLAYFIELD_HEIGHT = 30;
// Update frequency in milliseconds
const ANIMATION_SPEED = 400;

let tbl_playField = document.getElementById("main-playfield");
let btn_nextFrame = document.getElementById("button-next-frame");
let btn_play = document.getElementById("button-play");
let btn_stop = document.getElementById("button-stop");

// Container for setInterval, to enable stopping the animation
let intervalContainer;
let nowPlaying = false;

// Main playfield
let playfield = [];

window.onload = PlayField_Create;

btn_nextFrame.addEventListener("click", PlayField_Update);

btn_play.addEventListener("click", function () {
    if (!nowPlaying) {
        // Prevent setInterval from being invoked multiple times without being stopped first
        nowPlaying = true;
        intervalContainer = setInterval(PlayField_Update, ANIMATION_SPEED);
    }
});

btn_stop.addEventListener("click", function () {
    nowPlaying = false;
    clearInterval(intervalContainer);
});

// Extend the HTML Table Cell to contain properties and methods we're going to need
HTMLTableCellElement.prototype.alive = false;
HTMLTableCellElement.prototype.aliveNextFrame = false;
HTMLTableCellElement.prototype.kill = function () {
    this.alive = false;
    this.style.backgroundColor = "white";
}

HTMLTableCellElement.prototype.revive = function () {
    this.alive = true;
    this.style.backgroundColor = "black";
}

HTMLTableCellElement.prototype.killNextFrame = function () {
    this.aliveNextFrame = false;
}

HTMLTableCellElement.prototype.reviveNextFrame = function () {
    this.aliveNextFrame = true;
}


function PlayField_Create() {
    for (let height = 0; height < PLAYFIELD_HEIGHT; height++) {
        let curRow = [];
        let row = tbl_playField.insertRow(height);
        for (let width = 0; width < PLAYFIELD_WIDTH; width++) {
            let curCell = row.insertCell(width);
            // Add eventlisteners to all cells to be able to "draw" cells with mouse
            curCell.addEventListener("mouseover", function (e) {
                if (e.buttons === 1) {
                    // primary mouse button
                    this.revive();
                } else if (e.buttons === 2) {
                    // secondary mouse button
                    this.kill();
                }
            });

            // For some reason, single clicks over cells are not handled by events above,
            // so we have to write them out separately
            curCell.addEventListener("click", function (e) {
                // primary mouse button
                this.revive();
            });
            curCell.addEventListener("contextmenu", function (e) {
                // secondary mouse button
                this.kill();
            });
            curRow.push(curCell);
        }
        playfield.push(curRow);
    }
}

function PlayField_Update() {
    // Decide the state of the field for the next frame
    for (let y = 0; y < playfield.length; y++) {
        // Iterate through rows
        let curRow = playfield[y];
        for (let x = 0; x < curRow.length; x++) {
            // Iterate through the cells in the row
            let curCell = curRow[x];
            let neighbors = getNeighborsOf(x, y);
            let liveNeighborsCount = getLiveNeighborsCount(neighbors);

            if (curCell.alive) {
                // Any live cell with two or three live neighbours lives on to the next generation.
                // If fewer than 2 negihbors - dies as if by underpopulation
                // If more than 3 negihbors - dies as if by overpopulation
                if (liveNeighborsCount === 2 || liveNeighborsCount === 3) {
                    curCell.reviveNextFrame();
                } else {
                    curCell.killNextFrame();
                }
            } else {
                // Any dead cell with exactly three live neighbours becomes a live cell, 
                // as if by reproduction.
                if (liveNeighborsCount === 3) {
                    curCell.reviveNextFrame();
                } else {
                    curCell.killNextFrame();
                }
            }
        }
    }

    // Redraw the field
    for (let row of playfield) {
        for (let cell of row) {
            if (cell.aliveNextFrame) {
                cell.revive();
            } else {
                cell.kill();
            }
        }
    }
}

function getLiveNeighborsCount(_neighbors) {
    let result = 0;
    for (const neighbor of _neighbors) {
        if (neighbor.alive) {
            result++;
        }
    }

    return result;
}

function getCellAt(_x, _y) {
    // Dedicated function for getting cell at coordinates (x, y)
    // to enable "wrapping around" of the play field
    x_actual = (_x === -1) ? PLAYFIELD_WIDTH - 1 : _x % PLAYFIELD_WIDTH;
    y_actual = (_y === -1) ? PLAYFIELD_HEIGHT - 1 : _y % PLAYFIELD_HEIGHT;
    return playfield[y_actual][x_actual];
}

function getNeighborsOf(_x, _y) {
    let neighbors = [];
    for (let x_offset = -1; x_offset <= 1; x_offset++) {
        for (let y_offset = -1; y_offset <= 1; y_offset++) {
            // offset (0, 0) is the cell itself, so ignore it
            if (x_offset === 0 && y_offset === 0) continue;
            neighbors.push(getCellAt(_x + x_offset, _y + y_offset));
        }
    }

    return neighbors;
}
