import { parseEther } from "ethers/lib/utils";
import chai from "chai";
import { solidity } from "ethereum-waffle";

import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import "@openzeppelin/test-helpers";
import { Contract, constants, utils } from "ethers";
import * as hre from "hardhat";
import { waffle } from "hardhat";
import { Provider, Wallet } from "zksync-web3";
import { EsXB__factory } from "../../typechain/factories/contracts/Governance/Tokens/EsXB__factory";
import { distributeETH } from "../utils";

chai.use(solidity);
const { expect } = chai;

const DEPLOYER_WALLET_PK =
  "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const ALICE_WALLET_PK =
  "0x3bc6be7e7ff3f699ee912296170fd4cbaa5e39ccf1363236e000abf434af8810";
const BOB_WALLET_PK =
  "0x61537d18c2226a1cecad7fe674d0cd697f5b6c9fdd673cfb08f15f86d6f78df0";

const E18 = constants.WeiPerEther;

describe("EsXB", function () {
  // Providers
  const provider = Provider.getDefaultProvider();

  // Accounts
  let deployer: Deployer;
  let alice: Wallet;
  let bob: Wallet;

  // Txs
  let tx;

  // xBank
  let esXB: Contract;

  async function fixture() {
    // deployer
    const deployerWallet = new Wallet(DEPLOYER_WALLET_PK, provider);
    deployer = new Deployer(hre, deployerWallet);
    alice = new Wallet(ALICE_WALLET_PK, provider);
    bob = new Wallet(BOB_WALLET_PK, provider);
    console.log("# Deployer address:", deployer.zkWallet.address);

    // deploy ERC20s
    esXB = await hre.zkUpgrades.deployProxy(
      deployer.zkWallet,
      await deployer.loadArtifact("EsXB"),
      ["Escrowed XBANK", "esXB"],
      { initializer: "initialize" }
    );
    await esXB.deployed();
    console.log(`# esXB deployed at: ${esXB.address}`);

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
    it("Should have expected initial state", async function () {
      const esXBAsDeployer = EsXB__factory.connect(
        esXB.address,
        deployer.zkWallet
      );

      // [check] name and symbol
      expect(await esXBAsDeployer.name()).to.eq("Escrowed XBANK");
      expect(await esXBAsDeployer.symbol()).to.eq("esXB");

      // [check] transferGuard should be deployer
      const transferGuard = await esXBAsDeployer.transferGuard();
      expect(transferGuard).to.eq(deployer.zkWallet.address);

      // [check] allowedFrom any address should return false
      const canAliceTransfer = await esXBAsDeployer.allowedFroms(alice.address);
      expect(canAliceTransfer).to.eq(false);
    });

    context("Added functionalities", async () => {
      it("Should not allow to updateTransferGuard to 0", async function () {
        const esXBAsDeployer = EsXB__factory.connect(
          esXB.address,
          deployer.zkWallet
        );

        // [check] update transferGuard to 0x0 should revert
        tx = esXBAsDeployer.updateTransferGuard(constants.AddressZero);
        expect(tx).to.be.reverted;
      });

      it("Should not allow to updateTransferGuard by non transferGuard address", async function () {
        const esXBAsAlice = EsXB__factory.connect(esXB.address, alice);

        // [check] update transferGuard to 0x0 should revert
        tx = esXBAsAlice.updateTransferGuard(alice.address);
        expect(tx).to.be.reverted;
      });

      it("Should allow to set newTransferGuard when called by transferGuard", async function () {
        const esXBAsDeployer = EsXB__factory.connect(
          esXB.address,
          deployer.zkWallet
        );
        const esXBAsAlice = EsXB__factory.connect(esXB.address, alice);

        // update transferGuard to alice
        tx = await esXBAsDeployer.updateTransferGuard(alice.address);
        await tx.wait();
        // [check] transferGuard updated
        expect(await esXBAsDeployer.transferGuard()).to.eq(alice.address);

        // update transferGuard back to deployer
        tx = await esXBAsAlice.updateTransferGuard(deployer.zkWallet.address);
        await tx.wait();
        // [check] update transferGuard back to deployer
        expect(await esXBAsDeployer.transferGuard()).to.eq(
          deployer.zkWallet.address
        );
      });

      it("Should allow transferGuard to transfer", async function () {
        // mint 10e18 token to deployer
        const esXBAsDeployer = EsXB__factory.connect(
          esXB.address,
          deployer.zkWallet
        );
        tx = await esXBAsDeployer.mint(
          deployer.zkWallet.address,
          utils.parseEther("10")
        );
        await tx.wait();

        // [check] deployer can transfer to anyone without set allowedFroms
        tx = await esXBAsDeployer.transfer(
          alice.address,
          utils.parseEther("10")
        );
        await tx.wait();

        const aliceBalance = await esXBAsDeployer.balanceOf(alice.address);
        expect(aliceBalance).to.eq(utils.parseEther("10"));
      });

      it("Should not allow others to transfer when not in allowedFroms", async function () {
        // mint 10e18 token to alice
        const esXBAsDeployer = EsXB__factory.connect(
          esXB.address,
          deployer.zkWallet
        );
        esXBAsDeployer.mint(alice.address, utils.parseEther("10"));

        // [check] alice cannot transfer to anyone because alice is not in allowedFroms
        const esXBAsAlice = EsXB__factory.connect(esXB.address, alice);
        tx = esXBAsAlice.transfer(bob.address, utils.parseEther("10"));
        expect(tx).to.be.reverted;
      });

      it("Should allow others to transfer when in allowedFroms", async function () {
        // mint 10e18 token to alice, bob
        const esXBAsDeployer = EsXB__factory.connect(
          esXB.address,
          deployer.zkWallet
        );
        const esXBAsAlice = EsXB__factory.connect(esXB.address, alice);
        const esXBAsBob = EsXB__factory.connect(esXB.address, bob);
        tx = await esXBAsDeployer.mint(alice.address, utils.parseEther("10"));
        await tx.wait();

        // update transferFrom
        tx = await esXBAsDeployer.updateAllowedFrom(alice.address, true);
        await tx.wait();

        // [check] alice can transfer to anyone because alice is in allowedFroms
        tx = await esXBAsAlice.transfer(bob.address, utils.parseEther("10"));
        await tx.wait();
        const bobBalance = await esXBAsAlice.balanceOf(bob.address);
        expect(bobBalance).to.eq(utils.parseEther("10"));

        // [check] bob cannot transfer to anyone because bob is NOT in allowedFroms
        tx = esXBAsBob.transfer(alice.address, utils.parseEther("10"));
        expect(tx).to.be.reverted;
      });
    });
  });
});
