// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapBriber {
    using SafeERC20 for IERC20;

    function swapAndBribe(
        IERC20 _token,
        uint256 _tokenAmount,
        uint256 _ethBribe,
        IUniswapV2Router02 _router, // better to keep this in storage?
        address[] calldata _path,
        uint256 _deadline
    ) public {
        _token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
        _token.safeApprove(address(_router), _tokenAmount); // Can probably make this more efficient by only approving max first time per token
        _router.swapExactTokensForETH(_tokenAmount, _ethBribe, _path, address(this), _deadline);
        block.coinbase.transfer(_ethBribe);
    }

    fallback() external payable { }
}
