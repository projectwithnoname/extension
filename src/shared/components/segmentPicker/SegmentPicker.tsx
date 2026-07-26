import React, { useState } from "react";
import "./Styles.scss";

type SegmentPickerProps = {
  children?: React.ReactNode;
};

const SegmentPicker = ({ children }: SegmentPickerProps) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <div className="segmentPicker">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        return React.cloneElement(child as React.ReactElement<{ active?: boolean; onClick?: () => void }>, {
          active: index === activeIndex,
          onClick: () => setActiveIndex(index),
        });
      })}

      <div
        className="indicator"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
    </div>
  );
};

export default SegmentPicker;
