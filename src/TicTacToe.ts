import { EmbedBuilder } from 'discord.js';
import { makeSelectMenuRow, strengthTitle } from '@/components/selectMenu';
import { ButtonInfoArg, makeButtonRow } from '@/components/buttons';
import { buildEmbed, chunk, MemberInfo, withIndex } from '@/lib/utils';
import { minMax } from '@/lib/minMax';
import { judge } from '@/lib/judgement';
import { BotError } from '@/BotError';

type Grid = 0 | 1 | 2; // 0: まだ置かれてない, 1: 先手, 2: 後手
export type Area = [Grid, Grid, Grid, Grid, Grid, Grid, Grid, Grid, Grid];
const defaultArea: Area = [0, 0, 0, 0, 0, 0, 0, 0, 0];
export type Mark = ':o:' | ':x:';
export type Strength = 'weak' | 'normal' | 'strong' | 'unbeatable';
const properGridRatio: { [strength in Strength]: number } = {
  weak: 0,
  normal: 0.3,
  strong: 0.7,
  unbeatable: 1,
};

type Judgement = ReturnType<typeof judge>;

export class TicTacToe {
  private parent: MemberInfo;
  private gameMode: 'player' | 'cpu' = 'player';
  private cpuStrength: Strength | null = null;
  private parentIsFirst: boolean | null = null;
  private parentMark: Mark | null = null;
  private area: Area = [...defaultArea];
  private opponent: MemberInfo | null = null;
  private turnPlayerId = '';

  constructor(member: MemberInfo) {
    this.parent = member;
  }

  public noticeAlreadyInGame() {
    return `このチャンネルでは既に${this.parent.name}くんが\`/marubatsu\`しちゃってるね\n終わるのを待つか、他のチャンネルで\`/marubatsu\`してみてねー`;
  }

  public callOnEveryoneToJoin() {
    this.opponent = null;
    this.gameMode = 'player';
    this.area = [...defaultArea];
    const content = `@here ${this.parent.name}のヤツが対戦相手を募集してんぞ！誰か来てくれー！`;
    const channelMessage = { content, components: [makeButtonRow(['join', this.parent.name])] };
    return { configMessage: this.configurationMessage, channelMessage };
  }

  public get configurationMessage() {
    return this.gameMode === 'player'
      ? this.buildPlayerConfigurationMessage()
      : this.buildCpuConfigurationMessage();
  }

  private buildPlayerConfigurationMessage() {
    const isEnded = this.area.some((grid) => grid !== 0);
    let content = '対戦相手を募集すんぞぉ！おめえさんの番は何がいいか決めておこうな';
    const buttons: ButtonInfoArg[] = [['startBattle', this.canStart, isEnded]];
    if (isEnded) {
      buttons.push('withPlayer', 'withCpu', 'finish');
      content = `この後はどうするー？\n他の人とやりたい場合は「誰かと対戦する」にしてねー`;
    }
    const components = [
      makeSelectMenuRow('selectParentTurn', this.parentIsFirst),
      makeSelectMenuRow('selectParentMark', this.parentMark),
      makeButtonRow(...buttons),
    ];
    return { content, components };
  }

  public join(member: MemberInfo) {
    if (member.id === this.parent.id) {
      throw new BotError('己との闘いってか？意味分かんないね');
    }
    if (this.opponent !== null) {
      throw new BotError(`${this.opponent.name}くんがおるんだよなあ...`);
    }
    this.opponent = { ...member };
    return { content: `${this.opponent.name}が参戦！`, components: [] };
  }

  public startBattle() {
    if (this.opponent === null) {
      throw new BotError('ぼっち乙～ｗｗｗ');
    }
    this.area = [...defaultArea];
    this.turnPlayerId = this.parentIsFirst ? this.parent.id : this.opponent.id;
    return this.buildPlayerGameInfoMessage();
  }

  public buildGameInfoMessage(bingo?: number[]) {
    if (this.gameMode === 'player') {
      return this.buildPlayerGameInfoMessage(bingo);
    }
    return this.buildCpuGameInfoMessage(bingo);
  }

