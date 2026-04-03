import { Area } from '@/TicTacToe';
import { judge } from '@/lib/judgement';

// oxlint-disable-next-line complexity
export const evaluate = (area: Area, isPlayerFirst: boolean) => {
  const conditions = [
    { gap: 1, isValidStart: (index: number) => index % 3 === 0 }, // 横
    { gap: 3, isValidStart: (index: number) => index < 3 }, // 縦
    { gap: 2, isValidStart: (index: number) => index === 2 }, // 斜め
    { gap: 4, isValidStart: (index: number) => index === 0 }, // 斜め
  ];
  const order: [1 | 2, 1 | 2] = isPlayerFirst ? [1, 2] : [2, 1];
  const counts = [0, 0] as [number, number];
  for (const index of [0, 1, 2, 3, 6]) {
    for (const { gap, isValidStart } of conditions) {
      if (!isValidStart(index)) {
        continue;
      }
      const gridIndexes = [index, index + gap, index + gap * 2];
      const grids = gridIndexes.map((i) => area[i]);
      if (grids.every((i) => i === 0) || (grids.includes(1) && grids.includes(2))) {
        continue;
      }
      for (let countIndex = 0; countIndex < order.length; countIndex += 1) {
        const gridNumber = order[countIndex];
        if (counts[countIndex] > 10) {
          continue;
        }
        if (grids.every((grid) => grid === gridNumber)) {
          counts[countIndex] = 100;
        } else if (grids.includes(gridNumber)) {
          counts[countIndex] += 1;
        }
      }
    }
  }
  return counts[0] - counts[1];
};

export const minMax = (
  area: Area,
  isPlayerFirst?: boolean,
  selectedIndex?: number,
): { selected: number; value: number } => {
  if (area.every((value) => value === 0)) {
    const indexes = [0, 2, 4, 6, 8];
    const selected = indexes[Math.floor(Math.random() * indexes.length)];
    return { selected, value: 0 };
  }
  const candidateIndexes = area.flatMap((v, i) => (v === 0 ? [i] : []));
  if (isPlayerFirst === undefined) {
    isPlayerFirst = candidateIndexes.length % 2 === 1;
  }
  if (candidateIndexes.length === 0 || judge(area) !== null) {
    const value = evaluate(area, isPlayerFirst);
    return { selected: selectedIndex!, value };
  }
  const isSceneFirst = candidateIndexes.length % 2 === 1;
  const gridNumber = isSceneFirst ? 1 : 2;
  const children = candidateIndexes.map((i) => {
    const newArea = [...area] as Area;
    newArea[i] = gridNumber;
    return minMax(newArea, isPlayerFirst, i);
  });
  const sign = isPlayerFirst === isSceneFirst ? 1 : -1;
  const targetChildren = [...children]
    .sort((a, b) => sign * (b.value - a.value))
    .filter(({ value }, _, arr) => value === arr[0].value);
  const target = targetChildren[Math.floor(Math.random() * targetChildren.length)];
  const selected = selectedIndex ?? target.selected;
  return { selected, value: target.value };
};
