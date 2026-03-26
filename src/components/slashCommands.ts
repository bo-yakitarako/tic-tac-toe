import { game, TicTacToe } from '@/TicTacToe';
import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

const flags = MessageFlags.Ephemeral;

const registration = {
  marubatsu: {
    data: new SlashCommandBuilder().setName('marubatsu').setDescription('マルバツゲームしようぜ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      const ticTacToe = game.create(interaction);
      if (ticTacToe === null) {
        await interaction.reply({ content: 'ほ？', flags });
        return;
      }
      await interaction.reply('このゲームには必勝法が存在する...');
    },
  },
  bye: {
    data: new SlashCommandBuilder().setName('bye').setDescription('グッバイマルバツゲーム'),
    execute: async (interaction: ChatInputCommandInteraction, ticTacToe: TicTacToe) => {
      await interaction.reply('ばいばい');
    },
  },
};

type CommandName = keyof typeof registration;

export const commands = Object.values(registration).map(({ data }) => data.toJSON());
export const slashCommandsInteraction = async (interaction: ChatInputCommandInteraction) => {
  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: 'ほ？', flags });
    return;
  }
  const commandName = interaction.commandName as CommandName;
  if (commandName === 'marubatsu') {
    await registration.marubatsu.execute(interaction);
    return;
  }
  const ticTacToe = game.get(interaction);
  if (ticTacToe === null) {
    await interaction.reply({ content: 'ほ？', flags });
    return;
  }
  await registration[commandName].execute(interaction, ticTacToe);
};
