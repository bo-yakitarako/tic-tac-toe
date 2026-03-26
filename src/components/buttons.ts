import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';

const registration = {
  test: {
    component: new ButtonBuilder()
      .setCustomId('test')
      .setLabel('テスト')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction) {
      await interaction.deferUpdate();
    },
  },
};

type CustomId = keyof typeof registration;

const button = Object.fromEntries(
  (Object.keys(registration) as CustomId[]).map((id) => [id, registration[id].component] as const),
) as { [key in CustomId]: ButtonBuilder };

export const buttonInteraction = async (interaction: ButtonInteraction) => {
  const customId = interaction.customId;
  await registration[customId as CustomId].execute(interaction);
};

type ButtonKey = keyof typeof button;
export function makeButtonRow(...buttons: ButtonBuilder[]): ActionRowBuilder<ButtonBuilder>;
export function makeButtonRow(...buttonKeys: ButtonKey[]): ActionRowBuilder<ButtonBuilder>;
export function makeButtonRow(...buttonInfos: (ButtonKey | ButtonBuilder)[]) {
  const buttons =
    buttonInfos.length > 0 && typeof buttonInfos[0] === 'string'
      ? buttonInfos.map((key) => button[key as ButtonKey])
      : (buttonInfos as ButtonBuilder[]);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}
