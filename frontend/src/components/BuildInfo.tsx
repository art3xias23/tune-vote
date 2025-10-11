import React from 'react';

const BuildInfo: React.FC = () => {
  const buildNumber = process.env.REACT_APP_BUILD_NUMBER || 'dev';
  const buildCommit = process.env.REACT_APP_BUILD_COMMIT?.substring(0, 7) || 'local';

  return (
    <span>
      #{buildNumber} ({buildCommit})
    </span>
  );
};

export default BuildInfo;