const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const activeDeobamUsers = new Set(); // Danh sách người bị bóng ma đeo bám
const activeCuongepUsers = new Map(); // Danh sách người bị cưỡng ép và câu yêu cầu

module.exports = {
  data: new SlashCommandBuilder()
    .setName('king')
    .setDescription('Lệnh King với nhiều tính năng mạnh mẽ')
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
        .setDescription('Gỡ bỏ trạng thái bóng ma hoặc cưỡng ép cho tất cả người dùng')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'deobam') {
      const targetUser = interaction.options.getUser('target');
      if (targetUser.bot) {
        return interaction.reply({ content: '🤖 Bạn không thể gán trạng thái bóng ma cho bot!', ephemeral: true });
      }

      activeDeobamUsers.add(targetUser.id);

      await interaction.reply(`👻 **${targetUser.username}** đã bị bóng ma đeo bám và không thể gửi tin nhắn! Hãy van xin chủ nhân dùng lệnh \`/king off\` để giải trừ 👻🌑⛏️ **DEO BAM KING👑**`);
    }

    else if (subcommand === 'cuongep') {
      const targetUser = interaction.options.getUser('target');
      const requiredSentence = interaction.options.getString('sentence');

      if (targetUser.bot) {
        return interaction.reply({ content: '🤖 Bạn không thể cưỡng ép bot!', ephemeral: true });
      }

      activeCuongepUsers.set(targetUser.id, requiredSentence);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('👻 Bóng Ma Cưỡng Ép')
        .setDescription(`『Mày đã bị bóng ma cưỡng ép phải viết đúng câu sau:\n\n**"${requiredSentence}"**\nNếu không, mọi tin nhắn của mày sẽ bị xóa🗑️ ngay lập tức』!`)
        .setImage('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2RpdmJqNTlhYzlnd2NkdW54bzg1ZmM2Njdia3AyamU2dzRpczR4ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GWfLdlJSv2YcJGSe67/giphy.gif');

      await interaction.reply({ content: `👻 **${targetUser.username}** đã bị cưỡng ép viết đúng câu yêu cầu!`, embeds: [embed] });
    }

    else if (subcommand === 'off') {
      activeDeobamUsers.clear();
      activeCuongepUsers.clear();
      await interaction.reply('✨ Trạng thái bóng ma và cưỡng ép đã được giải trừ mau cảm ơn 『https://www.facebook.com/lms.cutii』!');
    }
  },

  /**
   * Kiểm tra và xử lý tin nhắn cho cả deobam và cuongep
   */
  handleMessage(message) {
    const userId = message.author.id;

    // Xử lý cho deobam
    if (activeDeobamUsers.has(userId)) {
      message.delete()
        .then(() => {
          message.channel.send(`«👻 **${message.author.username}** đã bị bóng ma đeo bám và không thể gửi tin nhắn! Hãy van xin chủ nhân dùng lệnh \`/king off\` để giải trừ 👻🌑⛏️ **DEO BAM KING👑**».`)
            .then(msg => setTimeout(() => msg.delete(), 5000));
        })
        .catch(console.error);
      return;
    }

    // Xử lý cho cuongep
    const requiredSentence = activeCuongepUsers.get(userId);
    if (requiredSentence) {
      if (message.content !== requiredSentence) {
        message.delete()
          .then(() => {
            message.channel.send(`『🚫 **Warning⚠️** 😇 Bóng ma cảnh cáo ghi hẳn hoi👻! Hãy tuân thủ』: **"${requiredSentence}"**.`)
              .then(msg => setTimeout(() => msg.delete(), 5000));
          })
          .catch(console.error);
      } else {
        activeCuongepUsers.delete(userId);
        message.channel.send(`🎉 **${message.author.username}** đã hoàn thành yêu cầu✅ bóng ma đã rời đi👻』!`).then(msg => setTimeout(() => msg.delete(), 5000));
      }
    }
  }
};
