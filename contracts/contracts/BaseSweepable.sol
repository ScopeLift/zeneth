// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseSweepable is Ownable {
  address payable public sweepReceiver;
  address public sweeper;

  event SetSweepReceiver(address indexed oldReceiver, address indexed newReceiver);
  event SetSweeper(address indexed oldSweeper, address indexed newReceiver);

  constructor(address payable _sweepReceiver, address _sweeper) {
    sweepReceiver = _sweepReceiver;
    sweeper = _sweeper;
  }
}
