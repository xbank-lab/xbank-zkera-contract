// import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
// import { constants, utils } from "ethers";
// import * as hre from "hardhat";
// import { waffle } from "hardhat";
// import { Provider, Wallet } from "zksync-web3";
// import { distributeERC20 } from "./utils";

// import { expect } from "chai";
// import { ERC20PresetFixedSupply, Multicall } from "../typechain";
// import { deployERC20, deployMulticall } from "./utils/deploy";

// const DEPLOYER_WALLET_PK =
//   "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
// const ALICE_WALLET_PK =
//   "0x3bc6be7e7ff3f699ee912296170fd4cbaa5e39ccf1363236e000abf434af8810";
// const BOB_WALLET_PK =
//   "0x61537d18c2226a1cecad7fe674d0cd697f5b6c9fdd673cfb08f15f86d6f78df0";

// const E18 = constants.WeiPerEther;

// describe("Multicall", function () {
//   // Providers
//   const provider = Provider.getDefaultProvider();

//   // Accounts
//   let deployer: Deployer;
//   let alice: Wallet;
//   let bob: Wallet;

//   let tx;

//   // ERC20s
//   let USDT: ERC20PresetFixedSupply;
//   let USDC: ERC20PresetFixedSupply;

//   let multicall: Multicall;

//   async function fixture() {
//     // deployer
//     const deployerWallet = new Wallet(DEPLOYER_WALLET_PK, provider);
//     deployer = new Deployer(hre, deployerWallet);
//     alice = new Wallet(ALICE_WALLET_PK, provider);
//     bob = new Wallet(BOB_WALLET_PK, provider);
//     console.log("# Deployer address:", deployer.zkWallet.address);

//     // deploy ERC20s
//     USDT = await deployERC20(
//       deployer,
//       "Tether USD",
//       "USDT",
//       utils.parseEther("1000")
//     );
//     USDC = await deployERC20(
//       deployer,
//       "USD Coin ",
//       "USDC",
//       utils.parseEther("1000")
//     );

//     console.log(`# ERC20 ${await USDT.symbol()} deployed at: ${USDT.address}`);
//     console.log(`# ERC20 ${await USDC.symbol()} deployed at: ${USDC.address}`);

//     // deploy multicall
//     multicall = await deployMulticall(deployer);

//     // distribute 100 USDT to alice and bob
//     await distributeERC20(
//       USDT,
//       deployer.zkWallet,
//       [alice, bob],
//       [utils.parseEther("100"), utils.parseEther("100")]
//     );

//     // distribute 100 USDC to alice and bob
//     await distributeERC20(
//       USDC,
//       deployer.zkWallet,
//       [alice, bob],
//       [utils.parseEther("100"), utils.parseEther("100")]
//     );
//   }

//   beforeEach(async () => {
//     await waffle.loadFixture(fixture);
//   });

//   it("should allow multicall contract call", async () => {
//     const meta = [{ contract: USDC }, { contract: USDT }];
//     const calls = [
//       {
//         target: meta[0].contract.address,
//         callData: meta[0].contract.interface.encodeFunctionData("balanceOf", [
//           alice.address,
//         ]),
//       },
//       {
//         target: meta[1].contract.address,
//         callData: meta[1].contract.interface.encodeFunctionData("balanceOf", [
//           alice.address,
//         ]),
//       },
//     ];
//     const { returnData } = await multicall
//       .connect(alice)
//       .callStatic.aggregate(calls);
//     const res = returnData.map((call, i) => {
//       const result = meta[i].contract.interface.decodeFunctionResult(
//         "balanceOf",
//         call
//       );
//       if (result.length === 1) return result[0];
//       return result;
//     });
//     expect(res[0]).to.eq(utils.parseEther("100"));
//     expect(res[1]).to.eq(utils.parseEther("100"));
//   });
// });
