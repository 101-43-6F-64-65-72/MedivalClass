'use client';

import { useState, useEffect } from 'react';

/**
 * Story Engine Hook
 * Manages story scene progression, timing, and transitions
 */
export const useStoryEngine = (storyData, autoAdvance = true) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isSceneComplete, setIsSceneComplete] = useState(false);

  const currentScene = storyData?.scenes?.[currentSceneIndex];
  const isLastScene = !!(storyData?.scenes && currentSceneIndex === (storyData.scenes.length - 1));

  // Reset progress when storyData changes
  useEffect(() => {
    setCurrentSceneIndex(0);
    setIsSceneComplete(false);
  }, [storyData?.id]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance || !currentScene?.duration) return;

    const timer = setTimeout(() => {
      if (isLastScene) {
        setIsSceneComplete(true);
      } else {
        setCurrentSceneIndex(prev => prev + 1);
      }
    }, currentScene.duration);

    return () => clearTimeout(timer);
  }, [currentSceneIndex, autoAdvance, currentScene?.duration, isLastScene]);

  const nextScene = () => {
    if (isLastScene) {
      setIsSceneComplete(true);
    } else {
      setCurrentSceneIndex(prev => prev + 1);
    }
  };

  const previousScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
      setIsSceneComplete(false);
    }
  };

  const goToScene = (index) => {
    if (storyData?.scenes && index >= 0 && index < storyData.scenes.length) {
      setCurrentSceneIndex(index);
      setIsSceneComplete(index === storyData.scenes.length - 1);
    }
  };

  const skipAllScenes = () => {
    if (storyData?.scenes?.length) {
      setCurrentSceneIndex(storyData.scenes.length - 1);
    }
    setIsSceneComplete(true);
  };

  return {
    currentScene,
    currentSceneIndex,
    isLastScene,
    isSceneComplete,
    sceneCount: storyData?.scenes?.length || 0,
    nextScene,
    previousScene,
    goToScene,
    skipAllScenes,
  };
};

export default useStoryEngine;
