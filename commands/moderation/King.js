const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const activeDeobamUsers = new Set(); // Danh sách lưu người dùng bị "deobam"

module.exports = {
  data: new SlashCommandBuilder()
    .setName('king')
    .setDescription('Lệnh King gồm nhiều tính năng mạnh mẽ')
    .addSubcommand(subcommand =>
      subcommand
        .setName('deobam')
        .setDescription('Gán trạng thái bóng ma cho người dùng được tag')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('Người bạn muốn gán trạng thái bóng ma')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('off')
        .setDescription('Gỡ bỏ trạng thái bóng ma cho tất cả người dùng')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Xử lý lệnh deobam
    if (subcommand === 'deobam') {
      const targetUser = interaction.options.getUser('target');
      if (targetUser.bot) return interaction.reply({ content: '🤖 Bạn không thể gán trạng thái bóng ma cho bot!', ephemeral: true });

      // Thêm người dùng vào danh sách bị deobam
      activeDeobamUsers.add(targetUser.id);
      await interaction.reply(`👻 **${targetUser.username}** đã bị bóng ma đeo bám và không thể gửi tin nhắn! Hãy van xin chủ nhân dùng lệnh \`/king off\` để giải trừ 👻🌑⛏️ **DEO BAM KING👑**`);
    }

    // Xử lý lệnh off
    else if (subcommand === 'off') {
      activeDeobamUsers.clear(); // Gỡ bỏ trạng thái của tất cả người dùng
      await interaction.reply('✨ Tất cả trạng thái bóng ma đã được giải trừ. Người dùng có thể hoạt động lại bình thường!');
    }
  },

  /**
   * Kiểm tra và xóa tin nhắn của người bị deobam
   * Hàm này sẽ được gọi từ file event của bot (messageCreate)
   */
  checkDeobam(message) {
    if (activeDeobamUsers.has(message.author.id)) {
      message.delete()
        .then(() => {
          message.channel.send(`🚫 **Warning⚠️** 😇Mày Đã Bị Bóng Ma Đeo Bám Hãy Van Xin Chủ Nhân dùng lệnh /king off Để Giải trừ👻🌑⛏️: **DEO BAM KING👑**.`)
            .then(msg => setTimeout(() => msg.delete(), 5000)); // Xóa cảnh báo sau 5 giây
        })
        .catch(console.error);
    }
  }
};
