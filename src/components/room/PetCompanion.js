'use client';

import React, { useState, useEffect, useRef } from 'react';

export const CAT_BREEDS = [
  {
    id: 'classical',
    name: 'Mochi (Tabby)',
    idle: '/assets/AllCatsDemo/AllCatsDemo/Classical/IdleCat.png',
    jump: '/assets/AllCatsDemo/AllCatsDemo/Classical/JumpCat.png',
    idleFrames: 7,
    jumpFrames: 13,
  },
  {
    id: 'black',
    name: 'Kuro (Black Cat)',
    idle: '/assets/AllCatsDemo/AllCatsDemo/BlackCat/IdleCatb.png',
    jump: '/assets/AllCatsDemo/AllCatsDemo/BlackCat/JumpCabt.png',
    idleFrames: 7,
    jumpFrames: 13,
  },
  {
    id: 'brown',
    name: 'Caramel (Ginger)',
    idle: '/assets/AllCatsDemo/AllCatsDemo/Brown/IdleCattt.png',
    jump: '/assets/AllCatsDemo/AllCatsDemo/Brown/JumpCatttt.png',
    idleFrames: 7,
    jumpFrames: 13,
  },
  {
    id: 'white',
    name: 'Snowy (White)',
    idle: '/assets/AllCatsDemo/AllCatsDemo/White/IdleCatttt.png',
    jump: '/assets/AllCatsDemo/AllCatsDemo/White/JumpCattttt.png',
    idleFrames: 7,
    jumpFrames: 13,
  },
  {
    id: 'tiger',
    name: 'Toramaru (Tiger)',
    idle: '/assets/AllCatsDemo/AllCatsDemo/TigerCatFree/IdleCatt.png',
    jump: '/assets/AllCatsDemo/AllCatsDemo/TigerCatFree/JumpCattt.png',
    idleFrames: 7,
    jumpFrames: 13,
  },
  {
    id: 'batman',
    name: 'Bruce (Masked)',
    idle: '/assets/AllCatsDemo/AllCatsDemo/BatmanCatFree/IdleCatt.png',
    jump: '/assets/AllCatsDemo/AllCatsDemo/BatmanCatFree/JumpCattt.png',
    idleFrames: 7,
    jumpFrames: 13,
  },
];

export default function PetCompanion({
  ownerX,
  ownerY,
  ownerDirection = 'down',
  ownerIsMoving = false,
  ownerName = '',
  breedId = 'classical',
  isLocal = false,
}) {
  const breed = CAT_BREEDS.find((c) => c.id === breedId) || CAT_BREEDS[0];

  // Pet's simulated position (lerping smoothly behind owner)
  const [petPos, setPetPos] = useState({ x: ownerX + 24, y: ownerY + 10 });
  const [isMoving, setIsMoving] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  const petPosRef = useRef({ x: ownerX + 24, y: ownerY + 10 });

  // Update target position based on owner position & direction
  useEffect(() => {
    let animId;
    const updatePetPosition = () => {
      // Calculate follower target offset based on owner facing direction
      let offsetX = 26;
      let offsetY = 8;
      if (ownerDirection === 'right') {
        offsetX = -30;
        offsetY = 6;
      } else if (ownerDirection === 'left') {
        offsetX = 30;
        offsetY = 6;
      } else if (ownerDirection === 'up') {
        offsetX = 18;
        offsetY = 20;
      } else if (ownerDirection === 'down') {
        offsetX = -18;
        offsetY = -14;
      }

      const targetX = ownerX + offsetX;
      const targetY = ownerY + offsetY;

      const current = petPosRef.current;
      const dx = targetX - current.x;
      const dy = targetY - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 18) {
        // Pet runs to catch up
        const speed = Math.min(0.2, Math.max(0.09, distance / 220));
        current.x += dx * speed;
        current.y += dy * speed;
        petPosRef.current = { x: current.x, y: current.y };
        setPetPos({ x: current.x, y: current.y });
        setIsMoving(true);

        if (Math.abs(dx) > 2) {
          setFlipX(dx < 0);
        }
      } else {
        // Pet rests near owner
        setIsMoving(false);
      }

      animId = requestAnimationFrame(updatePetPosition);
    };

    animId = requestAnimationFrame(updatePetPosition);
    return () => cancelAnimationFrame(animId);
  }, [ownerX, ownerY, ownerDirection]);

  // Frame animation timer (90ms for jump/run, 140ms for idle)
  useEffect(() => {
    const frameRate = isMoving ? 90 : 140;
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 91); // common multiple of 7 and 13
    }, frameRate);
    return () => clearInterval(interval);
  }, [isMoving]);

  const currentFrames = isMoving ? breed.jumpFrames : breed.idleFrames;
  const currentUrl = isMoving ? breed.jump : breed.idle;
  const frameIndex = animStep % currentFrames;

  // Cat sprite frame sizing (32x32px)
  const bgSizeWidth = currentFrames * 32;
  const bgPosX = -frameIndex * 32;

  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${petPos.x}px`,
        top: `${petPos.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: Math.floor(petPos.y) || 12,
      }}
    >
      {/* Mini Pet Nametag */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[8px] font-bold bg-[#140802]/85 text-amber-200 px-1.5 py-0.2 rounded border border-amber-700/60 shadow">
          {breed.name.split(' ')[0]}
        </span>
      </div>

      {/* Cat Sprite (32x32) */}
      <div
        style={{
          width: '32px',
          height: '32px',
          backgroundImage: `url('${currentUrl}')`,
          backgroundPosition: `${bgPosX}px 0px`,
          backgroundSize: `${bgSizeWidth}px 32px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          transform: flipX ? 'scaleX(-1)' : 'scaleX(1)',
          transformOrigin: 'center center',
        }}
      />

      {/* Shadow under cat */}
      <div className="w-5 h-1.5 bg-black/40 rounded-full blur-[1px] mx-auto -mt-1" />
    </div>
  );
}
