import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';
import ProposalContext from '../contexts/proposalContext';
import Container from '../styles/container';
import Note from '../styles/note';
import { ERROR_CODE_TX_REJECTED_BY_USER } from '../utils/constants';

const secondsInDay = 86400;

function CreateRrProposal() {
  const { rrContract, governorContract, setErrorMessage, setLoading } =
    useContext(EthersContext);

  const {
    percent,
    setPercent,
    duration, // days
    setDuration,
    description,
    setDescription,
  } = useContext(ProposalContext);

  const validateParams = () => {
    if (percent <= 0 || percent > 100)
      throw new Error('Incorrect percent value');
    if (duration < 1 || duration > 100)
      throw new Error('Incorrect duration value');
    if (!description) throw new Error('Specify a proposal description');
  };

  const createProposal = async () => {
    try {
      setErrorMessage(null);
      validateParams();
      const initiateRrCalldata = rrContract.interface.encodeFunctionData(
        'initiateRedistribution',
        [duration * secondsInDay, percent],
      );
      const proposal = [[rrContract.address], [0], [initiateRrCalldata]];
      const tx = await governorContract.propose(...proposal, description);
      setLoading(`Sending tx: ${tx.hash}`);
      await tx.wait();
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
          &nbsp;days
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
      <button type="button" onClick={createProposal}>
        Propose the RR
      </button>
    </Container>
  );
}

export default CreateRrProposal;
