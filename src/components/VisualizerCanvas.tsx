import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types';

interface VisualizerCanvasProps {
  analyserNode: AnalyserNode | null;
  mode: VisualizerMode;
  isPlaying: boolean;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  analyserNode,
  mode,
  isPlaying,
  className = 'w-full h-24',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === 'off' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        if (mode === 'waveform') {
          analyserNode.getByteTimeDomainData(dataArray);
        } else {
          analyserNode.getByteFrequencyData(dataArray);
        }
      } else {
        // Subtle idle pulsing line
        dataArray.fill(20);
      }

      if (mode === 'bars') {
        const barWidth = (width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
          gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.8)');
          gradient.addColorStop(1, 'rgba(251, 191, 36, 1)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }
      } else if (mode === 'waveform') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (mode === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.25;

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f59e0b';

        for (let i = 0; i < bufferLength; i += 2) {
          const val = dataArray[i] / 255;
          const angle = (i / bufferLength) * Math.PI * 2;

          const r = radius + val * 25;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
      } else if (mode === 'spectrum') {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] / 255) * height * 0.8;
          const y = height - val;

          ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyserNode, mode, isPlaying]);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className={`${className} rounded-xl overflow-hidden pointer-events-none`}
    />
  );
};
