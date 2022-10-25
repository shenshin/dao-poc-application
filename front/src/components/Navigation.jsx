import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { RouteNames } from '../utils/constants';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;
const NavSection = styled.ul`
  margin: 0;
  padding: 0;
  padding-right: 1rem;
  width: fit-content;
  list-style: none;
`;
const PageSection = styled.div`
  flex-grow: 2;
`;
const NavItem = styled.li`
  margin-bottom: 0.5rem;
`;
const StyledNavLink = styled(NavLink)`
  color: white;
  text-decoration: none;
  &.active {
    text-decoration: underline;
  }
`;

function Navigation({ children }) {
  return (
    <Container>
      <NavSection>
        <NavItem>
          <StyledNavLink to={RouteNames.enfranchisement}>
            Enfranchisement
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to={RouteNames.createRrProposal}>
            Create RR proposal
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to={RouteNames.voteForProposal}>
            Vote for proposal
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to={RouteNames.executeProposal}>
            Execute proposal
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to={RouteNames.acquireRevenue}>
            Acquire revenue
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to={RouteNames.unwrapTokens}>
            Unwrap RIF tokens
          </StyledNavLink>
        </NavItem>
      </NavSection>
      <PageSection>{children}</PageSection>
    </Container>
  );
}

export default Navigation;
