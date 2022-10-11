// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol';
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Snapshot
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

/// @custom:security-contact shenshin@me.com
contract RIFVoteToken is ERC20, ERC20Permit, ERC20Votes, ERC20Wrapper, ERC20Snapshot {
    constructor(IERC20 _rifToken)
        ERC20('RIFVoteToken', 'RIFV')
        ERC20Permit('RIFVoteToken')
        ERC20Wrapper(_rifToken)
    {}

    // think about who can call this function
    function makeSnapshot() public returns (uint256) {
      return _snapshot();
    }

    // The functions below are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    function decimals()
        public
        view
        override(ERC20, ERC20Wrapper)
        returns (uint8)
    {
        return super.decimals();
    }
}
