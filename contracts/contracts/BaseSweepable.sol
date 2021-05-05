// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseSweepable is Ownable {
  address payable public sweepReceiver;
  address public sweeper;

  event SetSweepReceiver(address indexed oldReceiver, address indexed newReceiver);
  event SetSweeper(address indexed oldSweeper, address indexed newReceiver);

  constructor(address payable _sweepReceiver, address _sweeper) {
    require(_sweepReceiver != address(0) && _sweeper != address(0), "BaseSweepable: Invalid 0-Addr deploy param");
    sweepReceiver = _sweepReceiver;
    sweeper = _sweeper;
  }

  function setSweepReceiver(address payable _newReceiver) public onlyOwner nonZero(_newReceiver) {
    emit SetSweepReceiver(sweepReceiver, _newReceiver);
    sweepReceiver = _newReceiver;
  }

  function setSweeper(address _newSweeper) public onlyOwner nonZero(_newSweeper) {
    emit SetSweeper(sweeper, _newSweeper);
    sweeper = _newSweeper;
  }

  modifier nonZero(address _addr) {
    require(_addr != address(0), "BaseSweepable: Invalid 0-Addr");
    _;
  }
}
