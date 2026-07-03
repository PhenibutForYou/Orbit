export function AppLoader({ hidden }) {
  return (
    <div className={`app-loader ${hidden ? "app-loader--hidden" : ""}`} aria-hidden="true">
      <div className="app-loader__spinner" />
    </div>
  );
}
