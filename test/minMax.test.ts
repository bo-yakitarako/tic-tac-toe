import { describe, expect, test, jest } from 'bun:test';
import { Area } from '@/TicTacToe';
import { minMax } from '@/lib/minMax';

describe('minMax', () => {
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
