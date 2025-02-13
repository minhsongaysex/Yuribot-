const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fbid')
    .setDescription('Lấy ID Facebook từ link.')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Nhập link Facebook.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const fbUrl = interaction.options.getString('url');

    // ✅ Bước 1: Trì hoãn phản hồi để tránh lỗi "Unknown Interaction"
    await interaction.deferReply({ ephemeral: false });

    try {
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/fbuid?url=${encodeURIComponent(fbUrl)}`);
      console.log("API Response:", response.data); // Debug API response

      if (!response.data || !response.data.UID) {
        return interaction.editReply({ content: '❌ Không tìm thấy ID Facebook hoặc API không hỗ trợ link này.' });
      }

      const fbId = response.data.UID;
      const embed = new EmbedBuilder()
        .setColor('#1877F2')
        .setTitle('🔍 Kết quả tìm kiếm Facebook ID')
        .setDescription(`🌐 **Link Facebook**: [Nhấn vào đây](${fbUrl})\n🆔 **Facebook ID**: \`${fbId}\``)
        .setImage('https://i.pinimg.com/originals/66/2d/48/662d48ee68b50e91884d8241450bd232.gif')
        .setFooter({ text: 'Nguồn: Kaiz API' });

      // ✅ Bước 2: Dùng editReply thay vì reply
      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Lỗi API:", error);
      return interaction.editReply({ content: '❌ Đã xảy ra lỗi khi lấy ID Facebook! Vui lòng thử lại sau.' });
    }
  }
};
