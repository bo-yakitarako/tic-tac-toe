import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { commands, slashCommandsInteraction } from '@/components/slashCommands';
import { buttonInteraction } from '@/components/buttons';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, () => {
  console.log('バカにしやがってると負けんぞ');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await slashCommandsInteraction(interaction);
  }
  if (interaction.isButton()) {
    await buttonInteraction(interaction);
  }
});

const TOKEN = process.env.TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const GUILD_ID = process.env.GUILD_ID ?? null;
const rest = new REST({ version: '10' }).setToken(TOKEN);
void (async () => {
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
})();
void client.login(TOKEN);
