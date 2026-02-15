"use client";

import { useState } from 'react';
import './GardenHelpButton.css';

export default function GardenHelpButton() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="garden-help-container">
      <div 
        className={`garden-help-message ${isVisible ? 'visible' : ''}`}
        role="tooltip"
      >
        The longer you study, the more your garden will grow!
      </div>
      <button
        className="garden-help-button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label="Learn about the flower garden"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="garden-help-icon"
        >
          <path 
            d="M12 2C12 2 8 6 8 10C8 12.5 9.5 14.5 12 15C14.5 14.5 16 12.5 16 10C16 6 12 2 12 2Z" 
            fill="currentColor"
          />
          <path 
            d="M12 15V22" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <path 
            d="M12 18C10 17 7 17 5 19C7 20 10 20 12 18Z" 
            fill="currentColor"
          />
          <path 
            d="M12 18C14 17 17 17 19 19C17 20 14 20 12 18Z" 
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
