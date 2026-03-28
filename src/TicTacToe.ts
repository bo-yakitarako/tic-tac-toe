import { ButtonInteraction, Interaction, MessageFlags, RepliableInteraction } from 'discord.js';
import { makeSelectMenuRow } from '@/components/selectMenu';
import { makeButtonRow } from '@/components/buttons';
import { memberInfo } from '@/lib/utils';

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

type Grid = 0 | 1 | 2; // 0: まだ置かれてない, 1: 先手, 2: 後手
export type Area = [Grid, Grid, Grid, Grid, Grid, Grid, Grid, Grid, Grid];
export type Mark = ':o:' | ':x:';
export type Strength = 'weak' | 'normal' | 'strong' | 'unbeatable';
export const strengthTitle: { [strength in Strength]: string } = {
  weak: 'ょゎぃ',
  normal: 'ふつう',
  strong: 'っょぃ',
  unbeatable: 'もぅまぢむり。。。',
};
// const properGridRatio: { [strength in Strength]: number } = {
//   weak: 0,
//   normal: 0.33,
//   strong: 0.66,
//   unbeatable: 1,
// };

export class TicTacToe {
  private cpuStrength: Strength = 'weak';
  private parentIsFirst = true;
  private parentMark: Mark = ':o:';

  public async startWithPlayer(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
  }

  public async configureCpu(interaction: ButtonInteraction) {
    const components = [
      makeSelectMenuRow('strengthSelect', this.cpuStrength),
      makeSelectMenuRow('selectParentTurn', this.parentIsFirst),
      makeSelectMenuRow('selectParentMark', this.parentMark),
      makeButtonRow('startWithCpu'),
    ];
    const { name } = memberInfo(interaction);
    const content = `CPUのつよさと、${name}の順番と:o:と:x:のどっち使いたいかとを決めて始めようねー`;
    await interaction.update({ content, components });
  }

  public setCpuStrength(strength: Strength) {
    this.cpuStrength = strength;
  }

  public setParentIsFirst(parentTurn: 'first' | 'second') {
    this.parentIsFirst = parentTurn === 'first';
  }

  public setParentMark(parentMark: Mark) {
    this.parentMark = parentMark;
  }

  public async startWithCpu(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
  }

  public async bye(interaction: RepliableInteraction) {
    await interaction.reply(':bye:');
  }
}
