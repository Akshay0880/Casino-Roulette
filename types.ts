
export type BetType = 'STRAIGHT' | 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH';

export interface Bet {
  type: BetType;
  value: number | string;
  amount: number;
}

export interface GameState {
  balance: number;
  currentBets: Bet[];
  isSpinning: boolean;
  lastResult: number | null;
  history: number[];
  message: string;
}

export interface WheelNumber {
  number: number;
  color: 'red' | 'black' | 'green';
}
