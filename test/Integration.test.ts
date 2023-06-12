import chai from "chai";
import { solidity } from "ethereum-waffle";

import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import "@openzeppelin/test-helpers";
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

import { XTokenLike } from "../utils/interfaces";

import {
  deployBaseJumpRateModelV2,
  deployERC20,
  deploySimplePriceOracle,
  deployXTokens,
  deployXes,
} from "../deploy/utils/deploy";
import {
  BaseJumpRateModelV2,
  ERC20PresetFixedSupply,
  SimplePriceOracle,
  XEtherImmutable__factory,
  XesImpl,
  XesImpl__factory,
} from "../typechain";
import { XTokenType } from "../utils/enums";
import { INTEREST_RATE_MODEL } from "./config/deployment_config";
import { parseEther, parseUnits } from "ethers/lib/utils";

chai.use(solidity);
const { expect } = chai;

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

  // Txs
  let tx;
  let pendingTx;

  // ERC20s
  let USDC: ERC20PresetFixedSupply;

  // xBank
  let simplePriceOracle: SimplePriceOracle;
  let xes: XesImpl;
  let baseJumpRateModelV2_ETH: BaseJumpRateModelV2;
  let baseJumpRateModelV2_Stables: BaseJumpRateModelV2;

  // deployed xTokens
  let xTokens: Record<string, XTokenLike>;

  async function fixture() {
    // deployer
    const deployerWallet = new Wallet(DEPLOYER_WALLET_PK, provider);
    deployer = new Deployer(hre, deployerWallet);
    alice = new Wallet(ALICE_WALLET_PK, provider);
    bob = new Wallet(BOB_WALLET_PK, provider);
    console.log("# Deployer address:", deployer.zkWallet.address);

    // deploy ERC20s
    USDC = await deployERC20(
      deployer,
      "USD Coin",
      "USDC",
      utils.parseEther("1000000")
    );
    console.log(`# ERC20 ${await USDC.symbol()} deployed at: ${USDC.address}`);

    // deploy price oracle
    simplePriceOracle = await deploySimplePriceOracle(deployer);
    console.log(`# PriceOracle deployed at: ${simplePriceOracle.address}`);

    // deploy xes
    xes = await deployXes(deployer);
    const xesAsDeployer = XesImpl__factory.connect(
      xes.address,
      deployer.zkWallet
    );
    console.log(`# Xes deployed at: ${xes.address}`);

    // set price oracle to xes
    tx = await xesAsDeployer._setPriceOracle(simplePriceOracle.address);
    await tx.wait();
    console.log("# SetPriceOracle to xes at: ", simplePriceOracle.address);

    // deploy interest models
    baseJumpRateModelV2_ETH = await deployBaseJumpRateModelV2(
      deployer,
      INTEREST_RATE_MODEL.IRM_ETH_Updateable
    );
    console.log(
      `# BaseJumpRateModelV2_ETH deployed at: ${baseJumpRateModelV2_ETH.address}`
    );
    baseJumpRateModelV2_Stables = await deployBaseJumpRateModelV2(
      deployer,
      INTEREST_RATE_MODEL.IRM_STABLES_Updateable
    );
    console.log(
      `# BaseJumpRateModelV2_Stables deployed at: ${baseJumpRateModelV2_Stables.address}`
    );

    // deploy xTokens
    let xTokenDeployArgs = [
      {
        name: "xBank Ether",
        symbol: "xETH",
        underlyingToken: "ETH",
        underlying: constants.AddressZero,
        type: XTokenType.XEtherImmutable,
        collateralFactor: utils.parseUnits("0.6", 18), // 60%
        interestRateModel: baseJumpRateModelV2_ETH.address,
        initialExchangeRate: "200000000000000000000000000",
        decimals: 8,
      },
      {
        name: "xBank USD Coin",
        symbol: "xUSDC",
        underlyingToken: "USDC",
        underlying: USDC.address,
        type: XTokenType.XErc20Immutable,
        collateralFactor: utils.parseUnits("0.8", 18), // 80%
        interestRateModel: baseJumpRateModelV2_Stables.address,
        initialExchangeRate: "200000000000000",
        decimals: 8,
      },
    ];
    xTokens = await deployXTokens(xTokenDeployArgs, xesAsDeployer, deployer);

    // Set prices
    tx = await simplePriceOracle.setDirectPrice(
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      parseEther("1500")
    );
    await tx.wait();
    tx = await simplePriceOracle.setUnderlyingPrice(
      xTokens["USDC"].address,
      parseEther("1")
    );
    await tx.wait();

    // Set collateral factor
    tx = await xesAsDeployer._setCollateralFactor(
      xTokens["ETH"].address,
      xTokenDeployArgs[0].collateralFactor
    );
    tx.wait();
    tx = await xesAsDeployer._setCollateralFactor(
      xTokens["USDC"].address,
      xTokenDeployArgs[1].collateralFactor
    );
    tx.wait();

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
      // [check] Xes
      const xesAsDeployer = XesImpl__factory.connect(
        xes.address,
        deployer.zkWallet
      );
      expect(await xesAsDeployer.isComptroller()).to.eq(true);

      // [check] PriceOracle set correctly with correct prices
      const xesPriceOracle = await xesAsDeployer.oracle();
      expect(xesPriceOracle).to.eq(simplePriceOracle.address);

      const allMarkets = await xesAsDeployer.getAllMarkets();
      expect(allMarkets.length).to.eq(2);
      expect(allMarkets).to.have.members([
        xTokens["ETH"].address,
        xTokens["USDC"].address,
      ]);
      expect(
        await simplePriceOracle.getUnderlyingPrice(xTokens["ETH"].address)
      ).to.eq(utils.parseEther("1500"));
      expect(
        await simplePriceOracle.getUnderlyingPrice(xTokens["USDC"].address)
      ).to.eq(utils.parseEther("1"));

      // [check] ETH listed with collateral factor 60%
      const marketETH = await xesAsDeployer.markets(xTokens["ETH"].address);
      expect(marketETH.isListed).to.eq(true);
      expect(marketETH.collateralFactorMantissa).to.eq(
        BigNumber.from(6).mul(E17) // 80%
      );

      // [check] USDC listed with collateral factor 80%
      const marketUSDC = await xesAsDeployer.markets(xTokens["USDC"].address);
      expect(marketUSDC.isListed).to.eq(true);
      expect(marketUSDC.collateralFactorMantissa).to.eq(
        BigNumber.from(8).mul(E17) // 80%
      );
    });
  });

  context("Mint Redeem", async () => {
    it("Should allow mint xERC20 and xETH", async function () {
      // alice & bob approve 100e18 USDC
      await approveERC20(
        USDC,
        alice,
        xTokens["USDC"].address,
        utils.parseEther("100")
      );
      await approveERC20(
        USDC,
        bob,
        xTokens["USDC"].address,
        utils.parseEther("100")
      );

      // alice deposit 100e18 USDC, receiving 5000000000000000e8 xUSDC
      tx = await xTokens["USDC"].connect(alice).mint(utils.parseEther("100"));
      await tx.wait();
      // bob deposit 100e18 USDC, receiving 5000000000000000e8 xUSDC
      tx = await xTokens["USDC"].connect(bob).mint(utils.parseEther("100"));
      await tx.wait();

      // [check] alice & bob balance should have 90e18 USDC, 500000000000000e8 xUSDC
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("900"));
      expect(await getERC20Balance(xTokens["USDC"], alice)).to.eq(
        utils.parseUnits("5000000000000000", 8)
      );
      expect(await getERC20Balance(USDC, bob)).to.eq(utils.parseEther("900"));
      expect(await getERC20Balance(xTokens["USDC"], bob)).to.eq(
        utils.parseUnits("5000000000000000", 8)
      );

      // alice deposit 0.5e18 ETH, receiving 25e8 xETH
      const xETHAsAlice = XEtherImmutable__factory.connect(
        xTokens["ETH"].address,
        alice
      );
      tx = await xETHAsAlice.mint({ value: utils.parseEther("5") });
      await tx.wait();
      // [check] alice balance should have 250e8 xETH
      expect(await getERC20Balance(xTokens["ETH"], alice)).to.eq(
        utils.parseUnits("250", 8)
      );
    });

    it("Should allow redeem xERC20 and xETH", async function () {
      // alice approve all xUSDC to redeem
      await approveERC20(
        xTokens["USDC"],
        alice,
        xTokens["USDC"].address,
        await getERC20Balance(xTokens["USDC"], alice)
      );

      // alice redeem 3000000000000000e8 xUSDC for 60e18 USDC
      tx = await xTokens["USDC"]
        .connect(alice)
        .redeem(utils.parseUnits("3000000000000000", 8));
      await tx.wait();
      // [check] alice balance should have 900e18 + 60e18 = 960e18 USDC, 2000000000000000e8 xUSDC
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("960"));
      expect(await getERC20Balance(xTokens["USDC"], alice)).to.eq(
        utils.parseUnits("2000000000000000", 8)
      );

      // alice redeemUnderlying 20e18 USDC more
      tx = await xTokens["USDC"]
        .connect(alice)
        .redeemUnderlying(utils.parseEther("20"));
      await tx.wait();
      // [check] alice balance should have 960e18 + 20e18 = 980e18USDC, 1000000000000000e8 xUSDC
      expect(await getERC20Balance(USDC, alice)).to.eq(utils.parseEther("980"));
      expect(await getERC20Balance(xTokens["USDC"], alice)).to.eq(
        utils.parseUnits("1000000000000000", 8)
      );

      // approve xETH to redeem
      await approveERC20(
        xTokens["ETH"],
        alice,
        xTokens["ETH"].address,
        await getERC20Balance(xTokens["ETH"], alice)
      );
      // alice redeem 50e8 xETH for 1e18 ETH
      const aliceETHBalanceBefore = await getETHBalance(alice);
      tx = await xTokens["ETH"]
        .connect(alice)
        .redeem(utils.parseUnits("50", 8));
      await tx.wait();
      // [check] alice balance should have 250e8 - 50e8 = 200e8 xETH, and almost +1e18 ETH more (deducted gas)
      expect(await getERC20Balance(xTokens["ETH"], alice)).to.eq(
        utils.parseUnits("200", 8)
      );
      expect(await getETHBalance(alice)).to.greaterThan(
        aliceETHBalanceBefore.add(utils.parseEther("0.999"))
      );
    });

    it("Should allow borrow cross markets", async function () {
      // Recap market state:
      // _____________________________
      // │ Market │  Alice  │  Bob   │
      // │  ETH   │   4e18  │   -    │
      // │  USDC  │  20e18  │ 100e18 │
      // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
      // bob has collateral of 100 USDC ($1) at collateral factor 80% => $80
      // bob can borrow ETH up to $80 ($80/$1500 ETH = 0.0533 ETH)

      // bob try to borrow without put USDC as collateral
      pendingTx = xTokens["ETH"].connect(bob).borrow(utils.parseEther("0.05"));
      await expect(pendingTx).to.be.reverted;

      const xesAsBob = XesImpl__factory.connect(xes.address, bob);

      // [check] bob has 0 collateral liquidity and 0 shortfall
      const [_, prevLiquidity, prevShortfall] =
        await xesAsBob.getAccountLiquidity(bob.address);
      expect(prevLiquidity).to.eq(utils.parseEther("0"));
      expect(prevShortfall).to.eq(utils.parseEther("0"));

      console.log(
        "bob xUSDC",
        (await getERC20Balance(xTokens["USDC"], bob)).toString(),
        "bob USDC",
        (await getERC20Balance(USDC, bob)).toString()
      );

      // bob use USDC as collateral
      tx = await xesAsBob.enterMarkets([xTokens["USDC"].address]);
      await tx.wait();

      // [check] bob has $80 collateral liquidity and 0 shortfall
      const [__, liquidity, shortfall] =
        await xesAsBob.getHypotheticalAccountLiquidity(
          bob.address,
          xTokens["ETH"].address,
          utils.parseEther("0"),
          utils.parseEther("0")
        );
      expect(liquidity).to.eq(utils.parseEther("80"));
      expect(shortfall).to.eq(utils.parseEther("0"));

      // bob try to borrow a little over allowed amount
      pendingTx = xTokens["ETH"].connect(bob).borrow(utils.parseEther("0.054"));
      await expect(pendingTx).to.be.reverted;

      // bob try to borrow at almost allowed amount
      const bobETHBalanceBefore = await getETHBalance(bob);
      tx = await xTokens["ETH"].connect(bob).borrow(utils.parseEther("0.053"));
      await tx.wait();

      // [check] bob balance ETH should +0.052e18 ETH more (deducted gas)
      expect(await getETHBalance(bob)).to.greaterThan(
        bobETHBalanceBefore.add(utils.parseEther("0.052"))
      );

      // [check] bob balance ETH should +0.052e18 ETH more (deducted gas)
      expect(await getETHBalance(bob)).to.greaterThan(
        bobETHBalanceBefore.add(utils.parseEther("0.052"))
      );

      // [check] bob cannot borrow additional certain amount of ETH due to borrow limit reached
      pendingTx = xTokens["ETH"].connect(bob).borrow(utils.parseEther("0.1"));
      await expect(pendingTx).to.be.reverted;
    });
  });
});
