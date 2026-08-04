import React from "react";

const Pipe = ({ x, gapY, gap, width }) => {
  const topPipeHeight = gapY;
  const bottomPipeY = gapY + gap;

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
        }}
      />
    </div>
  );
};

export default React.memo(Pipe);