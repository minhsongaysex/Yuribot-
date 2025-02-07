const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doctruyen')
    .setDescription('Đọc truyện từ NetTruyen')
    .addStringOption(option => 
      option.setName('url')
      .setDescription('URL của truyện trên NetTruyen')
      .setRequired(true)
    )
    .addIntegerOption(option => 
      option.setName('page')
      .setDescription('Trang truyện muốn đọc')
      .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');
    const page = interaction.options.getInteger('page');
    const apiUrl = `https://subhatde.id.vn/api/doctruyen?url=${encodeURIComponent(url)}&page=${page}`;
    
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      
      if (!data || !data.images || data.images.length === 0) {
        return interaction.reply('⚠️ Không tìm thấy trang truyện hoặc lỗi khi tải dữ liệu.');
      }
      
      const imageLinks = data.images.map((img, index) => `${index + 1}. [Trang ${index + 1}](${img})`).join('\n');
      return interaction.reply(`📖 **${data.title}** - Trang ${page}\n${imageLinks}`);
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi lấy dữ liệu truyện. Vui lòng thử lại sau.');
    }
  }
};
