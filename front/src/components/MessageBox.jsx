import styled from 'styled-components';
import ErrorMessage from './ErrorMessage';
import LoadingMessage from './LoadingMessage';

const Container = styled.div``;

function MessageBox() {
  return (
    <Container>
      <ErrorMessage />
      <LoadingMessage />
    </Container>
  );
}

export default MessageBox;
