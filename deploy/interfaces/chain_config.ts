export interface Config {
  Comptroller: string;
  PriceOralce: string;
  markets: Market[];
  tokens: Tokens;
}

export interface Comptroller {
  NFTStaking?: string;
  NFTBoostedLeverageController?: string;
}
export interface Market {
  address: string;
  creditors: string[];
}

export interface Creditor {
  name: string;
  address: string;
}

export interface Tokens {
  ETH: string;
  USDC?: string;
  USDT?: string;
}
