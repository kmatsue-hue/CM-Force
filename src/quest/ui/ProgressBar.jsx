import React from 'react';

const ProgressBar = ({ current, target, colorClass }) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  return (
    <div className="fc-progress">
      <div className={`fc-progress-fill ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

export default ProgressBar;
