import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './Game';
import { Player } from './Player';

test('GameEngine - Initialization and Setup', (t) => {
  const game = new GameEngine('room1', 'host1');
  assert.equal(game.roomId, 'room1');
  assert.equal(game.hostId, 'host1');
  assert.equal(game.currentPhase, 0);

  const p1 = game.addPlayer('p1_socket', 'Player 1');
  const p2 = game.addPlayer('p2_socket', 'Player 2');
  
  assert.equal(game.players.length, 2);
  assert.equal(p1.cash, 20000);

  game.startGame();
  assert.equal(game.hasStarted, true);
  assert.equal(game.maxRounds, 7); // 2 player game = 7 rounds
  assert.equal(game.currentPhase, 1); // Starts at Information Phase
  assert.equal(game.stockpiles.length, 2); // 1 pile per player
});

test('GameEngine - Bidding Logic (Phase 3)', (t) => {
  const game = new GameEngine('room1', 'host1');
  const p1 = game.addPlayer('p1', 'Player 1');
  const p2 = game.addPlayer('p2', 'Player 2');
  
  game.startGame();
  // Skip to Phase 3
  game.currentPhase = 2;
  game.nextPhase();
  assert.equal(game.currentPhase, 3);
  
  assert.deepEqual(game.unplacedBidders, ['p1', 'p2']);
  
  // p1 bids $1000 on Pile 0
  game.placeBid('p1', 0, 1000);
  assert.equal(game.stockpiles[0].bids.length, 1);
  assert.equal(game.stockpiles[0].bids[0].amount, 1000);
  
  // unplacedBidders should now just be ['p2']
  assert.deepEqual(game.unplacedBidders, ['p2']);
  
  // p2 bids $2000 on Pile 0 (bumps p1)
  game.placeBid('p2', 0, 2000);
  assert.equal(game.stockpiles[0].bids.length, 2);
  assert.equal(game.stockpiles[0].bids[1].playerId, 'p2');
  
  // unplacedBidders should now have p1 bumped to the front
  assert.deepEqual(game.unplacedBidders, ['p1']);
  
  // p1 bids $0 on Pile 1 (empty)
  game.placeBid('p1', 1, 0);
  assert.equal(game.stockpiles[1].bids.length, 1);
  
  // Queue is empty, auction should resolve automatically and transition to Phase 4
  assert.equal(game.unplacedBidders.length, 0);
  assert.equal(game.currentPhase, 4);
  
  // Verify cash deduction
  assert.equal(p1.cash, 20000); // Bidded 0
  assert.equal(p2.cash, 18000); // Bidded 2000
});

test('GameEngine - Market Movement (Phase 6)', (t) => {
  const game = new GameEngine('room1', 'host1');
  const p1 = game.addPlayer('p1', 'Player 1');
  
  // Mock some portfolio and forecasts
  game.companyTracks['Megacorp Industries'] = 8;
  game.companyTracks['Byteonics Inc.'] = 2;
  
  p1.portfolio['Megacorp Industries'] = 5;
  p1.portfolio['Byteonics Inc.'] = 3;
  
  // Add some movements that trigger Split (hits 10) and Bankrupt (hits 0)
  game.publicForecast = { company: 'Megacorp Industries', movement: 3 }; // 8 + 3 = 11 (Split)
  p1.hiddenCompanyCard = 'Byteonics Inc.';
  p1.hiddenForecastCard = { company: 'Byteonics Inc.', movement: -3 }; // 2 - 3 = -1 (Bankrupt)

  game.startMovementPhase();
  
  // Megacorp should have split: shares double, track resets to 5
  assert.equal(p1.portfolio['Megacorp Industries'], 10);
  assert.equal(game.companyTracks['Megacorp Industries'], 5);
  
  // Byteonics should have bankrupt: shares to 0, track resets to 5
  assert.equal(p1.portfolio['Byteonics Inc.'], 0);
  assert.equal(game.companyTracks['Byteonics Inc.'], 5);
});
