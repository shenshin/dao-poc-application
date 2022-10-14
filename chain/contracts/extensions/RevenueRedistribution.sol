// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/IGovernor.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '../FT-voting-simple/RIFVoteToken.sol';

contract RevenueRedistributor {
    using Counters for Counters.Counter;

    struct Redistribution {
        // rd expiration time
        uint256 endsAt;
        // total amount of RBTC to redistribute to token holders during this rd
        uint256 amount;
        // in case the vote token balances will change during the rd
        uint256 voteTokenSnapshot;
    }

    IGovernor public immutable governor;
    // token whoes owners to distribute the revenue
    RIFVoteToken public immutable voteToken;

    mapping(uint256 => Redistribution) public redistributions;
    mapping(uint256 => mapping(address => bool)) public acquired;

    event RevenueRedistributionInitiated(
        uint256 id,
        uint256 amount,
        uint256 endsAt,
        uint256 snapshot
    );
    event RevenueAcquired(address holder, uint256 amount);

    Counters.Counter private _rdCounter;

    constructor(IGovernor _governor, RIFVoteToken _voteToken) {
        governor = _governor;
        voteToken = _voteToken;
    }

    // this function call should be encoded within a proposal for redistribution
    // a new rd is active within a `_duration` period from the moment of creation
    function initiateRedistribution(uint256 _duration, uint256 _percent)
        public
    {
        // only the Governor!
        require(
            msg.sender == address(governor),
            'can be called only by the Governor'
        );
        // previous redistribution should be finished
        require(
            !isActiveRedistribution(_rdCounter.current()),
            'can not start a new redistribution before the previous one is still active'
        );
        _createNewRedistribution(_duration, _percent);
    }

    // to be called by the token holders to transfer their revenue
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
        uint256 amount = getRevenueAmount(msg.sender);
        (bool success, ) = msg.sender.call{value: amount}('');
        require(success, 'could not transfer revenue');
        emit RevenueAcquired(msg.sender, amount);
    }

    function getRevenueAmount(address _holder) public view returns (uint256) {
        Redistribution storage currentRd = redistributions[
            _rdCounter.current()
        ];
        uint256 snapshot = currentRd.voteTokenSnapshot;
        uint256 totalSupply = voteToken.totalSupplyAt(snapshot);
        uint256 holderBalance = voteToken.balanceOfAt(_holder, snapshot);

        return (currentRd.amount * holderBalance) / totalSupply;
    }

    function isActiveRedistribution(uint256 _id) public view returns (bool) {
        return redistributions[_id].endsAt >= block.timestamp;
    }

    function _createNewRedistribution(uint256 _duration, uint256 _percent)
        private
    {
        _rdCounter.increment();
        uint256 newRdId = _rdCounter.current();
        uint256 newRdAmount = (address(this).balance * _percent) / 100;
        uint256 snapshot = voteToken.makeSnapshot();
        uint256 endsAt = block.timestamp + _duration;
        redistributions[newRdId] = Redistribution({
            endsAt: endsAt,
            amount: newRdAmount,
            voteTokenSnapshot: snapshot
        });

        emit RevenueRedistributionInitiated(
            newRdId,
            newRdAmount,
            endsAt,
            snapshot
        );
    }

    receive() external payable {}

    fallback() external {
        revert('unknown function call');
    }
}
