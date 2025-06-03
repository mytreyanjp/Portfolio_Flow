
'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eraser, Pen } from 'lucide-react'; // Added Pen icon for clarity

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  lineWidth?: number;
  eraserLineWidthMultiplier?: number;
  lineColor?: string; // Base HSL string for foreground
  backgroundColor?: string; // Base HSL string for background
  ruledLineColor?: string; // Base HSL string for border
  className?: string;
}

export interface HandwritingCanvasRef {
  getImageDataUrl: () => string | undefined;
  clearCanvas: () => void; // Full clear, not just erase mode
}

const HandwritingCanvas = forwardRef<HandwritingCanvasRef, HandwritingCanvasProps>(
  (
    {
      width = 300,
      height = 120,
      lineWidth = 3,
      eraserLineWidthMultiplier = 4, // Eraser is thicker
      // Default HSL values (actual color is fetched from CSS vars at runtime)
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
    
    const getDynamicColors = () => {
      if (!isClient) { // Fallback if not client-side yet (shouldn't happen for drawing)
        return {
          currentBackgroundColor: `hsl(${backgroundColor})`,
          currentLineColor: `hsl(${lineColor})`,
          currentRuledLineColor: `hsl(${ruledLineColor})`,
        };
      }
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        currentBackgroundColor: `hsl(${rootStyle.getPropertyValue('--background').trim()})`,
        currentLineColor: `hsl(${rootStyle.getPropertyValue('--foreground').trim()})`,
        currentRuledLineColor: `hsl(${rootStyle.getPropertyValue('--border').trim()})`,
      };
    };

    const drawRuledLines = (currentContext: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      const { currentRuledLineColor } = getDynamicColors();
      const numLines = 4; 
      const lineSpacing = canvasHeight / (numLines + 1);
      
      currentContext.save();
      currentContext.strokeStyle = currentRuledLineColor;
      currentContext.lineWidth = 0.5; 
      currentContext.beginPath();
      for (let i = 1; i <= numLines; i++) {
        const yPosition = lineSpacing * i;
        currentContext.moveTo(10, yPosition); // Keep small margin for lines
        currentContext.lineTo(canvasWidth - 10, yPosition);
      }
      currentContext.stroke();
      currentContext.restore();
    };

    const fullClearCanvas = () => {
      const context = contextRef.current;
      const canvas = canvasRef.current;
      if (context && canvas) {
        const { currentBackgroundColor } = getDynamicColors();
        const dpr = window.devicePixelRatio || 1;
        const currentCanvasWidth = canvas.width / dpr; 
        const currentCanvasHeight = canvas.height / dpr;
        
        context.fillStyle = currentBackgroundColor;
        context.fillRect(0, 0, currentCanvasWidth, currentCanvasHeight);
        
        drawRuledLines(context, currentCanvasWidth, currentCanvasHeight);
        setIsErasing(false); // Reset to pen mode on full clear
      }
    };

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
        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;
        fullClearCanvas(); 
      }
    }, [isClient, width, height]);

    useEffect(() => {
      if (!isClient || !contextRef.current) return;
      // This effect ensures that if theme changes, the canvas background/lines can be redrawn
      // It's called when the base color HSL strings change, but more importantly,
      // `fullClearCanvas` inside it uses `getDynamicColors` to get current theme values.
      fullClearCanvas();
    }, [isClient, backgroundColor, lineColor, ruledLineColor]); // Dependencies on base HSL strings


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
      const { currentLineColor, currentBackgroundColor } = getDynamicColors();
      
      contextRef.current.strokeStyle = isErasing ? currentBackgroundColor : currentLineColor;
      contextRef.current.lineWidth = isErasing ? lineWidth * eraserLineWidthMultiplier : lineWidth;
      // For true erasing to transparent, use:
      // contextRef.current.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';

      const { x, y } = getCoordinates(event);
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !contextRef.current) return;
      // Ensure mode is set before drawing (e.g., if toggled mid-drag, though unlikely with mouseup)
      const { currentLineColor, currentBackgroundColor } = getDynamicColors();
      contextRef.current.strokeStyle = isErasing ? currentBackgroundColor : currentLineColor;
      contextRef.current.lineWidth = isErasing ? lineWidth * eraserLineWidthMultiplier : lineWidth;

      const { x, y } = getCoordinates(event);
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    };

    const finishDrawing = () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
    };

    if (!isClient) {
      return <div style={{ width, height }} className={cn("bg-muted rounded-md animate-pulse relative", className)} />;
    }

    return (
      <div className={cn("relative flex flex-col items-center", className)} style={{ width, height }}>
        <Button
          type="button"
          variant={isErasing ? "secondary" : "outline"} // Change variant to show active state
          size="icon"
          onClick={() => setIsErasing(prev => !prev)}
          className="absolute top-1 right-1 z-10 h-7 w-7" // Smaller icon button
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
            "border border-input rounded-md cursor-crosshair touch-none shadow-inner" // Removed bg-background, fillRect handles it
          )} 
          // Canvas style width/height is set by JS to match props
        />
      </div>
    );
  }
);

HandwritingCanvas.displayName = 'HandwritingCanvas';
export default HandwritingCanvas;
