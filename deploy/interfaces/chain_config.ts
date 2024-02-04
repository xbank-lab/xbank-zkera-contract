export interface Config {
  Xes: string;
  PriceOracle: string;
  InterestRateModels: InterestRateModels;
  gov: Governance;
  markets: Markets;
  tokens: Tokens;
  pyth: string; // Pyth's
  pythNetworkEndpoint: string; // Pyth's
  pythPriceUpdater: string; // xBank's
  pythIDs: PythIDs;
}

export interface InterestRateModels {
  xETH: string;
  xUSDC: string;
}
export interface Governance {
  esXB: string;
}

export interface Markets {
  xETH: string;
  xUSDC: string;
  xWBTC: string;
}

export interface Tokens {
  ETH: string;
  USDC: string;
  USDT?: string;
  WBTC?: string;
}

export interface PythIDs {
  ETH: string;
  USDC: string;
  WBTC: string;
  USDT?: string;
}
