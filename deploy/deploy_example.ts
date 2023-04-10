import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Greeter contract`);

  // Initialize the wallet.
  const wallet = new Wallet("<privatekey>");

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Greeter");

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  // `greeting` is an argument for contract constructor.
  const greeting = "Hi there!";
  const greeterContract = await deployer.deploy(artifact, [greeting]);

  // Show the contract info.
  const contractAddress = greeterContract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  // Call the deployed contract.
  const greetingFromContract = await greeterContract.greet();
  if (greetingFromContract == greeting) {
    console.log(`Contract greets us with ${greeting}!`);
  } else {
    console.error(
      `Contract said something unexpected: ${greetingFromContract}`
    );
  }

  // Edit the greeting of the contract
  const newGreeting = "We are xBank team!";
  const setNewGreetingHandle = await greeterContract.setGreeting(newGreeting);
  await setNewGreetingHandle.wait();

  const newGreetingFromContract = await greeterContract.greet();
  if (newGreetingFromContract == newGreeting) {
    console.log(`Contract greets us with ${newGreeting}!`);
  } else {
    console.error(
      `Contract said something unexpected: ${newGreetingFromContract}`
    );
  }
}
