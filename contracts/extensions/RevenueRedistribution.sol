// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/IGovernor.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '../FT-voting-simple/RIFVoteToken.sol';

contract RevenueRedistributor {
    struct Redistribution {
        // rd expiration time
        uint256 endsAt;
        // total amount of RBTC to redistribute to token holders during this rd
        uint256 amount;
        // in case the vote token balances will change during the rd
        uint256 voteTokenSnapshot;
    }
    using Counters for Counters.Counter;

    IGovernor public immutable governor;
    // token whoes owners to distribute the revenue
    RIFVoteToken public immutable voteToken;

    mapping(uint256 => Redistribution) redistributions;
    mapping(uint256 => mapping(address => bool)) acquired;

    Counters.Counter private _rdCounter;

    modifier governorOnly() {
        require(
            msg.sender == address(governor),
            'can be called only by the Governor'
        );
        _;
    }

    constructor(IGovernor _governor, RIFVoteToken _voteToken) {
        governor = _governor;
        voteToken = _voteToken;
        // to start rd counter from 1
        _rdCounter.increment();
    }

    // this function call should be encoded within a proposal for redistribution
    // a new rd is active from the moment of creation untill `_endsAt`
    function initiateRedistribution(uint256 _endsAt, uint256 _percent)
        public
        governorOnly
    {
        // previous redistribution should be finished
        require(
            !isActiveRedistribution(_rdCounter.current() - 1),
            'can not start a new redistribution before the previous one is still active'
        );
        // a new redistribution should be finished in future
        require(
            _endsAt > block.timestamp,
            'time is up for this redistribution'
        );
        _createNewRedistribution(_endsAt, _percent);
    }

    function aquireRevenue() external {
        uint256 rdId = _rdCounter.current();
        // make sure the rd is still active
        require(
            isActiveRedistribution(rdId),
            'there is no active redistribution'
        );
        // make sure the revenue is not acquired yet
        require(
            !acquired[rdId][msg.sender],
            'the revenue was already acquired'
        );
        // make sure token owner can't acquire revenue again
        acquired[rdId][msg.sender] = true;
        // send revenue to the sender
        payable(msg.sender).transfer(getRevenueAmount(msg.sender));
    }

    function getRevenueAmount(address _holder) public view returns (uint256) {
        Redistribution storage currentRd = redistributions[
            _rdCounter.current()
        ];
        uint256 snapshot = currentRd.voteTokenSnapshot;
        uint256 totalSupply = voteToken.totalSupplyAt(snapshot);
        uint256 holderBalance = voteToken.balanceOfAt(_holder, snapshot);
        return (currentRd.amount / holderBalance) * totalSupply;
    }

    function isActiveRedistribution(uint256 _id) public view returns (bool) {
        return redistributions[_id].endsAt >= block.timestamp;
    }

    function _createNewRedistribution(uint256 _endsAt, uint256 _percent)
        private
    {
        uint256 newRdId = _rdCounter.current();
        redistributions[newRdId] = Redistribution({
            endsAt: _endsAt,
            amount: (address(this).balance * _percent) / 100,
            voteTokenSnapshot: voteToken.makeSnapshot()
        });
        _rdCounter.increment();
    }

    receive() external payable {}

    fallback() external {
        revert('unknown function call');
    }
}
