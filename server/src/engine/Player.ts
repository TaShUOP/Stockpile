export interface Card {
  id: string;
  type: 'stock' | 'action' | 'fee';
  company?: string; // For stocks
  actionType?: 'boom' | 'bust'; // For actions
  value?: number; // For fees (usually negative)
}

export interface Forecast {
  company: string;
  movement: number; // e.g., -2, +2, +3, 'split', 'bankrupt' (could be strings for special cases, let's use numbers for simplicity in type for now, and special enums later)
}

export class Player {
  id: string;
  name: string;
  cash: number;
  portfolio: Record<string, number>; // companyName -> amount of shares
  hiddenCompanyCard?: string;
  hiddenForecastCard?: Forecast;
  biddingMeeplePlaced: boolean;
  cardsInHand: Card[]; // Used during supply phase

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.cash = 20000;
    this.portfolio = {
      'Megacorp Industries': 0,
      'Byteonics Inc.': 0,
      'AeroStar Dynamics': 0,
      'Global Pharma': 0,
      'Cosmic Energy': 0,
      'OmniBank': 0
    };
    this.biddingMeeplePlaced = false;
    this.cardsInHand = [];
  }

  // Returns data safe to send to everyone
  getPublicData() {
    return {
      id: this.id,
      name: this.name,
      cash: this.cash,
      portfolio: this.portfolio,
      biddingMeeplePlaced: this.biddingMeeplePlaced
    };
  }

  // Returns data only this player should see
  getPrivateData() {
    return {
      ...this.getPublicData(),
      hiddenCompanyCard: this.hiddenCompanyCard,
      hiddenForecastCard: this.hiddenForecastCard,
      cardsInHand: this.cardsInHand
    };
  }
}
