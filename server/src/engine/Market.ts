import { Card, Forecast } from './Player';

export class Market {
  companyDeck: string[];
  forecastDeck: Forecast[];
  marketDeck: Card[];

  constructor() {
    this.companyDeck = [];
    this.forecastDeck = [];
    this.marketDeck = [];
    this.initializeDecks();
  }

  initializeDecks() {
    this.resetRoundDecks();

    const companies = [
      'Megacorp Industries',
      'Byteonics Inc.',
      'AeroStar Dynamics',
      'Global Pharma',
      'Cosmic Energy',
      'OmniBank'
    ];

    // Create Market Deck (stocks, fees, actions)
    for (let c of companies) {
      for (let i = 0; i < 8; i++) {
        this.marketDeck.push({ id: `stock-${c}-${i}`, type: 'stock', company: c });
      }
    }
    for (let i = 0; i < 5; i++) {
      this.marketDeck.push({ id: `action-boom-${i}`, type: 'action', actionType: 'boom' });
      this.marketDeck.push({ id: `action-bust-${i}`, type: 'action', actionType: 'bust' });
    }
    for (let i = 0; i < 8; i++) {
      this.marketDeck.push({ id: `fee-${i}`, type: 'fee', value: -2000 });
    }
    this.shuffle(this.marketDeck);
  }

  resetRoundDecks() {
    this.companyDeck = [];
    this.forecastDeck = [];

    const companies = [
      'Megacorp Industries',
      'Byteonics Inc.',
      'AeroStar Dynamics',
      'Global Pharma',
      'Cosmic Energy',
      'OmniBank'
    ];

    // Forecasts: +1 to +4, -1 to -3, split, bankrupt
    const possibleForecasts = [
      4, 3, 2, 2, 1, 1, 1,
      -1, -1, -2, -2, -3,
      99, // 99 means split
      -99 // -99 means bankrupt
    ];

    // Create Company Deck
    this.companyDeck = [...companies, ...companies]; // Provide enough cards
    this.shuffle(this.companyDeck);

    // Create Forecast Deck
    for (let f of possibleForecasts) {
      this.forecastDeck.push({ company: '', movement: f }); // Company is assigned during pairing
    }
    this.shuffle(this.forecastDeck);
  }

  shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  drawCompany(): string {
    return this.companyDeck.pop() || 'Megacorp Industries';
  }

  drawForecast(company: string): Forecast {
    const f = this.forecastDeck.pop() || { company: '', movement: 0 };
    return { ...f, company };
  }

  drawMarketCards(count: number): Card[] {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.marketDeck.length > 0) {
        drawn.push(this.marketDeck.pop()!);
      }
    }
    return drawn;
  }
}
