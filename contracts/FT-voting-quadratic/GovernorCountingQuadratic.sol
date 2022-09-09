// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';
import '../FT-voting-simple/GovernorCountingSimple.sol';

import '../util/FixedPointMathLib.sol';

/**
 * @dev Extension of {Governor} for quadratic (sqrt), 3 options, vote counting.
 * Iherit from GovernorVotes to have access to `token` in order to calculate quorum.
 * `quorum` is defined here as prescibed in the Governor docs.
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
        bytes memory // params
    ) internal virtual override(Governor, GovernorCountingSimple) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];

        require(
            !proposalvote.hasVoted[account],
            'GovernorCountingQuadratic: vote already cast'
        );
        proposalvote.hasVoted[account] = true;

        if (support == uint8(VoteType.Against)) {
            proposalvote.againstVotes += FixedPointMathLib.sqrt(weight);
        } else if (support == uint8(VoteType.For)) {
            proposalvote.forVotes += FixedPointMathLib.sqrt(weight);
        } else if (support == uint8(VoteType.Abstain)) {
            proposalvote.abstainVotes += FixedPointMathLib.sqrt(weight);
        } else {
            revert(
                'GovernorCountingQuadratic: invalid value for enum VoteType'
            );
        }
    }
}
