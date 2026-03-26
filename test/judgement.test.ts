import { describe, expect, test } from 'bun:test';
import { extractIndexes, judge, parseIndexes } from '@/judgement';
import { Area } from '@/TicTacToe';

describe('parseIndexes', () => {
  test.each<{
    area: Area;
    first: number[];
    second: number[];
  }>([{ area: [0, 1, 2, 0, 0, 1, 2, 1, 0], first: [1, 5, 7], second: [2, 6] }])(
    '先攻後攻のindexexを分ける: $area -> first: $first, second: $second',
    ({ area, first, second }) => {
      expect(parseIndexes(area)).toEqual({ first, second });
    },
  );
});

describe('extractIndexes', () => {
  test.each([
    [0, 2, 3],
    [1, 2, 3],
    [4, 5, 7],
    [3, 6, 8],
    [2, 4, 7],
    [1, 4, 8],
    [1, 3, 5],
    [3, 5, 7],
  ])('何も無い場合(%i, %i, %i)', (a, b, c) => {
    expect(extractIndexes([a, b, c])).toBeNull();
  });
  test.each([
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
  ])('横に揃ったトリオがある場合(%i, %i, %i)', (a, b, c) => {
    expect(extractIndexes([a, b, c])).toEqual([a, b, c]);
  });
  test.each([
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
  ])('縦に揃ったトリオがある場合(%i, %i, %i)', (a, b, c) => {
    expect(extractIndexes([a, b, c])).toEqual([a, b, c]);
  });
  test.each([
    [0, 4, 8],
    [2, 4, 6],
  ])('斜めに揃ったトリオがある場合(%i, %i, %i)', (a, b, c) => {
    expect(extractIndexes([a, b, c])).toEqual([a, b, c]);
  });
});

type JudgeResult = Exclude<ReturnType<typeof judge>, null>;

describe('judge', () => {
  test('何も揃ってない場合', () => {
    const areas: Area[] = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 2, 1, 2, 1, 0, 2, 0],
      [0, 1, 0, 0, 0, 1, 2, 0, 0],
      [1, 0, 2, 2, 0, 1, 0, 0, 1],
      [0, 2, 1, 2, 1, 1, 2, 1, 2],
      [2, 1, 1, 1, 2, 2, 1, 2, 1],
    ];
    for (const area of areas) {
      expect(judge(area)).toBeNull();
    }
  });
  test('横の列が揃っている場合', () => {
    (
      [
        {
          area: [1, 1, 1, 2, 2, 0, 0, 1, 2],
          expected: { winner: 'first', bingo: [0, 1, 2] },
        },
        {
          area: [1, 1, 2, 2, 2, 2, 1, 0, 1],
          expected: { winner: 'second', bingo: [3, 4, 5] },
        },
        {
          area: [2, 2, 1, 1, 2, 2, 1, 1, 1],
          expected: { winner: 'first', bingo: [6, 7, 8] },
        },
      ] as { area: Area; expected: JudgeResult }[]
    ).forEach(({ area, expected }) => {
      expect(judge(area)).toEqual(expected);
    });
  });
  test('縦の列が揃っている場合', () => {
    (
      [
        {
          area: [1, 2, 0, 1, 2, 0, 1, 0, 2],
          expected: { winner: 'first', bingo: [0, 3, 6] },
        },
        {
          area: [1, 2, 0, 2, 2, 1, 1, 2, 1],
          expected: { winner: 'second', bingo: [1, 4, 7] },
        },
        {
          area: [2, 1, 1, 1, 2, 1, 2, 2, 1],
          expected: { winner: 'first', bingo: [2, 5, 8] },
        },
      ] as { area: Area; expected: JudgeResult }[]
    ).forEach(({ area, expected }) => {
      expect(judge(area)).toEqual(expected);
    });
  });
  test('斜めの列が揃っている場合', () => {
    (
      [
        {
          area: [1, 2, 0, 0, 1, 2, 0, 0, 1],
          expected: { winner: 'first', bingo: [0, 4, 8] },
        },
        {
          area: [0, 1, 2, 1, 2, 0, 2, 0, 1],
          expected: { winner: 'second', bingo: [2, 4, 6] },
        },
      ] as { area: Area; expected: JudgeResult }[]
    ).forEach(({ area, expected }) => {
      expect(judge(area)).toEqual(expected);
    });
  });
});
