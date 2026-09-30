import React from 'react';

export default function Player({ x, y, direction, isMoving, username, color, isLocal }) {
  const width = 32;
  const height = 48;
  const zIndex = Math.floor(y + height);

  // Bobbing animation if moving
  const bobbing = isMoving ? 'animate-bounce-short' : '';

  return (
    <div 
      className={`absolute top-0 left-0 flex flex-col items-center justify-end ${
        isLocal ? '' : 'transition-transform duration-75 ease-linear'
      }`}
      style={{ 
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: width, 
        height: height, 
        zIndex,
        willChange: 'transform'
      }}
    >
      {/* Name tag */}
      <div className="absolute -top-6 whitespace-nowrap bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full border border-white/20">
        {username} {isLocal && '(You)'}
      </div>

      {/* Character body (placeholder using simple shapes) */}
      <div className={`relative flex flex-col items-center ${bobbing}`} style={{ animationDuration: '300ms' }}>
        {/* Head */}
        <div 
          className="w-6 h-6 rounded-full shadow-sm z-10"
          style={{ backgroundColor: '#fcd34d' /* Skin tone */ }}
        >
          {/* Eyes based on direction */}
          <div className="relative w-full h-full">
            {(direction === 'down' || direction === 'left' || direction === 'right') && (
              <>
                <div className="absolute w-1 h-1 bg-black rounded-full top-2" style={{ left: direction === 'left' ? '4px' : '6px' }} />
                <div className="absolute w-1 h-1 bg-black rounded-full top-2" style={{ right: direction === 'right' ? '4px' : '6px' }} />
              </>
            )}
          </div>
        </div>
        
        {/* Body */}
        <div 
          className="w-7 h-8 rounded-t-md rounded-b-sm -mt-1 shadow-md"
          style={{ backgroundColor: color || '#3b82f6' }}
        />
        
        {/* Shadow */}
        <div className="absolute -bottom-1 w-6 h-2 bg-black/30 rounded-full blur-[1px] -z-10" />
      </div>
    </div>
  );
}
