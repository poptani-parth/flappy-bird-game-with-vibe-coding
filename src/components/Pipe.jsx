import React from "react";

const Pipe = ({ x, gapY, gap, width, color }) => {
  const topPipeHeight = gapY;
  const bottomPipeY = gapY + gap;
  const pipeBackground = `linear-gradient(180deg, ${color}, ${color}cc)`;

  return (
    <div
      className="pipe-container"
      style={{
        transform: `translateX(${x}px)`,
        width: `${width}px`,
      }}
    >
      {/* Top Pipe */}
      <div
        className="pipe pipe-top"
        style={{
          left: 0,
          top: 0,
          width: `${width}px`,
          height: `${topPipeHeight}px`,
          background: pipeBackground,
        }}
      />

      {/* Bottom Pipe */}
      <div
        className="pipe pipe-bottom"
        style={{
          left: 0,
          top: `${bottomPipeY}px`,
          width: `${width}px`,
          height: `calc(100% - ${bottomPipeY}px)`,
          background: pipeBackground,
        }}
      />
    </div>
  );
};

export default React.memo(Pipe);