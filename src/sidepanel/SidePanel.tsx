import { HighlightsProvider } from "./context/HighlightsContext";
import { useHighlights } from "./context/useHighlights";
import "./styles.scss";

const HighlightList = () =>
{
  const { highlights, loading, updateNote, deleteHighlight } = useHighlights();

  if (loading)
  {
    return <p>Loading…</p>;
  }

  return (
    <div>
      {highlights.map((highlight) => (
        <div key={highlight.id}>
          <span>{highlight.text}</span>
          <button onClick={() => updateNote(highlight.id, `edited ${Date.now()}`)}>
            Edit note
          </button>
          <button onClick={() => deleteHighlight(highlight.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

const SidePanel = () =>
{
  return (
    <div id="sidePanelContainer">
      <HighlightsProvider>
        <HighlightList />
      </HighlightsProvider>
    </div>
  );
};

export default SidePanel;