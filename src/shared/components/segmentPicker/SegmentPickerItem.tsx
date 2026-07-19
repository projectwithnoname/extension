import './Styles.scss'

interface SegmentPickerItemProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
    onMouseUp?: () => void;

}

const SegmentPickerItem = ({ label, active, onClick, onMouseUp }: SegmentPickerItemProps) =>
{
  return (
    <div
      className={`segmentPickerItem ${active ? 'active' : ''}`}
      onClick={onClick}
      onMouseUp={onMouseUp}
    >
      {label}
    </div>
  )
}

export default SegmentPickerItem
