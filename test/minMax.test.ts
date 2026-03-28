import { describe, expect, test, jest } from 'bun:test';
import { Area } from '@/TicTacToe';
import { evaluate, minMax } from '@/lib/minMax';

describe('minMax', () => {
  test.each<{ area: Area; isFirst: boolean; expected: ReturnType<typeof evaluate> }>([
    { area: [0, 0, 0, 0, 0, 0, 0, 0, 0], isFirst: true, expected: 0 },
    { area: [1, 0, 0, 0, 1, 2, 1, 0, 2], isFirst: false, expected: -3 },
    { area: [1, 1, 1, 0, 0, 0, 0, 2, 2], isFirst: true, expected: 99 },
    { area: [1, 2, 2, 1, 2, 1, 2, 0, 1], isFirst: false, expected: 100 },
  ])('終端ノードの評価値を計算する: $area', ({ area, isFirst, expected }) => {
    expect(evaluate(area, isFirst)).toEqual(expected);
  });
  test.each<{ area: Area; expected: number }>([
    { area: [0, 0, 0, 0, 0, 0, 0, 0, 0], expected: 0 },
    { area: [0, 0, 1, 0, 0, 0, 0, 0, 0], expected: 4 },
    { area: [2, 1, 0, 1, 0, 1, 2, 0, 0], expected: 4 },
  ])('ある状態のときのCPUの最善手を決定する: $area', ({ area, expected }) => {
    Math.random = jest.fn().mockReturnValue(0);
    const { selected } = minMax(area);
    expect(selected).toBe(expected);
  });
});
