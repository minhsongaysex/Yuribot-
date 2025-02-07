const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('node-persist');
const fs = require('fs');

// Khởi tạo lưu trữ dữ liệu cho Kingdom
(async () => {
  await storage.init({ dir: './kingdomData' });
})();

const LEVEL_REQUIREMENTS = {
  2: 1000,
  3: 10000
};

const KINGDOM_IMAGES = {
  1: 'https://i.imgur.com/weeWvYT.png',
  2: 'https://i.imgur.com/MdgNqz9.png',
  3: 'https://i.imgur.com/V7jD0eS.png'
};

const DATA_FILE = "commands/moderation/data/datauser.json";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kingdom')
    .setDescription('Xây dựng và nâng cấp vương quốc bóng tối!')
    .addSubcommand(subcommand =>
      subcommand
        .setName('darkkingdom')
        .setDescription('Xây dựng hoặc nâng cấp vương quốc.')
        .addIntegerOption(option =>
          option.setName('contribute')
            .setDescription('Số Soul bạn muốn đóng góp')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('kingdomstatus')
        .setDescription('Xem trạng thái hiện tại của vương quốc.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'darkkingdom') {
      const userId = interaction.user.id;
      const contributeSouls = interaction.options.getInteger('contribute');

      // Đọc dữ liệu người dùng
      let userData;
      try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        userData = JSON.parse(data);
      } catch (err) {
        console.error("Lỗi khi đọc file datauser.json:", err);
        return interaction.reply("Có lỗi xảy ra khi xử lý yêu cầu của bạn.");
      }

      // Kiểm tra số soul
      if (!userData[userId] || userData[userId] < contributeSouls) {
        return interaction.reply("Bạn không đủ Soul để đóng góp.");
      }

      // Trừ soul của người dùng
      userData[userId] -= contributeSouls;

      // Ghi lại dữ liệu người dùng
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
      } catch (err) {
        console.error("Lỗi khi ghi file datauser.json:", err);
        return interaction.reply("Có lỗi xảy ra khi xử lý yêu cầu của bạn.");
      }

      let kingdomData = (await storage.getItem('kingdomData')) || {
        level: 1,
        totalSouls: 0,
        contributors: {}
      };

      // Cập nhật đóng góp
      kingdomData.totalSouls += contributeSouls;
      kingdomData.contributors[userId] = (kingdomData.contributors[userId] || 0) + contributeSouls;

      let levelUpMessage = '';
      const currentLevel = kingdomData.level;

      // Kiểm tra và nâng cấp vương quốc
      if (currentLevel < 3 && kingdomData.totalSouls >= LEVEL_REQUIREMENTS[currentLevel + 1]) {
        kingdomData.level++;
        kingdomData.totalSouls -= LEVEL_REQUIREMENTS[currentLevel + 1];
        levelUpMessage = ` Vương quốc đã được nâng cấp lên cấp **${kingdomData.level}**!`;

        if (kingdomData.level === 3) {
          levelUpMessage += '\n **Dark Kingdom đã đạt cấp Kịch!**';
        }
      }

      // Lưu dữ liệu
      await storage.setItem('kingdomData', kingdomData);

      // Tạo Embed
      const embed = new EmbedBuilder()
        .setColor(0x5d3fd3)
        .setTitle('⚔️ **Dark Kingdom Status** ⚔️')
        .setDescription(` Vương quốc hiện đang ở cấp **${kingdomData.level}**`)
        .addFields(
          { name: '✨ Tổng số Soul:', value: `${kingdomData.totalSouls} Soul`, inline: true },
          { name: ' Đóng góp của bạn:', value: `${kingdomData.contributors[userId]} Soul`, inline: true }
        )
        .setImage(KINGDOM_IMAGES[kingdomData.level])
        .setFooter({ text: levelUpMessage || 'Tiếp tục đóng góp để nâng cấp vương quốc!' });

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === 'kingdomstatus') {
      let kingdomData = (await storage.getItem('kingdomData')) || {
        level: 1,
        totalSouls: 0,
        contributors: {}
      };

      const embed = new EmbedBuilder()
        .setColor(0x5d3fd3)
        .setTitle('⚔️ **Dark Kingdom Status** ⚔️')
        .setDescription(` Vương quốc hiện đang ở cấp **${kingdomData.level}**`)
        .addFields(
          { name: '✨ Tổng số Soul:', value: `${kingdomData.totalSouls} Soul`, inline: true },
          { name: '️ Thành viên đóng góp:', value: formatContributors(kingdomData.contributors), inline: false }
        )
        .setImage(KINGDOM_IMAGES[kingdomData.level])
        .setFooter({ text: 'Hãy tiếp tục xây dựng vương quốc!' });

      await interaction.reply({ embeds: [embed] });
    }
  }
};

function formatContributors(contributors) {
  if (Object.keys(contributors).length === 0) return 'Chưa có đóng góp nào.';
  return Object.entries(contributors)
    .map(([userId, souls]) => `<@${userId}>: ${souls} Soul`)
    .join('\n');
}
// npm i node-persist
