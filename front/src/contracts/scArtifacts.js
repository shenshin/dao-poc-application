// smart contract artifacts
import rifArtifact31 from './31/RIFToken.json';
import voteArtifact31 from './31/RIFVoteToken.json';
import governorArtifact31 from './31/GovernorFT.json';
import rrArtifact31 from './31/RevenueRedistributor.json';

import rifArtifact33 from './33/RIFToken.json';
import voteArtifact33 from './33/RIFVoteToken.json';
import governorArtifact33 from './33/GovernorFT.json';
import rrArtifact33 from './33/RevenueRedistributor.json';

const scArtifacts = {
  31: {
    rif: rifArtifact31,
    vote: voteArtifact31,
    governor: governorArtifact31,
    rr: rrArtifact31,
  },
  33: {
    rif: rifArtifact33,
    vote: voteArtifact33,
    governor: governorArtifact33,
    rr: rrArtifact33,
  },
};

export default scArtifacts;
