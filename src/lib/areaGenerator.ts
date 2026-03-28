import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Area, Mark } from '@/TicTacToe';

const { Primary, Danger, Secondary, Success } = ButtonStyle;

export const generateAreaComponents = (area: Area, firstMark: Mark, bingo?: number[]) =>
  area.reduce<ActionRowBuilder<ButtonBuilder>[]>((pre, grid, i) => {
    const rows = [...pre];
    if (i % 3 === 0) {
      rows.push(new ActionRowBuilder<ButtonBuilder>());
    }
    const label: { [key in typeof grid]: string } = {
      0: 'ー',
      1: firstMark === ':o:' ? '〇' : '✕',
      2: firstMark === ':o:' ? '✕' : '〇',
    };
    const style: { [key in typeof grid]: ButtonStyle } = {
      0: Secondary,
      1: firstMark === ':o:' ? Danger : Primary,
      2: firstMark === ':o:' ? Primary : Danger,
    };
    rows[rows.length - 1].addComponents(
      new ButtonBuilder()
        .setCustomId(`grid-${i}`)
        .setLabel(label[grid])
        .setStyle(bingo?.includes(i) ? Success : style[grid])
        .setDisabled(bingo !== undefined || area.every((g) => g !== 0)),
    );
    return rows;
  }, []);
