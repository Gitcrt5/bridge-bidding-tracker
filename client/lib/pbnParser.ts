import { 
  Board, 
  BoardHands, 
  Hand, 
  DoubleDummyResult, 
  Rank, 
  Position, 
  Vulnerability,
  Bid,
  Level,
  Suit,
  LeadCard,
  CardSuit
} from '../types/bridge';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedPBNBoard {
  number: number;
  dealer: Position;
  vulnerability: Vulnerability;
  hands?: BoardHands;
  doubleDummy?: DoubleDummyResult;
  bids?: Bid[];
  leadCard?: LeadCard;
}

export interface PBNParseResult {
  boards: ParsedPBNBoard[];
  eventName?: string;
  date?: string;
  errors: string[];
}

function parseRanks(cardString: string): Rank[] {
  const validRanks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const ranks: Rank[] = [];
  for (const char of cardString) {
    if (validRanks.includes(char as Rank)) {
      ranks.push(char as Rank);
    }
  }
  return ranks;
}

function parseHand(handString: string): Hand {
  const suits = handString.split('.');
  return {
    spades: parseRanks(suits[0] || ''),
    hearts: parseRanks(suits[1] || ''),
    diamonds: parseRanks(suits[2] || ''),
    clubs: parseRanks(suits[3] || ''),
  };
}

function parseDeal(dealString: string): BoardHands | undefined {
  const match = dealString.match(/^([NESW]):(.+)$/);
  if (!match) return undefined;

  const startPosition = match[1] as Position;
  const handsStr = match[2].split(' ');
  
  if (handsStr.length !== 4) return undefined;

  const positions: Position[] = ['N', 'E', 'S', 'W'];
  const startIndex = positions.indexOf(startPosition);
  
  const hands: Partial<BoardHands> = {};
  for (let i = 0; i < 4; i++) {
    const pos = positions[(startIndex + i) % 4];
    const hand = parseHand(handsStr[i]);
    if (pos === 'N') hands.north = hand;
    else if (pos === 'E') hands.east = hand;
    else if (pos === 'S') hands.south = hand;
    else if (pos === 'W') hands.west = hand;
  }

  return hands as BoardHands;
}

function parseVulnerability(vul: string): Vulnerability {
  const vulLower = vul.toLowerCase();
  if (vulLower === 'none' || vulLower === '-' || vulLower === 'love') return 'None';
  if (vulLower === 'ns' || vulLower === 'n-s') return 'NS';
  if (vulLower === 'ew' || vulLower === 'e-w') return 'EW';
  if (vulLower === 'all' || vulLower === 'both') return 'Both';
  return 'None';
}

function parseDealer(dealer: string): Position {
  const d = dealer.toUpperCase();
  if (d === 'N' || d === 'NORTH') return 'N';
  if (d === 'E' || d === 'EAST') return 'E';
  if (d === 'S' || d === 'SOUTH') return 'S';
  if (d === 'W' || d === 'WEST') return 'W';
  return 'N';
}

function parseDoubleDummy(optLine: string): DoubleDummyResult | undefined {
  const parts = optLine.split(':');
  if (parts.length < 2) return undefined;
  
  const ddData = parts[1].trim();
  const rows = ddData.split('\\n');
  
  if (rows.length < 4) return undefined;

  const result: DoubleDummyResult = {
    north: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
    south: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
    east: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
    west: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
  };

  for (const row of rows) {
    const trimmed = row.trim();
    const match = trimmed.match(/^([NESW])\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
    if (match) {
      const pos = match[1].toUpperCase();
      const tricks = [
        parseInt(match[2], 10),
        parseInt(match[3], 10),
        parseInt(match[4], 10),
        parseInt(match[5], 10),
        parseInt(match[6], 10),
      ];
      
      const posResult = { 
        notrump: tricks[0], 
        spades: tricks[1], 
        hearts: tricks[2], 
        diamonds: tricks[3], 
        clubs: tricks[4] 
      };
      
      if (pos === 'N') result.north = posResult;
      else if (pos === 'E') result.east = posResult;
      else if (pos === 'S') result.south = posResult;
      else if (pos === 'W') result.west = posResult;
    }
  }

  return result;
}

function parseDoubleDummyTable(lines: string[]): DoubleDummyResult | undefined {
  const result: DoubleDummyResult = {
    north: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
    south: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
    east: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
    west: { clubs: 0, diamonds: 0, hearts: 0, spades: 0, notrump: 0 },
  };

  let foundData = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([NESW])\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)/i);
    if (match) {
      foundData = true;
      const pos = match[1].toUpperCase();
      const parseTrick = (s: string) => s === '*' ? 0 : parseInt(s, 10);
      const tricks = [
        parseTrick(match[2]),
        parseTrick(match[3]),
        parseTrick(match[4]),
        parseTrick(match[5]),
        parseTrick(match[6]),
      ];
      
      const posResult = { 
        notrump: tricks[0], 
        spades: tricks[1], 
        hearts: tricks[2], 
        diamonds: tricks[3], 
        clubs: tricks[4] 
      };
      
      if (pos === 'N') result.north = posResult;
      else if (pos === 'E') result.east = posResult;
      else if (pos === 'S') result.south = posResult;
      else if (pos === 'W') result.west = posResult;
    }
  }

  return foundData ? result : undefined;
}

