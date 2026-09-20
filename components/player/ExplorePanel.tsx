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
      <div className="input-flow">
        <label htmlFor="room-code" className="flow-field flow-field--room">
          <span>部屋番号</span>
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
        </label>
        <svg className="flow-connections" viewBox="0 0 36 168" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path className="flow-to-answer" d="M 10 50 V 144 H 33 M 0 144 H 33 M 28 139 L 33 144 L 28 149" />
          <path className="flow-to-explore" d="M 0 50 H 33 M 28 45 L 33 50 L 28 55" />
          <circle cx="10" cy="50" r="3" className="flow-room-junction" />
          <circle cx="10" cy="144" r="3" className="flow-answer-junction" />
        </svg>
        <button
          type="button"
          onClick={onExplore}
          disabled={isExploreDisabled}
          aria-describedby="explore-inputs"
          className="button button--compact flow-explore"
        >
          {exploreBusy ? "探索中" : "探索"}
        </button>
        <label htmlFor="answer" className="flow-field flow-field--answer">
          <span>解答</span>
          <input
            id="answer"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            className="input"
            placeholder="解答を入力"
            inputMode="text"
          />
        </label>
        <button
          type="button"
          onClick={onAnswer}
          disabled={isAnswerDisabled}
          aria-describedby="answer-inputs"
          className="button button--compact flow-answer"
        >
          {answerBusy ? "解答中" : "解答"}
        </button>
        <span id="explore-inputs" className="visually-hidden">部屋番号のみを送信</span>
        <span id="answer-inputs" className="visually-hidden">部屋番号と解答を送信</span>
      </div>
      {feedback ? (
        <p className="message message--notice explore-feedback">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
