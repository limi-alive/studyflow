type BuddyState = 'idle' | 'running' | 'paused' | 'celebrate';

type FocusBuddyProps = {
  state: BuddyState;
  intro?: boolean;
  subject?: string;
};

export function FocusBuddy({ state, intro = false, subject }: FocusBuddyProps) {
  const caption = state === 'running'
    ? `Mochi is studying${subject ? ` · ${subject}` : ''}`
    : state === 'paused'
      ? 'Mochi is waiting for you'
      : state === 'celebrate'
        ? 'Session complete! ✨'
        : 'Ready when you are';

  return (
    <div className={`focus-buddy buddy-${state} ${intro ? 'buddy-intro' : ''}`} aria-hidden="true">
      <div className="buddy-sparkles">
        <span>✦</span><span>♡</span><span>✧</span><span>★</span>
      </div>
      <div className="buddy-scene">
        <div className="buddy-tail" />
        <div className="buddy-cat">
          <div className="buddy-ear buddy-ear-left"><i /></div>
          <div className="buddy-ear buddy-ear-right"><i /></div>
          <div className="buddy-head">
            <div className="buddy-face">
              <span className="buddy-eye buddy-eye-left" />
              <span className="buddy-eye buddy-eye-right" />
              <span className="buddy-nose" />
              <span className="buddy-mouth" />
              <span className="buddy-cheek buddy-cheek-left" />
              <span className="buddy-cheek buddy-cheek-right" />
            </div>
          </div>
          <div className="buddy-body" />
          <div className="buddy-paw buddy-paw-left" />
          <div className="buddy-paw buddy-paw-right" />
        </div>
        <div className="buddy-desk">
          <div className="buddy-book"><span /></div>
          <div className="buddy-pencil" />
          <div className="buddy-mug">☕</div>
        </div>
      </div>
      <div className="buddy-caption">{caption}</div>
    </div>
  );
}
