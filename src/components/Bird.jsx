import React from 'react';

const Bird = ({ y, rotation, state, color }) => {
  const birdStyle = {
    transform: `translateY(${y}px) rotate(${rotation}deg)`,
  };

  const birdClassName = `bird ${state === 'idle' ? 'bird-idle' : ''}`;

  return (
    <div className={birdClassName} style={birdStyle}>
      <div className="bird-graphic" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        <div className="bird-wing" />
      </div>
    </div>
  );
};

export default React.memo(Bird);