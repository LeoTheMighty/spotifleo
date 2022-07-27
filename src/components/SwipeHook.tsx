import { useEffect, useRef } from 'react';

const THRESHOLD_PIXELS = 150;
const SWIPE_SPEED = 1; // sec;

type Props = {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
};

const useSwipe = ({ onLeft, onRight, onUp, onDown }: Props) => {
  const touchCoordsRef = useRef({ touchStart: { x: 0, y: 0, time: Date.now() }});
  const fnsRef = useRef({ onLeft, onRight, onUp, onDown })
  fnsRef.current = {
    onLeft,
    onRight,
    onUp,
    onDown,
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchCoordsRef.current.touchStart.x = e.targetTouches[0].clientX;
      touchCoordsRef.current.touchStart.y = e.targetTouches[0].clientY;
      touchCoordsRef.current.touchStart.time = Date.now();
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchStartX = touchCoordsRef.current.touchStart.x;
      const touchStartY = touchCoordsRef.current.touchStart.y;
      const elapsedTime = (Date.now() - touchCoordsRef.current.touchStart.time) / 1000;
      if(elapsedTime > SWIPE_SPEED) {
        return;
      }
      const xDistance = touchStartX - touchEndX;
      const yDistance = touchStartY - touchEndY;

      if(Math.abs(xDistance) < THRESHOLD_PIXELS && Math.abs(yDistance) < THRESHOLD_PIXELS) {
        return;
      }

      if(Math.abs(xDistance) >= Math.abs(yDistance)) {
        xDistance > 0 ? fnsRef.current.onRight?.() : fnsRef.current.onLeft?.();
      } else {
        yDistance > 0 ? fnsRef.current.onDown?.() : fnsRef.current.onUp?.();
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  });
}

export default useSwipe;
