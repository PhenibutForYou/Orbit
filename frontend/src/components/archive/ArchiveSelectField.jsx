export function ArchiveSelectField({ label, value, options, open, onOpen, onChange }) {
  return (
    <div className="archive-field">
      <span>{label}</span>
      <button
        className={`archive-field__control archive-field__control--select ${open ? "is-open" : ""}`}
        type="button"
        onClick={onOpen}
      >
        {value}
      </button>
      <div className="archive-popover archive-popover--menu" hidden={!open}>
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
