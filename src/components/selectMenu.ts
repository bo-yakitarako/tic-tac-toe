import { game, Mark, Strength, strengthTitle, TicTacToe } from '@/TicTacToe';
import {
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

const flags = MessageFlags.Ephemeral;

const registration = {
  strengthSelect: {
    component(defaultStrength: Strength) {
      const options = (Object.keys(strengthTitle) as Strength[]).map((strength) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(strengthTitle[strength])
          .setValue(strength)
          .setDefault(strength === defaultStrength),
      );
      return new StringSelectMenuBuilder()
        .setCustomId('strengthSelect')
        .setPlaceholder('CPUの強さを選択')
        .addOptions(options);
    },
    async execute(interaction: StringSelectMenuInteraction, ticTacToe: TicTacToe) {
      ticTacToe.setCpuStrength(interaction.values[0] as Strength);
      await interaction.deferUpdate();
    },
  },
  selectParentTurn: {
    component(parentIsFirst: boolean) {
      const turnLabel = { first: 'やっぱ先攻っしょ', second: '残り物には福があるんだ。後攻で' };
      const options = (Object.keys(turnLabel) as (keyof typeof turnLabel)[]).map((turn) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(turnLabel[turn])
          .setValue(turn)
          .setDefault((turn === 'first') === parentIsFirst),
      );
      return new StringSelectMenuBuilder()
        .setCustomId('selectParentTurn')
        .setPlaceholder('先攻後攻を選択')
        .addOptions(options);
    },
    async execute(interaction: StringSelectMenuInteraction, ticTacToe: TicTacToe) {
      ticTacToe.setParentIsFirst(interaction.values[0] as 'first' | 'second');
      await interaction.deferUpdate();
    },
  },
  selectParentMark: {
    component(parentMark: Mark) {
      const label = { ':o:': '〇以外なくね？', ':x:': '我は✕で交錯する運命...' };
      const options = ([':o:', ':x:'] as Mark[]).map((mark) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(label[mark])
          .setValue(mark)
          .setDefault(mark === parentMark),
      );
      return new StringSelectMenuBuilder()
        .setCustomId('selectParentMark')
        .setPlaceholder('自分のマークを選択')
        .addOptions(options);
    },
    async execute(interaction: StringSelectMenuInteraction, ticTacToe: TicTacToe) {
      ticTacToe.setParentMark(interaction.values[0] as Mark);
      await interaction.deferUpdate();
    },
  },
};

type CustomId = keyof typeof registration;

export const selectMenuInteraction = async (interaction: StringSelectMenuInteraction) => {
  const ticTacToe = game.get(interaction);
  if (ticTacToe === null) {
    await interaction.reply({ content: '`/marubatsu`しようね', flags });
    return;
  }
  const customId = interaction.customId as CustomId;
  await registration[customId].execute(interaction, ticTacToe);
};

type SelectMenuParam<T extends CustomId> = [
  T,
  ...Parameters<(typeof registration)[T]['component']>,
];
export function makeSelectMenuRow<T extends CustomId>(...params: SelectMenuParam<T>) {
  const [key, ...args] = params;
  const component = (registration[key].component as any)(...args);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(component);
}
