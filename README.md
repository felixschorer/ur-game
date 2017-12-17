
[![npm version](https://badge.fury.io/js/ur-game.svg)](https://badge.fury.io/js/ur-game)
# ur-game
This module implements the logic of the [Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur)
using the rules from the [British Museum / Irving Finkel](https://www.mastersofgames.com/rules/royal-ur-rules.htm).

## Installation
```bash
npm install ur-game
```

## Usage
```javascript
const Ur = require('ur-core');

// Ur(stones: number, dice: number)
const game = new Ur(7, 4);

const state = game.getState();
// state.currentPlayer -> 'w'
// state.possibleMoves -> { '0': 3}


// takeTurn(player: string, move: number)
game.takeTurn('w', 0);
// returns false on invalid input
// returns new state otherwise
```

## State
```javascript
state.currentPlayer  
// either 'w' or 'b'

state.dice
// [ 0, 1, 1, 0 ]
// Array of individual dice

state.diceResult
// result of the dice roll

state.board
// state.board[0] -> home base
// state.board[15] -> goal
// [ 
//     { w: 7, b: 7, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] },
//     { w: 0, b: 0, metadata: [Object] } 
// ] 

state.board[8].metadata
// { shared: true, reroll: true, safe: true }
// shared: field used by both players
// reroll: player gets an other turn when landing on it, usually marked with a star on the board
// safe: player can't be thrown on this field, false for not shared fields

state.possibleMoves
// { '0': 2 }
// { from: to }
```