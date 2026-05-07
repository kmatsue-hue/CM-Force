import React from 'react';

const DqCommand = ({ children, onClick, disabled, className = "", isActive = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group relative w-full text-left pl-6 py-1.5 sm:py-2 focus:outline-none transition-none text-[15px] sm:text-[17px] leading-loose fc-command ${disabled ? 'is-disabled' : ''} ${className}`}
  >
    <span className={`absolute left-1 top-1/2 -translate-y-1/2 text-[14px] fc-command-cursor ${isActive ? 'animate-blink opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'}`}>
      ▶
    </span>
    {children}
  </button>
);

export default DqCommand;
