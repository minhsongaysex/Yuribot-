const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('node-persist');

// Khởi tạo lưu trữ dữ liệu cho Kingdom
(async () => {
  await storage.init({ dir: './kingdomData' });
})();

const LEVEL_REQUIREMENTS = {
  2: 1000,
  3: 10000
};

const KINGDOM_IMAGES = {
  1: 'https://i.imgur.com/lv1.png', // Hình LV1
  2: 'https://i.imgur.com/lv2.png', // Hình LV2
  3: 'https://i.imgur.com/lv3.png'  // Hình LV3 (Kịch)
};

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

    // 🌑 Xử lý đóng góp Soul cho Kingdom
    if (subcommand === 'darkkingdom') {
      const userId = interaction.user.id;
      const contributeSouls = interaction.options.getInteger('contribute');

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
        levelUpMessage = `🎉 Vương quốc đã được nâng cấp lên cấp **${kingdomData.level}**!`;

        if (kingdomData.level === 3) {
          levelUpMessage += '\n💀 **Dark Kingdom đã đạt cấp Kịch!**';
        }
      }

      // Lưu dữ liệu
      await storage.setItem('kingdomData', kingdomData);

      // Tạo Embed trả về
      const embed = new EmbedBuilder()
        .setColor(0x5d3fd3)
        .setTitle('⚔️ **Dark Kingdom Status** ⚔️')
        .setDescription(`🔮 Vương quốc hiện đang ở cấp **${kingdomData.level}**`)
        .addFields(
          { name: '✨ Tổng số Soul:', value: `${kingdomData.totalSouls} Soul`, inline: true },
          { name: '🔑 Đóng góp của bạn:', value: `${kingdomData.contributors[userId]} Soul`, inline: true }
        )
        .setImage(KINGDOM_IMAGES[kingdomData.level])
        .setFooter({ text: levelUpMessage ? levelUpMessage : 'Tiếp tục đóng góp để nâng cấp vương quốc!' });

      await interaction.reply({ embeds: [embed] });
    }

    // 🏰 Xử lý kiểm tra trạng thái vương quốc
    else if (subcommand === 'kingdomstatus') {
      let kingdomData = (await storage.getItem('kingdomData')) || {
        level: 1,
        totalSouls: 0,
        contributors: {}
      };

      const embed = new EmbedBuilder()
        .setColor(0x5d3fd3)
        .setTitle('⚔️ **Dark Kingdom Status** ⚔️')
        .setDescription(`🔮 Vương quốc hiện đang ở cấp **${kingdomData.level}**`)
        .addFields(
          { name: '✨ Tổng số Soul:', value: `${kingdomData.totalSouls} Soul`, inline: true },
          { name: '🛡️ Thành viên đóng góp:', value: formatContributors(kingdomData.contributors), inline: false }
        )
        .setImage(KINGDOM_IMAGES[kingdomData.level])
        .setFooter({ text: 'Hãy tiếp tục xây dựng vương quốc!' });

      await interaction.reply({ embeds: [embed] });
    }
  }
};

/**
 * Hàm format danh sách đóng góp của thành viên
 */
function formatContributors(contributors) {
  if (Object.keys(contributors).length === 0) return 'Chưa có đóng góp nào.';
  return Object.entries(contributors)
    .map(([userId, souls]) => `<@${userId}>: ${souls} Soul`)
    .join('\n');
}
