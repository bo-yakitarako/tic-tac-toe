import {
  ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
  RepliableInteraction,
  TextChannel,
} from 'discord.js';
import { makeSelectMenuRow, strengthTitle } from '@/components/selectMenu';
import { makeButtonRow } from '@/components/buttons';
import { buildEmbed, chunk, memberInfo, withIndex } from '@/lib/utils';
import { minMax } from '@/lib/minMax';
import { judge } from '@/lib/judgement';

const channels: { [channelId in string]: TicTacToe } = {};
export const game = {
  get({ channelId }: RepliableInteraction) {
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
    channels[channelId] = new TicTacToe(interaction);
    return channels[channelId];
  },
  remove({ channelId }: RepliableInteraction) {
    if (channelId === null) {
      return;
    }
    delete channels[channelId];
  },
};

const flags = MessageFlags.Ephemeral;

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

type Player = {
  id: string;
  name: string;
  iconURL: string;
};
type Judgement = ReturnType<typeof judge>;

export class TicTacToe {
  private parent: Player;
  private channel: TextChannel;
  private gameMode: 'player' | 'cpu' = 'player';
  private cpuStrength: Strength | null = null;
  private parentIsFirst: boolean | null = null;
  private parentMark: Mark | null = null;
  private area: Area = [...defaultArea];
  private opponent: Player | null = null;
  private turnPlayerId = '';

  constructor(interaction: RepliableInteraction) {
    this.parent = { id: interaction.user.id, ...memberInfo(interaction) };
    this.channel = interaction.channel as TextChannel;
  }

  public async noticeAlreadyInGame(interaction: RepliableInteraction) {
    const content = `このチャンネルでは既に${this.parent.name}くんが\`/marubatsu\`しちゃってるね\n終わるのを待つか、他のチャンネルで\`/marubatsu\`してみてねー`;
    await interaction.reply({ content, flags });
  }

  public async callOnEveryoneToJoin(interaction: ButtonInteraction) {
    this.opponent = null;
    this.gameMode = 'player';
    this.area = [...defaultArea];
    await interaction.update(this.configurationMessage);
    const content = `@here ${this.parent.name}のヤツが対戦相手を募集してんぞ！誰か来てくれー！`;
    await this.channel.send({ content, components: [makeButtonRow(['join', this.parent.name])] });
  }

  public get configurationMessage() {
    return this.gameMode === 'player'
      ? this.buildPlayerConfigurationMessage()
      : this.buildCpuConfigurationMessage();
  }

  private buildPlayerConfigurationMessage() {
    const isEnded = this.area.some((grid) => grid !== 0);
    let content = '対戦相手を募集すんぞぉ！おめえさんの番は何がいいか決めておこうな';
    const buttons: Parameters<typeof makeButtonRow> = [['startBattle', this.canStart, isEnded]];
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

  public async join(interaction: ButtonInteraction) {
    if (interaction.user.id === this.parent.id) {
      await interaction.reply({ content: '己との闘いってか？意味分かんないね', flags });
      return;
    }
    if (this.opponent !== null) {
      const content = `先に${this.opponent.name}くんがおるんだよなあ...`;
      await interaction.reply({ content, flags });
      return;
    }
    this.opponent = { id: interaction.user.id, ...memberInfo(interaction) };
    await interaction.update({ content: `${this.opponent.name}が参戦！`, components: [] });
  }

  public async startBattle(interaction: ButtonInteraction) {
    if (this.opponent === null) {
      await interaction.reply({ content: 'ぼっち乙～ｗｗｗ', flags });
      return;
    }
    this.area = [...defaultArea];
    await interaction.deferUpdate();
    await interaction.deleteReply();
    this.turnPlayerId = this.parentIsFirst ? this.parent.id : this.opponent.id;
    await this.channel.send(this.buildPlayerGameInfoMessage());
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
    type Param = Parameters<typeof makeButtonRow>[0];
    return chunk(withIndex(this.area), 3).map((row) =>
      makeButtonRow(...row.map<Param>(({ i }) => ['grid', this.area, i, this.firstMark, bingo])),
    );
  }

  public async configureCpu(interaction: ButtonInteraction) {
    this.opponent = null;
    this.gameMode = 'cpu';
    this.area = [...defaultArea];
    await interaction.update(this.configurationMessage);
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

  public async startWithCpu(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
    this.area = [...defaultArea];
    if (!this.parentIsFirst) {
      this.putByCpu();
    }
    this.turnPlayerId = this.parent.id;
    await this.channel.send(this.buildCpuGameInfoMessage());
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
    if (this.opponent !== null) {
      await this.toNextOnPlayer(interaction, judgement);
    } else {
      await this.toNextOnCpu(interaction, judgement);
    }
  }

  /** このメソッドはthis.opponent !== nullの条件のもと呼ばれるのでthis.opponent!を使っておけ */
  private async toNextOnPlayer(interaction: ButtonInteraction, judgement: Judgement) {
    if (judgement === null && this.hasEmpty) {
      this.turnPlayerId = this.parent.id === this.turnPlayerId ? this.opponent!.id : this.parent.id;
      await interaction.update(this.buildPlayerGameInfoMessage());
      return;
    }
    await interaction.update(this.buildPlayerGameInfoMessage(judgement?.bingo));
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
    await this.channel.send({ embeds: [embed], components });
  }

  public async onBattleFinish(interaction: ButtonInteraction) {
    if (interaction.user.id !== this.parent.id) {
      await interaction.reply({ content: 'あんたにゃ関係ねーよー？', flags });
      return;
    }
    await interaction.reply({ ...this.configurationMessage, flags });
    await interaction.message.edit({ embeds: interaction.message.embeds, components: [] });
  }

  private async toNextOnCpu(interaction: ButtonInteraction, judgement: Judgement) {
    if (judgement === null && this.hasEmpty) {
      this.putByCpu();
      const nextJudgement = judge(this.area);
      if (nextJudgement === null && this.hasEmpty) {
        await interaction.update(this.buildCpuGameInfoMessage());
      } else {
        await this.cpuFinish(interaction, nextJudgement);
      }
      return;
    }
    await this.cpuFinish(interaction, judgement);
  }

  private async cpuFinish(interaction: ButtonInteraction, judgement: Judgement) {
    await interaction.deferUpdate();
    await interaction.message.edit(this.buildCpuGameInfoMessage(judgement?.bingo));
    if (judgement === null) {
      const embed = buildEmbed(
        '引き分け！',
        'なかなかいい戦いだったぜ\nだが、次はこうは行けないぞ？',
      );
      await this.channel.send({ embeds: [embed] });
    } else {
      const { winner } = judgement;
      const isWinParent = this.judgeParentWinning(winner);
      const title = isWinParent ? `${this.parent.name}くんの勝ち！` : 'CPUに敗けちゃったね...';
      const description = isWinParent
        ? 'くっ...なかなかやるじゃねえか...！\n次は敗けねえぞ！'
        : 'うぇ乁( ˙ω˙ )厂ーい\n俺の勝ち～ｗｗｗｗｗｗｗｗｗｗ';
      const embed = buildEmbed(title, description, isWinParent ? 'success' : 'failure');
      await this.channel.send({ embeds: [embed] });
    }
    await interaction.followUp({ ...this.configurationMessage, flags });
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
