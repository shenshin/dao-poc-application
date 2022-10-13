// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '../extensions/ProposalTarget.sol';

contract ProposalTargetQuadratic is ProposalTarget {
    constructor(IGovernor _governor) ProposalTarget(_governor) {}
}
