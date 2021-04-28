// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapBriber {

    function swapAndBribe(
        IERC20 _token,
        uint256 _tokenAmount,
        uint256 _ethBribe,
        IUniswapV2Router02 _router,
        address[] calldata _path,
        uint256 _deadline
    ) public {
        SafeERC20.safeTransferFrom(_token, msg.sender, address(this), _tokenAmount);
        _token.approve(address(_router), _tokenAmount);
        _router.swapExactTokensForETH(_tokenAmount, _ethBribe, _path, address(this), _deadline);
    }

    fallback() external payable { }
}
