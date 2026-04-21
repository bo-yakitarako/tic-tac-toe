import { game } from '@/game';
import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { makeButtonRow } from './buttons';

const flags = MessageFlags.Ephemeral;

const registration = {
  marubatsu: {
    data: new SlashCommandBuilder().setName('marubatsu').setDescription('マルバツゲームしようぜ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      const alreadyGame = game.get(interaction);
      if (alreadyGame !== undefined) {
        await interaction.reply({ content: alreadyGame.alreadyInGameMessage, flags });
        return;
      }
      const components = [makeButtonRow('withPlayer', 'withCpu')];
      await interaction.reply({ content: 'はぁいこんにちは', components, flags });
    },
  },
  bye: {
    data: new SlashCommandBuilder().setName('bye').setDescription('グッバイマルバツゲーム'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      game.remove(interaction);
      await interaction.reply(':wave: ばいばーい');
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
  await registration[commandName].execute(interaction);
};
