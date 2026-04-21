import { RepliableInteraction } from 'discord.js';
import { getMemberInfo } from '@/lib/utils';
import { TicTacToe } from '@/gameClasses/TicTacToe';
import { PlayerGame } from '@/gameClasses/PlayerGame';
import { CpuGame } from '@/gameClasses/CpuGame';

const channels: { [channelId in string]: TicTacToe } = {};
export const game = {
  get({ channelId }: RepliableInteraction) {
    if (channelId === null) {
      return undefined;
    }
    return channels[channelId] ?? undefined;
  },
  create(interaction: RepliableInteraction, mode: 'player' | 'cpu', preInstance?: TicTacToe) {
    const member = getMemberInfo(interaction);
    const instance =
      mode === 'player' ? new PlayerGame(member, preInstance) : new CpuGame(member, preInstance);
    channels[interaction.channelId!] = instance;
    return instance;
  },
  remove({ channelId }: RepliableInteraction) {
    if (channelId === null) {
      return;
    }
    delete channels[channelId];
  },
};
