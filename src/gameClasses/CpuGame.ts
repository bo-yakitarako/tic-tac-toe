import { ButtonInfoArg, makeButtonRow } from '@/components/buttons';
import { makeSelectMenuRow, strengthTitle } from '@/components/selectMenu';
import { TicTacToe } from '@/gameClasses/TicTacToe';
import { judge } from '@/lib/judgement';
import { minMax } from '@/lib/minMax';
import { buildEmbed, MemberInfo } from '@/lib/utils';
import { EmbedBuilder } from 'discord.js';

export type Strength = 'weak' | 'normal' | 'strong' | 'unbeatable';
const properGridRatio: { [strength in Strength]: number } = {
  weak: 0,
  normal: 0.3,
  strong: 0.7,
  unbeatable: 1,
};

export class CpuGame extends TicTacToe {
  private strength: Strength | null = null;

  constructor(parent: MemberInfo, preInstance?: TicTacToe) {
    super(parent, preInstance);
    if (preInstance instanceof CpuGame) {
      this.strength = preInstance.strength;
    }
  }

  public get configMessage() {
    const isEnded = this.area.some((grid) => grid !== 0);
    const content = isEnded ? '次はどうするー？もっかいやる？' : 'なんか色々設定したらはじめよやー';
    const buttons: ButtonInfoArg[] = [['startBattle', this.canStart, isEnded]];
    if (isEnded) {
      buttons.push('withPlayer', 'finish');
    }
    const components = [
      makeSelectMenuRow('strengthSelect', this.strength),
      makeSelectMenuRow('selectParentTurn', this.parentIsFirst),
      makeSelectMenuRow('selectParentMark', this.parentMark),
      makeButtonRow(...buttons),
    ];
    return { content, components };
  }

  public setStrength(strength: Strength) {
    this.strength = strength;
  }

  public startBattle() {
    this.resetArea();
    if (!this.parentIsFirst) {
      this.putByCpu();
    }
    return this.buildInfoMessage();
  }

  private putByCpu() {
    const cpuTurn = this.parentIsFirst ? 2 : 1;
    if (Math.random() > properGridRatio[this.strength!]) {
      const girdsWithIndex = this.area.map((grid, i) => ({ grid, i }));
      const validIndexes = girdsWithIndex.filter(({ grid }) => grid === 0).map(({ i }) => i);
      const randomIndex = Math.floor(Math.random() * validIndexes.length);
      this.area[validIndexes[randomIndex]] = cpuTurn;
      return;
    }
    this.area[minMax(this.area).selected] = cpuTurn;
  }

  public buildInfoMessage(bingo?: number[]) {
    const ended = bingo !== undefined || !this.hasEmpty;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${this.parent.name}くんの挑戦！`, iconURL: this.parent.iconURL })
      .setTitle(`CPU(${strengthTitle[this.strength!].title})との対決！`)
      .setDescription(`${this.parent.name}くんのマーク: ${this.parentMark}`)
      .setColor(0x3b93ff)
      .setFooter({ text: ended ? 'おぉっと！？決着だぁ！' : '一体どっちが勝つんだー！？' });
    return { embeds: [embed], components: this.buildAreaComponents(bingo) };
  }

  protected get canStart() {
    return [this.strength, this.parentIsFirst, this.parentMark].every((v) => v !== null);
  }

  protected toNext() {
    let judgement = judge(this.area);
    if (judgement === null && this.hasEmpty) {
      this.putByCpu();
      judgement = judge(this.area);
      if (judgement === null && this.hasEmpty) {
        return null;
      }
    }
    let embed: EmbedBuilder;
    if (judgement === null) {
      embed = buildEmbed('引き分け！', 'なかなかいい戦いだったぜ\nだが、次はこうは行けないぞ？');
    } else {
      const { winner } = judgement;
      const isWinParent = this.judgeParentWinning(winner);
      const title = isWinParent ? `${this.parent.name}くんの勝ち！` : 'CPUに敗けちゃったね...';
      const description = isWinParent
        ? 'くっ...なかなかやるじゃねえか...！\n次は敗けねえぞ！'
        : 'うぇ乁( ˙ω˙ )厂ーい\n俺の勝ち～ｗｗｗｗｗｗｗｗｗｗ';
      embed = buildEmbed(title, description, isWinParent ? 'success' : 'failure');
    }
    return {
      bingo: judgement?.bingo,
      channelMessage: { embeds: [embed] },
    };
  }

  protected get currentTurnGrid() {
    return this.parentIsFirst ? 1 : 2;
  }
}
