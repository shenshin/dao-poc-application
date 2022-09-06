// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';

import '../util/FixedPointMathLib.sol';

/**
 * @dev Extension of {Governor} for quadratic (sqrt), 3 options, vote counting.
 * Iherit from GovernorVotes to have access to `token` in order to calculate quorum.
 * `quorum` is defined here as prescibed in the Governor docs.
 */
abstract contract RIFGovernorCountingQuadratic is GovernorVotes {
    /**
     * @dev Supported vote types. Matches Governor Bravo ordering.
     */
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => ProposalVote) private _proposalVotes;

    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE()
        public
        pure
        virtual
        override
        returns (string memory)
    {
        return 'support=bravo&quorum=for,abstain';
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account)
        public
        view
        virtual
        override
        returns (bool)
    {
        return _proposalVotes[proposalId].hasVoted[account];
    }

    /**
     * @dev Accessor to the internal vote counts.
     */
    function proposalVotes(uint256 proposalId)
        public
        view
        virtual
        returns (
            uint256 againstVotes,
            uint256 forVotes,
            uint256 abstainVotes
        )
    {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return (
            proposalvote.againstVotes,
            proposalvote.forVotes,
            proposalvote.abstainVotes
        );
    }

    function quorum(uint256 blockNumber)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return FixedPointMathLib.sqrt(token.getPastTotalSupply(blockNumber));
    }

    function getForVotes(uint256 _proposalId)
        external
        view
        virtual
        returns (uint256)
    {
        return _proposalVotes[_proposalId].forVotes;
    }

    function getAgainstVotes(uint256 _proposalId)
        external
        view
        virtual
        returns (uint256)
    {
        return _proposalVotes[_proposalId].againstVotes;
    }

    function getAbstainVotes(uint256 _proposalId)
        external
        view
        virtual
        returns (uint256)
    {
        return _proposalVotes[_proposalId].abstainVotes;
    }

    /**
     * @dev See {Governor-_quorumReached}.
     */
    function _quorumReached(uint256 proposalId)
        internal
        view
        virtual
        override
        returns (bool)
    {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];

        return
            quorum(proposalSnapshot(proposalId)) <=
            proposalvote.forVotes + proposalvote.abstainVotes;
    }

    /**
     * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
     */
    function _voteSucceeded(uint256 proposalId)
        internal
        view
        virtual
        override
        returns (bool)
    {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];

        return proposalvote.forVotes > proposalvote.againstVotes;
    }

    /**
     * @dev See {Governor-_countVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
     */
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
