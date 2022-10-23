import { ethers } from 'ethers';

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
