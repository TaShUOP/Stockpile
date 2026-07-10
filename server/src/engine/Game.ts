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
    
    // 1. Information Phase
    for (let p of this.players) {
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
    // Auction logic initialization
  }

  startActionPhase() {
    // Action logic initialization
  }

  startSellingPhase() {
    // Selling logic initialization
  }

  startMovementPhase() {
    // Market movement logic initialization
  }

  endGame() {
    // Calculate winners
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
      stockpiles: this.stockpiles.map(s => ({
        cards: s.cards, // Note: hidden cards should be masked here later
        bids: s.bids
      })),
      players: this.players.map(p => p.getPublicData())
    };
  }
}

