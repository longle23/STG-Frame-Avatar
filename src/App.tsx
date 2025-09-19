
import React, { useState } from 'react';
import AvatarFrame from './AvatarFrame';
import SplashScreen from './SplashScreen';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <div>
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <AvatarFrame />
      )}
    </div>
  );
}

export default App;
