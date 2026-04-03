import { Area } from '@/TicTacToe';

export const extractIndexes = (indexes: number[]) => {
  const conditions = [
    { gap: 1, isValidStart: (index: number) => index % 3 === 0 }, // 横
    { gap: 3, isValidStart: (index: number) => index < 3 }, // 縦
    { gap: 2, isValidStart: (index: number) => index === 2 }, // 斜め
    { gap: 4, isValidStart: (index: number) => index === 0 }, // 斜め
  ];
  for (const { gap, isValidStart } of conditions) {
    const startIndexes = indexes.filter(isValidStart);
    for (const startIndex of startIndexes) {
      if (indexes.includes(startIndex + gap) && indexes.includes(startIndex + gap * 2)) {
        return [startIndex, startIndex + gap, startIndex + gap * 2];
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
