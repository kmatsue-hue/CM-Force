import React from 'react';
import { stripProjectHonorific } from '../utils/projectName.js';

const ProjectName = ({
  name = '',
  className = '',
  honorificClassName = '',
  fallback = '案件名未設定',
}) => {
  const baseName = stripProjectHonorific(name);

  return (
    <span className={className}>
      <span>{baseName || fallback}</span>
      {baseName && (
        <span className={`ml-1 align-baseline text-[0.72em] font-semibold text-gray-400 ${honorificClassName}`}>
          様
        </span>
      )}
    </span>
  );
};

export default ProjectName;