function parseAuction(lines: string[], dealer: Position): Bid[] {
  const bids: Bid[] = [];
  const positions: Position[] = ['N', 'E', 'S', 'W'];
  let currentPosIndex = positions.indexOf(dealer);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') || trimmed === '') continue;
    
    const bidTokens = trimmed.split(/\s+/);
    for (const token of bidTokens) {
      if (!token) continue;
      
      const bid: Bid = {
        id: uuidv4(),
        position: positions[currentPosIndex],
      };

      const upperToken = token.toUpperCase();
      
      if (upperToken === 'PASS' || upperToken === 'P') {
        bid.special = 'Pass';
      } else if (upperToken === 'X' || upperToken === 'DBL' || upperToken === 'DOUBLE') {
        bid.special = 'X';
      } else if (upperToken === 'XX' || upperToken === 'RDBL' || upperToken === 'REDOUBLE') {
        bid.special = 'XX';
      } else {
        const bidMatch = token.match(/^(\d)([CDHSN]T?)/i);
        if (bidMatch) {
          const level = parseInt(bidMatch[1], 10) as Level;
          const suitStr = bidMatch[2].toUpperCase();
          let suit: Suit;
          if (suitStr === 'C') suit = 'C';
          else if (suitStr === 'D') suit = 'D';
          else if (suitStr === 'H') suit = 'H';
          else if (suitStr === 'S') suit = 'S';
          else if (suitStr === 'N' || suitStr === 'NT') suit = 'NT';
          else continue;
          
          bid.level = level;
          bid.suit = suit;
        } else if (upperToken === 'AP') {
          for (let i = 0; i < 3; i++) {
            bids.push({
              id: uuidv4(),
              position: positions[currentPosIndex],
              special: 'Pass',
            });
            currentPosIndex = (currentPosIndex + 1) % 4;
          }
          continue;
        } else {
          continue;
        }
      }

      bids.push(bid);
      currentPosIndex = (currentPosIndex + 1) % 4;
    }
  }

  return bids;
}

function parseLeadCard(leadString: string): LeadCard | undefined {
  const match = leadString.match(/([CDHS])([2-9TJQKA])/i);
  if (!match) return undefined;
  
  const suitChar = match[1].toUpperCase();
  const rankChar = match[2].toUpperCase();
  
  let suit: CardSuit;
  if (suitChar === 'C') suit = 'C';
  else if (suitChar === 'D') suit = 'D';
  else if (suitChar === 'H') suit = 'H';
  else if (suitChar === 'S') suit = 'S';
  else return undefined;

  const validRanks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  if (!validRanks.includes(rankChar as Rank)) return undefined;

  return { suit, rank: rankChar as Rank };
}

