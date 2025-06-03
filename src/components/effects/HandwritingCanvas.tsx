
'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eraser, Pen } from 'lucide-react';

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  lineWidth?: number;
  eraserLineWidthMultiplier?: number;
  lineColor?: string; 
  backgroundColor?: string; 
  ruledLineColor?: string; 
  className?: string;
}

export interface HandwritingCanvasRef {
  getImageDataUrl: () => string | undefined;
  clearCanvas: () => void;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasRef, HandwritingCanvasProps>(
  (
    {
      width = 300,
      height = 120,
      lineWidth = 3,
      eraserLineWidthMultiplier = 4,
      lineColor = 'var(--foreground)',
      backgroundColor = 'var(--background)',
      ruledLineColor = 'var(--border)',
      className,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isErasing, setIsErasing] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);
    
    const getDynamicColors = useCallback(() => {
      if (!isClient || typeof document === 'undefined') { 
        return {
          currentBackgroundColor: `hsl(${backgroundColor})`, // Fallback
          currentLineColor: `hsl(${lineColor})`, // Fallback
          currentRuledLineColor: `hsl(${ruledLineColor})`, // Fallback
        };
      }
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        currentBackgroundColor: `hsl(${rootStyle.getPropertyValue('--background').trim()})`,
        currentLineColor: `hsl(${rootStyle.getPropertyValue('--foreground').trim()})`,
        currentRuledLineColor: `hsl(${rootStyle.getPropertyValue('--border').trim()})`,
      };
    }, [isClient, backgroundColor, lineColor, ruledLineColor]);

    const drawRuledLines = useCallback((currentContext: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      const { currentRuledLineColor } = getDynamicColors();
      const numLines = 4; 
      const lineSpacing = canvasHeight / (numLines + 1);
      
      currentContext.save();
      currentContext.globalCompositeOperation = 'source-over'; // Ensure lines draw normally
      currentContext.strokeStyle = currentRuledLineColor;
      currentContext.lineWidth = 0.5; 
      currentContext.beginPath();
      for (let i = 1; i <= numLines; i++) {
        const yPosition = lineSpacing * i;
        currentContext.moveTo(10, yPosition);
        currentContext.lineTo(canvasWidth - 10, yPosition);
      }
      currentContext.stroke();
      currentContext.restore();
    }, [getDynamicColors]);

    const fullClearCanvas = useCallback(() => {
      const context = contextRef.current;
      const canvas = canvasRef.current;
      if (context && canvas) {
        const { currentBackgroundColor } = getDynamicColors();
        const dpr = window.devicePixelRatio || 1;
        // Use logical width/height for clearing and drawing rules
        const logicalWidth = canvas.width / dpr; 
        const logicalHeight = canvas.height / dpr;
        
        context.save();
        context.globalCompositeOperation = 'source-over'; // Reset composite operation
        context.fillStyle = currentBackgroundColor;
        context.fillRect(0, 0, logicalWidth, logicalHeight); // Use logical dimensions
        context.restore();
        
        drawRuledLines(context, logicalWidth, logicalHeight);
        setIsErasing(false); // Reset to pen mode on full clear
      }
    }, [getDynamicColors, drawRuledLines]);

    useEffect(() => {
      if (!isClient || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(dpr, dpr); // Scale once for all drawing operations
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;
        fullClearCanvas(); 
      }
    }, [isClient, width, height, fullClearCanvas]); // fullClearCanvas is now a dependency

    useEffect(() => {
      if (!isClient || !contextRef.current) return;
      fullClearCanvas();
    }, [isClient, getDynamicColors, fullClearCanvas]); // Depends on getDynamicColors because it affects fullClearCanvas


    useImperativeHandle(ref, () => ({
      getImageDataUrl: () => {
        if (canvasRef.current) {
          return canvasRef.current.toDataURL('image/png');
        }
        return undefined;
      },
      clearCanvas: fullClearCanvas,
    }));

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      if ('touches' in event) {
        return {
          x: event.touches[0].clientX - rect.left,
          y: event.touches[0].clientY - rect.top,
        };
      }
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      if (!contextRef.current) return;
      const { currentLineColor } = getDynamicColors();
      
      if (isErasing) {
        contextRef.current.globalCompositeOperation = 'destination-out';
        // For destination-out, strokeStyle's color channels don't matter for erasing, only alpha.
        // Using an opaque color is important.
        contextRef.current.strokeStyle = 'rgba(0,0,0,1)'; 
      } else {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.strokeStyle = currentLineColor;
      }
      contextRef.current.lineWidth = isErasing ? lineWidth * eraserLineWidthMultiplier : lineWidth;

      const { x, y } = getCoordinates(event);
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !contextRef.current) return;
      // globalCompositeOperation, strokeStyle, and lineWidth are set in startDrawing and persist.
      const { x, y } = getCoordinates(event);
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    };

    const finishDrawing = () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
      // No need to redraw ruled lines here if destination-out works correctly
    };

    if (!isClient) {
      return <div style={{ width, height }} className={cn("bg-muted rounded-md animate-pulse relative", className)} />;
    }

    return (
      <div className={cn("relative flex flex-col items-center", className)} style={{ width, height }}>
        <Button
          type="button"
          variant={isErasing ? "secondary" : "outline"}
          size="icon"
          onClick={() => setIsErasing(prev => !prev)}
          className="absolute top-1 right-1 z-10 h-7 w-7"
          aria-label={isErasing ? "Switch to Pen" : "Switch to Eraser"}
        >
          {isErasing ? <Pen className="h-4 w-4" /> : <Eraser className="h-4 w-4" />}
        </Button>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={finishDrawing}
          className={cn(
            "border border-input rounded-md cursor-crosshair touch-none shadow-inner"
          )} 
        />
      </div>
    );
  }
);

HandwritingCanvas.displayName = 'HandwritingCanvas';
export default HandwritingCanvas;

