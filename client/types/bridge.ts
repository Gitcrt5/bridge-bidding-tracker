export type Suit = 'C' | 'D' | 'H' | 'S' | 'NT';
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SpecialBid = 'Pass' | 'X' | 'XX';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type CardSuit = 'C' | 'D' | 'H' | 'S';
export type Position = 'N' | 'E' | 'S' | 'W';
export type Vulnerability = 'None' | 'NS' | 'EW' | 'Both';
export interface Bid {
  id: string;
  position: Position;
  level?: Level;
  suit?: Suit;
  special?: SpecialBid;
  alertText?: string;
}

export interface LeadCard {
  rank: Rank;
  suit: CardSuit;
}

export interface BoardResult {
  tricksTaken?: number;
  leadCard?: LeadCard;
  score?: string;
}

export interface Hand {
  spades: Rank[];
  hearts: Rank[];
  diamonds: Rank[];
  clubs: Rank[];
}

export interface DoubleDummyResult {
  north: { clubs: number; diamonds: number; hearts: number; spades: number; notrump: number };
  south: { clubs: number; diamonds: number; hearts: number; spades: number; notrump: number };
  east: { clubs: number; diamonds: number; hearts: number; spades: number; notrump: number };
  west: { clubs: number; diamonds: number; hearts: number; spades: number; notrump: number };
}

export interface BoardHands {
  north: Hand;
  east: Hand;
  south: Hand;
  west: Hand;
}

export interface Board {
  id: string;
  number: number;
  dealer: Position;
  vulnerability: Vulnerability;
  bids: Bid[];
  notes: string;
  result: BoardResult;
  hands?: BoardHands;
  doubleDummy?: DoubleDummyResult;
}

export interface Game {
  id: string;
  date: string;
  partner: string;
  location: string;
  numberOfBoards: number;
  tournamentName: string;
  boards: Board[];
  createdAt: string;
  isLocked?: boolean;
}

export const POSITIONS: Position[] = ['N', 'E', 'S', 'W'];
export const LEVELS: Level[] = [1, 2, 3, 4, 5, 6, 7];
export const SUITS: Suit[] = ['C', 'D', 'H', 'S', 'NT'];
export const CARD_SUITS: CardSuit[] = ['C', 'D', 'H', 'S'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function getDealerForBoard(boardNumber: number): Position {
  const dealerIndex = (boardNumber - 1) % 4;
  return POSITIONS[dealerIndex];
}

export function getVulnerabilityForBoard(boardNumber: number): Vulnerability {
  const vulPattern = [
    'None', 'NS', 'EW', 'Both',
    'NS', 'EW', 'Both', 'None',
    'EW', 'Both', 'None', 'NS',
    'Both', 'None', 'NS', 'EW'
  ];
  const index = (boardNumber - 1) % 16;
  return vulPattern[index] as Vulnerability;
}

export function getSuitSymbol(suit: Suit | CardSuit): string {
  switch (suit) {
    case 'C': return '♣';
    case 'D': return '♦';
    case 'H': return '♥';
    case 'S': return '♠';
    case 'NT': return 'NT';
    default: return '';
  }
}

export function getPositionName(position: Position): string {
  switch (position) {
    case 'N': return 'North';
    case 'E': return 'East';
    case 'S': return 'South';
    case 'W': return 'West';
  }
}

export function formatBid(bid: Bid): string {
  if (bid.special) {
    return bid.special === 'X' ? 'X' : bid.special === 'XX' ? 'XX' : 'Pass';
  }
  if (bid.level && bid.suit) {
    return `${bid.level}${getSuitSymbol(bid.suit)}`;
  }
  return '';
}

export function createEmptyBoard(number: number): Board {
  return {
    id: `board-${number}`,
    number,
    dealer: getDealerForBoard(number),
    vulnerability: getVulnerabilityForBoard(number),
    bids: [],
    notes: '',
    result: {},
  };
}

export function createEmptyGame(params: {
  date: string;
  partner: string;
  location: string;
  numberOfBoards: number;
  tournamentName: string;
}): Game {
  const boards: Board[] = [];
  for (let i = 1; i <= params.numberOfBoards; i++) {
    boards.push(createEmptyBoard(i));
  }

  return {
    id: '',
    date: params.date,
    partner: params.partner,
    location: params.location,
    numberOfBoards: params.numberOfBoards,
    tournamentName: params.tournamentName,
    boards,
    createdAt: new Date().toISOString(),
  };
}
