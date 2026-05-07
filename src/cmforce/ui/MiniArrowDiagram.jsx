import React from 'react';
import { PHASES } from '../data/phases.js';

// 一覧表示用のミニマイルストーン
const MiniArrowDiagram = ({ currentPhase }) => {
  const currentIndex = PHASES.indexOf(currentPhase);
  return (
    <div className="flex items-center w-full min-w-[140px] mt-2 py-1">
      {PHASES.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <React.Fragment key={phase}>
            <div
              className={`flex-shrink-0 rounded-full transition-all duration-300 ${
                isCompleted ? 'w-2 h-2 bg-purple-600' :
                isActive ? 'w-3.5 h-3.5 bg-purple-600 ring-[4px] ring-purple-100 z-10 relative' :
                'w-2 h-2 bg-gray-200'
              }`}
              title={phase}
            />
            {index < PHASES.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-[2px] transition-all duration-300 rounded-full ${
                  index < currentIndex ? 'bg-purple-600' : 'bg-gray-100'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MiniArrowDiagram;
