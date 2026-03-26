import { Interaction, MessageFlags, RepliableInteraction } from 'discord.js';

const guilds: { [guildId in string]: TicTacToe } = {};
export const game = {
  get({ guildId }: Interaction) {
    if (guildId === null) {
      return null;
    }
    return guilds[guildId] ?? null;
  },
  create({ guildId }: RepliableInteraction) {
    if (guildId === null) {
      return null;
    }
    guilds[guildId] = new TicTacToe();
    return guilds[guildId];
  },
  remove({ guildId }: Interaction) {
    if (guildId === null) {
      return;
    }
    delete guilds[guildId];
  },
};

const flags = MessageFlags.Ephemeral;

export class TicTacToe {}
