import { EmbedBuilder } from 'discord.js';
import { BotError } from '@/BotError';
import { ButtonInfoArg, makeButtonRow } from '@/components/buttons';
import { makeSelectMenuRow } from '@/components/selectMenu';
import { TicTacToe } from '@/gameClasses/TicTacToe';
import { buildEmbed, MemberInfo } from '@/lib/utils';
import { judge } from '@/lib/judgement';

export class PlayerGame extends TicTacToe {
  private opponent: MemberInfo | null = null;
  private turnPlayerId = '';

  public join(member: MemberInfo) {
    if (member.id === this.parent.id) {
      throw new BotError('己との闘いってか？意味わかんないね');
    }
    if (this.opponent !== null) {
      throw new BotError(`${this.opponent.name}くんがもうおるんだよなあ...`);
    }
    this.opponent = { ...member };
    return `**${this.opponent.name}**くんが参戦！`;
  }

  public get configMessage() {
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

  public startBattle() {
    if (this.opponent === null) {
      throw new BotError('ぼっち乙～ｗｗｗ');
    }
    this.resetArea();
    this.turnPlayerId = this.parentIsFirst ? this.parent.id : this.opponent.id;
    return this.buildInfoMessage();
  }

  public buildInfoMessage(bingo?: number[]) {
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

  protected get canStart() {
    return this.opponent !== null && this.parentIsFirst !== null && this.parentMark !== null;
  }

  public override putByPlayer(member: MemberInfo, gridIndex: number) {
    if (![this.parent.id, this.opponent?.id ?? ''].includes(member.id)) {
      throw new BotError('部外者は黙ってな');
    }
    if (member.id !== this.turnPlayerId) {
      throw new BotError('おめえの番じゃねえど？');
    }
    return super.putByPlayer(member, gridIndex);
  }

  protected toNext() {
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

  protected get currentTurnGrid() {
    return this.parentIsFirst === (this.turnPlayerId === this.parent.id) ? 1 : 2;
  }
}
