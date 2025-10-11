import React from 'react';

const BuildInfo: React.FC = () => {
  const buildNumber = process.env.REACT_APP_BUILD_NUMBER || 'dev';
  const buildCommit = process.env.REACT_APP_BUILD_COMMIT?.substring(0, 7) || 'local';

  return (
    <div className="text-xs text-slate-400 dark:text-slate-500">
      Build: #{buildNumber} ({buildCommit})
    </div>
  );
};

export default BuildInfo;