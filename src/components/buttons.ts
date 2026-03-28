import { game, TicTacToe } from '@/TicTacToe';
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
      await ticTacToe.startWithPlayer(interaction);
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
    component: new ButtonBuilder()
      .setCustomId('startWithCpu')
      .setLabel('対戦開始！')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ticTacToe: TicTacToe) {
      await ticTacToe.startWithCpu(interaction);
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

type CustomId = keyof typeof registration;

const button = Object.fromEntries(
  (Object.keys(registration) as CustomId[]).map((id) => [id, registration[id].component] as const),
) as { [key in CustomId]: ButtonBuilder };

export const buttonInteraction = async (interaction: ButtonInteraction) => {
  const ticTacToe = game.get(interaction);
  if (ticTacToe === null) {
    await interaction.reply({ content: '`/marubatsu`しようね', flags });
    return;
  }
  const customId = interaction.customId;
  if (customId.includes('grid-')) {
    const gridIndex = Number(customId.replace('grid-', ''));
    await ticTacToe.putByPlayer(interaction, gridIndex);
    return;
  }
  await registration[customId as CustomId].execute(interaction, ticTacToe);
};

type ButtonKey = keyof typeof button;
export function makeButtonRow(...buttons: ButtonBuilder[]): ActionRowBuilder<ButtonBuilder>;
export function makeButtonRow(...buttonKeys: ButtonKey[]): ActionRowBuilder<ButtonBuilder>;
export function makeButtonRow(...buttonInfos: (ButtonKey | ButtonBuilder)[]) {
  const buttons =
    buttonInfos.length > 0 && typeof buttonInfos[0] === 'string'
      ? buttonInfos.map((key) => button[key as ButtonKey])
      : (buttonInfos as ButtonBuilder[]);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}
