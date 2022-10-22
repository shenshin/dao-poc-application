import { useState } from 'react';
import ProposalContext from '../contexts/proposalContext';

function ProposalProvider({ children }) {
  // percent of treasury to distribute
  const [percent, setPercent] = useState(50);
  // RR duration, days
  const [duration, setDuration] = useState(1);
  // unique proposal description
  const [description, setDescription] = useState('RR proposal #1');
  const proposalContextValue = {
    percent,
    setPercent,
    duration,
    setDuration,
    description,
    setDescription,
  };
  return (
    <ProposalContext.Provider value={proposalContextValue}>
      {children}
    </ProposalContext.Provider>
  );
}

export default ProposalProvider;
