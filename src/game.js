const { List, Set, Map } = require('immutable');

const sharedFields = Set([5, 6, 7, 8, 9, 10, 11, 12]);
const rerollFields = Set([4, 8, 14]);
const safeFields = rerollFields.intersect(sharedFields);

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
    return new List(new Array(16)).map((_, field) => new Map({
        w: !field ? numStones : 0,
        b: !field ? numStones : 0,
        metadata: {
            shared: sharedFields.has(field),
            reroll: rerollFields.has(field),
            safe: safeFields.has(field)
        }
    }))
}

function winner(board) {
    return board.reduce(
        (occupies, stones) => occupies.map((fields, player) => fields + (stones.get(player) > 0)),
        Map({ w: 0, b: 0 })
    ).filter((fields, player) => fields === 1 && board.get(15).get(player) > 0).keySeq().first();
}

function isMoveLegal(player, dest, board) {
    return dest === 15 || dest < 16 && !board.get(dest).get(player)
        && !(safeFields.has(dest) && board.get(dest).get(otherPlayer(player)));
}

function possibleMoves(player, diceResult, board) {
    return board.reduce(
        (moves, stones, field) => (
            stones.get(player) && diceResult > 0
                ? (dest =>
                     isMoveLegal(player, dest, board)
                        ? moves.set(field, dest)
                        : safeFields.has(dest) && !board.get(dest).get(player) // only if occupied by opponent
                            && isMoveLegal(player, dest + 1, board)
                            ? moves.set(field, dest + 1)
                            : moves
                )(field + diceResult)
                : moves
        ),
        Map()
    );
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
    return (board =>
        sharedFields.has(to) && board.get(to).get(otherPlayer(player)) > 0
            ? moveStone(otherPlayer(player), to, 0, board)
            : board
    )(moveStone(player, from, to, board));
}

function startTurn(player, numDice, board) {
    return (dice =>
        (diceResult => Map({
            currentPlayer: player,
            dice: dice,
            diceResult: diceResult,
            possibleMoves: possibleMoves(player, diceResult, board),
            board: board
        }))(diceResult(dice))
    )(rollDice(numDice));
}

function endTurn(player, selField, state) {
    return ((currentPlayer, possibleMoves, numDice, board) =>
        player === currentPlayer && (possibleMoves.has(selField) || possibleMoves.size === 0)
            ? (board =>
                (winner =>
                    typeof winner !== 'undefined'
                        ? Map({ winner: winner, board: board })
                        : rerollFields.has(possibleMoves.get(selField))
                            ? startTurn(player, numDice, board)
                            : startTurn(otherPlayer(player), numDice, board)
                )(winner(board))
            )(!possibleMoves.size ? board : makeMove(player, selField, possibleMoves.get(selField), board))
            : false
    )(state.get('currentPlayer'), state.get('possibleMoves'), state.get('dice').size, state.get('board'));
}

class Ur {
    constructor(numStones, numDice) {
        this._state = startTurn('w', numDice, createBoard(numStones));
    }

    getState() {
        return this._state.toJS();
    }

    takeTurn(player, selectedField) {
        const state = endTurn(player, selectedField, this._state);
        if (state) {
            this._state = state;
            return this.getState();
        }
        return false;
    }
}

module.exports = Ur;