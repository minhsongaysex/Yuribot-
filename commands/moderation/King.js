const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const activeCuongepUsers = new Map();
const activeDeobamUsers = new Set();
const originalNicknames = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('king')
    .setDescription('Lệnh King với nhiều tính năng mạnh mẽ')
    .addSubcommand(subcommand =>
      subcommand
        .setName('phanquyet')
        .setDescription('Phán quyết một thành viên có tội hay không với tỷ lệ ngẫu nhiên.')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Người bạn muốn phán quyết')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deobam')
        .setDescription('Gán trạng thái bóng ma cho người dùng được tag')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('Người bạn muốn gán trạng thái bóng ma')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cuongep')
        .setDescription('Cưỡng ép người dùng viết đúng câu bạn yêu cầu.')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('Người bạn muốn cưỡng ép')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('sentence')
            .setDescription('Câu bạn muốn người bị cưỡng ép viết')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('off')
        .setDescription('Gỡ bỏ tất cả trạng thái bóng ma, cưỡng ép và đổi biệt danh')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // 🏆 Xử lý lệnh PHÁN QUYẾT
    if (subcommand === 'phanquyet') {
      const user = interaction.options.getUser('user');

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return interaction.reply({
          content: '❌ Bạn không có quyền phán quyết thành viên!',
          ephemeral: true,
        });
      }

      const member = await interaction.guild.members.fetch(user.id);

      if (!member) {
        return interaction.reply({ content: '❌ Người dùng này không có trong server!', ephemeral: true });
      }

      const randomOutcome = Math.random() < 0.5; // Tỉ lệ 50% kick ngẫu nhiên

      if (randomOutcome) {
        try {
          await member.kick('Bị kick theo phán quyết ngẫu nhiên của King');
          return interaction.reply(`🔨 **${user.tag}** đã bị phán quyết có tội và bị kick khỏi server!`);
        } catch (error) {
          console.error('Lỗi khi kick thành viên:', error);
          return interaction.reply({ content: '❌ Không thể kick thành viên này!', ephemeral: true });
        }
      } else {
        return interaction.reply(`👻 **${user.tag}** vô tội! Bóng ma đã hiểu lầm bạn 🌙`);
      }
    }

    // 👻 Xử lý lệnh ĐEO BÁM
    else if (subcommand === 'deobam') {
      const targetUser = interaction.options.getUser('target');
      activeDeobamUsers.add(targetUser.id);
      await interaction.reply(`👻 **${targetUser.username}** đã bị đeo bám! Không thể gửi tin nhắn cho đến khi bị giải trừ.`);
    }

    // 🚨 Xử lý lệnh CƯỠNG ÉP
    else if (subcommand === 'cuongep') {
      const targetUser = interaction.options.getUser('target');
      const sentence = interaction.options.getString('sentence');
      activeCuongepUsers.set(targetUser.id, sentence);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚨 **Yuri Support!** 🚨')
        .setDescription(`👑 **${targetUser.username}**, bạn đã bị cưỡng ép!  
        🔹 Hãy viết chính xác câu: **"${sentence}"**  
        🔹 Nếu không, mọi tin nhắn của bạn sẽ bị xóa!`)
        .setImage('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2RpdmJqNTlhYzlnd2NkdW54bzg1ZmM2Njdia3AyamU2dzRpczR4ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GWfLdlJSv2YcJGSe67/giphy.gif');

      await interaction.reply({ embeds: [embed] });
    }

    // ❌ Xử lý lệnh OFF
    else if (subcommand === 'off') {
      activeDeobamUsers.clear();
      activeCuongepUsers.clear();
      originalNicknames.clear();
      await interaction.reply('✨ **Tất cả trạng thái đã được giải trừ!**');
    }
  },

  /**
   * Xử lý tin nhắn trong server (deobam và cuongep)
   */
  handleMessage(message) {
    const userId = message.author.id;

    // 👻 Nếu người dùng bị "đeo bám", xóa tin nhắn
    if (activeDeobamUsers.has(userId)) {
      message.delete().catch(console.error);
      return;
    }

    // 🚨 Nếu người dùng bị "cưỡng ép", xóa tin nhắn nếu không đúng câu
    const requiredSentence = activeCuongepUsers.get(userId);
    if (requiredSentence && message.content !== requiredSentence) {
      message.delete().catch(console.error);
    }
  }
};
