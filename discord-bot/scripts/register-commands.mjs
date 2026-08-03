import { readFile } from "node:fs/promises";

const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const token = process.env.DISCORD_BOT_TOKEN;
if (!applicationId || !guildId || !token) {
  throw new Error(
    "DISCORD_APPLICATION_ID, DISCORD_GUILD_ID and DISCORD_BOT_TOKEN are required",
  );
}
const commands = JSON.parse(
  await readFile(new URL("../commands.json", import.meta.url), "utf8"),
);
const response = await fetch(
  `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  },
);
if (!response.ok)
  throw new Error(
    `Discord command registration failed: ${response.status} ${await response.text()}`,
  );
console.log(`Registered ${commands.length} guild command(s).`);
