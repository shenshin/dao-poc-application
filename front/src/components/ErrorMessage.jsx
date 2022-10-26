import { useContext } from 'react';
import styled from 'styled-components';
import RootstockContext from '../contexts/rootstockContext';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.4rem;
`;

const ErrorText = styled.span`
  color: red;
  font-size: 1.2rem;
`;

function ErrorMessage() {
  const { errorMessage, setErrorMessage } = useContext(RootstockContext);
  return (
    errorMessage && (
      <Container>
        <ErrorText>{errorMessage}</ErrorText>
        <button type="button" onClick={() => setErrorMessage(null)}>
          <span aria-hidden="true">&times;</span>
        </button>
      </Container>
    )
  );
}

export default ErrorMessage;
