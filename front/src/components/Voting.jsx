import { useContext, useRef } from 'react';
import { ethers } from 'ethers';
import EthersContext from '../contexts/ethersContext';
import ProposalContext from '../contexts/proposalContext';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  VOTE_OPTIONS,
} from '../utils/constants';
import Container from '../styles/container';
import Note from '../styles/note';

function Voting() {
  const { governorContract, setErrorMessage, setLoading } =
    useContext(EthersContext);

  const { proposals } = useContext(ProposalContext);

  const selectedProposalIndex = useRef(0);
  const selectedVoteType = useRef(0);

  const selectProposal = (event) => {
    selectedProposalIndex.current = event.target.value;
  };

  const selectVoteType = (event) => {
    selectedVoteType.current = event.target.value;
  };

  const getId = ({ addresses, amounts, calldatas, description }) => {
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
  };

  const vote = async () => {
    try {
      setErrorMessage(null);
      const proposal = proposals[selectedProposalIndex.current];
      const proposalId = getId(proposal);
      const voteType = selectedVoteType.current;
      const tx = await governorContract.castVote(proposalId, voteType);
      setLoading(`Sending tx ${tx.hash}`);
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
        <h4>Voting for a proposal</h4>
        <p>Select a proposal</p>
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
            <div>
              <label htmlFor="vote">
                Vote &nbsp;
                <select onChange={selectVoteType}>
                  {VOTE_OPTIONS.map((option, i) => (
                    <option value={i} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" onClick={vote}>
              Cast vote
            </button>
          </>
        )}
      </div>
    </Container>
  );
}

export default Voting;