  private buildPlayerGameInfoMessage(bingo?: number[]) {
    const ended = bingo !== undefined || !this.hasEmpty;
    const player = this.parent.id === this.turnPlayerId ? this.parent : this.opponent!;
    const opponentMark = this.parentMark === ':o:' ? ':x:' : ':o:';
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${player.name}くんの番！`, iconURL: player.iconURL })
      .setTitle(`${this.parent.name} vs ${this.opponent!.name} の対決だぁ！`)
      .setDescription(
        `${this.parent.name}くんのマーク: ${this.parentMark}\n${this.opponent!.name}くんのマーク: ${opponentMark}`,
      )
      .setColor(0x3b93ff)
      .setFooter({ text: ended ? 'おぉっと！？決着だぁ！' : '一体どっちが勝つんだー！？' });
    return { embeds: [embed], components: this.buildAreaComponents(bingo) };
  }

  private buildAreaComponents(bingo?: number[]) {
    return chunk(withIndex(this.area), 3).map((row) =>
      makeButtonRow(
        ...row.map<ButtonInfoArg>(({ i }) => ['grid', this.area, i, this.firstMark, bingo]),
      ),
    );
  }

  public configureCpu() {
    this.opponent = null;
    this.gameMode = 'cpu';
    this.area = [...defaultArea];
    return this.configurationMessage;
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

  private buildCpuConfigurationMessage() {
    const isEnded = this.area.some((grid) => grid !== 0);
    const content = isEnded ? '次はどうするー？もっかいやる？' : 'なんか色々設定したらはじめよやー';
    const buttons: Parameters<typeof makeButtonRow> = [['startWithCpu', this.canStart, isEnded]];
    if (isEnded) {
      buttons.push('withPlayer', 'finish');
    }
    const components = [
      makeSelectMenuRow('strengthSelect', this.cpuStrength),
      makeSelectMenuRow('selectParentTurn', this.parentIsFirst),
      makeSelectMenuRow('selectParentMark', this.parentMark),
      makeButtonRow(...buttons),
    ];
    return { content, components };
  }

  private get canStart() {
    const commonCondition = this.parentIsFirst !== null && this.parentMark !== null;
    if (this.gameMode === 'player') {
      return commonCondition;
    }
    return commonCondition && this.cpuStrength !== null;
  }

  public startWithCpu() {
    this.area = [...defaultArea];
    if (!this.parentIsFirst) {
      this.putByCpu();
    }
    this.turnPlayerId = this.parent.id;
    return this.buildCpuGameInfoMessage();
  }

  private putByCpu() {
    const cpuTurn = this.parentIsFirst ? 2 : 1;
    if (Math.random() > properGridRatio[this.cpuStrength!]) {
      const girdsWithIndex = this.area.map((grid, i) => ({ grid, i }));
      const validIndexes = girdsWithIndex.filter(({ grid }) => grid === 0).map(({ i }) => i);
      const randomIndex = Math.floor(Math.random() * validIndexes.length);
      this.area[validIndexes[randomIndex]] = cpuTurn;
      return;
    }
    this.area[minMax(this.area).selected] = cpuTurn;
  }

  private buildCpuGameInfoMessage(bingo?: number[]) {
    const ended = bingo !== undefined || !this.hasEmpty;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${this.parent.name}くんの挑戦！`, iconURL: this.parent.iconURL })
      .setTitle(`CPU(${strengthTitle[this.cpuStrength!].title})との対決！`)
      .setDescription(`${this.parent.name}くんのマーク: ${this.parentMark}`)
      .setColor(0x3b93ff)
      .setFooter({ text: ended ? 'おぉっと！？決着だぁ！' : '一体どっちが勝つんだー！？' });
    return { embeds: [embed], components: this.buildAreaComponents(bingo) };
  }

  private get firstMark() {
    if (this.parentIsFirst) {
      return this.parentMark!;
    }
    return this.parentMark === ':o:' ? ':x:' : ':o:';
  }

  public putByPlayer(member: MemberInfo, gridIndex: number) {
    if (![this.parent.id, this.opponent?.id ?? ''].includes(member.id)) {
      throw new BotError('部外者は黙ってな');
    }
    if (member.id !== this.turnPlayerId) {
      throw new BotError('おめえの番じゃねえど？');
    }
    if (this.area[gridIndex] !== 0) {
      throw new BotError('上書きやめてー？ダメだからね？');
    }
    this.area[gridIndex] = this.currentTurnGrid;
    const result = this.opponent !== null ? this.toNextOnPlayer() : this.toNextOnCpu();
    return {
      boardUpdate: this.buildGameInfoMessage(result?.bingo),
      gameEnd: result ?? undefined,
    };
  }

  /** このメソッドはthis.opponent !== nullの条件のもと呼ばれるのでthis.opponent!を使っておけ */
  private toNextOnPlayer() {
    const judgement = judge(this.area);
    if (judgement === null && this.hasEmpty) {
      this.turnPlayerId = this.parent.id === this.turnPlayerId ? this.opponent!.id : this.parent.id;
      return null;
    }
    let embed = buildEmbed('引き分け！', '2人ともいい戦いだったぜ！');
    if (judgement !== null) {
      const { winner } = judgement;
      const isWinParent = this.judgeParentWinning(winner);
      const winningPlayer = isWinParent ? this.parent : this.opponent!;
      const losingPlayer = isWinParent ? this.opponent! : this.parent;
      const author = { name: `${winningPlayer.name}くんの勝ち！`, iconURL: winningPlayer.iconURL };
      const description = `${winningPlayer.name}くん、おめでとう！\n${losingPlayer.name}くんもなかなかに健闘してたな。次は勝とうぜ！`;
      embed = buildEmbed(author, description, 'success');
    }
    const components = [makeButtonRow(['onBattleEnd', this.parent.name])];
    const channelMessage = { embeds: [embed], components };
    return { bingo: judgement?.bingo, channelMessage };
  }

  public onBattleFinish(member: MemberInfo) {
    if (member.id !== this.parent.id) {
      throw new BotError('あんたにゃ関係ねーよー？');
    }
    return this.configurationMessage;
  }

  private toNextOnCpu() {
    let judgement = judge(this.area);
    if (judgement === null && this.hasEmpty) {
      this.putByCpu();
      judgement = judge(this.area);
      if (judgement === null && this.hasEmpty) {
        return null;
      }
    }
    return this.cpuFinish(judgement);
  }

  private cpuFinish(judgement: Judgement) {
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
      followUpMessage: this.configurationMessage,
    };
  }

  private get currentTurnGrid() {
    return this.parentIsFirst === (this.turnPlayerId === this.parent.id) ? 1 : 2;
  }

  private get hasEmpty() {
    return this.area.some((grid) => grid === 0);
  }

  private judgeParentWinning(winner: 'first' | 'second') {
    return (
      (winner === 'first' && this.parentIsFirst) || (winner === 'second' && !this.parentIsFirst)
    );
  }
}
