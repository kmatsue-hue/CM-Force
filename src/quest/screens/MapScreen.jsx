import React from 'react';
import {
  AREA_LABELS,
  AREA_TO_MAP_CODE,
  JAPAN_MAP_PIXELS,
  MAP_COLORS,
  MAP_COORDS,
} from '../data/japanMap.js';
import { MAP_CSV_SORT_OPTIONS } from '../data/users.js';
import { getBgColorByLevel, getBorderClassByLevel, getCharInfo } from '../utils/userLevel.js';
import DqWindow from '../ui/DqWindow.jsx';
import DqCommand from '../ui/DqCommand.jsx';
import PixelCharacter from '../ui/PixelCharacter.jsx';

const MapScreen = ({
  clients,
  selectedClientId,
  setSelectedClientId,
  mapCsvSort,
  setMapCsvSort,
  mapZoom,
  setMapZoom,
  editProgress,
  setEditProgress,
  user,
  sortClientsByMode,
  resolveClientOwnerName,
  handleFileUpload,
  handleExportClientsCsv,
  handleReport,
}) => {
  const selectedClient = clients.find(c => String(c.id) === selectedClientId);
  const sortedClientsForMap = sortClientsByMode(clients, mapCsvSort);
  const highlightedArea = selectedClient?.area || null;
  const highlightedCode = highlightedArea ? AREA_TO_MAP_CODE[highlightedArea] : null;
  const selectedClientOwnerName = selectedClient
    ? resolveClientOwnerName(selectedClient)
    : null;
  const selectedClientOwnerChar = selectedClientOwnerName ? getCharInfo(selectedClientOwnerName, user) : null;

  return (
    <div className="space-y-4 animate-fadeIn p-4 pb-20">
      <DqWindow title="クエスト" className="relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button onClick={() => setMapZoom(Math.max(0.6, mapZoom - 0.2))} className="bg-black border-[2px] border-white w-8 h-8 rounded text-white flex items-center justify-center font-bold pb-1 hover:bg-white/20">-</button>
        <button onClick={() => setMapZoom(Math.min(2, mapZoom + 0.2))} className="bg-black border-[2px] border-white w-8 h-8 rounded text-white flex items-center justify-center font-bold pb-1 hover:bg-white/20">+</button>
      </div>

      <div className="bg-[#003366] border-[2px] border-blue-400 rounded-[4px] h-[300px] mt-2 flex items-center justify-center overflow-hidden">
        <div className="relative" style={{ width: '320px', height: '300px', transform: `scale(${mapZoom * 0.9})`, transformOrigin: 'center' }}>
          {/* 日本地図のドット表示 */}
          {JAPAN_MAP_PIXELS.map((row, y) =>
            row.split('').map((char, x) => {
              if (char === '.') return null;
              const isHighlightedPixel = highlightedCode === char;
              return (
                <div
                  key={`map-${x}-${y}`}
                  className="absolute w-[10px] h-[10px] transition-all duration-200"
                  style={{
                    left: x * 10,
                    top: y * 10,
                    backgroundColor: isHighlightedPixel ? '#fde047' : MAP_COLORS[char],
                    boxShadow: isHighlightedPixel ? '0 0 7px rgba(253,224,71,0.95)' : 'none',
                    filter: isHighlightedPixel ? 'brightness(1.25)' : 'none',
                    zIndex: isHighlightedPixel ? 5 : 1,
                  }}
                />
              );
            })
          )}

          {/* エリア名ラベル */}
          {AREA_LABELS.map(({ area, label, x, y }) => {
            const isHighlightedLabel = highlightedArea === area;
            return (
              <div
                key={`label-${area}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-1 rounded pointer-events-none select-none font-bold ${
                  isHighlightedLabel ? 'text-yellow-200 bg-black/75' : 'text-white bg-black/55'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  fontSize: '11px',
                  lineHeight: 1.1,
                  letterSpacing: '0.04em',
                  textShadow: '0 1px 2px rgba(0,0,0,0.95)',
                  boxShadow: isHighlightedLabel ? '0 0 8px rgba(253,224,71,0.6)' : 'none',
                  zIndex: isHighlightedLabel ? 24 : 12,
                }}
              >
                {label}
              </div>
            );
          })}

          {/* クライアント(施設)ピン */}
          {clients.map(client => {
            const coords = MAP_COORDS[client.area];
            if (!coords) return null;
            const isSelected = selectedClientId === String(client.id);
            const isDone = client.status === '契約済み';

            return (
              <div
                key={`pin-${client.id}`}
                className={`absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center cursor-pointer z-20 transition-transform ${isSelected ? 'scale-150 animate-bounce' : 'hover:scale-125'}`}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                onClick={() => setSelectedClientId(String(client.id))}
              >
                <div className={`w-3 h-3 rounded-full border-[2px] border-black shadow-md ${isDone ? 'bg-gray-500' : isSelected ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[15px] mb-2">▼ もくてきちを えらぶ</div>
        <select
          className="w-full bg-black border-[3px] border-white text-white p-2 rounded-[4px] font-dq focus:outline-none focus:border-yellow-300 text-[15px]"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
        >
          <option value="">-- えらんでください --</option>
          {sortedClientsForMap.map(c => (
            <option key={c.id} value={c.id}>
              {c.area}・{c.name} ({c.status})
            </option>
          ))}
        </select>
      </div>

      {/* CSV取り込みボタン */}
      <div className="mt-4 border-t-[2px] border-dashed border-gray-600 pt-3">
        <div className="text-[13px] text-gray-300 mb-2">▼ ひょうじ/しゅつりょく ならび</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {MAP_CSV_SORT_OPTIONS.map((option) => (
            <button
              key={`csv-sort-${option.value}`}
              onClick={() => setMapCsvSort(option.value)}
              className={`px-3 py-1 border-[2px] rounded-[4px] text-[13px] transition-colors ${
                mapCsvSort === option.value
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-white border-gray-500 hover:border-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="text-[14px] text-yellow-300 mb-2">▼ しせつデータ(CSV)を よみこむ</div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer inline-block bg-black border-[2px] border-white text-white px-4 py-2 rounded-[4px] hover:bg-white/20 transition-colors text-[14px] sm:text-[15px]">
            ▶ CSVファイルを えらぶ <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={handleExportClientsCsv}
            className="inline-block bg-black border-[2px] border-white text-white px-4 py-2 rounded-[4px] hover:bg-white/20 transition-colors text-[14px] sm:text-[15px]"
          >
            ▶ CSVを しゅつりょく
          </button>
        </div>
      </div>
    </DqWindow>

    {/* 選択中クライアントの進捗を編集して報告するUI */}
    {selectedClientId && editProgress && (
      <DqWindow title="しんちょく の ほうこく">
        {selectedClientOwnerName && selectedClientOwnerChar && (
          <div className="mt-2 mb-3 p-2 border-[2px] border-white/60 bg-black/40 rounded-[4px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1 rounded-[4px] shrink-0 ${getBgColorByLevel(selectedClientOwnerChar.level)} ${getBorderClassByLevel(selectedClientOwnerChar.level)}`}>
                <PixelCharacter type={selectedClientOwnerChar.charType} size={26} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-gray-300 leading-none mb-1">たんとうしゃ</div>
                <div className="text-[14px] font-bold text-white truncate">{selectedClientOwnerName}</div>
              </div>
            </div>
            <div className="text-[12px] text-yellow-200 whitespace-nowrap">{selectedClientOwnerChar.className}</div>
          </div>
        )}
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between bg-white/5 p-2 rounded">
            <span className="text-[14px] sm:text-[15px]">耳 ヒアリング</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editProgress.hearing}
                onChange={e => setEditProgress({...editProgress, hearing: parseInt(e.target.value, 10) || 0})}
                className="w-16 sm:w-20 bg-black border-[2px] border-white text-right p-1 text-[15px] focus:border-yellow-300 focus:outline-none"
                min="0"
              />
              <span className="text-[15px]">件</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 p-2 rounded">
            <span className="text-[14px] sm:text-[15px]">巻 見積もり</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editProgress.estimate}
                onChange={e => setEditProgress({...editProgress, estimate: parseInt(e.target.value, 10) || 0})}
                className="w-16 sm:w-20 bg-black border-[2px] border-white text-right p-1 text-[15px] focus:border-yellow-300 focus:outline-none"
                min="0"
              />
              <span className="text-[15px]">件</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 p-2 rounded">
            <span className="text-[14px] sm:text-[15px]">冠 契約</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editProgress.contract}
                onChange={e => setEditProgress({...editProgress, contract: parseInt(e.target.value, 10) || 0})}
                className="w-16 sm:w-20 bg-black border-[2px] border-white text-right p-1 text-[15px] focus:border-yellow-300 focus:outline-none"
                min="0"
              />
              <span className="text-[15px]">件</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 p-2 rounded">
            <span className="text-[14px] sm:text-[15px]">利益（円）</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editProgress.profit}
                onChange={e => setEditProgress({...editProgress, profit: parseInt(e.target.value, 10) || 0})}
                className="w-24 sm:w-32 bg-black border-[2px] border-white text-right p-1 text-[15px] focus:border-yellow-300 focus:outline-none"
                min="0"
              />
              <span className="text-[15px]">G</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t-[2px] border-dashed border-gray-600">
          <DqCommand onClick={handleReport}>
            ギルドに ほうこくする
          </DqCommand>
        </div>
      </DqWindow>
    )}
    </div>
  );
};

export default MapScreen;
