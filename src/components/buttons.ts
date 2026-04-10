import { MemberInfo } from '@/lib/utils';
import { Area, game, Mark, TicTacToe } from '@/TicTacToe';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
  TextChannel,
} from 'discord.js';

const flags = MessageFlags.Ephemeral;

const registration = {
  withPlayer: {
    component: new ButtonBuilder()
      .setCustomId('withPlayer')
      .setLabel('誰かと対戦する')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe) {
      await ticTacToe.callOnEveryoneToJoin(interaction);
    },
  },
  join: {
    component: (parentName: string) =>
      new ButtonBuilder()
        .setCustomId('join')
        .setLabel(`${parentName}くんの対戦に参加する`)
        .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe, member: MemberInfo) {
      await interaction.update(ticTacToe.join(member));
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
      await ticTacToe.startBattle(interaction);
    },
  },
  withCpu: {
    component: new ButtonBuilder()
      .setCustomId('withCpu')
      .setLabel('CPUと対戦する')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe) {
      await ticTacToe.configureCpu(interaction);
    },
  },
  startWithCpu: {
    component: (canStart: boolean, retry?: boolean) =>
      new ButtonBuilder()
        .setCustomId('startWithCpu')
        .setLabel(retry ? 'CPUともっかいやる' : 'CPUと対戦開始！')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!canStart),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe) {
      await ticTacToe.startWithCpu(interaction);
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
      await ticTacToe.putByPlayer(interaction, gridIndex);
    },
  },
  onBattleEnd: {
    component: (parentName: string) =>
      new ButtonBuilder()
        .setCustomId('onBattleEnd')
        .setLabel(`${parentName}くんは終了処理のためにここを押してねー`)
        .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe) {
      await ticTacToe.onBattleFinish(interaction);
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
  const ticTacToe = game.get(interaction);
  if (ticTacToe === null) {
    await interaction.reply({ content: '`/marubatsu`しようね', flags });
    return;
  }
  const [customId, ...params] = interaction.customId.split('-');
  const numberedParams = params.map((p) => (isNaN(Number(p)) ? p : Number(p)));
  await (registration[customId as ButtonKey].execute as AnyExecute)(
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
type ButtonInfoArg = {
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
