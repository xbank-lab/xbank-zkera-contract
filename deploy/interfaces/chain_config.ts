export interface Config {
  Xes: string;
  PriceOracle: string;
  markets: Market[];
  tokens: Tokens;
  pyth: string;
}

export interface Xes {
  NFTStaking?: string;
  NFTBoostedLeverageController?: string;
}
export interface Market {
  address: string;
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
