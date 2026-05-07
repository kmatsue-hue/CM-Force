import React from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

export default Card;
