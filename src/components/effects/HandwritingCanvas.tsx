
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
      width = 300, // Reduced default width
      height = 120, // Reduced default height
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
    
    const drawRuledLines = (currentContext: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, currentRuledLineColor: string) => {
      const numLines = 4; // Adjusted for potentially smaller height
      const lineSpacing = canvasHeight / (numLines + 1);
      
      currentContext.save();
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
    };

    const clearCanvasContent = () => {
      const context = contextRef.current;
      const canvas = canvasRef.current;
      if (context && canvas) {
        const dpr = window.devicePixelRatio || 1;
        // Get actual render size of canvas from its width/height attributes, not style
        const currentCanvasWidth = canvas.width / dpr; 
        const currentCanvasHeight = canvas.height / dpr;

        // Fetch current CSS variable values for colors
        const rootStyle = getComputedStyle(document.documentElement);
        const currentBackgroundColor = rootStyle.getPropertyValue('--background').trim();
        const currentRuledLineColor = rootStyle.getPropertyValue('--border').trim();
        
        context.fillStyle = `hsl(${currentBackgroundColor})`;
        context.fillRect(0, 0, currentCanvasWidth, currentCanvasHeight);
        
        drawRuledLines(context, currentCanvasWidth, currentCanvasHeight, `hsl(${currentRuledLineColor})`);
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
        // Initial setup of stroke style will be overridden before drawing starts
        // based on current theme. This is fine.
        const rootStyle = getComputedStyle(document.documentElement);
        const currentLineColor = rootStyle.getPropertyValue('--foreground').trim();
        context.strokeStyle = `hsl(${currentLineColor})`;
        context.lineWidth = lineWidth;
        contextRef.current = context;
        clearCanvasContent(); 
      }
    // Explicitly list dependencies. clearCanvasContent itself depends on props indirectly via computed styles
    // but its definition doesn't change. Re-running effect for color/lineWidth props ensures canvas updates.
    }, [isClient, width, height, lineWidth]); // Added lineColor to dependencies

    // Effect to re-apply colors if theme changes
    useEffect(() => {
      if (!isClient || !canvasRef.current || !contextRef.current) return;
        // Re-clear (which also redraws background and lines with current theme colors)
        // and set drawing properties when theme might have changed.
        // This effect depends on `backgroundColor`, `ruledLineColor`, `lineColor` from props,
        // which are now static strings. If these were dynamic based on theme,
        // this effect would listen to those. Since clearCanvasContent and startDrawing
        // now fetch live CSS variables, they adapt to theme changes.
        // We might need to trigger a re-clear if the theme changes externally.
        // For now, this effect primarily handles initial setup.
        // If theme is changed via next-themes, the component might not re-render to pick new CSS vars
        // unless one of its direct dependencies change.
        // However, clearCanvasContent and startDrawing are called on interaction or mount.
        // Let's ensure the strokeStyle is updated if lineColor prop could change.
        const rootStyle = getComputedStyle(document.documentElement);
        const currentLineColor = rootStyle.getPropertyValue('--foreground').trim();
        contextRef.current.strokeStyle = `hsl(${currentLineColor})`;
        contextRef.current.lineWidth = lineWidth;
        clearCanvasContent(); // Re-clear to apply current theme colors to background/ruled lines

    }, [isClient, backgroundColor, ruledLineColor, lineColor, lineWidth]); // Ensure it runs if these base HSL strings change (they don't)


    useImperativeHandle(ref, () => ({
      getImageDataUrl: () => {
        if (canvasRef.current) {
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
      // Fetch current theme's foreground color for drawing
      const rootStyle = getComputedStyle(document.documentElement);
      const currentLineColor = rootStyle.getPropertyValue('--foreground').trim();
      contextRef.current.strokeStyle = `hsl(${currentLineColor})`;
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
          className={cn("border border-input rounded-md cursor-crosshair touch-none bg-background shadow-inner")} 
          style={{ width, height }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={clearCanvasContent}
          className="mt-3"
          aria-label="Clear canvas"
        >
          <Eraser className="h-5 w-5" />
        </Button>
      </div>
    );
  }
);

HandwritingCanvas.displayName = 'HandwritingCanvas';
export default HandwritingCanvas;

