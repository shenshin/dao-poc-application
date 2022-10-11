// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

// controller which generates crowdfunding Campaign contracts
contract KickStarter is Ownable {
    using Counters for Counters.Counter;

    struct KickCampaign {
        Campaign targetContract;
        bool claimed;
    }
    event CampaignStarted(
        uint256 id,
        address addr,
        uint256 goal,
        uint256 endsAt,
        address starter
    );

    mapping(uint256 => KickCampaign) public campaigns;

    Counters.Counter private campaignCounter;
    uint256 constant MAX_DURATION = 30 days;

    function startCampaign(uint256 _goal, uint256 _endsAt) external {
        require(_goal > 0, 'goal should be a positive number');
        require(
            _endsAt <= block.timestamp + MAX_DURATION &&
                _endsAt > block.timestamp,
            'incorrect campaign duration'
        );
        uint256 newCampaignId = campaignCounter.current();
        Campaign newCampaign = new Campaign(newCampaignId, _endsAt, _goal);
        campaigns[newCampaignId] = KickCampaign({
            targetContract: newCampaign,
            claimed: false
        });
        emit CampaignStarted(newCampaignId, address(newCampaign), _goal, _endsAt, msg.sender);
        campaignCounter.increment();
    }

    // callback function
    function onClaimed(uint256 _id) public {
        KickCampaign storage campaign = campaigns[_id];
        require(
            msg.sender == address(campaign.targetContract),
            'can be called only by the campaign contract'
        );
        campaign.claimed = true;
    }
}

// crowdfunding Campaign
contract Campaign {
    uint256 public immutable id;
    uint256 public immutable endsAt;
    uint256 public immutable goal;
    address public immutable organizer;
    KickStarter public immutable parent;

    event Pledged(address donator, uint256 amount);

    mapping(address => uint256) pledges;
    uint256 public pledged;

    constructor(
        uint256 _id,
        uint256 _endsAt,
        uint256 _goal
    ) {
        id = _id;
        endsAt = _endsAt;
        goal = _goal;
        organizer = tx.origin;
        parent = KickStarter(msg.sender);
    }

    modifier activeCampaign(bool isActive) {
        if (isActive) {
            require(
                block.timestamp <= endsAt,
                'the campaign has already finished'
            );
        } else {
            require(block.timestamp > endsAt, 'the campaign is still active');
        }
        _;
    }

    function pledge() external payable activeCampaign(true) {
        require(msg.value > 0, 'you must pledge a positive amount');

        pledges[msg.sender] += msg.value;
        pledged += msg.value;

        emit Pledged(msg.sender, msg.value);
    }

    function claim() external activeCampaign(false) {
        require(msg.sender == organizer, 'you are not an organizer');
        require(pledged >= goal, 'the campaign goal was not reached');

        payable(organizer).transfer(pledged);
        // inform the parent
        parent.onClaimed(id);
    }

    // pull pattern refund
    function refundPledge(uint256 _amount) external activeCampaign(true) {
        pledged -= _amount;
        pledges[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    function fullRefundPledge() external activeCampaign(false) {
        require(pledged < goal, 'the campaign goal was reached');
        uint256 amount = pledges[msg.sender];
        pledged -= amount;
        delete pledges[msg.sender];
        payable(msg.sender).transfer(amount);
    }
}
