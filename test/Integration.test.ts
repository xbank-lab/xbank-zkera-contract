import { Provider, Contract, Wallet } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as hre from "hardhat";
import { ethers, waffle } from "hardhat";
import { Signer, BigNumberish, utils, BigNumber, constants } from "ethers";
import {
  getERC20Balance,
  approveERC20,
  transferERC20,
  distributeERC20,
  getETHBalance,
} from "./utils/helper";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

import {
  CErc20Args,
  CErc20DelegatorArgs,
  CEthArgs,
  CompoundV2,
  CTokenArgs,
  CTokenDeployArg,
  CTokenLike,
  CTokens,
  InterestRateModelConfig,
  InterestRateModels,
  JumpRateModelV2Args,
  LegacyJumpRateModelV2Args,
  WhitePaperInterestRateModelArgs,
} from "./utils/interfaces";

import {
  deployBaseJumpRateModelV2,
  deployCTokens,
  deployComptroller,
  deployERC20,
  deploySimplePriceOracle,
} from "./utils/deploy";
import {
  Comptroller,
  ERC20PresetFixedSupply,
  InterestRateModel,
  SimplePriceOracle,
  Comptroller__factory,
  Unitroller,
} from "../typechain";

const DEPLOYER_WALLET_PK =
  "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const ALICE_WALLET_PK =
  "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";
const BOB_WALLET_PK =
  "0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e";

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
  let baseJumpRateModelV2: InterestRateModel;

  // deployed CTokens
  let cTokens: Array<CTokenLike>;

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
      BigNumber.from(1000).mul(E18)
    );
    USDC = await deployERC20(
      deployer,
      "USD Coin ",
      "USDC",
      BigNumber.from(1000).mul(E18)
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

    // deploy interest model
    baseJumpRateModelV2 = await deployBaseJumpRateModelV2(deployer);
    console.log(`# InterestModel deployed at: ${baseJumpRateModelV2.address}`);

    // deploy cTokens
    let cTokenDeployArgs: CTokenDeployArg[] = [
      {
        underlyingToken: "USDT",
        cToken: "cUSDT",
        underlying: USDT.address,
        underlyingPrice: BigNumber.from(1).mul(E18),
        collateralFactor: BigNumber.from(8).mul(E17), // 0.8
      },
      {
        underlyingToken: "USDC",
        cToken: "cUSDC",
        underlying: USDC.address,
        underlyingPrice: BigNumber.from(1).mul(E18),
        collateralFactor: BigNumber.from(8).mul(E17), // 0.8
      },
      {
        underlyingToken: "ETH",
        cToken: "cETH",
        underlyingPrice: BigNumber.from(3000).mul(E18),
        collateralFactor: BigNumber.from(6).mul(E17), // 0.6
      },
    ];
    cTokens = await deployCTokens(
      cTokenDeployArgs,
      baseJumpRateModelV2,
      simplePriceOracle,
      comptrollerAsDeployer,
      deployer
    );
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("When everything is deployed", async () => {
    it("Should allow deposit", async function () {
      // distribute 100 USDC to alice and bob
      await distributeERC20(
        USDC,
        deployer.zkWallet,
        [alice, bob],
        [BigNumber.from(100).mul(E18), BigNumber.from(100).mul(E18)]
      );

      console.log("alice USDC", await getERC20Balance(USDC, alice));
      console.log("bob USDC", await getERC20Balance(USDC, bob));

      // distribute 10 ETH to alice and bob
      await deployer.zkWallet.sendTransaction({
        to: alice.address,
        value: ethers.utils.parseEther("10"),
      });
      await deployer.zkWallet.sendTransaction({
        to: bob.address,
        value: ethers.utils.parseEther("10"),
      });
      // console.log("alice eth:", getETHBalance(alice));
      // console.log("bob eth:", getETHBalance(bob));

      // alice mint cUSDT
      await approveERC20(
        USDC,
        alice,
        cTokens[1].address,
        BigNumber.from(100).mul(E18)
      );
      console.log("name", await cTokens[1].name());
      console.log("cUSDC total supply", cTokens[1].totalSupply);
      console.log(
        "allowance",
        await USDC.allowance(alice.address, cTokens[1].address),
        await USDC.allowance(cTokens[1].address, alice.address)
      );
      console.log("alice minting cUSDC from underlying 10 USDC");
      tx = await cTokens[1].connect(alice).mint(BigNumber.from(10).mul(E18));
      await tx.wait();
      console.log("alice USDC", await getERC20Balance(USDC, alice));
      console.log(
        "deployer USDC",
        await getERC20Balance(USDC, deployer.zkWallet)
      );
      console.log("cUSDC total supply", await cTokens[1].totalSupply());

      console.log("alice minting cETH from underlying 1 ETH");
      tx = await cTokens[2].connect(alice).mint(ethers.utils.parseEther("1"));
      await tx.wait();
      console.log("alice ETH", await getERC20Balance(USDC, alice));
      console.log(
        "deployer USDC",
        await getERC20Balance(USDC, deployer.zkWallet)
      );
      console.log("cUSDC total supply", await cTokens[1].totalSupply());
    });
  });
});
