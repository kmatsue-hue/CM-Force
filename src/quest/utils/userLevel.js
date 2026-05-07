import { USERS_MASTER } from '../data/users.js';

export const getBorderClassByLevel = (level) => {
  if (level >= 10) return "animate-rainbow-border border-[3px]";
  if (level >= 5) return "border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] border-[3px]";
  if (level >= 4) return "border-gray-300 shadow-[0_0_8px_rgba(209,213,219,0.8)] border-[3px]";
  if (level >= 3) return "border-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] border-[3px]";
  if (level >= 2) return "border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] border-[3px]";
  return "border-white border-[3px]";
};

export const getBgColorByLevel = (level) => {
  if (level >= 25) return "bg-gradient-to-br from-yellow-500 to-red-600";
  if (level >= 20) return "bg-purple-900";
  if (level >= 15) return "bg-red-900";
  if (level >= 10) return "bg-blue-900";
  if (level >= 5) return "bg-green-900";
  return "bg-black";
};

// user は呼び出し側コンポーネントの state なので引数で受け取る
export const getCharInfo = (userName, currentUser) => {
  if (userName === currentUser.name) {
    return {
      id: currentUser.id,
      charType: currentUser.charType,
      className: currentUser.className,
      level: currentUser.level,
    };
  }
  return USERS_MASTER[userName] || { id: 999, charType: 'hero', className: 'みならい', level: 1 };
};
