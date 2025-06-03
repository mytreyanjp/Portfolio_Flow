
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Constants for the paint strip effect
const LINE_COLOR_RGB = '50, 50, 50'; 
const LINE_WIDTH = 12; 
const BASE_LINE_OPACITY = 0.5; 
const BLUR_AMOUNT_PX = 2; 

const FADE_START_DELAY_MS = 1000;
const FADE_DURATION_MS = 2000;
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;

const LERP_FACTOR_CURSOR_FOLLOW = 0.15;
const MIN_DISTANCE_TO_ADD_LERPED_POINT = 1; // Reduced for smoother line
const MAX_POINTS_IN_TAIL = 200;

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface LightModeDrawingCanvasProps {
  isDrawingActive: boolean; // This prop is now effectively unused for drawing.
}

const LightModeDrawingCanvas: React.FC<LightModeDrawingCanvasProps> = ({ isDrawingActive }) => {
  // The pencil icon and its toggle state are managed in the Header/RootLayout.
  // This component will receive the isDrawingActive prop, but for now,
  // it will not produce any visual output, effectively removing the old feature.
  // This allows for a new feature to be implemented here later using the same toggle.
  
  // To "remove this pencil feature" visually, we simply return null.
  // The isDrawingActive prop is still available if a new feature needs it.
  return null;
};

export default LightModeDrawingCanvas;
