import { game, Mark, Strength, TicTacToe } from '@/TicTacToe';
import {
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

const flags = MessageFlags.Ephemeral;

export const strengthTitle: { [strength in Strength]: { title: string; description: string } } = {
  weak: { title: 'ょゎぃ', description: 'あへぇ～？？？' },
  normal: { title: 'ふつう', description: 'おれ、まけねえから！' },
  strong: { title: 'っょぃ', description: '私に勝負を挑むとは良い度胸だな貴様' },
  unbeatable: { title: 'もぅまぢむり。。。', description: 'ｩﾁにゎかてなぃ。。。ﾘｽｶしょ。。。' },
};

const registration = {
  strengthSelect: {
    component(defaultStrength: Strength | null) {
      const options = (Object.keys(strengthTitle) as Strength[]).map((strength) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(strengthTitle[strength].title)
          .setDescription(strengthTitle[strength].description)
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
      await interaction.update(ticTacToe.configurationMessage);
    },
  },
  selectParentTurn: {
    component(parentIsFirst: boolean | null) {
      const turnLabel = { first: 'やっぱ先攻っしょ', second: '残り物には福があるんだ。後攻で' };
      const options = (Object.keys(turnLabel) as (keyof typeof turnLabel)[]).map((turn) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(turnLabel[turn])
          .setValue(turn)
          .setDefault((turn === 'first') === parentIsFirst),
      );
      return new StringSelectMenuBuilder()
        .setCustomId('selectParentTurn')
        .setPlaceholder('おめえさんの先攻後攻を選択')
        .addOptions(options);
    },
    async execute(interaction: StringSelectMenuInteraction, ticTacToe: TicTacToe) {
      ticTacToe.setParentIsFirst(interaction.values[0] as 'first' | 'second');
      await interaction.update(ticTacToe.configurationMessage);
    },
  },
  selectParentMark: {
    component(parentMark: Mark | null) {
      const label = { ':o:': '〇以外なくね？', ':x:': '我は✕で交錯する運命...' };
      const options = ([':o:', ':x:'] as Mark[]).map((mark) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(label[mark])
          .setValue(mark)
          .setDefault(mark === parentMark),
      );
      return new StringSelectMenuBuilder()
        .setCustomId('selectParentMark')
        .setPlaceholder('おめえさんのマークを選択')
        .addOptions(options);
    },
    async execute(interaction: StringSelectMenuInteraction, ticTacToe: TicTacToe) {
      ticTacToe.setParentMark(interaction.values[0] as Mark);
      await interaction.update(ticTacToe.configurationMessage);
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