export function parsePBN(content: string): PBNParseResult {
  const result: PBNParseResult = {
    boards: [],
    errors: [],
  };

  const lines = content.split(/\r?\n/);
  let currentBoard: Partial<ParsedPBNBoard> | null = null;
  let inAuction = false;
  let auctionLines: string[] = [];
  let inDoubleDummyTable = false;
  let ddTableLines: string[] = [];

  const finishCurrentBoard = () => {
    if (currentBoard && currentBoard.number !== undefined) {
      if (inAuction && auctionLines.length > 0) {
        currentBoard.bids = parseAuction(auctionLines, currentBoard.dealer || 'N');
      }
      if (inDoubleDummyTable && ddTableLines.length > 0) {
        currentBoard.doubleDummy = parseDoubleDummyTable(ddTableLines);
      }
      result.boards.push(currentBoard as ParsedPBNBoard);
    }
    currentBoard = null;
    inAuction = false;
    auctionLines = [];
    inDoubleDummyTable = false;
    ddTableLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('[Board ')) {
      finishCurrentBoard();
      const match = trimmed.match(/\[Board\s+"?(\d+)"?\]/i);
      if (match) {
        currentBoard = { number: parseInt(match[1], 10) };
      }
      continue;
    }

    if (trimmed.startsWith('[Event ')) {
      const match = trimmed.match(/\[Event\s+"(.*)"\]/);
      if (match) result.eventName = match[1];
      continue;
    }

    if (trimmed.startsWith('[Date ')) {
      const match = trimmed.match(/\[Date\s+"(.*)"\]/);
      if (match) result.date = match[1];
      continue;
    }

    if (!currentBoard) continue;

    if (trimmed.startsWith('[Dealer ')) {
      const match = trimmed.match(/\[Dealer\s+"(.*)"\]/);
      if (match) currentBoard.dealer = parseDealer(match[1]);
      continue;
    }

    if (trimmed.startsWith('[Vulnerable ')) {
      const match = trimmed.match(/\[Vulnerable\s+"(.*)"\]/);
      if (match) currentBoard.vulnerability = parseVulnerability(match[1]);
      continue;
    }

    if (trimmed.startsWith('[Deal ')) {
      const match = trimmed.match(/\[Deal\s+"(.*)"\]/);
      if (match) currentBoard.hands = parseDeal(match[1]);
      continue;
    }

    if (trimmed.startsWith('[OptimumResultTable ')) {
      inDoubleDummyTable = true;
      ddTableLines = [];
      continue;
    }

    if (trimmed.startsWith('[DoubleDummyTricks ')) {
      const match = trimmed.match(/\[DoubleDummyTricks\s+"(.*)"\]/);
      if (match) {
        const ddString = match[1];
        if (ddString.length >= 20) {
          const parseDDChar = (c: string) => {
            if (c === '*') return 0;
            if (c >= 'A' && c <= 'D') return 10 + (c.charCodeAt(0) - 'A'.charCodeAt(0));
            return parseInt(c, 16) || 0;
          };
          
          currentBoard.doubleDummy = {
            north: {
              notrump: parseDDChar(ddString[0]),
              spades: parseDDChar(ddString[1]),
              hearts: parseDDChar(ddString[2]),
              diamonds: parseDDChar(ddString[3]),
              clubs: parseDDChar(ddString[4]),
            },
            south: {
              notrump: parseDDChar(ddString[5]),
              spades: parseDDChar(ddString[6]),
              hearts: parseDDChar(ddString[7]),
              diamonds: parseDDChar(ddString[8]),
              clubs: parseDDChar(ddString[9]),
            },
            east: {
              notrump: parseDDChar(ddString[10]),
              spades: parseDDChar(ddString[11]),
              hearts: parseDDChar(ddString[12]),
              diamonds: parseDDChar(ddString[13]),
              clubs: parseDDChar(ddString[14]),
            },
            west: {
              notrump: parseDDChar(ddString[15]),
              spades: parseDDChar(ddString[16]),
              hearts: parseDDChar(ddString[17]),
              diamonds: parseDDChar(ddString[18]),
              clubs: parseDDChar(ddString[19]),
            },
          };
        }
      }
      continue;
    }

    if (trimmed.startsWith('[Auction ')) {
      inAuction = true;
      inDoubleDummyTable = false;
      auctionLines = [];
      continue;
    }

    if (trimmed.startsWith('[Play ')) {
      inAuction = false;
      inDoubleDummyTable = false;
      continue;
    }

    if (trimmed.startsWith('[Contract ')) {
      inAuction = false;
      inDoubleDummyTable = false;
      continue;
    }

    if (trimmed.startsWith('[')) {
      inAuction = false;
      inDoubleDummyTable = false;
      
      if (trimmed.startsWith('[Lead ')) {
        const match = trimmed.match(/\[Lead\s+"(.*)"\]/);
        if (match) currentBoard.leadCard = parseLeadCard(match[1]);
      }
      continue;
    }

    if (inAuction) {
      auctionLines.push(trimmed);
    }

    if (inDoubleDummyTable) {
      ddTableLines.push(trimmed);
    }
  }

  finishCurrentBoard();

  return result;
}

export function hasBiddingConflict(existingBoard: Board, pbnBoard: ParsedPBNBoard): boolean {
  if (!pbnBoard.bids || pbnBoard.bids.length === 0) return false;
  return existingBoard.bids.length > 0;
}

export function hasLeadConflict(existingBoard: Board, pbnBoard: ParsedPBNBoard): boolean {
  if (!pbnBoard.leadCard) return false;
  return existingBoard.result.leadCard !== undefined;
}
