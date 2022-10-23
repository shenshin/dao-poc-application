/* eslint-disable no-unused-vars */
import { useContext, useState } from 'react';
import { ethers } from 'ethers';
import EthersContext from '../contexts/ethersContext';
import { ERROR_CODE_TX_REJECTED_BY_USER } from '../utils/constants';
import Container from '../styles/container';
import Note from '../styles/note';

function Voting() {
  return (
    <Container>
      <Note>Voting</Note>
    </Container>
  );
}

export default Voting;
