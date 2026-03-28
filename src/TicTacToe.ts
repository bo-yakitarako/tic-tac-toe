import {
  ButtonInteraction,
  EmbedBuilder,
  Interaction,
  MessageFlags,
  RepliableInteraction,
  TextChannel,
} from 'discord.js';
import { makeSelectMenuRow } from '@/components/selectMenu';
import { makeButtonRow } from '@/components/buttons';
import { buildEmbed, memberInfo } from '@/lib/utils';
import { minMax } from '@/lib/minMax';
import { generateAreaComponents } from '@/lib/areaGenerator';
import { judge } from '@/lib/judgement';

const guilds: { [guildId in string]: TicTacToe } = {};
export const game = {
  get({ guildId }: Interaction) {
    if (guildId === null) {
      return null;
    }
    return guilds[guildId] ?? null;
  },
  create(interaction: RepliableInteraction) {
    const { guildId } = interaction;
    if (guildId === null) {
      return null;
    }
    guilds[guildId] = new TicTacToe(interaction);
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
const defaultArea: Area = [0, 0, 0, 0, 0, 0, 0, 0, 0];
export type Mark = ':o:' | ':x:';
export type Strength = 'weak' | 'normal' | 'strong' | 'unbeatable';
export const strengthTitle: { [strength in Strength]: string } = {
  weak: 'ょゎぃ',
  normal: 'ふつう',
  strong: 'っょぃ',
  unbeatable: 'もぅまぢむり。。。',
};
const properGridRatio: { [strength in Strength]: number } = {
  weak: 0,
  normal: 0.3,
  strong: 0.7,
  unbeatable: 1,
};

type Player = {
  id: string;
  name: string;
  iconURL: string;
};
type Judgement = ReturnType<typeof judge>;

export class TicTacToe {
  private parent: Player;
  private cpuStrength: Strength = 'weak';
  private parentIsFirst = true;
  private parentMark: Mark = ':o:';
  private area: Area = [...defaultArea];
  private opponent: Player | null = null;
  private turnPlayerId = '';

  constructor(interaction: RepliableInteraction) {
    this.parent = { id: interaction.user.id, ...memberInfo(interaction) };
  }

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
    const content = `CPUのつよさと、${this.parent.name}の順番と:o:と:x:のどっち使いたいかとを決めて始めようねー`;
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
    await interaction.deleteReply();
    this.area = [...defaultArea];
    if (!this.parentIsFirst) {
      this.putByCpu();
    }
    this.turnPlayerId = this.parent.id;
    await (interaction.channel as TextChannel).send(this.buildCpuGameInfoMessage());
  }

  private putByCpu() {
    const cpuTurn = this.parentIsFirst ? 2 : 1;
    if (Math.random() > properGridRatio[this.cpuStrength]) {
      const girdsWithIndex = this.area.map((grid, i) => ({ grid, i }));
      const validIndexes = girdsWithIndex.filter(({ grid }) => grid === 0).map(({ i }) => i);
      const randomIndex = Math.floor(Math.random() * validIndexes.length);
      this.area[validIndexes[randomIndex]] = cpuTurn;
      return;
    }
    this.area[minMax(this.area).selected] = cpuTurn;
  }

  private buildCpuGameInfoMessage(bingo?: number[]) {
    const ended = bingo !== undefined || this.area.every((grid) => grid !== 0);
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${this.parent.name}くんの挑戦！`, iconURL: this.parent.iconURL })
      .setTitle(`CPU(${strengthTitle[this.cpuStrength]})との対決！`)
      .setDescription(`${this.parent.name}くんのマーク: ${this.parentMark}`)
      .setColor(0x3b93ff)
      .setFooter({ text: ended ? 'おぉっと！？決着だぁ！' : '一体どっちが勝つんだー！？' });
    const components = generateAreaComponents(this.area, this.firstMark, bingo);
    return { embeds: [embed], components };
  }

  private get firstMark() {
    if (this.parentIsFirst) {
      return this.parentMark;
    }
    return this.parentMark === ':o:' ? ':x:' : ':o:';
  }

  public async putByPlayer(interaction: ButtonInteraction, gridIndex: number) {
    if (![this.parent.id, this.opponent?.id ?? ''].includes(interaction.user.id)) {
      await interaction.reply({ content: '部外者は黙ってな', flags });
      return;
    }
    if (interaction.user.id !== this.turnPlayerId) {
      await interaction.reply({ content: 'おめえの番じゃねえど？', flags });
      return;
    }
    if (this.area[gridIndex] !== 0) {
      await interaction.reply({ content: '上書きやめてー？ダメだからね？', flags });
      return;
    }
    this.area[gridIndex] = this.currentTurnGrid;
    const judgement = judge(this.area);
    if (this.opponent === null) {
      // CPU戦
      await this.toNextOnCpu(interaction, judgement);
    } else {
      // 対人戦
      await interaction.deferUpdate();
    }
  }

  private async toNextOnCpu(interaction: ButtonInteraction, judgement: Judgement) {
    if (judgement === null && this.area.some((grid) => grid === 0)) {
      this.putByCpu();
      const nextJudgement = judge(this.area);
      if (nextJudgement === null && this.area.some((grid) => grid === 0)) {
        await interaction.update(this.buildCpuGameInfoMessage());
      } else {
        await this.cpuFinish(interaction, nextJudgement);
      }
      return;
    }
    await this.cpuFinish(interaction, judgement);
  }

  private async cpuFinish(interaction: ButtonInteraction, judgement: Judgement) {
    await interaction.update(this.buildCpuGameInfoMessage(judgement?.bingo));
    if (judgement === null) {
      const embed = buildEmbed(
        '引き分け！',
        'なかなかいい戦いだったぜ\nだが、次はこうは行けないぞ？',
      );
      await (interaction.channel as TextChannel).send({ embeds: [embed] });
      return;
    }
    const { winner } = judgement;
    const isWinParent = this.judgeParentWinning(winner);
    const title = isWinParent ? `${this.parent.name}くんの勝ち！` : 'CPUに敗けちゃったね...';
    const description = isWinParent
      ? 'くっ...なかなかやるじゃねえか...！\n次は敗けねえぞ！'
      : 'うぇ乁( ˙ω˙ )厂ーい\n俺の勝ち～ｗｗｗｗｗｗｗｗｗｗ';
    const embed = buildEmbed(title, description, isWinParent ? 'success' : 'failure');
    await (interaction.channel as TextChannel).send({ embeds: [embed] });
    game.remove(interaction);
  }

  private get currentTurnGrid() {
    return this.parentIsFirst === (this.turnPlayerId === this.parent.id) ? 1 : 2;
  }

  private judgeParentWinning(winner: 'first' | 'second') {
    return (
      (winner === 'first' && this.parentIsFirst) || (winner === 'second' && !this.parentIsFirst)
    );
  }
}
