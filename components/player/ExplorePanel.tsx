"use client";

type ExplorePanelProps = {
  roomCode: string;
  answer: string;
  onRoomCodeChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onExplore: () => void;
  onUnlock: () => void;
  exploreBusy: boolean;
  unlockBusy: boolean;
  disabled: boolean;
};

export function ExplorePanel({
  roomCode,
  answer,
  onRoomCodeChange,
  onAnswerChange,
  onExplore,
  onUnlock,
  exploreBusy,
  unlockBusy,
  disabled
}: ExplorePanelProps) {
  const exploreDisabled = disabled || exploreBusy || !roomCode.trim();
  const unlockDisabled = disabled || unlockBusy || !roomCode.trim() || !answer.trim();

  return (
    <div className="explore-panel">
      <div className="explore-row">
        <label htmlFor="room-code" className="explore-label">
          部屋番号
        </label>
        <input
          id="room-code"
          value={roomCode}
          onChange={(event) => onRoomCodeChange(event.target.value)}
          className="input"
          placeholder="305"
          inputMode="text"
          autoCapitalize="characters"
        />
        <button
          type="button"
          onClick={onExplore}
          disabled={exploreDisabled}
          className="button button--primary button--compact"
        >
          {exploreBusy ? "探索中" : "探索"}
        </button>
      </div>
      <div className="explore-row">
        <label htmlFor="answer" className="explore-label">
          解答
        </label>
        <input
          id="answer"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          className="input"
          placeholder="ひかり"
          inputMode="text"
        />
        <button
          type="button"
          onClick={onUnlock}
          disabled={unlockDisabled}
          className="button button--dark button--compact"
        >
          {unlockBusy ? "解錠中" : "解錠"}
        </button>
      </div>
    </div>
  );
}
