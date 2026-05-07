import React from 'react';

const Badge = ({ children, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${colors[color] || colors.purple}`}>
      {children}
    </span>
  );
};

export default Badge;
