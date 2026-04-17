import { RepliableInteraction } from 'discord.js';
import { getMemberInfo } from '@/lib/utils';
import { TicTacToe } from '@/TicTacToe';

const channels: { [channelId in string]: TicTacToe } = {};
export const game = {
  get({ channelId }: { channelId: string | null }) {
    if (channelId === null) {
      return null;
    }
    return channels[channelId] ?? null;
  },
  create(interaction: RepliableInteraction) {
    const { channelId } = interaction;
    if (channelId === null) {
      return null;
    }
    channels[channelId] = new TicTacToe(getMemberInfo(interaction));
    return channels[channelId];
  },
  remove({ channelId }: { channelId: string | null }) {
    if (channelId === null) {
      return;
    }
    delete channels[channelId];
  },
};
