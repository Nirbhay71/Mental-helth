import { Card, CardContent } from "@/components/ui/card";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  size = "md", 
  fullScreen = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        data-testid="loading-spinner-fullscreen"
      >
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
            <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`} />
            <p className={`text-muted-foreground ${textSizeClasses[size]}`} data-testid="loading-message">
              {message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8" data-testid="loading-spinner-inline">
      <div className="flex flex-col items-center gap-4">
        <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`} />
        <p className={`text-muted-foreground ${textSizeClasses[size]}`} data-testid="loading-message">
          {message}
        </p>
      </div>
    </div>
  );
}
