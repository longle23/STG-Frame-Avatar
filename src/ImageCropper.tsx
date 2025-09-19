import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropperProps {
  src: string;
  onCropChange: (cropData: CropData) => void;
  containerWidth: number;
  containerHeight: number;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  onCropChange,
  containerWidth,
  containerHeight
}) => {
  const [cropData, setCropData] = useState<CropData>({
    x: 50,
    y: 50,
    width: 400,
    height: 400,
    scale: 1
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Xử lý khi ảnh load
  const handleImageLoad = () => {
    // Chỉ khởi tạo nếu chưa có crop data
    if (cropData.width === 200 && cropData.height === 200) {
      // Khởi tạo crop area rất nhỏ ở giữa container
      const initialSize = Math.min(containerWidth, containerHeight) * 0.25;
      const centerX = (containerWidth - initialSize) / 2;
      const centerY = (containerHeight - initialSize) / 2;
      
      // Tính scale phù hợp với object-fit: contain
      const img = imageRef.current;
      if (img) {
        // Với object-fit: contain, ảnh sẽ tự động fit vào container
        // Chúng ta chỉ cần scale nhỏ hơn để dễ căn chỉnh
        let initialScale = 0.3; // Mặc định 30%
        
        setCropData({
          x: centerX,
          y: centerY,
          width: initialSize,
          height: initialSize,
          scale: initialScale
        });
      } else {
        setCropData({
          x: centerX,
          y: centerY,
          width: initialSize,
          height: initialSize,
          scale: 0.3
        });
      }
    }
  };

  // Xử lý kéo thả crop area
  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropData.x,
      y: e.clientY - cropData.y
    });
  }, [cropData]);

  // Xử lý resize crop area
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: cropData.width,
      height: cropData.height
    });
  }, [cropData]);

  // Xử lý di chuyển chuột
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Giới hạn trong container
      const maxX = containerWidth - cropData.width;
      const maxY = containerHeight - cropData.height;
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }));
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      // Giữ crop area vuông
      const delta = Math.max(deltaX, deltaY);
      const newSize = Math.max(100, Math.min(resizeStart.width + delta, 
        Math.min(containerWidth - cropData.x, containerHeight - cropData.y)));
      
      setCropData(prev => ({
        ...prev,
        width: newSize,
        height: newSize
      }));
    }
  }, [isDragging, isResizing, dragStart, resizeStart, cropData, containerWidth, containerHeight]);

  // Xử lý thả chuột
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
    }
  }, [isDragging, isResizing]);

  // Xử lý zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(3, cropData.scale + delta));
    
    setCropData(prev => ({
      ...prev,
      scale: newScale
    }));
  }, [cropData.scale]);

  // Cập nhật crop data khi có thay đổi
  useEffect(() => {
    onCropChange(cropData);
  }, [cropData, onCropChange]);

  // Event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="image-cropper-container"
      onWheel={handleWheel}
    >
      {/* Ảnh nền */}
      <div className="cropper-background">
        <img
          ref={imageRef}
          src={src}
          alt="Crop source"
          onLoad={handleImageLoad}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${cropData.scale})`,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Overlay tối */}
      <div className="cropper-overlay">
        {/* Crop area */}
        <div
          className="crop-area"
          style={{
            left: cropData.x,
            top: cropData.y,
            width: cropData.width,
            height: cropData.height
          }}
          onMouseDown={handleCropMouseDown}
        >
          {/* Resize handles */}
          <div className="resize-handle nw" onMouseDown={handleResizeMouseDown} />
          <div className="resize-handle ne" onMouseDown={handleResizeMouseDown} />
          <div className="resize-handle sw" onMouseDown={handleResizeMouseDown} />
          <div className="resize-handle se" onMouseDown={handleResizeMouseDown} />
          
          {/* Grid lines */}
          <div className="grid-lines">
            <div className="grid-line vertical" style={{ left: '33.33%' }} />
            <div className="grid-line vertical" style={{ left: '66.66%' }} />
            <div className="grid-line horizontal" style={{ top: '33.33%' }} />
            <div className="grid-line horizontal" style={{ top: '66.66%' }} />
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="cropper-controls">
        <div className="zoom-controls">
          <button 
            className="zoom-btn"
            onClick={() => setCropData(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
          >
            −
          </button>
          <span className="zoom-level">{Math.round(cropData.scale * 100)}%</span>
          <button 
            className="zoom-btn"
            onClick={() => setCropData(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
          >
            +
          </button>
        </div>
      </div>

    </div>
  );
};

export default ImageCropper;