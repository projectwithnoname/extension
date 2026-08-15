import "./Styles.scss";

interface SegmentPickerItemProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SegmentPickerItem = ({ label, active, onClick }: SegmentPickerItemProps) => {
  return (
    <button
      type="button"
      className={`segmentPickerItem ${active ? "active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default SegmentPickerItem;
