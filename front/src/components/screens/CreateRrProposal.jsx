import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EthersContext from '../../contexts/ethersContext';
import ProposalContext from '../../contexts/proposalContext';
import Container from '../../styles/container';
import Note from '../../styles/note';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  RouteNames,
} from '../../utils/constants';

const secondsInMinute = 60;

function CreateRrProposal() {
  const navigate = useNavigate();
  const {
    rrContract,
    isActiveRr,
    governorContract,
    setErrorMessage,
    setLoading,
  } = useContext(EthersContext);

  const { addProposal, proposals } = useContext(ProposalContext);

  // percent of treasury to distribute
  const [percent, setPercent] = useState(50);
  // RR duration, minutes
  const [duration, setDuration] = useState(5);
  // unique proposal description
  const [description, setDescription] = useState('RR proposal #1');

  const validateParams = async () => {
    if (percent <= 0 || percent > 100)
      throw new Error('Incorrect percent value');
    if (duration < 1 || duration > 100)
      throw new Error('Incorrect duration value');
    if (!description) throw new Error('Specify a proposal description');
    // make sure proposal ID is unique
    if (proposals.some((proposal) => proposal.description === description))
      throw new Error('Proposal description should be unique');
  };

  const createRRProposal = async () => {
    try {
      await validateParams();
      const initiateRrCalldata = rrContract.interface.encodeFunctionData(
        'initiateRedistribution',
        [duration * secondsInMinute, percent],
      );
      const addresses = [rrContract.address];
      const amounts = [0];
      const calldatas = [initiateRrCalldata];
      const tx = await governorContract.propose(
        addresses,
        amounts,
        calldatas,
        description,
      );
      setLoading(`Sending tx ${tx.hash}`);
      await tx.wait();
      addProposal({ addresses, amounts, calldatas, description });
      navigate(RouteNames.voteForProposal);
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
      {isActiveRr ? (
        <Note>
          <h4>Revenue redistribution is already active</h4>
          <p>
            You will be able to create a new one after the current is finished
          </p>
        </Note>
      ) : (
        <>
          <Note>
            <h4>Revenue redistribution proposal creation</h4>
            <p>Fill in the redistribution proposal parameters</p>
          </Note>
          <div>
            <label htmlFor="percent">
              Percent of the treasury to distribute &nbsp;
              <input
                value={percent}
                type="number"
                name="percent"
                min={0}
                max={100}
                onChange={(e) => setPercent(e.target.value)}
              />
              &nbsp;%
            </label>
          </div>
          <div>
            <label htmlFor="duration">
              Duration &nbsp;
              <input
                value={duration}
                type="number"
                name="duration"
                min={1}
                max={100}
                onChange={(e) => setDuration(e.target.value)}
              />
              &nbsp;minutes
            </label>
          </div>
          <div>
            <label htmlFor="description">
              Proposal description &nbsp;
              <input
                value={description}
                type="text"
                name="description"
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
          <button type="button" onClick={createRRProposal}>
            Submit Proposal
          </button>
        </>
      )}
    </Container>
  );
}

export default CreateRrProposal;
