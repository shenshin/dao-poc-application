import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RootstockContext from '../../contexts/rootstockContext';
import ProposalContext from '../../contexts/proposalContext';
import Container from '../../styles/container';
import Note from '../../styles/note';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  RouteNames,
} from '../../utils/constants';
import { verifyProposalUniqueness } from '../../utils/functions';

const secondsInMinute = 60;

function CreateRrProposal() {
  const navigate = useNavigate();
  const { rrContract, governorContract, setErrorMessage, setLoading } =
    useContext(RootstockContext);

  const { addProposal, proposals } = useContext(ProposalContext);

  // percent of treasury to distribute
  const [percent, setPercent] = useState(50);
  // RR duration, minutes
  const [duration, setDuration] = useState(15);
  // unique proposal description
  const [description, setDescription] = useState('RR proposal #1');

  const validateParams = async () => {
    if (percent <= 0 || percent > 100)
      throw new Error('Incorrect percent value');
    if (duration < 1 || duration > 100)
      throw new Error('Incorrect duration value');
    if (!description) throw new Error('Specify a proposal description');
    // make sure proposal ID is unique
    if (proposals.some((propos) => propos.description === description))
      throw new Error('Proposal description should be unique');
    // make sure there is no active redistribution running
    if (await rrContract.isActive())
      throw new Error('Revenue redistribution is currently running');
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
      const proposal = { addresses, amounts, calldatas, description };
      await verifyProposalUniqueness(governorContract, proposal);
      const tx = await governorContract.propose(
        addresses,
        amounts,
        calldatas,
        description,
      );
      setLoading(`Sending tx ${tx.hash}`);
      await tx.wait();
      addProposal(proposal);
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
    </Container>
  );
}

export default CreateRrProposal;
