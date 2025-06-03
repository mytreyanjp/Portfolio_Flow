
'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  lineWidth?: number;
  lineColor?: string;
  backgroundColor?: string;
  className?: string;
}

export interface HandwritingCanvasRef {
  getImageDataUrl: () => string | undefined;
  clearCanvas: () => void;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasRef, HandwritingCanvasProps>(
  (
    {
      width = 380,
      height = 150,
      lineWidth = 3,
      lineColor = 'hsl(var(--foreground))', // Use theme variable
      backgroundColor = 'hsl(var(--background))', // Use theme variable for canvas bg
      className,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);
    
    const drawRuledLines = (ctx: CanvasRenderingContext2D) => {
      const numLines = 5;
      const lineSpacing = height / (numLines + 1);
      ctx.save();
      ctx.strokeStyle = 'hsl(var(--border))'; // Use theme variable for lines
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 1; i <= numLines; i++) {
        const y = lineSpacing * i;
        ctx.moveTo(10, y);
        ctx.lineTo(width - 10, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    useEffect(() => {
      if (!isClient || !canvasRef.current) return;

      const canvas = canvasRef.current;
      // Adjust for device pixel ratio for sharper drawing
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(dpr, dpr); // Scale context to match canvas size
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = lineColor;
        context.lineWidth = lineWidth;
        contextRef.current = context;

        // Initial clear and draw background/rules
        clearCanvasContent();
      }
    }, [isClient, width, height, lineColor, lineWidth, backgroundColor]); // Rerun if dimensions or colors change

    const clearCanvasContent = () => {
      const context = contextRef.current;
      const canvas = canvasRef.current;
      if (context && canvas) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width / (window.devicePixelRatio||1) , canvas.height / (window.devicePixelRatio||1) );
        drawRuledLines(context);
      }
    };
    
    useImperativeHandle(ref, () => ({
      getImageDataUrl: () => {
        if (canvasRef.current) {
          // Create a temporary canvas to draw without ruled lines for better OCR
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return undefined;

          const dpr = window.devicePixelRatio || 1;
          tempCanvas.width = width * dpr;
          tempCanvas.height = height * dpr;
          
          // Draw background color
          tempCtx.fillStyle = backgroundColor; // Match main canvas bg
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Draw only the user's drawing (original canvas content) onto temp canvas
          // This assumes canvasRef.current already has the scaled drawing
          tempCtx.drawImage(canvasRef.current, 0, 0);
          
          return tempCanvas.toDataURL('image/png');
        }
        return undefined;
      },
      clearCanvas: clearCanvasContent,
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
      const { x, y } = getCoordinates(event);
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !contextRef.current) return;
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
      return <div style={{ width, height }} className={cn("bg-muted rounded-md animate-pulse", className)} />;
    }

    return (
      <div className={cn("flex flex-col items-center", className)}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={finishDrawing}
          className={cn("border border-input rounded-md cursor-crosshair touch-none bg-background")}
          style={{ width, height }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvasContent}
          className="mt-2"
        >
          <Eraser className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    );
  }
);

HandwritingCanvas.displayName = 'HandwritingCanvas';
export default HandwritingCanvas;
