import React, { useState } from "react";
import "./Styles.scss";

type SegmentPickerProps = {
  children?: React.ReactNode;
  label?: string;
};

const SegmentPicker = ({ children, label }: SegmentPickerProps) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <div className="segmentPicker" role="group" aria-label={label}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        const item = child as React.ReactElement<{ active?: boolean; onClick?: () => void }>;

        return React.cloneElement(item, {
          active: index === activeIndex,
          onClick: () => {
            setActiveIndex(index);
            item.props.onClick?.();
          },
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
