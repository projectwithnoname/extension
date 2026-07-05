import React from 'react'
import './Styles.scss'

interface SegmentPickerItemProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const SegmentPickerItem = ({ label, active, onClick }: SegmentPickerItemProps) =>
{
  return (
    <div
      className={`segmentPickerItem ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </div>
  )
}

export default SegmentPickerItem
