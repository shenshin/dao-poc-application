/* eslint-disable no-unused-vars */
import { useState, useContext } from 'react';
// import { ethers } from 'ethers';
import EthersContext from '../contexts/ethersContext';
import ProposalContext from '../contexts/proposalContext';

function ProposalProvider({ children }) {
  const { governorContract } = useContext(EthersContext);
  /* 
  Proposal format:
  {
      addresses: [],
      amounts: [],
      calldatas: [],
      description: '',
  },
  */
  const [proposals, setProposals] = useState([]);
  const addProposal = (proposal) => {
    setProposals((existingPoposals) => [proposal, ...existingPoposals]);
  };
  const createProposal = async (proposal) => {
    const { addresses, amounts, calldatas, description } = proposal;
    const tx = await governorContract.propose(
      addresses,
      amounts,
      calldatas,
      description,
    );
    await tx.wait();
    addProposal(proposal);
  };

  /*   const getId = ({ addresses, amounts, calldatas, description }) => {
    const descriptionHash = ethers.utils.solidityKeccak256(
      ['string'],
      [description],
    );
    return ethers.BigNumber.from(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
          [addresses, amounts, calldatas, descriptionHash],
        ),
      ),
    );
  }; */

  const removeProposal = (description) => {
    setProposals((existingPoposals) =>
      existingPoposals.filter(
        (proposal) => proposal.description !== description,
      ),
    );
  };

  const proposalContextValue = {
    proposals,
    createProposal,
    removeProposal,
  };
  return (
    <ProposalContext.Provider value={proposalContextValue}>
      {children}
    </ProposalContext.Provider>
  );
}

export default ProposalProvider;
