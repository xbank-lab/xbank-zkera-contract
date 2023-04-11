import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { BigNumber, constants, utils } from "ethers";
import * as hre from "hardhat";
import { waffle } from "hardhat";
import { Provider, Wallet } from "zksync-web3";
import {
  approveERC20,
  distributeERC20,
  distributeETH,
  getERC20Balance,
  getETHBalance,
} from "./utils";

import { CTokenDeployArg, CTokenLike } from "../utils/interfaces";

import { expect } from "chai";
import {
  BaseJumpRateModelV2,
  CEther__factory,
  Comptroller,
  Comptroller__factory,
  ERC20PresetFixedSupply,
  SimplePriceOracle,
} from "../typechain";
import { INTEREST_RATE_MODEL } from "./config/deployment_config";
import {
  deployComptroller,
  deployCTokens,
  deployERC20,
  deployBaseJumpRateModelV2 as deployJumpRateModelV2,
  deploySimplePriceOracle,
} from "./utils/deploy";

const DEPLOYER_WALLET_PK =
  "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const ALICE_WALLET_PK =
  "0x3bc6be7e7ff3f699ee912296170fd4cbaa5e39ccf1363236e000abf434af8810";
const BOB_WALLET_PK =
  "0x61537d18c2226a1cecad7fe674d0cd697f5b6c9fdd673cfb08f15f86d6f78df0";

const E18 = constants.WeiPerEther;
const E17 = E18.div(10);

describe("Deploy scenario", function () {
  // Providers
  const provider = Provider.getDefaultProvider();

  // Accounts
  let deployer: Deployer;
  let alice: Wallet;
  let bob: Wallet;

  let tx;

  // ERC20s
  let USDT: ERC20PresetFixedSupply;
  let USDC: ERC20PresetFixedSupply;

  // Compound
  let simplePriceOracle: SimplePriceOracle;
  let comptroller: Comptroller;
  let baseJumpRateModelV2_ETH: BaseJumpRateModelV2;
  let baseJumpRateModelV2_Stables: BaseJumpRateModelV2;

  // deployed CTokens
  let cTokens: Record<string, CTokenLike>;

  async function fixture() {
    // deployer
    const deployerWallet = new Wallet(DEPLOYER_WALLET_PK, provider);
    deployer = new Deployer(hre, deployerWallet);
    alice = new Wallet(ALICE_WALLET_PK, provider);
    bob = new Wallet(BOB_WALLET_PK, provider);
    console.log("# Deployer address:", deployer.zkWallet.address);

    // deploy ERC20s
    USDT = await deployERC20(
      deployer,
      "Tether USD",
      "USDT",
      utils.parseEther("1000")
    );
    USDC = await deployERC20(
      deployer,
      "USD Coin ",
      "USDC",
      utils.parseEther("1000")
    );

    console.log(`# ERC20 ${await USDT.symbol()} deployed at: ${USDT.address}`);
    console.log(`# ERC20 ${await USDC.symbol()} deployed at: ${USDC.address}`);

    // deploy price oracle
    simplePriceOracle = await deploySimplePriceOracle(deployer);
    console.log(`# PriceOracle deployed at: ${simplePriceOracle.address}`);

    // deploy comptroller
    comptroller = await deployComptroller(deployer);
    const comptrollerAsDeployer = Comptroller__factory.connect(
      comptroller.address,
      deployer.zkWallet
    );
    console.log(`# Comptroller deployed at: ${comptroller.address}`);

    // set price oracle to comptroller
    tx = await comptrollerAsDeployer._setPriceOracle(simplePriceOracle.address);
    await tx.wait();
    console.log(
      "# SetPriceOracle to comptroller at: ",
      simplePriceOracle.address
    );

    // deploy interest models
    baseJumpRateModelV2_ETH = await deployJumpRateModelV2(
      deployer,
      INTEREST_RATE_MODEL.IRM_ETH_Updateable
    );
    console.log(
      `# BaseJumpRateModelV2_ETH deployed at: ${baseJumpRateModelV2_ETH.address}`
    );
    baseJumpRateModelV2_Stables = await deployJumpRateModelV2(
      deployer,
      INTEREST_RATE_MODEL.IRM_STABLES_Updateable
    );
    console.log(
      `# BaseJumpRateModelV2_Stables deployed at: ${baseJumpRateModelV2_Stables.address}`
    );

    // deploy cTokens
    let cTokenDeployArgs: CTokenDeployArg[] = [
      {
        underlyingToken: "USDT",
        cToken: "cUSDT",
        underlying: USDT.address,
        underlyingPrice: utils.parseEther("1"),
        collateralFactor: BigNumber.from(8).mul(E17), // 0.8
        interestRateModel: baseJumpRateModelV2_ETH.address,
      },
      {
        underlyingToken: "USDC",
        cToken: "cUSDC",
        underlying: USDC.address,
        underlyingPrice: utils.parseEther("1"),
        collateralFactor: BigNumber.from(8).mul(E17), // 0.8
        interestRateModel: baseJumpRateModelV2_Stables.address,
      },
      {
        underlyingToken: "ETH",
        cToken: "cETH",
        underlyingPrice: utils.parseEther("1"),
        collateralFactor: BigNumber.from(6).mul(E17), // 0.6
        interestRateModel: baseJumpRateModelV2_Stables.address,
      },
    ];
    cTokens = await deployCTokens(
      cTokenDeployArgs,
      simplePriceOracle,
      comptrollerAsDeployer,
      deployer
    );

    // distribute 100 USDT to alice and bob
    await distributeERC20(
      USDT,
      deployer.zkWallet,
      [alice, bob],
      [utils.parseEther("100"), utils.parseEther("100")]
    );

    // distribute 100 USDC to alice and bob
    await distributeERC20(
      USDC,
      deployer.zkWallet,
      [alice, bob],
      [utils.parseEther("100"), utils.parseEther("100")]
    );

    // distribute 10 ETH to alice and bob
    await distributeETH(
      deployer.zkWallet,
      [alice, bob],
      [utils.parseEther("10"), utils.parseEther("10")]
    );
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("When everything is deployed", async () => {
    it("Should have config ready", async function () {});

    it("Should allow deposit cERC20, cETH", async function () {
      console.log("alice eth", (await getETHBalance(alice)).toString());
      // alice mint cUSDT
      await approveERC20(
        USDC,
        alice,
        cTokens["USDC"].address,
        utils.parseEther("100")
      );
      console.log("alice eth", (await getETHBalance(alice)).toString());
      // alice minting cUSDC from underlying 10 USDC
      tx = await cTokens["USDC"].connect(alice).mint(utils.parseEther("10"));
      await tx.wait();
      console.log(
        "alice USDC",
        (await getERC20Balance(USDC, alice)).toString()
      );
      console.log(
        "alice cUSDC",
        (await getERC20Balance(cTokens["USDC"], alice)).toString()
      );
      console.log(
        "cUSDC total supply",
        (await cTokens["USDC"].totalSupply()).toString()
      );
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("90"));
      expect(await getERC20Balance(cTokens["USDC"], alice)).to.eq(
        utils.parseEther("50000")
      );

      console.log("alice eth", (await getETHBalance(alice)).toString());
      // alice minting cETH from underlying 0.5 ETH
      const cETHAsAlice = CEther__factory.connect(
        cTokens["ETH"].address,
        alice
      );

      tx = await cETHAsAlice.mint({ value: utils.parseEther("0.5") });
      await tx.wait();
      expect(await getERC20Balance(cTokens["ETH"], alice)).to.eq(
        BigNumber.from("2500000000")
      );
    });
  });
});
