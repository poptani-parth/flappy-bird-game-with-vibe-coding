import React, { useRef } from 'react';
import useGameLoop from '../hooks/useGameLoop';

const Background = ({ speed }) => {
  const groundScroll = useRef(0);
  const mountainScroll = useRef(0);
  const cloudScroll = useRef(0);

  useGameLoop((delta) => {
    const gameSpeed = speed * delta;
    // The values used for the modulo operation should be the width of the tileable image
    groundScroll.current = (groundScroll.current - gameSpeed) % 1000;
    mountainScroll.current = (mountainScroll.current - gameSpeed * 0.2) % 1000;
    cloudScroll.current = (cloudScroll.current - gameSpeed * 0.4) % 1000;
  });

  return (
    <div className="background-container">
      <div className="sky" />
      <div
        className="mountains background-layer"
        style={{ transform: `translateX(${mountainScroll.current}px)` }}
      />
      <div
        className="clouds background-layer"
        style={{ transform: `translateX(${cloudScroll.current}px)` }}
      />
      <div
        className="ground background-layer"
        style={{ transform: `translateX(${groundScroll.current}px)` }}
      />
      <div className="particles" />
    </div>
  );
};

export default React.memo(Background);