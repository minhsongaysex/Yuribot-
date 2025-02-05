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
        .setName('banhtruong')
        .setDescription('Đổi biệt danh toàn bộ thành viên trong server')
        .addStringOption(option =>
          option.setName('nickname')
            .setDescription('Biệt danh bạn muốn đặt cho mọi người')
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

    // 🏆 Xử lý lệnh BANH TRƯỜNG (đổi biệt danh toàn server)
    if (subcommand === 'banhtruong') {
      const guild = interaction.guild;
      const newNickname = interaction.options.getString('nickname');
      const executorId = interaction.user.id;
      let successCount = 0;

      if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return interaction.reply({
          content: '❌ Bot không có quyền đổi biệt danh! Vui lòng cấp quyền "Manage Nicknames".',
          ephemeral: true
        });
      }

      try {
        const members = await guild.members.fetch();
        const updatePromises = members.map(async (member) => {
          if (!member.user.bot && member.id !== executorId && member.manageable) {
            originalNicknames.set(member.id, member.nickname || member.user.username);
            await member.setNickname(newNickname);
            successCount++;
          }
        });

        await Promise.all(updatePromises);

        const embed = new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('🎭 **Bóng Ma Thức Dậy!** 🌙')
          .setDescription(`👑 Đã đổi biệt danh cho **${successCount}** thành viên thành **"${newNickname}"**.`)
          .setImage('https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeG1maWJ4djRucm96bWp4amlwajhnYnA3bGl5MW9nemIxbjNwZjJjMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/v7OFL1RGk1m4qTNsb2/giphy.gif');

        await interaction.reply({ embeds: [embed] });

        // ⏳ Tự động đặt lại biệt danh sau 5 phút
        setTimeout(async () => {
          let resetCount = 0;
          const resetPromises = Array.from(originalNicknames).map(async ([memberId, oldNickname]) => {
            try {
              const member = await guild.members.fetch(memberId);
              if (member.manageable) {
                await member.setNickname(oldNickname);
                resetCount++;
              }
            } catch (error) {
              console.error(`Không thể đặt lại biệt danh cho ${memberId}:`, error);
            }
          });

          await Promise.all(resetPromises);
          originalNicknames.clear();

          await interaction.followUp(`🔄 **Đã đặt lại biệt danh cũ cho ${resetCount} thành viên!**`);
        }, 300000); // 300000ms = 5 phút
      } catch (error) {
        console.error('Lỗi khi đổi biệt danh:', error);
        await interaction.reply({ content: '❌ Đã xảy ra lỗi khi đổi biệt danh. Vui lòng kiểm tra bot hoặc thử lại.', ephemeral: true });
      }
    }

    // 👻 Xử lý lệnh ĐEO BÁM (cấm nhắn tin)
    else if (subcommand === 'deobam') {
      const targetUser = interaction.options.getUser('target');
      activeDeobamUsers.add(targetUser.id);
      await interaction.reply(`👻 **${targetUser.username}** đã bị đeo bám! Không thể gửi tin nhắn cho đến khi bị giải trừ.`);
    }

    // 🚨 Xử lý lệnh CƯỠNG ÉP (bắt buộc người chơi viết đúng câu)
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

    // ❌ Xử lý lệnh OFF (xóa toàn bộ hiệu ứng)
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
