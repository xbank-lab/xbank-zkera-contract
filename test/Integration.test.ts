import { parseEther } from "ethers/lib/utils";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { BigNumber, constants, utils } from "ethers";
import * as hre from "hardhat";
import { waffle } from "hardhat";
import { Provider, Wallet } from "zksync-web3";
import {
  _simulateMintCErc20,
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
  deployCTokens,
  deployComptroller,
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

describe("Protocol fundamentals", function () {
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
      utils.parseEther("1000000")
    );
    USDC = await deployERC20(
      deployer,
      "USD Coin ",
      "USDC",
      utils.parseEther("1000000")
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
        collateralFactor: BigNumber.from(8).mul(E17), // 80%
        interestRateModel: baseJumpRateModelV2_ETH.address,
      },
      {
        underlyingToken: "USDC",
        cToken: "cUSDC",
        underlying: USDC.address,
        underlyingPrice: utils.parseEther("1"),
        collateralFactor: BigNumber.from(8).mul(E17), // 80%
        interestRateModel: baseJumpRateModelV2_Stables.address,
      },
      {
        underlyingToken: "ETH",
        cToken: "cETH",
        underlyingPrice: utils.parseEther("1500"),
        collateralFactor: BigNumber.from(6).mul(E17), // 60%
        interestRateModel: baseJumpRateModelV2_Stables.address,
      },
    ];
    cTokens = await deployCTokens(
      cTokenDeployArgs,
      simplePriceOracle,
      comptrollerAsDeployer,
      deployer
    );

    // distribute 100e18 USDT to alice and bob
    await distributeERC20(
      USDT,
      deployer.zkWallet,
      [alice, bob],
      [utils.parseEther("1000"), utils.parseEther("1000")]
    );

    // distribute 100e18 USDC to alice and bob
    await distributeERC20(
      USDC,
      deployer.zkWallet,
      [alice, bob],
      [utils.parseEther("1000"), utils.parseEther("1000")]
    );

    // distribute 10e18 ETH to alice and bob
    await distributeETH(
      deployer.zkWallet,
      [alice, bob],
      [utils.parseEther("10"), utils.parseEther("10")]
    );
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("Initial config", async () => {
    it("Should have config ready", async function () {
      // [check] Comptroller
      const comptrollerAsDeployer = Comptroller__factory.connect(
        comptroller.address,
        deployer.zkWallet
      );
      expect(await comptrollerAsDeployer.isComptroller()).to.eq(true);

      // [check] PriceOracle set correctly with correct prices
      const comptrollerPriceOracle = await comptrollerAsDeployer.oracle();
      expect(comptrollerPriceOracle).to.eq(simplePriceOracle.address);

      const allMarkets = await comptrollerAsDeployer.getAllMarkets();
      expect(allMarkets.length).to.eq(3);
      expect(allMarkets).to.have.members([
        cTokens["ETH"].address,
        cTokens["USDC"].address,
        cTokens["USDT"].address,
      ]);
      expect(
        await simplePriceOracle.getUnderlyingPrice(cTokens["ETH"].address)
      ).to.eq(utils.parseEther("1500"));
      expect(
        await simplePriceOracle.getUnderlyingPrice(cTokens["USDC"].address)
      ).to.eq(utils.parseEther("1"));
      expect(
        await simplePriceOracle.getUnderlyingPrice(cTokens["USDT"].address)
      ).to.eq(utils.parseEther("1"));

      // [check] ETH listed with collateral factor 60%
      const marketETH = await comptrollerAsDeployer.markets(
        cTokens["ETH"].address
      );
      expect(marketETH.isListed).to.eq(true);
      expect(marketETH.collateralFactorMantissa).to.eq(
        BigNumber.from(6).mul(E17) // 80%
      );

      // [check] USDT listed with collateral factor 80%
      const marketUSDC = await comptrollerAsDeployer.markets(
        cTokens["USDC"].address
      );
      expect(marketUSDC.isListed).to.eq(true);
      expect(marketUSDC.collateralFactorMantissa).to.eq(
        BigNumber.from(8).mul(E17) // 80%
      );

      // [check] USDT listed with collateral factor 80%
      const marketUSDT = await comptrollerAsDeployer.markets(
        cTokens["USDT"].address
      );
      expect(marketUSDT.isListed).to.eq(true);
      expect(marketUSDT.collateralFactorMantissa).to.eq(
        BigNumber.from(8).mul(E17) // 80%
      );
    });
  });

  context("Mint Redeem", async () => {
    it("Should allow mint cERC20 and cETH", async function () {
      // alice approve 100e18 USDC
      await approveERC20(
        USDC,
        alice,
        cTokens["USDC"].address,
        utils.parseEther("100")
      );

      // alice deposit 100e18 USDC, receiving 5000000000000000e8 cUSDC
      tx = await cTokens["USDC"].connect(alice).mint(utils.parseEther("100"));
      await tx.wait();
      // [check] alice balance should have 90e18 USDC, 500000000000000e8 cUSDC
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("900"));
      expect(await getERC20Balance(cTokens["USDC"], alice)).to.eq(
        utils.parseUnits("5000000000000000", 8)
      );

      // alice deposit 0.5e18 ETH, receiving 25e8 cETH
      const cETHAsAlice = CEther__factory.connect(
        cTokens["ETH"].address,
        alice
      );
      tx = await cETHAsAlice.mint({ value: utils.parseEther("5") });
      await tx.wait();
      // [check] alice balance should have 250e8 cETH
      expect(await getERC20Balance(cTokens["ETH"], alice)).to.eq(
        utils.parseUnits("250", 8)
      );
    });

    it("Should allow redeem cERC20 and cETH", async function () {
      // alice approve all cUSDC to redeem
      await approveERC20(
        cTokens["USDC"],
        alice,
        cTokens["USDC"].address,
        await getERC20Balance(cTokens["USDC"], alice)
      );

      // alice redeem 3000000000000000e8 cUSDC for 60e18 USDC
      tx = await cTokens["USDC"]
        .connect(alice)
        .redeem(utils.parseUnits("3000000000000000", 8));
      await tx.wait();
      // [check] alice balance should have 900e18 + 60e18 = 960e18 USDC, 2000000000000000e8 cUSDC
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("960"));
      expect(await getERC20Balance(cTokens["USDC"], alice)).to.eq(
        utils.parseUnits("2000000000000000", 8)
      );

      // alice redeemUnderlying 20e18 USDC more
      tx = await cTokens["USDC"]
        .connect(alice)
        .redeemUnderlying(utils.parseEther("20"));
      await tx.wait();
      // [check] alice balance should have 960e18 + 20e18 = 980e18USDC, 1000000000000000e8 cUSDC
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("980"));
      expect(await getERC20Balance(cTokens["USDC"], alice)).to.eq(
        utils.parseUnits("1000000000000000", 8)
      );

      // approve cETH to redeem
      await approveERC20(
        cTokens["ETH"],
        alice,
        cTokens["ETH"].address,
        await getERC20Balance(cTokens["ETH"], alice)
      );
      // alice redeem 50e8 cETH for 1e18 ETH
      const aliceETHBalanceBefore = await getETHBalance(alice);
      tx = await cTokens["ETH"]
        .connect(alice)
        .redeem(utils.parseUnits("50", 8));
      await tx.wait();
      // [check] alice balance should have 250e8 - 50e8 = 200e8 cETH, and almost +1e18 ETH more
      expect(await getERC20Balance(cTokens["ETH"], alice)).to.eq(
        utils.parseUnits("200", 8)
      );
      expect(await getETHBalance(alice)).to.be.greaterThan(
        aliceETHBalanceBefore.add(utils.parseEther("0.99"))
      );
    });
  });
});
