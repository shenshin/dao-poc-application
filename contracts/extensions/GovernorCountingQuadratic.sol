// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol';
import '../util/FixedPointMathLib.sol';

/**
 * @dev Extension of {Governor} for quadratic (sqrt), 3 options, vote counting.
 * Inherit from GovernorVotes to have access to `token` in order to calculate quorum.
 * `quorum` is defined here as prescribed in the Governor docs.
 */
abstract contract GovernorCountingQuadratic is
    GovernorVotes,
    GovernorCountingSimple
{
    function quorum(uint256 blockNumber)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return FixedPointMathLib.sqrt(token.getPastTotalSupply(blockNumber));
    }

    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory params
    ) internal virtual override(Governor, GovernorCountingSimple) {
        super._countVote(
            proposalId,
            account,
            support,
            FixedPointMathLib.sqrt(weight),
            params
        );
    }
}
