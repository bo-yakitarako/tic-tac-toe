import { Area } from '@/TicTacToe';

export const parseIndexes = (area: Area) => {
  const areasWithIndex = area.map((value, index) => ({ value, index }));
  const first = areasWithIndex.filter(({ value }) => value === 1).map(({ index }) => index);
  const second = areasWithIndex.filter(({ value }) => value === 2).map(({ index }) => index);
  return { first, second };
};

export const extractIndexes = (indexes: number[]) => {
  const conditions = [
    { gap: 1, isValidStart: (index: number) => index % 3 === 0 }, // 横
    { gap: 3, isValidStart: (index: number) => index < 3 }, // 縦
    { gap: 2, isValidStart: (index: number) => index === 2 }, // 斜め
    { gap: 4, isValidStart: (index: number) => index === 0 }, // 斜め
  ];
  for (const { gap, isValidStart } of conditions) {
    const startIndexex = indexes.filter(isValidStart);
    for (const startIndex of startIndexex) {
      if (indexes.includes(startIndex + gap) && indexes.includes(startIndex + gap * 2)) {
        return [startIndex, startIndex + gap, startIndex + gap * 2];
      }
    }
  }
  return null;
};

export const judge = (area: Area) => {
  const { first, second } = parseIndexes(area);
  const firstTrio = extractIndexes(first);
  if (firstTrio !== null) {
    return { winner: 'first', bingo: firstTrio } as const;
  }
  const secondTrio = extractIndexes(second);
  if (secondTrio !== null) {
    return { winner: 'second', bingo: secondTrio } as const;
  }
  return null;
};
