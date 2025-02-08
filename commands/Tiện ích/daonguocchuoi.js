const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daonguoc')
    .setDescription('Đảo ngược một chuỗi ký tự')
    .addStringOption(option => 
      option.setName('chuoi')
      .setDescription('Chuỗi cần đảo ngược')
      .setRequired(true)
    ),

  async execute(interaction) {
    const chuoi = interaction.options.getString('chuoi');
    const apiUrl = `https://huu-tri-api.onrender.com/daonguoc?chuoi=${encodeURIComponent(chuoi)}`;
    
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      
      if (data.status !== 200) {
        return interaction.reply('⚠️ Lỗi khi xử lý chuỗi. Vui lòng thử lại.');
      }
      
      return interaction.reply(`🔄 Chuỗi gốc: **${data.original}**\n🔁 Chuỗi đảo ngược: **${data.reversed}**`);
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi kết nối với API. Vui lòng thử lại sau.');
    }
  }
};
