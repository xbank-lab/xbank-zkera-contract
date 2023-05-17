// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { IVester } from "./VesterInterface.sol";

contract Vester is ReentrancyGuardUpgradeable, IVester {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  uint256 private constant YEAR = 365 days;

  /**
   * Events
   */
  event LogVest(
    address indexed owner,
    uint256 indexed itemIndex,
    uint256 amount,
    uint256 startTime,
    uint256 endTime,
    uint256 penaltyAmount
  );
  event LogClaim(
    address indexed owner,
    uint256 indexed itemIndex,
    uint256 vestedAmount,
    uint256 unusedAmount
  );
  event LogAbort(
    address indexed owner,
    uint256 indexed itemIndex,
    uint256 returnAmount
  );

  /**
   * States
   */
  IERC20Upgradeable public esXBANK;
  IERC20Upgradeable public XBANK;

  address public vestedEsXBDestination;
  address public unusedEsXBANKDestination;

  Item[] public override items;

  function initialize(
    address esXBANKAddress,
    address XBANKAddress,
    address vestedEsXBANKDestinationAddress,
    address unusedEsXBANKDestinationAddress
  ) external initializer {
    ReentrancyGuardUpgradeable.__ReentrancyGuard_init();

    esXBANK = IERC20Upgradeable(esXBANKAddress);
    XBANK = IERC20Upgradeable(XBANKAddress);
    vestedEsXBDestination = vestedEsXBANKDestinationAddress;
    unusedEsXBANKDestination = unusedEsXBANKDestinationAddress;

    // Santy checks
    esXBANK.totalSupply();
    XBANK.totalSupply();
  }

  function vestFor(
    address account,
    uint256 amount,
    uint256 duration
  ) external nonReentrant {
    if (account == address(0) || account == address(this))
      revert IVester_InvalidAddress();
    if (amount == 0) revert IVester_BadArgument();
    if (duration > YEAR) revert IVester_ExceedMaxDuration();

    uint256 totalUnlockedAmount = getUnlockAmount(amount, duration);

    Item memory item = Item({
      owner: account,
      amount: amount,
      startTime: block.timestamp,
      endTime: block.timestamp + duration,
      hasAborted: false,
      hasClaimed: false,
      lastClaimTime: block.timestamp,
      totalUnlockedAmount: totalUnlockedAmount
    });

    items.push(item);

    uint256 penaltyAmount;

    unchecked {
      penaltyAmount = amount - totalUnlockedAmount;
    }

    esXBANK.safeTransferFrom(msg.sender, address(this), amount);

    if (penaltyAmount > 0) {
      esXBANK.safeTransfer(unusedEsXBANKDestination, penaltyAmount);
    }

    emit LogVest(
      item.owner,
      items.length - 1,
      amount,
      item.startTime,
      item.endTime,
      penaltyAmount
    );
  }

  function claimFor(uint256 itemIndex) external nonReentrant {
    _claimFor(itemIndex);
  }

  function claimFor(uint256[] memory itemIndexes) external nonReentrant {
    for (uint256 i = 0; i < itemIndexes.length; ) {
      _claimFor(itemIndexes[i]);

      unchecked {
        ++i;
      }
    }
  }

  function _claimFor(uint256 itemIndex) internal {
    Item memory item = items[itemIndex];

    if (item.hasClaimed) revert IVester_Claimed();
    if (item.hasAborted) revert IVester_Aborted();

    uint256 elapsedDuration = block.timestamp < item.endTime
      ? block.timestamp - item.lastClaimTime
      : item.endTime - item.lastClaimTime;
    uint256 claimable = getUnlockAmount(item.amount, elapsedDuration);

    // If vest has ended, then mark this as claimed.
    items[itemIndex].hasClaimed = block.timestamp > item.endTime;

    items[itemIndex].lastClaimTime = block.timestamp;

    XBANK.safeTransfer(item.owner, claimable);

    esXBANK.safeTransfer(vestedEsXBDestination, claimable);

    emit LogClaim(item.owner, itemIndex, claimable, item.amount - claimable);
  }

  function abort(uint256 itemIndex) external nonReentrant {
    Item memory item = items[itemIndex];
    if (msg.sender != item.owner) revert IVester_Unauthorized();
    if (block.timestamp > item.endTime) revert IVester_HasCompleted();
    if (item.hasClaimed) revert IVester_Claimed();
    if (item.hasAborted) revert IVester_Aborted();

    _claimFor(itemIndex);

    uint256 elapsedDurationSinceStart = block.timestamp - item.startTime;
    uint256 amountUsed = getUnlockAmount(
      item.amount,
      elapsedDurationSinceStart
    );
    uint256 returnAmount = item.totalUnlockedAmount - amountUsed;

    items[itemIndex].hasAborted = true;

    esXBANK.safeTransfer(msg.sender, returnAmount);

    emit LogAbort(msg.sender, itemIndex, returnAmount);
  }

  function getUnlockAmount(
    uint256 amount,
    uint256 duration
  ) public pure returns (uint256) {
    // The total unlock amount if the user wait until the end of the vest duration
    // totalUnlockAmount = (amount * vestDuration) / YEAR
    // Return the adjusted unlock amount based on the elapsed duration
    // pendingUnlockAmount = (totalUnlockAmount * elapsedDuration) / vestDuration
    // OR
    // pendingUnlockAmount = ((amount * vestDuration) / YEAR * elapsedDuration) / vestDuration
    //                     = (amount * vestDuration * elapsedDuration) / YEAR / vestDuration
    //                     = (amount * elapsedDuration) / YEAR
    return (amount * duration) / YEAR;
  }

  function nextItemId() external view returns (uint256) {
    return items.length;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }
}
