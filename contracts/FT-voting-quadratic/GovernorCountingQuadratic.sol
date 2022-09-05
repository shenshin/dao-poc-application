// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol';
import '../util/FixedPointMathLib.sol';

abstract contract GovernorCountingQuadratic is GovernorCountingSimple {
    using FixedPointMathLib for uint256;
    mapping(uint256 => ProposalVote) private _proposalVotes;

    function getForVotes(uint256 _proposalId) external view returns (uint256) {
        return _proposalVotes[_proposalId].forVotes;
    }

    function getAgainstVotes(uint256 _proposalId)
        external
        view
        returns (uint256)
    {
        return _proposalVotes[_proposalId].againstVotes;
    }

    function getAbstainVotes(uint256 _proposalId)
        external
        view
        returns (uint256)
    {
        return _proposalVotes[_proposalId].abstainVotes;
    }

    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory // params
    ) internal virtual override {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];

        require(
            !proposalvote.hasVoted[account],
            'GovernorVotingSimple: vote already cast'
        );
        proposalvote.hasVoted[account] = true;

        if (support == uint8(VoteType.Against)) {
            proposalvote.againstVotes += weight.sqrt();
        } else if (support == uint8(VoteType.For)) {
            proposalvote.forVotes += weight.sqrt();
        } else if (support == uint8(VoteType.Abstain)) {
            proposalvote.abstainVotes += weight.sqrt();
        } else {
            revert('GovernorVotingSimple: invalid value for enum VoteType');
        }
    }
}
