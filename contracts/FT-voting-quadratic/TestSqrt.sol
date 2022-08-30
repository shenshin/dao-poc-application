// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import './FixedPointMathLib.sol';

contract TestSqrt {
    using FixedPointMathLib for uint256;
    function sqrt(uint256 _value) public pure returns(uint256) {
        return _value.sqrt();
    }
}