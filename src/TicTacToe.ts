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

export type Area = (0 | 1 | 2)[]; // 0: まだ置かれてない, 1: 先手(〇), 2: 後手(×)

export class TicTacToe {}
