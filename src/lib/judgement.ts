import { Area } from '@/TicTacToe';

const SIZE = 3;

export const extractIndexes = (indexes: number[]) => {
  const conditions = [
    { gap: 1, isValidStart: (index: number) => index % SIZE === 0 }, // 横
    { gap: SIZE, isValidStart: (index: number) => index < SIZE }, // 縦
    { gap: SIZE - 1, isValidStart: (index: number) => index === SIZE - 1 }, // 斜め
    { gap: SIZE + 1, isValidStart: (index: number) => index === 0 }, // 斜め
  ];
  for (const { gap, isValidStart } of conditions) {
    const startIndexes = indexes.filter(isValidStart);
    for (const startIndex of startIndexes) {
      const targets = Array.from({ length: SIZE }, (_, i) => startIndex + gap * i);
      if (targets.every((target) => indexes.includes(target))) {
        return targets;
      }
    }
  }
  return null;
};

export const judge = (area: Area) => {
  for (const grid of [1, 2]) {
    const bingo = extractIndexes(area.flatMap((v, i) => (v === grid ? [i] : [])));
    if (bingo !== null) {
      return { winner: grid === 1 ? 'first' : 'second', bingo } as const;
    }
  }
  return null;
};
