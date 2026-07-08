import type { TreasureItem } from "@/lib/types/app";

type TreasureListProps = {
  treasures: TreasureItem[];
};

export function TreasureList({ treasures }: TreasureListProps) {
  return (
    <section className="rounded-lg border border-[#d8e3df] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">入手した宝</h2>
        <span className="rounded-md bg-[#e9f6f2] px-2 py-1 text-sm font-bold text-[#006c5b]">
          {treasures.length}個
        </span>
      </div>
      {treasures.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          まだ宝を入手していません。
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {treasures.map((treasure) => (
            <li
              key={treasure.roomCode}
              className="rounded-md border border-[#d8e3df] bg-[#f9fbfa] px-3 py-2"
            >
              <p className="font-bold">{treasure.name}</p>
              <p className="text-sm text-neutral-600">部屋 {treasure.roomCode}</p>
              {treasure.description ? (
                <p className="mt-1 text-sm leading-6 text-neutral-700">
                  {treasure.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
