import styled from 'styled-components';
import NetworkErrorMessage from './NetworkErrorMessage';
import WaitingForTxMessage from './WaitingForTxMessage';

const Container = styled.div``;

function MessageBox() {
  return (
    <Container>
      <NetworkErrorMessage />
      <WaitingForTxMessage />
    </Container>
  );
}

export default MessageBox;
