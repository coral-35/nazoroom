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
  const isExploreDisabled = exploreDisabled || exploreBusy || !roomCode.trim();
  const isAnswerDisabled =
    answerDisabled || answerBusy || !roomCode.trim() || !answer.trim();

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
          disabled={isExploreDisabled}
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
          onClick={onAnswer}
          disabled={isAnswerDisabled}
          className="button button--dark button--compact"
        >
          {answerBusy ? "解答中" : "解答"}
        </button>
      </div>
      {feedback ? (
        <p className="message message--notice explore-feedback">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
