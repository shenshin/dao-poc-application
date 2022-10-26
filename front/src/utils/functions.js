import { ethers } from 'ethers';
import { ProposalState } from './constants';

export function getDescriptionHash(description) {
  return ethers.utils.solidityKeccak256(['string'], [description]);
}

export function calculateProposalId({
  addresses,
  amounts,
  calldatas,
  description,
}) {
  return ethers.BigNumber.from(
    ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
        [addresses, amounts, calldatas, getDescriptionHash(description)],
      ),
    ),
  );
}

export async function validateProposalState(governorContract, proposal, state) {
  let proposalState;
  try {
    const proposalId = calculateProposalId(proposal);
    // if this tx rejects, it means proposal with this ID was not initiated yet
    proposalState = await governorContract.state(proposalId);
  } catch (error) {
    throw new Error(`Proposal "${proposal.description}" does not exist`);
  }
  if (proposalState !== state) {
    const optionName = Object.keys(ProposalState)[proposalState];
    throw new Error(`Proposal "${proposal.description}" is ${optionName}`);
  }
}
