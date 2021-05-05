// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseSweepable.sol";

contract EthSweepable is BaseSweepable {
  event SweptEth(address indexed receiver);

  constructor(address payable _sweepReceiver, address _sweeper) BaseSweepable(_sweepReceiver, _sweeper) {}

  function sweepEth() public onlySweeper {
    emit SweptEth(sweepReceiver);
    sweepReceiver.transfer(address(this).balance);
  }

  receive() external payable {}
}
