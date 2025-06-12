'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle } from 'lucide-react';

interface ProgressTimerProps {
  isActive: boolean;
  estimatedTimeSeconds: number;
  message: string;
  className?: string;
}

export function ProgressTimer({
  isActive,
  estimatedTimeSeconds,
  message,
  className = ''
}: ProgressTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      setIsOvertime(false);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      if (elapsed > estimatedTimeSeconds && !isOvertime) {
        setIsOvertime(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, estimatedTimeSeconds, isOvertime]);

  if (!isActive) {
    return null;
  }

  const remainingTime = Math.max(0, estimatedTimeSeconds - elapsedTime);
  const progressPercentage = Math.min(100, (elapsedTime / estimatedTimeSeconds) * 100);

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getTimeDisplay = () => {
    if (isOvertime) {
      return (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Processing is taking longer than expected...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-sm">
          {remainingTime > 0 ? `${formatTime(remainingTime)} remaining` : 'Finalizing results...'}
        </span>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        {getTimeDisplay()}
      </div>

      <div className="space-y-2">
        <Progress
          value={progressPercentage}
          className={`h-2 ${isOvertime ? 'opacity-75' : ''}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Elapsed: {formatTime(elapsedTime)}</span>
          <span>
            {isOvertime
              ? `+${formatTime(elapsedTime - estimatedTimeSeconds)} overtime`
              : `Est. total: ${formatTime(estimatedTimeSeconds)}`
            }
          </span>
        </div>
        {elapsedTime > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            AI processing with parallel providers for optimal speed
          </div>
        )}
      </div>
    </div>
  );
}
