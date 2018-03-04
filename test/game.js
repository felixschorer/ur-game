const should = require('chai').should();
const rewire = require('rewire');

const { List, Map } = require('immutable');

const ur = rewire('../src/game');

const sharedFields = ur.__get__('SHARED_FIELDS');
const rerollFields = ur.__get__('REROLL_FIELDS');
const safeFields = ur.__get__('SAFE_SHARED_FIELDS');

const rollDice = ur.__get__('rollDice');
const diceResult = ur.__get__('diceResult');
const otherPlayer = ur.__get__('otherPlayer');
const createBoard = ur.__get__('createBoard');
const winner = ur.__get__('winner');
const isMoveLegal = ur.__get__('isMoveLegal');
const possibleMoves = ur.__get__('possibleMoves');
const moveStone = ur.__get__('moveStone');
const makeMove = ur.__get__('makeMove');
const startTurn = ur.__get__('startTurn');
const endTurn = ur.__get__('endTurn');


describe('rollDice', () => {
    it('should return an immutable list', () => {
        rollDice(4).should.satisfy(List.isList);
    });

    it('should return the correct number of dice', () => {
        for(let dice = 0; dice < 10; dice++) rollDice(dice).size.should.equal(dice);
    });

    it('should return only dice with values of either 0 or 1', () => {
        for(let i = 0; i < 10; i++) rollDice(4).forEach(dice => {
            dice.should.be.oneOf([0, 1]);
        });
    });
});

describe('diceResult', () => {
    it('should return the correct dice result', () => {
        diceResult(new List([1 , 1, 0, 1])).should.equal(3);
    });
});

describe('otherPlayer', () => {
    it('should return the other player', () => {
        otherPlayer('w').should.equal('b');
        otherPlayer('b').should.equal('w');
    });
});

describe('createBoard', () => {
    it('should return a board of correct size', () => {
        const board = createBoard(0);
        board.should.satisfy(List.isList);
        board.size.should.equal(16);
    });

    it('should place all stones only in the first field', () => {
        const board = createBoard(7);
        board.rest().forEach(field => {
            field.should.satisfy(Map.isMap);
            field.get('w').should.equal(0);
            field.get('b').should.equal(0);
        });
    });

    it('should place the correct amount of stones in the first field', () => {
        for(let stones = 0; stones < 10; stones++) {
            const field = createBoard(stones).first();
            field.should.satisfy(Map.isMap);
            field.toObject().should.include({ b: stones });
            field.toObject().should.include({ w: stones });
        }
    });
});

describe('winner', () => {
    it('should return undefined if there is no winner', () => {
        should.not.exist(winner(createBoard(7)));
    });

    it('should return the correct winner', () => {
        winner(moveStone('b', 0, 15, createBoard(1))).should.equal('b');
        winner(moveStone('w', 0, 15, createBoard(1))).should.equal('w');
    });
});

describe('isMoveLegal', () => {
    it('should be illegal to move a stone to a field occupied by the same player', () => {
        for(let field = 1; field <= 14; field++) {
            const player = Math.round(Math.random()) ? 'w' : 'b';
            const board = moveStone(player, 0, field, createBoard(2));
            isMoveLegal(player, field, board).should.equal(false);
        }
    });

    it('should be legal to move a stone to a field occupied by another player, unless its a blockable field', () => {
        for(let field = 1; field <= 14; field++) {
            const player = Math.round(Math.random()) ? 'w' : 'b';
            const board = moveStone(otherPlayer(player), 0, field, createBoard(2));
            isMoveLegal(player, field, board).should.equal(!safeFields.has(field));
        }
    });

    it('should always be legal to move a stone to the last field', () => {
        let board = createBoard(2);
        isMoveLegal('b', 15, board).should.equal(true);
        isMoveLegal('w', 15, board).should.equal(true);

        board = moveStone('b', 0, 15, moveStone('w', 0, 15, board));
        isMoveLegal('b', 15, board).should.equal(true);
        isMoveLegal('w', 15, board).should.equal(true);
    });
});

