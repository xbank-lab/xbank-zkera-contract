export interface Config {
  Xes: string;
  InterestRateModels: InterestRateModels;
  gov: Governance;
  markets: Markets;
  tokens: Tokens;
  xETHRepayHelper: string;
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
}

export interface Tokens {
  ETH: string;
  USDC: string;
  USDT?: string;
}

export interface PythIDs {
  ETH: string;
  USDC: string;
  USDT?: string;
}
