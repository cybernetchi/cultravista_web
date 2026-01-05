// Processing status component that handles the complete flow
import React from 'react';
import { useProcessingFlow } from '@/hooks/useCapture';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  serialize: string | null;
  captureId: string | null;
  onComplete?: () => void;
}

export function ProcessingStatus({ serialize, captureId, onComplete }: ProcessingStatusProps) {
  const {
    status,
    progress,
    isPolling,
    isComplete,
    isFailed,
    isConverting,
    conversionError,
  } = useProcessingFlow(serialize, captureId, true);

  // Trigger completion callback when fully done
  React.useEffect(() => {
    if (isComplete && !isConverting && onComplete) {
      onComplete();
    }
  }, [isComplete, isConverting, onComplete]);

  if (!serialize || !captureId) {
    return null;
  }

  const getStatusMessage = () => {
    if (isConverting) {
      return "Converting to Splat format...";
    }
    if (isComplete && !isConverting) {
      return "3D Model ready!";
    }
    if (isFailed) {
      return "Processing failed";
    }
    if (isPolling) {
      return "Processing 3D model...";
    }
    return "Initializing...";
  };

  const getStatusIcon = () => {
    if (isComplete && !isConverting) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (isFailed || conversionError) {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <span className="font-medium">{getStatusMessage()}</span>
      </div>
      
      {(isPolling || isConverting) && progress !== undefined && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{progress}% complete</p>
        </div>
      )}
      
      {conversionError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {conversionError.message || 'Conversion failed'}
        </div>
      )}
      
      <div className="mt-3 text-xs text-muted-foreground space-y-1">
        <div>Status: {status} (0=processing, 1=complete, 2=failed)</div>
        <div>Serialize ID: {serialize}</div>
        <div>Capture ID: {captureId}</div>
      </div>
    </div>
  );
}