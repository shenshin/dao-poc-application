import { useState } from 'react';
import ProposalContext from '../contexts/proposalContext';

function ProposalProvider({ children }) {
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

  const removeProposal = (description) => {
    setProposals((existingPoposals) =>
      existingPoposals.filter(
        (proposal) => proposal.description !== description,
      ),
    );
  };

  const proposalContextValue = {
    proposals,
    addProposal,
    removeProposal,
  };
  return (
    <ProposalContext.Provider value={proposalContextValue}>
      {children}
    </ProposalContext.Provider>
  );
}

export default ProposalProvider;
