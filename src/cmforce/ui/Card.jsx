import React from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`cm-card bg-white/90 rounded-[24px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-[#e4e4df] overflow-hidden backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

export default Card;
