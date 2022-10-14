// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '../FT-voting-simple/GovernorFT.sol';

contract GovernorNFT is GovernorFT {
    constructor(IVotes _token) GovernorFT(_token) {}
}
