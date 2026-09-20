"use client";

type ExplorePanelProps = {
  roomCode: string;
  answer: string;
  onRoomCodeChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onExplore: () => void;
  onAnswer: () => void;
  feedback: string | null;
  exploreBusy: boolean;
  answerBusy: boolean;
  exploreDisabled: boolean;
  answerDisabled: boolean;
};

export function ExplorePanel({
  roomCode,
  answer,
  onRoomCodeChange,
  onAnswerChange,
  onExplore,
  onAnswer,
  feedback,
  exploreBusy,
  answerBusy,
  exploreDisabled,
  answerDisabled
}: ExplorePanelProps) {
  const validRoomCode = /^[0-9]{1,6}$/.test(roomCode);
  const isExploreDisabled = exploreDisabled || exploreBusy || !validRoomCode;
  const isAnswerDisabled =
    answerDisabled || answerBusy || !validRoomCode || !answer.trim();

  return (
    <div className="explore-panel">
      <fieldset className="action-group">
        <legend>探索 <span>部屋番号のみ</span></legend>
        <div className="explore-row">
          <label htmlFor="room-code" className="explore-label">
            部屋番号
          </label>
          <input
            id="room-code"
            value={roomCode}
            onChange={(event) => {
              const value = event.target.value.normalize("NFKC");
              if (/^[0-9]*$/.test(value)) onRoomCodeChange(value.slice(0, 6));
            }}
            className="input"
            placeholder="部屋番号を入力"
            inputMode="numeric"
            pattern="[0-9]{1,6}"
            maxLength={6}
          />
          <button
            type="button"
            onClick={onExplore}
            disabled={isExploreDisabled}
            className="button button--primary button--compact"
          >
            {exploreBusy ? "探索中" : "探索"}
          </button>
        </div>
      </fieldset>
      <fieldset className="action-group">
        <legend>解答 <span>部屋番号＋解答</span></legend>
        <p id="answer-target" className="answer-target" aria-live="polite">
          {validRoomCode ? `解答先：部屋 ${roomCode}（上の部屋番号）` : "解答先：上の部屋番号を入力してください"}
        </p>
        <div className="explore-row">
          <label htmlFor="answer" className="explore-label">
            解答
          </label>
          <input
            id="answer"
            aria-describedby="answer-target"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            className="input"
            placeholder="解答を入力"
            inputMode="text"
          />
          <button
            type="button"
            onClick={onAnswer}
            disabled={isAnswerDisabled}
            className="button button--dark button--compact"
          >
            {answerBusy ? "解答中" : "解答"}
          </button>
        </div>
      </fieldset>
      {feedback ? (
        <p className="message message--notice explore-feedback">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
