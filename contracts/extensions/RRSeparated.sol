// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/IGovernor.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '../FT-voting-simple/RIFVoteToken.sol';

contract RevenueRedistributor {
    using Counters for Counters.Counter;

    // Распорядитель - гарант демократичного и честного выбора
    IGovernor public immutable governor;

    mapping(uint256 => Redistribution) redistributions;

    Counters.Counter private _rdCounter;

    modifier governorOnly() {
        require(
            msg.sender == address(governor),
            'can be called only by the Governor'
        );
        _;
    }

    event Initiated(Redistribution redistribution);

    constructor(IGovernor _governor) {
        governor = _governor;
        // to start rd counter from 1
        _rdCounter.increment();
    }

    // TODO: Make snapshot token interface with `makeSnapshot()`

    // this function call should be encoded within a proposal for redistribution
    // a new rd is active from the moment of creation untill `_endsAt`
    function initiateRedistribution(RIFVoteToken _voteToken, uint256 _endsAt)
        public
        governorOnly
    {
        // previous redistribution should be finished
        require(
            !redistributions[_rdCounter.current() - 1].isActive(),
            'can not start a new redistribution before the previous one is still active'
        );
        // a new redistribution should be finished in future
        require(
            _endsAt > block.timestamp,
            'time is up for this redistribution'
        );
        // redistribution creation
        // transfer all the money to newly created smart contract
        Redistribution newRd = new Redistribution{value: address(this).balance}(
            _voteToken,
            _endsAt
        );
        redistributions[_rdCounter.current()] = newRd;
        _rdCounter.increment();
        emit Initiated(newRd);
    }

    receive() external payable {}

    fallback() external {
        revert('unknown function call');
    }
}

contract Redistribution {
    // rd expiration time
    uint256 public immutable endsAt;
    // total amount of RBTC to redistribute to token holders during this rd
    uint256 public immutable amount;
    // token whos holders receive the revenue
    RIFVoteToken public immutable voteToken;
    // in case the vote token balances will change during the rd
    uint256 public immutable voteTokenSnapshot;

    mapping(address => bool) acquired;

    constructor(RIFVoteToken _voteToken, uint256 _endsAt) payable {
        voteToken = _voteToken;
        voteTokenSnapshot = _voteToken.makeSnapshot();
        endsAt = _endsAt;
        amount = msg.value;
    }

    function aquireRevenue() external {
        // make sure the rd is still active
        require(isActive(), 'there is no active redistribution');
        // make sure the revenue is not acquired yet
        require(!acquired[msg.sender], 'the revenue was already acquired');
        // make sure token owner can't acquire revenue again
        acquired[msg.sender] = true;
        // send revenue to the sender
        payable(msg.sender).transfer(getRevenueAmount(msg.sender));
    }

    function isActive() public view returns (bool) {
        return endsAt >= block.timestamp;
    }

    function getRevenueAmount(address _holder) public view returns (uint256) {
        uint256 totalSupply = voteToken.totalSupplyAt(voteTokenSnapshot);
        uint256 holderBalance = voteToken.balanceOfAt(
            _holder,
            voteTokenSnapshot
        );
        return (amount / holderBalance) * totalSupply;
    }
}
