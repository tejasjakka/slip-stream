import React, { useEffect, useRef } from 'react';

export interface SceneStep {
  id: string;
  type: 'circle' | 'rect' | 'line' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  opacity: number;
  time: number;
}

interface CanvasEngineProps {
  steps: SceneStep[];
  currentTime: number;
}

// EaseInOutCubic
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Linear interpolation
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function CanvasEngine({ steps, currentTime }: CanvasEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Group steps by ID
    const objectsById = steps.reduce((acc, step) => {
      if (!acc[step.id]) acc[step.id] = [];
      acc[step.id].push(step);
      return acc;
    }, {} as Record<string, SceneStep[]>);

    // Draw each object based on current time
    Object.values(objectsById).forEach(objectSteps => {
      // Sort by time
      objectSteps.sort((a, b) => a.time - b.time);

      let currentState: SceneStep | null = null;

      if (currentTime <= objectSteps[0].time) {
        currentState = objectSteps[0];
      } else if (currentTime >= objectSteps[objectSteps.length - 1].time) {
        currentState = objectSteps[objectSteps.length - 1];
      } else {
        // Interpolate between two steps
        for (let i = 0; i < objectSteps.length - 1; i++) {
          const stepA = objectSteps[i];
          const stepB = objectSteps[i + 1];
          if (currentTime >= stepA.time && currentTime < stepB.time) {
            const range = stepB.time - stepA.time;
            const progress = (currentTime - stepA.time) / range;
            const easedProgress = easeInOutCubic(progress);

            currentState = {
              ...stepA,
              x: lerp(stepA.x, stepB.x, easedProgress),
              y: lerp(stepA.y, stepB.y, easedProgress),
              width: stepA.width !== undefined && stepB.width !== undefined ? lerp(stepA.width, stepB.width, easedProgress) : stepA.width,
              height: stepA.height !== undefined && stepB.height !== undefined ? lerp(stepA.height, stepB.height, easedProgress) : stepA.height,
              radius: stepA.radius !== undefined && stepB.radius !== undefined ? lerp(stepA.radius, stepB.radius, easedProgress) : stepA.radius,
              opacity: lerp(stepA.opacity, stepB.opacity, easedProgress),
            };
            break;
          }
        }
      }

      if (!currentState || currentState.opacity <= 0) return;

      // Map 0-100 coordinates to canvas size
      const sx = (currentState.x / 100) * canvas.width;
      const sy = (currentState.y / 60) * canvas.height;
      const sw = currentState.width ? (currentState.width / 100) * canvas.width : 0;
      const sh = currentState.height ? (currentState.height / 60) * canvas.height : 0;
      const sr = currentState.radius ? (currentState.radius / 100) * canvas.width : 0;

      ctx.globalAlpha = currentState.opacity;
      ctx.fillStyle = currentState.color;
      ctx.strokeStyle = currentState.color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (currentState.type === 'circle' && sr) {
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentState.type === 'rect') {
        ctx.fillRect(sx, sy, sw, sh);
      } else if (currentState.type === 'line' && sw && sh) {
        ctx.moveTo(sx, sy);
        ctx.lineTo(sw, sh); // Overloading width/height as target x/y for lines
        ctx.stroke();
      } else if (currentState.type === 'text' && currentState.text) {
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText(currentState.text, sx, sy);
      }
    });

  }, [steps, currentTime]);

  return (
    <div className="w-full aspect-video bg-inverse-surface rounded-2xl overflow-hidden relative shadow-lg">
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        className="w-full h-full block"
      />
    </div>
  );
}
