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

  return (
    <div className="puzzle-panel">
      <div className="panel-header">
        <div>
          <p className="kicker">探索ログ</p>
          <h2 className="card-title">見つけた部屋</h2>
        </div>
        <button
          disabled={loading || cards.length === 0}
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
        {cards.length === 0 ? <PuzzleCard loading={loading} /> : cards.map((card, index) => (
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
