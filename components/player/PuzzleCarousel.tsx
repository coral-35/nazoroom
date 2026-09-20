"use client";

import { useRef } from "react";
import { PuzzleCard } from "@/components/player/PuzzleCard";
import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCarouselProps = {
  cards: ExploredRoomCard[];
  loading: boolean;
};

export function PuzzleCarousel({ cards, loading }: PuzzleCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="puzzle-placeholder">
        探索ログを読み込み中...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="puzzle-empty">
        <p className="kicker">探索ログ</p>
        <h2 className="card-title">まだ部屋を探索していません</h2>
      </div>
    );
  }

  return (
    <div className="puzzle-panel">
      <div className="panel-header">
        <div>
          <p className="kicker">探索ログ</p>
          <h2 className="card-title">見つけた部屋</h2>
        </div>
        <button
          type="button"
          onClick={() =>
            rowRef.current?.scrollTo({
              left: 0,
              behavior: "smooth"
            })
          }
          className="button button--secondary button--compact"
        >
          未クリアへ
        </button>
      </div>
      <div ref={rowRef} className="snap-row puzzle-row">
        {cards.map((card, index) => (
          <PuzzleCard
            key={card.logId}
            card={card}
            index={index + 1}
            total={cards.length}
          />
        ))}
      </div>
    </div>
  );
}
