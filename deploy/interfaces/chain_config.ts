export interface Config {
  Xes: string;
  PriceOracle: string;
  InterestRateModels: InterestRateModel;
  gov: Governance;
  markets: Market;
  tokens: Tokens;
  pyth: string;
}

export interface InterestRateModel {
  xETH: string;
  xUSDC: string;
}
export interface Governance {
  esXB: string;
}

export interface Market {
  xETH: string;
  xUSDC: string;
}

export interface Creditor {
  name: string;
  address: string;
}

export interface Tokens {
  ETH: string;
  USDC: string;
  USDT?: string;
}
