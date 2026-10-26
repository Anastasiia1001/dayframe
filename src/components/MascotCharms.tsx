/** Small, non-interactive greeting accents, kept outside the character's face. */
export function MascotCharms() {
  return (
    <span className="mascot-charms" aria-hidden="true">
      {["heart", "star", "heart", "star"].map((kind, i) => (
        <svg
          key={i}
          className={`mascot-charm charm-${i}`}
          viewBox="0 0 24 24"
          fill={kind === "heart" ? "#e996ae" : "#e7c778"}
        >
          {kind === "heart" ? (
            <path d="M12 21 3 12C-3 4 7-1 12 6 17-1 27 4 21 12Z" />
          ) : (
            <path d="m12 1 3 7 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1Z" />
          )}
        </svg>
      ))}
    </span>
  );
}
