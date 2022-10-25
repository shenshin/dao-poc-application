import { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EthersContext from '../../contexts/ethersContext';
import ProposalContext from '../../contexts/proposalContext';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  ProposalState,
  RouteNames,
} from '../../utils/constants';
import Container from '../../styles/container';
import Note from '../../styles/note';
import { calculateProposalId, getDescriptionHash } from '../../utils/functions';

function ExecuteProposal() {
  const navigate = useNavigate();
  const { governorContract, setErrorMessage, setLoading } =
    useContext(EthersContext);
  const { proposals } = useContext(ProposalContext);

  const selectedProposalIndex = useRef(0);

  const selectProposal = (event) => {
    selectedProposalIndex.current = event.target.value;
  };

  const validateProposalState = async (proposal) => {
    let proposalState;
    try {
      const proposalId = calculateProposalId(proposal);
      // if this tx rejects, it means proposal with this ID was not initiated yet
      proposalState = await governorContract.state(proposalId);
    } catch (error) {
      throw new Error(`Proposal "${proposal.description}" doesn not exist`);
    }
    if (proposalState !== ProposalState.Succeeded) {
      const optionName = Object.keys(ProposalState)[proposalState];
      throw new Error(`Proposal "${proposal.description}" is ${optionName}`);
    }
  };

  const execute = async () => {
    try {
      const proposal = proposals[selectedProposalIndex.current];
      await validateProposalState(proposal);
      const { addresses, amounts, calldatas, description } = proposal;
      const tx = await governorContract.execute(
        addresses,
        amounts,
        calldatas,
        getDescriptionHash(description),
      );
      setLoading(`Sending tx ${tx.hash}`);
      await tx.wait();
      navigate(RouteNames.acquireRevenue);
    } catch (error) {
      if (error.code !== ERROR_CODE_TX_REJECTED_BY_USER) {
        setErrorMessage(error.message);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Container>
      <Note>
        <h4>Proposal execution</h4>
        <p>Select a proposal to execute</p>
      </Note>
      <div>
        {proposals.length === 0 ? (
          <p>No active proposals</p>
        ) : (
          <>
            <div>
              <label htmlFor="select-proposal">
                Proposal &nbsp;
                <select onChange={selectProposal} name="select-proposal">
                  {proposals.map((proposal, i) => (
                    <option value={i} key={proposal.description}>
                      {proposal.description}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" onClick={execute}>
              Execute
            </button>
          </>
        )}
      </div>
    </Container>
  );
}

export default ExecuteProposal;
