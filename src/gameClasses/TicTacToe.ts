import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { chunk, MemberInfo, withIndex } from '@/lib/utils';
import { ButtonInfoArg, makeButtonRow } from '@/components/buttons';
import { BotError } from '@/BotError';

type Message = {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
};

type Grid = 0 | 1 | 2; // 0: まだ置かれてない, 1: 先手, 2: 後手
export type Area = [Grid, Grid, Grid, Grid, Grid, Grid, Grid, Grid, Grid];
const defaultArea: Area = [0, 0, 0, 0, 0, 0, 0, 0, 0];
export type Mark = ':o:' | ':x:';

export abstract class TicTacToe {
  protected parent: MemberInfo;
  protected parentIsFirst: boolean | null = null;
  protected parentMark: Mark | null = null;
  protected area: Area = [...defaultArea];

  constructor(parent: MemberInfo, preInstance?: TicTacToe) {
    this.parent = parent;
    if (preInstance !== undefined) {
      this.parentIsFirst = preInstance.parentIsFirst;
      this.parentMark = preInstance.parentMark;
    }
  }

  protected resetArea() {
    this.area = [...defaultArea];
  }

  public abstract get configMessage(): Message;
  public abstract startBattle(): Message;
  public abstract buildInfoMessage(bingo?: number[]): Message;
  protected abstract get canStart(): boolean;
  protected abstract toNext(): { bingo?: number[]; channelMessage: Message } | null;

  public get alreadyInGameMessage() {
    return `このチャンネルでは既に${this.parent.name}くんが\`/marubatsu\`しちゃってるね\n終わるのを待つか、他のチャンネルで\`/marubatsu\`してみてねー`;
  }

  protected buildAreaComponents(bingo?: number[]) {
    return chunk(withIndex(this.area), 3).map((row) =>
      makeButtonRow(
        ...row.map<ButtonInfoArg>(({ i }) => ['grid', this.area, i, this.firstMark, bingo]),
      ),
    );
  }

  private get firstMark() {
    if (this.parentIsFirst) {
      return this.parentMark!;
    }
    return this.parentMark === ':o:' ? ':x:' : ':o:';
  }

  public putByPlayer(member: MemberInfo, gridIndex: number) {
    if (this.area[gridIndex] !== 0) {
      throw new BotError('上書きやめてー？ダメだからね？');
    }
    this.area[gridIndex] = this.currentTurnGrid;
    return this.toNext();
  }

  protected abstract get currentTurnGrid(): Grid;

  public setParentIsFirst(parentTurn: 'first' | 'second') {
    this.parentIsFirst = parentTurn === 'first';
  }

  public setParentMark(mark: Mark) {
    this.parentMark = mark;
  }

  protected get hasEmpty() {
    return this.area.some((grid) => grid === 0);
  }

  protected judgeParentWinning(winner: 'first' | 'second') {
    return (
      (winner === 'first' && this.parentIsFirst) || (winner === 'second' && !this.parentIsFirst)
    );
  }

  public isParent(member: MemberInfo) {
    return this.parent.id === member.id;
  }
}
