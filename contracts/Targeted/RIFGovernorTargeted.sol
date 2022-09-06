// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import './RIFProposalTarget.sol';

abstract contract RIFGovernorTargeted is Governor {
    IRIFProposalTarget public proposalTarget;

    function updateProposalTarget(IRIFProposalTarget _newTarget)
        public
        virtual
        onlyGovernance
    {
        proposalTarget = _newTarget;
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual override returns (uint256) {
        uint256 proposalId = super.execute(
            targets,
            values,
            calldatas,
            descriptionHash
        );
        // call function on the target smart contract after the proposal execution
        if (address(proposalTarget) != address(0)) {
            proposalTarget.onProposalExecution(proposalId);
        }
        return proposalId;
    }
}
