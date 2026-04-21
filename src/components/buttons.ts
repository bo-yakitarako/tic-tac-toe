import { getMemberInfo, MemberInfo } from '@/lib/utils';
import { Area, Mark, TicTacToe } from '@/gameClasses/TicTacToe';
import { game } from '@/game';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
  TextChannel,
} from 'discord.js';
import { PlayerGame } from '@/gameClasses/PlayerGame';
import { CpuGame } from '@/gameClasses/CpuGame';

const flags = MessageFlags.Ephemeral;

const registration = {
  withPlayer: {
    component: new ButtonBuilder()
      .setCustomId('withPlayer')
      .setLabel('誰かと対戦する')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction) {
      const { name } = getMemberInfo(interaction);
      const instance = game.create(interaction, 'player');
      const content = `@here ${name}のヤツが対戦相手を募集してんぞ！誰か来てくれー！`;
      const components = [makeButtonRow(['join', name])];
      await interaction.update(instance.configMessage);
      await (interaction.channel as TextChannel).send({ content, components });
    },
  },
  withCpu: {
    component: new ButtonBuilder()
      .setCustomId('withCpu')
      .setLabel('CPUと対戦する')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ticTacToe?: TicTacToe) {
      const instance = game.create(interaction, 'cpu', ticTacToe);
      await interaction.update(instance.configMessage);
    },
  },
  join: {
    component: (parentName: string) =>
      new ButtonBuilder()
        .setCustomId('join')
        .setLabel(`${parentName}くんの対戦に参加する`)
        .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe, member: MemberInfo) {
      if (!(ticTacToe instanceof PlayerGame)) {
        await interaction.reply({ content: 'ほ？', flags });
        return;
      }
      await interaction.update({ content: ticTacToe.join(member), components: [] });
    },
  },
  startBattle: {
    component: (canStart: boolean, retry?: boolean) =>
      new ButtonBuilder()
        .setCustomId('startBattle')
        .setLabel(retry ? 'もう一回やる' : '対戦開始！')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!canStart),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe) {
      const message = ticTacToe.startBattle();
      await interaction.deferUpdate();
      await interaction.deleteReply();
      await (interaction.channel as TextChannel).send(message);
    },
  },
  grid: {
    component: (area: Area, gridIndex: number, firstMark: Mark, bingo?: number[]) => {
      const grid = area[gridIndex];
      const label: { [key in typeof grid]: string } = {
        0: 'ー',
        1: firstMark === ':o:' ? '〇' : '✕',
        2: firstMark === ':o:' ? '✕' : '〇',
      };
      const style: { [key in typeof grid]: ButtonStyle } = {
        0: ButtonStyle.Secondary,
        1: firstMark === ':o:' ? ButtonStyle.Danger : ButtonStyle.Primary,
        2: firstMark === ':o:' ? ButtonStyle.Primary : ButtonStyle.Danger,
      };
      return new ButtonBuilder()
        .setCustomId(`grid-${gridIndex}`)
        .setLabel(label[grid])
        .setStyle(bingo?.includes(gridIndex) ? ButtonStyle.Success : style[grid])
        .setDisabled(bingo !== undefined || area.every((g) => g !== 0));
    },
    async execute(
      interaction: ButtonInteraction,
      ticTacToe: TicTacToe,
      member: MemberInfo,
      gridIndex: number,
    ) {
      const result = ticTacToe.putByPlayer(member, gridIndex);
      await interaction.update(ticTacToe.buildInfoMessage(result?.bingo));
      if (result === null) {
        return;
      }
      await (interaction.channel as TextChannel).send(result.channelMessage);
      if (ticTacToe instanceof CpuGame) {
        await interaction.followUp({ ...ticTacToe.configMessage, flags });
      }
    },
  },
  onBattleEnd: {
    component: (parentName: string) =>
      new ButtonBuilder()
        .setCustomId('onBattleEnd')
        .setLabel(`${parentName}くんは終了処理のためにここを押してねー`)
        .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe, member: MemberInfo) {
      if (!ticTacToe.isParent(member)) {
        await interaction.reply({ content: 'あんたにゃ関係ねーよー？', flags });
        return;
      }
      await interaction.reply({ ...ticTacToe.configMessage, flags });
      await interaction.message.edit({ embeds: interaction.message.embeds, components: [] });
    },
  },
  finish: {
    component: new ButtonBuilder()
      .setCustomId('finish')
      .setLabel('もうやめる')
      .setStyle(ButtonStyle.Danger),
    async execute(interaction: ButtonInteraction) {
      game.remove(interaction);
      await interaction.deferUpdate();
      await interaction.deleteReply();
      await (interaction.channel as TextChannel).send(':wave: ばいばーい');
    },
  },
};

type ButtonKey = keyof typeof registration;
type Registration = typeof registration;
type AnyExecute = (
  interaction: ButtonInteraction,
  ticTacToe: TicTacToe,
  memberInfo: MemberInfo,
  ...args: (string | number)[]
) => Promise<void>;

export const buttonInteraction = async (interaction: ButtonInteraction, memberInfo: MemberInfo) => {
  const [customId, ...params] = interaction.customId.split('-') as [ButtonKey, ...string[]];
  const ticTacToe = game.get(interaction);
  if (customId === 'withCpu' || customId === 'withPlayer') {
    await registration[customId].execute(interaction, ticTacToe);
    return;
  }
  if (ticTacToe === undefined) {
    await interaction.reply({ content: '`/marubatsu`しようね', flags });
    return;
  }
  const numberedParams = params.map((p) => (isNaN(Number(p)) ? p : Number(p)));
  await (registration[customId].execute as AnyExecute)(
    interaction,
    ticTacToe,
    memberInfo,
    ...numberedParams,
  );
};

type ButtonComponentBuilder<T extends ButtonKey> = Registration[T]['component'] extends (
  ...args: infer P
) => ButtonBuilder
  ? [T, ...P]
  : [T];
export type ButtonInfoArg = {
  [K in ButtonKey]: Registration[K]['component'] extends (...args: infer _P) => ButtonBuilder
    ? ButtonComponentBuilder<K>
    : K | ButtonComponentBuilder<K>;
}[ButtonKey];

export function makeButtonRow(...buttonInfos: ButtonInfoArg[]) {
  const buttons = buttonInfos.map((info) => {
    const [key, ...args] = Array.isArray(info) ? info : [info];
    const component = registration[key as ButtonKey].component;
    if (typeof component === 'function') {
      return (component as (...args: unknown[]) => ButtonBuilder)(...args);
    }
    return component;
  });
  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}
