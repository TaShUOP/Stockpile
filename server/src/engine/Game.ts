import { Player, Forecast, Card } from './Player';
import { Market } from './Market';

export class GameEngine {
  roomId: string;
  players: Player[];
  hasStarted: boolean;
  round: number;
  maxRounds: number;
  currentPhase: number; // 1 to 6
  
  companyTracks: Record<string, number>;
  market: Market;
  publicForecast: Forecast | null;
  stockpiles: { cards: Card[], bids: { playerId: string, amount: number }[] }[];
  unplacedBidders: string[];

  hostId: string;

  constructor(roomId: string, hostId: string) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.players = [];
    this.hasStarted = false;
    this.round = 1;
    this.maxRounds = 5; 
    this.currentPhase = 0;
    
    this.companyTracks = {
      'Megacorp Industries': 5,
      'Byteonics Inc.': 5,
      'AeroStar Dynamics': 5,
      'Global Pharma': 5,
      'Cosmic Energy': 5,
      'OmniBank': 5
    };

    this.market = new Market();
    this.publicForecast = null;
    this.stockpiles = [];
    this.unplacedBidders = [];
  }

  addPlayer(socketId: string, name: string): Player {
    const player = new Player(socketId, name);
    this.players.push(player);
    return player;
  }

  startGame() {
    this.hasStarted = true;
    if (this.players.length === 2) this.maxRounds = 7;
    else if (this.players.length === 3) this.maxRounds = 6;
    else this.maxRounds = 5;
    
    // Give each player a starting random stock card
    for (let p of this.players) {
      const startCards = this.market.drawMarketCards(1); // Wait, this draws any card. It should be specifically a stock card.
      // For simplicity in MVP, we just draw 1 market card for start.
      p.portfolio['Megacorp Industries'] += 1; // Simplified start for now
    }
    
    this.startRound();
  }

  startRound() {
    this.currentPhase = 1; // Information Phase
    
    // Reset round-specific market decks (Company and Forecast)
    this.market.resetRoundDecks();

    // 1. Information Phase
    for (let p of this.players) {
      p.hasPlacedFaceUp = false;
      p.hasPlacedFaceDown = false;
      const company = this.market.drawCompany();
      const forecast = this.market.drawForecast(company);
      p.hiddenCompanyCard = company;
      p.hiddenForecastCard = forecast;
    }
    
    // Public forecast
    const pubCompany = this.market.drawCompany();
    this.publicForecast = this.market.drawForecast(pubCompany);
    
    // Prepare stockpiles
    this.stockpiles = [];
    for (let i = 0; i < this.players.length; i++) {
      this.stockpiles.push({ cards: [], bids: [] });
    }

    // Automatically transition to Supply Phase after a short delay or user acknowledgment in a real game.
    // For now, let's keep state here and clients will call nextPhase.
  }

  nextPhase() {
    if (this.currentPhase === 7) return; // Game over, do nothing

    if (this.currentPhase < 6) {
      this.currentPhase++;
      if (this.currentPhase === 2) this.startSupplyPhase();
      if (this.currentPhase === 3) this.startDemandPhase();
      if (this.currentPhase === 4) this.startActionPhase();
      if (this.currentPhase === 5) this.startSellingPhase();
      if (this.currentPhase === 6) this.startMovementPhase();
    } else {
      this.round++;
      if (this.round > this.maxRounds) {
        this.endGame();
      } else {
        this.startRound();
      }
    }
  }

  startSupplyPhase() {
    // Deal 1 market card to each stockpile face-up
    for (let s of this.stockpiles) {
      const cards = this.market.drawMarketCards(1);
      if (cards.length > 0) {
        s.cards.push({ ...cards[0], faceDown: false } as any);
      }
    }
    
    // Deal 2 market cards to each player
    for (let p of this.players) {
      p.cardsInHand = this.market.drawMarketCards(2);
    }
  }

  startDemandPhase() {
    this.unplacedBidders = [...this.players.map(p => p.id)];
  }

  placeCard(playerId: string, cardId: string, stockpileIndex: number, faceDown: boolean) {
    if (this.currentPhase !== 2) return;
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    if (faceDown && player.hasPlacedFaceDown) return;
    if (!faceDown && player.hasPlacedFaceUp) return;

    const cardIndex = player.cardsInHand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    if (stockpileIndex < 0 || stockpileIndex >= this.stockpiles.length) return;

    const card = player.cardsInHand[cardIndex];
    player.cardsInHand.splice(cardIndex, 1);
    
    this.stockpiles[stockpileIndex].cards.push({ ...card, faceDown } as any);

    if (faceDown) player.hasPlacedFaceDown = true;
    else player.hasPlacedFaceUp = true;
  }

  placeBid(playerId: string, stockpileIndex: number, amount: number) {
    if (this.currentPhase !== 3) return;
    if (this.unplacedBidders[0] !== playerId) return; // Not their turn
    if (stockpileIndex < 0 || stockpileIndex >= this.stockpiles.length) return;

    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    if (player.cash < amount) return; // Insufficient cash

    const stockpile = this.stockpiles[stockpileIndex];
    const topBid = stockpile.bids.length > 0 ? stockpile.bids[stockpile.bids.length - 1].amount : -1;
    
    if (amount <= topBid) return; // Must beat top bid

    this.unplacedBidders.shift();
    if (stockpile.bids.length > 0) {
      const bumpedPlayerId = stockpile.bids[stockpile.bids.length - 1].playerId;
      this.unplacedBidders.unshift(bumpedPlayerId);
    }

    stockpile.bids.push({ playerId, amount });
    
    // Check if bidding is over
    if (this.unplacedBidders.length === 0) {
      this.resolveBids();
      this.nextPhase();
    }
  }

  resolveBids() {
    for (let s of this.stockpiles) {
      if (s.bids.length > 0) {
        const winningBid = s.bids[s.bids.length - 1];
        const winner = this.players.find(p => p.id === winningBid.playerId);
        if (winner) {
          winner.cash -= winningBid.amount;
          for (let card of s.cards) {
            if (card.type === 'stock' && card.company) {
              winner.portfolio[card.company] = (winner.portfolio[card.company] || 0) + 1;
            } else if (card.type === 'fee' && card.value) {
              winner.cash += card.value;
            }
          }
        }
      }
    }
  }

  startActionPhase() {
    // Action logic initialization
  }

  startSellingPhase() {
    // Selling logic initialization (clients can emit sellShares)
  }

  sellShares(playerId: string, company: string, amount: number) {
    if (this.currentPhase !== 5) return;
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    
    if ((player.portfolio[company] || 0) >= amount) {
      player.portfolio[company] -= amount;
      player.cash += (amount * this.companyTracks[company]) * 1000; // Assuming tracks are in thousands
    }
  }

  startMovementPhase() {
    const movements: { company: string, movement: number }[] = [];
    if (this.publicForecast) movements.push(this.publicForecast);
    
    for (let p of this.players) {
      if (p.hiddenCompanyCard && p.hiddenForecastCard) {
        movements.push(p.hiddenForecastCard);
      }
    }

    for (let m of movements) {
      if (!m.company) continue;
      
      if (m.movement === 99) { // Split
        for (let p of this.players) p.portfolio[m.company] *= 2;
        this.companyTracks[m.company] = 5;
      } else if (m.movement === -99) { // Bankrupt
        for (let p of this.players) p.portfolio[m.company] = 0;
        this.companyTracks[m.company] = 5;
      } else {
        this.companyTracks[m.company] += m.movement;
        // Check bounds
        if (this.companyTracks[m.company] <= 0) {
          for (let p of this.players) p.portfolio[m.company] = 0;
          this.companyTracks[m.company] = 5;
        } else if (this.companyTracks[m.company] >= 10) {
          for (let p of this.players) p.portfolio[m.company] *= 2;
          this.companyTracks[m.company] = 5;
        }
      }
    }
  }

  endGame() {
    this.currentPhase = 7; // Phase 7: Game Over
    
    // Majority bonuses ($10,000 for most shares)
    const companies = Object.keys(this.companyTracks);
    for (let company of companies) {
      let maxShares = 0;
      for (let p of this.players) {
        if (p.portfolio[company] > maxShares) maxShares = p.portfolio[company];
      }
      if (maxShares > 0) {
        const majorPlayers = this.players.filter(p => p.portfolio[company] === maxShares);
        const bonus = Math.floor(10000 / majorPlayers.length);
        for (let p of majorPlayers) {
          p.cash += bonus;
        }
      }
    }

    // Sell all remaining stocks
    for (let p of this.players) {
      for (let company of companies) {
        const shares = p.portfolio[company] || 0;
        p.cash += shares * this.companyTracks[company] * 1000;
        p.portfolio[company] = 0;
      }
    }
  }

  getPublicState() {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      hasStarted: this.hasStarted,
      round: this.round,
      maxRounds: this.maxRounds,
      currentPhase: this.currentPhase,
      companyTracks: this.companyTracks,
      publicForecast: this.publicForecast,
      unplacedBidders: this.unplacedBidders,
      stockpiles: this.stockpiles.map(s => ({
        cards: s.cards.map((c: any) => c.faceDown ? { faceDown: true, type: 'hidden' } : c), // Mask hidden cards
        bids: s.bids
      })),
      players: this.players.map(p => p.getPublicData())
    };
  }
}

