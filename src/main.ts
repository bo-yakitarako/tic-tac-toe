import { Client, GatewayIntentBits, Events, REST, Routes, MessageFlags } from 'discord.js';
import { commands, slashCommandsInteraction } from '@/components/slashCommands';
import { buttonInteraction } from '@/components/buttons';
import { selectMenuInteraction } from '@/components/selectMenu';
import { BotError } from '@/BotError';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const TOKEN = process.env.TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const GUILD_ID = process.env.GUILD_ID ?? null;

let isReady = false;

// ホットリロード時の重複リスナー登録を防ぐ
if (process.env.NODE_ENV === 'development') {
  client.removeAllListeners(Events.InteractionCreate);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!isReady) return;

  try {
    if (interaction.isChatInputCommand()) {
      await slashCommandsInteraction(interaction);
    }
    if (interaction.isButton()) {
      await buttonInteraction(interaction);
    }
    if (interaction.isStringSelectMenu()) {
      await selectMenuInteraction(interaction);
    }
  } catch (error) {
    if (error instanceof BotError && interaction.isRepliable()) {
      await interaction.reply({ content: error.message, flags: MessageFlags.Ephemeral });
    }
  }
});

client.once(Events.ClientReady, async () => {
  console.log('バカにしやがってると負けんぞ');

  const rest = new REST().setToken(TOKEN);
  try {
    if (GUILD_ID !== null) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
    }
  } catch (error) {
    console.error(error);
  }

  isReady = true;
});

void client.login(TOKEN);
