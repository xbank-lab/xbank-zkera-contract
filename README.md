# xBank - multi-currency money market on zkSync ERA

xBank will serve primarily as the multi-currency money market on Starknet. The vision is to be the premier money market and facilitate the lending and borrowing for participants within the Starknet DeFi ecosystem, including but not limited to retail users, protocols, and institutions.

This contract version of xBank is Compound-forked and tailored for zkSync ERA limitations and guidances.

## Overview

### At the start, there will be four primary types of participants in the xBank protocol.

### 1. Lender

- Alice, as one of the lenders, can deposit ERC20 tokens (e.g. USDC, wETH) to the protocol lending vaults, which in return provides "xToken" to the Lender. The "xToken" is an interest-bearing token that accrues interest over time and acts as a receipt for the Lenders' deposited funds. To withdraw the funds, Lenders can convert the "xToken" back to the original ERC 20 tokens they deposited + the interest that has accrued over the deposit period.

### 2. Borrower

- To become a borrower, the user must first be a lender and put up their lending deposit as collateral. With their deposit collateralized, Bob, as one of the Borrowers, can take out loans in any assets from xBank's lending vaults. The maximum borrowable amount for the Borrower is determined by the value of their collateral assets and the collateral factor of the borrowed assets. Note that just like AAVE and Compound, xBank loans are cross-margin loans.

### 3. Liquidator

- Charlie, as one of the Liquidators, plays a key role in helping xBank manage risks from bad debt, especially in a volatile market condition. They are in charge of liquidating positions whose health metrics fall below a predetermined threshold. To incentivize the Liquidator to take timely action, the Liquidator will be awarded a liquidation incentive for the liquidation they initiate. The liquidation incentive paid to the Liquidator is part of the liquidation fee charged on the position owners' collateral asset.

## Contracts

### xtoken

- The xtoken contract represents a self-contained interest-bearing token for users who deposit ERC20 tokens to xBank's lending vaults. Each ERC20 has a distinct pair of "xToken" e.g. ETH-xETH, USDC-xUSDC which are always exchangeable. In addition, "xToken" can be considered as an entry point for xBank basic functionalities e.g. redeem, mint, borrow, and repay.

### xes

- The xes contract acts as a mediator & approver for the "xToken", checking whether a given action can be done safely under the current context and condition.

### interest-model

- The interest-model contract represents a mathematical strategy to determine the most suitable interest rate for each asset based on the asset's dynamic utilization rate, which is a function of the asset's supply and market demand.

### Compile contracts

- `yarn compile`
