import React from 'react';
import { USERS_MASTER } from '../data/users.js';
import { formatG, formatId } from '../utils/format.js';
import { getBgColorByLevel, getBorderClassByLevel } from '../utils/userLevel.js';
import DqWindow from '../ui/DqWindow.jsx';
import PixelCharacter from '../ui/PixelCharacter.jsx';

const UserProfileModal = ({ selectedUserProfile, user, dashboardData, onClose }) => {
  if (!selectedUserProfile) return null;

  const isSelf = selectedUserProfile === user.name;
  const charInfo = isSelf
    ? { id: user.id, charType: user.charType, className: user.className, level: user.level }
    : USERS_MASTER[selectedUserProfile] || { id: 999, charType: 'hero', className: 'みならい', level: 1 };

  const userData = dashboardData.users[selectedUserProfile] || { sales: 0, profit: 0 };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 animate-fadeIn">
      <DqWindow className="w-full max-w-sm relative pb-14" title="ぼうけんしゃ じょうほう">
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className={`p-3 rounded-[6px] mb-3 ${getBgColorByLevel(charInfo.level)} ${getBorderClassByLevel(charInfo.level)}`}>
             <PixelCharacter type={charInfo.charType} size={80} className="animate-bounce-slow" />
          </div>
          <div className="text-yellow-200 text-[13px]">{formatId(charInfo.id)}</div>
          <div className="text-[19px] font-bold text-white mb-2">{selectedUserProfile}</div>
          <div className="text-[15px] text-gray-300">しょくぎょう: {charInfo.className}</div>
          <div className="text-[15px] text-gray-300">レベル: <span className="text-white">{charInfo.level}</span></div>
        </div>

        <DqWindow title="ギルドでの こうけん" className="mb-4 text-[15px] leading-loose bg-black/50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-300">うりあげ</span>
            <span>{formatG(userData.sales)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">りえき</span>
            <span className="text-yellow-200">{userData.profit > 0 ? formatG(userData.profit) : "—"}</span>
          </div>
        </DqWindow>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="px-8 py-2 border-[3px] border-white bg-black hover:bg-white/20 text-[15px] rounded-[6px] transition-colors"
          >
            とじる
          </button>
        </div>
      </DqWindow>
    </div>
  );
};

export default UserProfileModal;
