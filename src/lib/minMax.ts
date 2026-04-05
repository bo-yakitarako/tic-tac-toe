import { Area } from '@/TicTacToe';
import { judge } from '@/lib/judgement';

// oxlint-disable-next-line complexity
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
  const result = judge(area);
  if (result !== null) {
    const isWinOnFirst = isPlayerFirst && result.winner === 'first';
    const isWinOnSecond = !isPlayerFirst && result.winner === 'second';
    return { selected: selectedIndex!, value: isWinOnFirst || isWinOnSecond ? 1 : -1 };
  }
  if (candidateIndexes.length === 0) return { selected: selectedIndex!, value: 0 };
  const isSceneFirst = candidateIndexes.length % 2 === 1;
  const gridNumber = isSceneFirst ? 1 : 2;
  const children = candidateIndexes.map((i) => {
    const newArea = [...area] as Area;
    newArea[i] = gridNumber;
    return minMax(newArea, isPlayerFirst, i);
  });
  const minMaxMethod = isPlayerFirst === isSceneFirst ? Math.max : Math.min;
  const minMaxValue = minMaxMethod(...children.map(({ value }) => value));
  const targetChildren = [...children].filter(({ value }) => value === minMaxValue);
  const target = targetChildren[Math.floor(Math.random() * targetChildren.length)];
  const selected = selectedIndex ?? target.selected;
  return { selected, value: target.value };
};
