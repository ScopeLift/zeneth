// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract SwapBriber {
    using Address for address;
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

        // If this is the first time this token and router have been used, we'll approve it
        // it permanently. Could this be risky? What if someone uses a malicious router? The
        // contract should never hold a token balance. All tokens transfered in this method are
        // immediately swapped. If the assumption that this contract will never hold a balance
        // isn't broken, then there shouldn't be a risk.
        if (_token.allowance(address(this), address(_router)) == 0) {
            _callOptionalReturn(
                _token,
                abi.encodeWithSelector(_token.approve.selector, address(_router), type(uint256).max)
            );
        }

        _router.swapExactTokensForETH(_tokenAmount, _ethBribe, _path, address(this), _deadline);
        block.coinbase.transfer(_ethBribe);
    }

    receive() external payable { }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * Via OpenZeppelin https://github.com/OpenZeppelin/openzeppelin-contracts/blob/0d40f705a7d4a42ff622ae3a0e1a90305fc5b93e/contracts/token/ERC20/utils/SafeERC20.sol#L66
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) { // Return data is optional
            // solhint-disable-next-line max-line-length
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}
