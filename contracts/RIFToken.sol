// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/// @custom:security-contact shenshin@me.com
contract RIFToken is ERC20, Ownable {
    constructor(uint _totalSupply) ERC20('RIFToken', 'RIF') {
        _mint(msg.sender, _totalSupply * 10**decimals());
    }

    function decimals() public pure override(ERC20) returns(uint8) {
        return 0;
    }
}
