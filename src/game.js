const { fromJS, List, Set, Map } = require('immutable');

const START = 0;
const FINISH = 15;
const SHARED_FIELDS = new Set([5, 6, 7, 8, 9, 10, 11, 12]);         // fields shared by both players
const REROLL_FIELDS = new Set([4, 8, 14]);                          // fields when landed upon provide an other turn
const SAFE_SHARED_FIELDS = REROLL_FIELDS.intersect(SHARED_FIELDS);  // shared fields which are safe to sit on
const MULTI_FIELDS = new Set([START, FINISH]);                      // fields which allow multiple stones

const boardLayout = [
    [[13, 'w'], [12], [13, 'b']],
    [[14, 'w'], [11], [14, 'b']],
    [[15, 'w'], [10], [15, 'b']],
    [[0,  'w'], [9],  [0,  'b']],
    [[1,  'w'], [8],  [1,  'b']],
    [[2,  'w'], [7],  [2,  'b']],
    [[3,  'w'], [6],  [3,  'b']],
    [[4,  'w'], [5],  [4,  'b']]
];

function otherPlayer(player) {
    return player === 'w' ? 'b' : 'w';
}

function rollDice(numDice) {
    return List(new Array(numDice).fill().map(() => Math.round(Math.random())));
}

function diceResult(dice) {
    return dice.reduce((t, d) => t + d);
}

function createBoard(numStones) {
    return new List(new Array(FINISH + 1)).map((_, field) => new Map({
        w: field === START ? numStones : 0,
        b: field === START ? numStones : 0,
    }));
}

function winner(board) {
    return board
        .reduce(
            (occupies, stones) => occupies.map((fields, player) => fields + (stones.get(player) > 0)),
            new Map({ w: 0, b: 0 })
        )
        .filter((fields, player) => fields === 1 && board.get(FINISH).get(player) > 0).keySeq().first();
}

function isMoveLegal(player, dest, board) {
    return dest <= FINISH && (!board.get(dest).get(player) || MULTI_FIELDS.has(dest))
        && !(SAFE_SHARED_FIELDS.has(dest) && board.get(dest).get(otherPlayer(player)));
}

function possibleMoves(player, diceResult, board) {
    return board.reduce((moves, stones, field) => {
        if (!stones.get(player) || diceResult === 0) return moves;
        const dest = field + diceResult;
        if(isMoveLegal(player, dest, board)) {
            return moves.set(field.toString(), dest);
        } else if(SAFE_SHARED_FIELDS.has(dest) && !!board.get(dest).get(otherPlayer(player))
            && isMoveLegal(player, dest + 1, board)) {
            return moves.set(field.toString(), dest + 1)
        } else {
            return moves;
        }
    }, new Map());
}

function updateStones(field, player, board, updater) {
    return board.update(field, stones => stones.update(player, updater));
}

function incStones(field, player, board) {
    return updateStones(field, player, board, stones => stones + 1);
}

function decStones(field, player, board) {
    return updateStones(field, player, board, stones => stones - 1);
}

function moveStone(player, from, to, board) {
    return incStones(to, player, decStones(from, player, board));
}

function makeMove(player, from, to, board) {
    to = typeof to === 'number' ? to : parseInt(to);
    const newBoard = moveStone(player, from, to, board);
    if(SHARED_FIELDS.has(to) && newBoard.get(to).get(otherPlayer(player)) > 0) {
        return moveStone(otherPlayer(player), to, START, newBoard);
    }
    return newBoard;
}

function startTurn(player, numDice, board) {
    const dice = rollDice(numDice);
    const  diceRoll = diceResult(dice);
    return new Map({
        currentPlayer: player,
        dice: dice,
        diceResult: diceRoll,
        possibleMoves: possibleMoves(player, diceRoll, board),
        board: board
    });
}

function endTurn(player, selField, state) {
    selField = typeof selField !== 'undefined' && selField.toString();
    const currentPlayer = state.get('currentPlayer');
    const possibleMoves = state.get('possibleMoves');
    const numDice = state.get('dice').size;
    const board = state.get('board');
    if (player === currentPlayer && (possibleMoves.has(selField) || possibleMoves.size === 0)) {
        const newBoard = !possibleMoves.size
            ? board : makeMove(player, selField, possibleMoves.get(selField), board);
        const winningPlayer = winner(newBoard);
        if (typeof winningPlayer !== 'undefined') return new Map({ winner: winningPlayer, board: newBoard });
        return startTurn(REROLL_FIELDS.has(possibleMoves.get(selField))
            ? player : otherPlayer(player), numDice, newBoard);
    }
    return false;
}

function startGame(numStones, numDice, player) {
    return startTurn(player === 'w' || player === 'b' ? player : 'w', numDice || 4, createBoard(numStones || 7));
}

function voidTurn(player, state) {
    return player === state.get('currentPlayer')
        ? startTurn(otherPlayer(player), state.get('dice').size, state.get('board'))
        : false;
}

class Ur {
    constructor(numStones, numDice, player) {
        this._state = startGame(numStones, numDice, player);
    }

    getState() {
        return this._state.toJS();
    }

    voidTurn(player) {
        return this._setState(voidTurn(player, this._state));
    }

    takeTurn(player, selectedField) {
        return this._setState(endTurn(player, selectedField, this._state));
    }

    _setState(state) {
        if (state) {
            this._state = state;
            return this.getState();
        }
        return false;
    }

    static startGame(numStones, numDice, player) {
        return startGame(numStones, numDice, player).toJS();
    }

    static voidTurn(state, player) {
        return Ur._stateToJs(voidTurn(player, fromJS(state)));
    }

    static takeTurn(state, player, selectedField) {
        return Ur._stateToJs(endTurn(player, selectedField, fromJS(state)));
    }

    static prettifyState(uglyState) {
        const prettyBoard = boardLayout.map(row => row.map(cell => {
            let [cellIndex, player] = cell;
            const boardCell = uglyState.board[cellIndex];
            player = player || (boardCell.w && 'w') || (boardCell.b && 'b') || null;
            return {
                player: player,
                cell: cellIndex,
                stones: boardCell[player] || 0,
                metadata: {
                    shared: SHARED_FIELDS.has(cellIndex),
                    safeShared: SAFE_SHARED_FIELDS.has(cellIndex),
                    reroll: REROLL_FIELDS.has(cellIndex),
                    multi: MULTI_FIELDS.has(cellIndex),
                    start: START === cellIndex,
                    finish: FINISH === cellIndex
                }
            };
        }));
        return Object.assign({}, uglyState, { board: prettyBoard });
    }

    static uglifyState(prettyState) {
        const uglyBoard = new Array(FINISH + 1).fill().map(() => ({ w: 0, b: 0 }));
        prettyState.board.forEach(row => row.forEach(cell => {
            if(cell.player) uglyBoard[cell.cell][cell.player] = cell.stones;
        }));
        return Object.assign({}, prettyState, { board: uglyBoard });
    }

    static _stateToJs(state) {
        if (Map.isMap(state)) return state.toJS();
        return state;
    }
}
Ur.BLACK = 'b';
Ur.WHITE = 'w';

module.exports = Ur;