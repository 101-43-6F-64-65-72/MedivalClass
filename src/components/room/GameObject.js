import React from 'react';

export default function GameObject({ object }) {
  if (!object.visible) return null;

  // We use object.y as the z-index so objects lower on the screen (higher y) appear in front
  const zIndex = Math.floor(object.y + object.height);

  let style = {
    position: 'absolute',
    left: object.x,
    top: object.y,
    width: object.width,
    height: object.height,
    zIndex: object.collision ? zIndex : 0, // Background/zones stay at bottom
  };

  let content = null;

  switch (object.type) {
    case 'wall':
      if (object.id === 'wall-top') {
        style.backgroundColor = '#e8dfcf'; // Wall surface matching asset sheet
        style.borderBottom = '8px solid #9c7853'; // Wooden baseboard from asset sheet
        style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
      } else {
        style.backgroundColor = '#475569';
        style.border = '2px solid #334155';
      }
      break;
    case 'stage-carpet':
      style.backgroundColor = 'rgba(30, 41, 59, 0.45)';
      style.border = '2px solid #64748b';
      style.borderRadius = '12px';
      style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.3)';
      break;
    case 'screen':
      style.backgroundColor = '#f8fafc';
      style.border = '6px solid #1e293b';
      style.borderRadius = '8px';
      style.display = 'flex';
      style.alignItems = 'center';
      style.justifyContent = 'center';
      style.color = '#0f172a';
      style.fontWeight = 'bold';
      style.boxShadow = '0 16px 24px rgba(0,0,0,0.25)';
      content = 'Presentation Screen';
      break;
    case 'podium':
      style.backgroundColor = '#b08968';
      style.border = '3px solid #7f5539';
      style.borderRadius = '6px';
      style.boxShadow = '0 8px 0 #582f0e, 0 12px 10px rgba(0,0,0,0.3)';
      style.display = 'flex';
      style.alignItems = 'center';
      style.justifyContent = 'center';
      style.color = '#fff';
      style.fontSize = '12px';
      content = '🎤';
      break;
    case 'table':
      style.backgroundColor = '#ddb892'; // Warm oak wood top matching asset sheet
      style.border = '3px solid #b08968';
      style.borderRadius = '10px';
      // 3D semi-isometric depth bevel & soft shadow
      style.boxShadow = '0 12px 0 #7f5539, 0 18px 15px rgba(0,0,0,0.25)';
      style.display = 'flex';
      style.alignItems = 'center';
      style.justifyContent = 'space-around';
      content = (
        <div className="flex gap-4 opacity-75 pointer-events-none text-xs">
          <span>💻</span>
          <span>📓</span>
        </div>
      );
      break;
    case 'coffee-table':
      style.backgroundColor = '#cda77a';
      style.border = '3px solid #9c7853';
      style.borderRadius = '12px';
      style.boxShadow = '0 8px 0 #785332, 0 14px 10px rgba(0,0,0,0.2)';
      style.display = 'flex';
      style.alignItems = 'center';
      style.justifyContent = 'center';
      content = <span className="opacity-80 text-sm">☕</span>;
      break;
    case 'game-zone':
      style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
      style.border = '2px dashed #60a5fa';
      style.borderRadius = '16px';
      style.display = 'flex';
      style.alignItems = 'flex-start';
      style.padding = '12px';
      style.color = '#2563eb';
      style.fontWeight = 'bold';
      style.fontSize = '13px';
      content = '🕹️ Gaming & Arcade Lounge';
      break;
    case 'reading-zone':
      style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
      style.border = '2px dashed #f59e0b';
      style.borderRadius = '16px';
      style.display = 'flex';
      style.alignItems = 'flex-start';
      style.padding = '12px';
      style.color = '#d97706';
      style.fontWeight = 'bold';
      style.fontSize = '13px';
      content = '📚 Cozy Reading Corner';
      break;
    case 'arcade':
      style.backgroundColor = '#ef4444';
      style.border = '2px solid #991b1b';
      style.borderRadius = '6px 6px 0 0';
      style.boxShadow = '0 16px 0 #7f1d1d, 0 20px 15px rgba(0,0,0,0.3)';
      style.display = 'flex';
      style.alignItems = 'center';
      style.justifyContent = 'center';
      style.color = 'white';
      content = '🕹️';
      break;
    default:
      style.backgroundColor = 'gray';
  }

  return (
    <div style={style}>
      {content}
    </div>
  );
}
