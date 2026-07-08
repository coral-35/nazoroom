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
    <div className="grid gap-2 rounded-lg border border-[#d8e3df] bg-white p-3 shadow-soft">
      <div className="grid grid-cols-[5.4rem_minmax(0,1fr)_5rem] items-center gap-2">
        <label htmlFor="room-code" className="text-sm font-bold">
          部屋番号
        </label>
        <input
          id="room-code"
          value={roomCode}
          onChange={(event) => onRoomCodeChange(event.target.value)}
          className="focus-ring min-w-0 rounded-md border border-[#c6d5d0] px-3 py-3"
          placeholder="305"
          inputMode="text"
          autoCapitalize="characters"
        />
        <button
          type="button"
          onClick={onExplore}
          disabled={exploreDisabled}
          className="focus-ring rounded-md bg-[#008a72] px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {exploreBusy ? "探索中" : "探索"}
        </button>
      </div>
      <div className="grid grid-cols-[5.4rem_minmax(0,1fr)_5rem] items-center gap-2">
        <label htmlFor="answer" className="text-sm font-bold">
          解答
        </label>
        <input
          id="answer"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          className="focus-ring min-w-0 rounded-md border border-[#c6d5d0] px-3 py-3"
          placeholder="ひかり"
          inputMode="text"
        />
        <button
          type="button"
          onClick={onUnlock}
          disabled={unlockDisabled}
          className="focus-ring rounded-md bg-[#19202a] px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {unlockBusy ? "解錠中" : "解錠"}
        </button>
      </div>
    </div>
  );
}
