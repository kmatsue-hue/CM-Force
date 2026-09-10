import React from 'react';

const ProgressBar = ({ current, target, colorClass, large = false, showValue = false }) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  return (
    <div
      className={`fc-progress ${large ? 'is-large' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={current}
    >
      <div className={`fc-progress-fill ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      {showValue && (
        <span className="fc-progress-value">
          {current} / {target} EXP
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
