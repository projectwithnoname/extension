import Icon from "../icon/Icon";
import "./Styles.scss";

interface EmptyStateProps {
  message: string;
  iconSize?: number;
}

const DEFAULT_ICON_SIZE = 96;

const EmptyState = (props: EmptyStateProps) => {
  const { message, iconSize = DEFAULT_ICON_SIZE } = props;

  return (
    <div className="emptyState">
      <Icon name="no-highlights" size={iconSize} />
      <p className="message">{message}</p>
    </div>
  );
};

export default EmptyState;
