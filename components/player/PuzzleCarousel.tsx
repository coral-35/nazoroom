"use client";

import { useEffect, useRef } from "react";
import { PuzzleCard } from "@/components/player/PuzzleCard";
import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCarouselProps = {
  cards: ExploredRoomCard[];
  latestCard?: ExploredRoomCard;
  loading: boolean;
};

export function PuzzleCarousel({ cards, latestCard, loading }: PuzzleCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rowRef.current?.scrollTo({
      left: rowRef.current.scrollWidth,
      behavior: "smooth"
    });
  }, [latestCard?.logId]);

  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-[#d8e3df] bg-white p-5 text-sm font-semibold text-neutral-600">
        探索ログを読み込み中...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[340px] flex-col justify-center rounded-lg border border-dashed border-[#b7c9c3] bg-white p-5">
        <p className="text-sm font-semibold text-[#008a72]">探索ログ</p>
        <h2 className="mt-2 text-xl font-bold">まだ部屋を探索していません</h2>
        <p className="mt-2 leading-7 text-neutral-700">
          部屋番号を入力して探索すると、ここにログや謎カードが残ります。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#d8e3df] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#008a72]">探索ログ</p>
          <h2 className="text-lg font-bold">見つけた部屋</h2>
        </div>
        <button
          type="button"
          onClick={() =>
            rowRef.current?.scrollTo({
              left: rowRef.current.scrollWidth,
              behavior: "smooth"
            })
          }
          className="focus-ring rounded-md border border-[#d8e3df] px-3 py-2 text-sm font-semibold"
        >
          最新へ
        </button>
      </div>
      <div ref={rowRef} className="snap-row flex gap-3 overflow-x-auto pb-2">
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
