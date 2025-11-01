import React, { useEffect, useRef } from 'react';
import { Barcode as BarcodeIcon } from 'lucide-react';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  format?: string;
  displayValue?: boolean;
  background?: string;
  lineColor?: string;
  fontSize?: number;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  width = 200,
  height = 80,
  format = 'CODE128',
  displayValue = true,
  background = '#ffffff',
  lineColor = '#000000',
  fontSize = 14
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Simple barcode representation using bars
    const barWidth = 2;
    const barHeight = height - (displayValue ? fontSize + 8 : 8);
    const startX = 10;
    const startY = 4;

    // Generate a simple pattern based on the barcode value
    const pattern = value.split('').map(char => char.charCodeAt(0));
    const totalBars = pattern.reduce((sum, code) => sum + (code % 5 + 1), 0);
    const availableWidth = width - 20;
    const scaleFactor = availableWidth / totalBars;

    ctx.fillStyle = lineColor;
    let currentX = startX;

    pattern.forEach((code, index) => {
      const barCount = code % 5 + 1;
      const isEven = index % 2 === 0;

      if (isEven) {
        const barWidth = barCount * scaleFactor;
        ctx.fillRect(currentX, startY, barWidth, barHeight);
        currentX += barWidth;
      } else {
        currentX += barCount * scaleFactor;
      }
    });

    // Display the value below the barcode
    if (displayValue) {
      ctx.fillStyle = lineColor;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(value, width / 2, height - 4);
    }
  }, [value, width, height, displayValue, background, lineColor, fontSize]);

  if (!value) {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded p-4">
        <BarcodeIcon className="h-8 w-8 text-gray-400" />
        <span className="ml-2 text-gray-500">No barcode available</span>
      </div>
    );
  }

  return (
    <div className="inline-block border border-gray-200 rounded p-2 bg-white">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

// QR Code placeholder component
export const QRCodeDisplay: React.FC<{
  value: string;
  size?: number;
  background?: string;
  foreground?: string;
}> = ({
  value,
  size = 150,
  background = '#ffffff',
  foreground = '#000000'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Simple QR code-like pattern
    const cellSize = size / 25;
    const pattern = value.split('').map(char => char.charCodeAt(0) % 2);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    // Draw pattern
    ctx.fillStyle = foreground;
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        const index = (row * 25 + col) % pattern.length;
        if (pattern[index]) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Add corner squares (QR code style)
    const cornerSize = cellSize * 7;
    const corners = [
      { x: 0, y: 0 },
      { x: size - cornerSize, y: 0 },
      { x: 0, y: size - cornerSize }
    ];

    corners.forEach(corner => {
      // Outer square
      ctx.fillRect(corner.x, corner.y, cornerSize, cornerSize);
      // Inner square (white)
      ctx.fillStyle = background;
      ctx.fillRect(corner.x + cellSize, corner.y + cellSize, cellSize * 5, cellSize * 5);
      // Center dot (black)
      ctx.fillStyle = foreground;
      ctx.fillRect(corner.x + cellSize * 3, corner.y + cellSize * 3, cellSize, cellSize);
    });
  }, [value, size, background, foreground]);

  if (!value) {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded p-4">
        <div className="h-8 w-8 text-gray-400">QR</div>
        <span className="ml-2 text-gray-500">No QR code available</span>
      </div>
    );
  }

  return (
    <div className="inline-block border border-gray-200 rounded p-2 bg-white">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

// Barcode scanner input component
export const BarcodeScanner: React.FC<{
  onScan: (barcode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}> = ({ onScan, placeholder = "Scan barcode...", disabled = false, className = "" }) => {
  const [barcode, setBarcode] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);

  const handleScan = () => {
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus
        />
        {isScanning && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleScan}
        disabled={disabled || !barcode.trim()}
        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Scan
      </button>
    </div>
  );
};

export default BarcodeDisplay;