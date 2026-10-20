import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
const notes = [
  'Little steps are still steps. You’re doing lovely.',
  'A sip of water, a deep breath. You’ve got this.',
  'You don’t have to do everything to have a good day.',
  'A tiny win deserves a tiny happy dance.',
];
/** A small local companion: no services, timers or personal data. */
export function CozyCompanion() {
  const [note, setNote] = useState(0);
  return <div className="cozy-note">
    <button className="bunny-button" aria-label="A little encouragement" onClick={() => setNote(n => n + 1)}>
      <svg className="bunny" viewBox="0 0 90 90" fill="none" aria-hidden="true">
        <g className="bunny-ears"><ellipse cx="32" cy="25" rx="10" ry="22" fill="var(--bunny)" stroke="var(--bunny-line)" strokeWidth="1.6" transform="rotate(-12 32 25)"/><ellipse cx="58" cy="25" rx="10" ry="22" fill="var(--bunny)" stroke="var(--bunny-line)" strokeWidth="1.6" transform="rotate(12 58 25)"/><ellipse cx="32" cy="24" rx="4" ry="14" fill="var(--blush)" transform="rotate(-12 32 24)"/><ellipse cx="58" cy="24" rx="4" ry="14" fill="var(--blush)" transform="rotate(12 58 24)"/></g>
        <ellipse cx="45" cy="57" rx="31" ry="27" fill="var(--bunny)" stroke="var(--bunny-line)" strokeWidth="1.6"/>
        <ellipse cx="25" cy="63" rx="7" ry="4" fill="var(--blush)"/><ellipse cx="65" cy="63" rx="7" ry="4" fill="var(--blush)"/>
        <g className="bunny-eyes"><ellipse cx="34" cy="55" rx="2.3" ry="3.2" fill="var(--text)"/><ellipse cx="56" cy="55" rx="2.3" ry="3.2" fill="var(--text)"/></g>
        <path d="M42 61 Q45 65 48 61 M45 64 Q42 69 39 66 M45 64 Q48 69 51 66" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M70 22l2-5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="var(--accent)" opacity=".65"/>
      </svg>
      <span className="bunny-heart" aria-hidden="true">♡</span>
    </button>
    <div className="cozy-copy"><span className="cozy-label"><Sparkles size={12}/> A SOFTER KIND OF PRODUCTIVITY</span><p key={note} aria-live="polite">{notes[note % notes.length]}</p></div>
    <span className="cozy-flower" aria-hidden="true">✿</span><span className="cozy-signoff"><Heart size={13}/> One little thing at a time</span>
  </div>;
}
export function HappyPetals({ burst }: { burst: number }) {
  if (!burst) return null;
  return <div className="happy-petals" key={burst} aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i} style={{'--i':i} as import('react').CSSProperties}>{i%3===0?'♡':i%3===1?'✦':'✿'}</span>)}</div>;
}