describe('possibleMoves', () => {
    it('should only be possbible to move exactly by the dice result', () => {
        const moves = possibleMoves('w', 4, createBoard(1));
        moves.size.should.equal(1);
        moves.toObject().should.include({ '0': 4 });
    });

    it('should be possible to move one field ahead of a blockable field if its blocked by the other player', () => {
        const blockedField = safeFields.first();
        const board = moveStone('w', 0, blockedField, createBoard(1));
        possibleMoves('b', blockedField, board).toObject().should.include({ '0': blockedField + 1 });
    });

    it('should not be possible to move one field ahead of a blockable field if its blocked by the same player', () => {
        const blockedField = safeFields.first();
        const board = moveStone('w', 0, blockedField, createBoard(1));
        possibleMoves('w', blockedField, board).toObject().should.not.include({ '0': blockedField + 1 });
    });

    it('should not be possible to move with a dice result of 0', () => {
        possibleMoves('w', 0, createBoard(1)).size.should.equal(0);
    });

    it('should not be possible to move with no stones on the board', () => {
        possibleMoves('w', 1, createBoard(0)).size.should.equal(0);
    });

    it('should not be possible to move if the dice result exceeds the board size', () => {
        const board = moveStone('b', 0, 14, createBoard(1));
        possibleMoves('b', 10, board).size.should.equal(0);
    });

    it('should not be possible to move if all destinations are occupied by the same player', () => {
        const board = moveStone('b', 0, 14, moveStone('b', 0, 12, createBoard(2)));
        possibleMoves('b', 2, board).size.should.equal(0);
    });

    it('should be possible to move to not occupied fields', () => {
        const board = moveStone('b', 0, 10, createBoard(2));
        possibleMoves('b', 2, board).size.should.equal(2);
    });

    it('should be possible to move to a not blockable field occupied by another player', () => {
        safeFields.toArray().should.not.include(9);
        safeFields.toArray().should.not.include(14);
        const board = moveStone('w', 0, 5, moveStone('b', 0, 14, moveStone('b', 0, 9, createBoard(2))));
        const moves = possibleMoves('w', 9, board);
        moves.toObject().should.include({ '0': 9 });
        moves.toObject().should.include({ '5': 14 });
    });
});

describe('moveStone', () => {
    it('should update the board correctly', () => {
        let board = moveStone('w', 0, 4, createBoard(2));
        board.get(0).get('w').should.equal(1);
        board.get(4).get('w').should.equal(1);
        board = moveStone('w', '4', '0', board);
        board.get(0).get('w').should.equal(2);
        board.get(4).get('w').should.equal(0);
    });
});

describe('makeMove', () => {
    it('should not throw non existent stones', () => {
        const sharedField = sharedFields.first();
        const board = makeMove('w', 0, sharedField, createBoard(2));
        board.get(sharedField).get('b').should.equal(0);
        board.get(0).get('b').should.equal(2);
    });

    it('should throw the correct stone', () => {
        const sharedField = sharedFields.first();
        const board = makeMove('w', 0, sharedField, moveStone('b', 0, sharedField, createBoard(2)));
        board.get(sharedField).get('b').should.equal(0);
        board.get(0).get('b').should.equal(2);

        const board2 = makeMove('w', '0', sharedField.toString(), moveStone('b', 0, sharedField, createBoard(2)));
        board2.get(sharedField).get('b').should.equal(0);
        board2.get(0).get('b').should.equal(2);
    });

    it('should only throw stones on shared fields', () => {
        let board = createBoard(15);
        board.rest().forEach((_, field) => {
            board = makeMove('w', 0, field + 1, board);
        });
        board.rest().forEach((_, field) => {
            board = makeMove('b', 0, field + 1, board);
        });
        board.get(0).get('w').should.equal(sharedFields.size);
        board.filterNot((_, field) => sharedFields.has(field)).forEach(stones => {
            stones.get('w').should.satisfy(stones => stones > 0);
        });
    });
});

describe('startTurn', () => {
    it('should return a game state', () => {
        const state = startTurn('w', 4, createBoard(1)).toObject();
        state.should.have.all.keys('currentPlayer', 'dice', 'diceResult', 'possibleMoves', 'board');
    });
});

describe('endTurn', () => {
    it('should alternate between player turns', () => {
        const state = new Map({
            currentPlayer: 'w',
            possibleMoves: new Map(),
            dice: new List([0, 0, 0, 0]),
            board: createBoard(1)
        });
        endTurn('w', 0, state).get('currentPlayer').should.equal('b');
    });

    it('should deny wrong player input', () => {
        const state = new Map({
            currentPlayer: 'w',
            possibleMoves: new Map(),
            dice: new List([0, 0, 0, 0]),
            board: createBoard(1)
        });
        endTurn('b', 0, state).should.equal(false);
    });

    it('should grant a reroll when landing on a reroll field', () => {
        const state = new Map({
            currentPlayer: 'w',
            possibleMoves: new Map().set('0', rerollFields.first()),
            dice: new List([0, 0, 0, 0]),
            board: createBoard(1)
        });
        endTurn('w', 0, state).get('currentPlayer').should.equal('w');
    });

    it('should announce the winner', () => {
        const state = new Map({
            currentPlayer: 'w',
            possibleMoves: new Map().set('0', 15),
            dice: new List([0, 0, 0, 0]),
            board: createBoard(1)
        });
        endTurn('w', 0, state).get('winner').should.equal('w');
    });
});



