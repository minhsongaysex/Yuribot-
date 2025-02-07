const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('thuphap')
    .setDescription('Tạo ảnh thư pháp với nội dung tùy chỉnh')
    .addStringOption(option => 
      option.setName('dong1')
      .setDescription('Nội dung dòng 1')
      .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('dong2')
      .setDescription('Nội dung dòng 2')
      .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('dong3')
      .setDescription('Nội dung dòng 3')
      .setRequired(false)
    ),

  async execute(interaction) {
    const dong1 = interaction.options.getString('dong1');
    const dong2 = interaction.options.getString('dong2') || '';
    const dong3 = interaction.options.getString('dong3') || '';
    const sodong = [dong1, dong2, dong3].filter(d => d).length;
    
    const url = `https://subhatde.id.vn/thuphap?id=1&sodong=${sodong}&dong_1=${encodeURIComponent(dong1)}&dong_2=${encodeURIComponent(dong2)}&dong_3=${encodeURIComponent(dong3)}`;
    
    try {
      return interaction.reply(`🖌️ Đây là ảnh thư pháp của bạn: ${url}`);
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi tạo ảnh thư pháp. Vui lòng thử lại sau.');
    }
  }
};
