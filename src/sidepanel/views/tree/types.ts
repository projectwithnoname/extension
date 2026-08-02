export interface TreeNodeState {
  isOpen: (key: string) => boolean;
  onToggle: (key: string) => void;
}
