
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
      width = 380,
      height = 150,
      lineWidth = 3,
      lineColor = 'hsl(var(--foreground))',
      backgroundColor = 'hsl(var(--background))',
      ruledLineColor = 'hsl(var(--border))', // Color for the ruled lines
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
      const numLines = 5; // Number of horizontal lines
      const lineSpacing = height / (numLines + 1); // Calculate spacing for even distribution
      
      ctx.save();
      ctx.strokeStyle = ruledLineColor;
      ctx.lineWidth = 0.5; // Thin lines
      ctx.beginPath();
      for (let i = 1; i <= numLines; i++) {
        const yPosition = lineSpacing * i;
        // Add a small padding from the edges for the lines
        ctx.moveTo(10, yPosition);
        ctx.lineTo(width - 10, yPosition);
      }
      ctx.stroke();
      ctx.restore();
    };

    const clearCanvasContent = () => {
      const context = contextRef.current;
      const canvas = canvasRef.current;
      if (context && canvas) {
        // Get the actual computed style for background color
        const computedBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        context.fillStyle = `hsl(${computedBackgroundColor})`;
        context.fillRect(0, 0, canvas.width / (window.devicePixelRatio||1), canvas.height / (window.devicePixelRatio||1));
        
        // Get actual computed style for ruled line color
        const computedRuledLineColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
        const tempRuledLineColor = `hsl(${computedRuledLineColor})`;
        
        // Draw ruled lines with the current theme's border color
        const numLines = 5;
        const lineSpacing = height / (numLines + 1);
        context.save();
        context.strokeStyle = tempRuledLineColor;
        context.lineWidth = 0.5;
        context.beginPath();
        for (let i = 1; i <= numLines; i++) {
          const y = lineSpacing * i;
          context.moveTo(10, y);
          context.lineTo(width - 10, y);
        }
        context.stroke();
        context.restore();
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
        // User's drawing color
        const computedLineColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
        context.strokeStyle = `hsl(${computedLineColor})`;
        context.lineWidth = lineWidth;
        contextRef.current = context;
        clearCanvasContent(); // Initial clear with background and ruled lines
      }
    }, [isClient, width, height, backgroundColor, ruledLineColor, lineColor, lineWidth]); // Dependencies updated

    useImperativeHandle(ref, () => ({
      getImageDataUrl: () => {
        if (canvasRef.current) {
          // The main canvas already has the background and ruled lines drawn on it.
          // So, exporting it directly will include them.
          return canvasRef.current.toDataURL('image/png');
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
      // Ensure drawing color is set from theme variable before drawing
      const computedLineColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
      contextRef.current.strokeStyle = `hsl(${computedLineColor})`;
      contextRef.current.lineWidth = lineWidth;

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
          // The bg-background here is a fallback, JS fill is primary
          className={cn("border border-input rounded-md cursor-crosshair touch-none bg-background shadow-inner")} 
          style={{ width, height }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvasContent}
          className="mt-3" // Added a bit more margin
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

