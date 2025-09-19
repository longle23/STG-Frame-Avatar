import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Hiển thị splash screen trong 2 giây
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Sau khi fade out, gọi onComplete
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 200); // Thời gian fade out
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="frame-container">
          <img 
            src="/Frame_Avatar.png" 
            alt="SOTRANS Group 50th Anniversary Frame" 
            className="frame-image"
          />
        </div>
        <div className="splash-text">
          <h1 className="company-name">SOTRANS GROUP</h1>
          <h2 className="anniversary-text">50 YEARS OF GROWTH AND EXCELLENCE</h2>
          <p className="loading-text">Đang tải...</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
