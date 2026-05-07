import React from 'react';

const DqWindow = ({ children, className = "", title = "" }) => (
  <div className={`relative fc-window p-4 text-white ${className}`}>
    {title && (
      <div className="absolute -top-[14px] left-4 fc-window-title px-2 text-[15px] sm:text-[17px] text-white">
        {title}
      </div>
    )}
    <div className={title ? "mt-1" : ""}>
      {children}
    </div>
  </div>
);

export default DqWindow;
