// hooks/use-exam-timer.ts - Enhanced timer hook
import { useEffect, useState, useCallback } from 'react';

interface UseExamTimerProps {
  initialTimeInSeconds: number;
  isActive: boolean;
  onTimeUp: () => void;
  onWarning?: (remainingSeconds: number) => void;
}

export function useExamTimer({ 
  initialTimeInSeconds, 
  isActive, 
  onTimeUp, 
  onWarning 
}: UseExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeInSeconds);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Warning states
        if (newTime <= 300 && !isCritical) { // 5 minutes
          setIsCritical(true);
          onWarning?.(newTime);
        } else if (newTime <= 900 && !isWarning) { // 15 minutes  
          setIsWarning(true);
          onWarning?.(newTime);
        }
        
        // Time up
        if (newTime <= 0) {
          onTimeUp();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, onTimeUp, onWarning, isWarning, isCritical]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isWarning,
    isCritical,
    isTimeUp: timeRemaining <= 0
  };
}