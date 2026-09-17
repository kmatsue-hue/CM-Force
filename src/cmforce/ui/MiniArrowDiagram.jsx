import React from 'react';
import { PHASES } from '../data/phases.js';

// 一覧表示用のミニマイルストーン
const MiniArrowDiagram = ({ currentPhase }) => {
  const currentIndex = PHASES.indexOf(currentPhase);
  return (
    <div className="mt-2 flex w-full min-w-[180px] items-center py-1.5" aria-label={`進捗 ${currentIndex + 1}/${PHASES.length}`}>
      {PHASES.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <React.Fragment key={phase}>
            <div
              className={`flex-shrink-0 rounded-full transition-all duration-300 ${
                isCompleted ? 'h-2.5 w-2.5 bg-purple-600 shadow-[0_0_0_1px_rgba(126,34,206,0.12)]' :
                isActive ? 'relative z-10 h-4 w-4 bg-purple-600 ring-[5px] ring-purple-100 shadow-sm' :
                'h-2.5 w-2.5 bg-slate-200 ring-1 ring-white'
              }`}
              title={phase}
            />
            {index < PHASES.length - 1 && (
              <div
                className={`mx-1 h-[3px] flex-1 rounded-full transition-all duration-300 ${
                  index < currentIndex ? 'bg-purple-500' : 'bg-slate-100'
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
