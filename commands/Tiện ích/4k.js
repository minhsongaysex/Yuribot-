const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('4k')
    .setDescription('Tăng cường chất lượng hình ảnh bằng API upscale.')
    .addStringOption(option =>
      option.setName('imageurl')
        .setDescription('Nhập URL của hình ảnh cần tăng cường chất lượng')
        .setRequired(true)
    ),
  async execute(interaction) {
    const imageUrl = interaction.options.getString('imageurl');
    const requestTime = new Date();
    await interaction.deferReply();

    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/upscale?imageUrl=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        return interaction.editReply('❌ Có lỗi khi gọi API upscale.');
      }
      const buffer = await response.buffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'upscaled.png' });

      const embed = new EmbedBuilder()
        .setTitle('Hình ảnh đã được tăng cường chất lượng')
        .setDescription(`Hình ảnh gốc: ${imageUrl}`)
        .setImage('attachment://upscaled.png')
        .addFields(
          { name: '⚠️===Người yêu cầu===⚠️', value: `<@${interaction.user.id}>`, inline: true },
          { name: '🌏===Thời gian yêu cầu===⌚', value: requestTime.toLocaleString(), inline: true }
        )
        .setFooter({ text: `Được tạo bởi ${interaction.user.tag}` })
        .setTimestamp(); // Hiển thị thời gian trả về của lệnh

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error('Lỗi khi gọi API upscale:', error);
      await interaction.editReply('❌ Đã xảy ra lỗi khi xử lý hình ảnh.');
    }
  }
};
