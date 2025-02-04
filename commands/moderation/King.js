const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const activeCuongepUsers = new Map(); // Lưu người bị cưỡng ép và câu yêu cầu

module.exports = {
  data: new SlashCommandBuilder()
    .setName('king')
    .setDescription('Lệnh King với nhiều tính năng')
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

    if (subcommand === 'cuongep') {
      const targetUser = interaction.options.getUser('target');
      const requiredSentence = interaction.options.getString('sentence');

      if (targetUser.bot) {
        return interaction.reply({ content: '🤖 Bạn không thể cưỡng ép bot!', ephemeral: true });
      }

      activeCuongepUsers.set(targetUser.id, requiredSentence);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('👻 Bóng Ma Cưỡng Ép')
        .setDescription(`Mày Đã Bị Ma Thần Cưỡng Ép:\n\n**"${requiredSentence}"**\nNếu không, mọi tin nhắn của mày sẽ bị xóa ngay lập tức!`)
        .setImage('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2RpdmJqNTlhYzlnd2NkdW54bzg1ZmM2Njdia3AyamU2dzRpczR4ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GWfLdlJSv2YcJGSe67/giphy.gif');

      await interaction.reply({ content: `👻 **${targetUser.username}** đã bị cưỡng ép viết đúng câu yêu cầu!`, embeds: [embed] });
    }

    else if (subcommand === 'off') {
      activeCuongepUsers.clear();
      await interaction.reply('✨ Trạng thái bóng ma và cưỡng ép đã được giải trừ!');
    }
  },

  /**
   * Kiểm tra và xóa tin nhắn của người bị cưỡng ép nếu không đúng câu yêu cầu
   */
  checkCuongep(message) {
    const requiredSentence = activeCuongepUsers.get(message.author.id);
    if (requiredSentence) {
      if (message.content !== requiredSentence) {
        message.delete()
          .then(() => {
            message.channel.send(`🚫 **Warning⚠️** 👻 Bạn đã không viết đúng câu yêu cầu👑! Hãy tuân thủ: **"${requiredSentence}"**.`)
              .then(msg => setTimeout(() => msg.delete(), 5000)); // Xóa cảnh báo sau 5 giây
          })
          .catch(console.error);
      } else {
        activeCuongepUsers.delete(message.author.id); // Gỡ bỏ trạng thái cưỡng ép khi viết đúng
        message.channel.send(`🎉 **${message.author.username}** đã hoàn thành yêu🔮 cầu bóng ma tạm tha👻!`).then(msg => setTimeout(() => msg.delete(), 5000));
      }
    }
  }
};
