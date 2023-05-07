import { network } from "hardhat";
import MainnetConfig from "../../.zkera_mainnet.json";
import TestnetConfig from "../../.zkera_testnet.json";
import { Config } from "../interfaces/chain_config";

export function getConfig(): Config {
  if (network.name === "zkSyncMainnet") {
    return MainnetConfig;
  }
  if (network.name === "zkSyncTestnet") {
    return TestnetConfig;
  }
  throw new Error("Config not found!");
}
