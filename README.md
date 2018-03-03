
[![npm version](https://badge.fury.io/js/ur-game.svg)](https://badge.fury.io/js/ur-game)
# The Royal Game of Ur
This module implements the logic of the [Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur)
using the rules from the [British Museum / Irving Finkel](https://www.mastersofgames.com/rules/royal-ur-rules.htm).

## Installation
```bash
npm install ur-game
```

## Usage
```javascript
const Ur = require('ur-game');

// Ur(stones?: number, dice?: number, player?: string)
const game = new Ur();
// default: stones = 7, dice = 4, player = Ur.WHITE

let state = game.getState();
// possible state:
// state.currentPlayer -> 'w'
// state.diceResult -> 3
// state.possibleMoves -> { '0': 3 }

// takeTurn(player: string, move?: string | number)
game.takeTurn(Ur.WHITE, 0);  // or game.takeTurn('w', 0);
// returns false on invalid input
// returns new state otherwise
// move is allowed to be undefined should there be no possible move

// voidTurn(player: string)
game.voidTurn(Ur.BLACK);
// returns false when not the current player is input, new state otherwise
// useful for ending turns after a certain amount of time
```

Alternatively you can keep track of the state yourself.
```javascript
const Ur = require('ur-game');

// startGame(stones?: number, dice?: number, player?: string)
let state = Ur.startGame(7, 4, Ur.BLACK);
// default: stones = 7, dice = 4, player = Ur.WHITE

// possible state:
// state.currentPlayer -> 'b'
// state.diceResult -> 2
// state.possibleMoves -> { '0': 2 }

// takeTurn(state: Object, player: string, move?: string | number)
state = Ur.takeTurn(state, Ur.BLACK, 0);  // or Ur.takeTurn(state, 'b', 0)
// returns false on invalid input, new state otherwise
// move is allowed to be undefined should there be no possible move

// voidTurn(state: Object, player: string)
state = Ur.voidTurn(state, Ur.WHITE);
// returns false when not the current player is input, new state otherwise
// useful for ending turns after a certain amount of time
```

## State
```javascript
state.currentPlayer  
// either 'w' or 'b'
// (undefined after game has been finished)

state.dice
// array of individual dice
// [ 0, 1, 1, 0 ]
// (undefined after game has been finished)

state.diceResult
// result of the dice roll
// (undefined after game has been finished)

state.board
// representation of the board as a list of objects
// index 0 and 15 aren't actual fields on the board 
// they represent the starting and finishing point respectively
// [ 
//     { w: 7, b: 7 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 },
//     { w: 0, b: 0 } 
// ] 

state.possibleMoves
// an object containing all legal moves based on the result of dice roll
// the key of each key value pair is the starting point of the move
// the value is the field the player would land on
// { '0': 2 }
// (undefined after game has been finished)

state.winner
// either 'w', 'b' or undefined
```

## Pretty State
`Ur.prettifyState(state);` returns a prettified version of the state.  
`Ur.uglifyState(state);` converts a prettified state back to its original representation.