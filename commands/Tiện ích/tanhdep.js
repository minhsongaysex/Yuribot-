const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taoanhdep')
    .setDescription('Tạo ảnh đẹp từ danh sách có sẵn')
    .addIntegerOption(option => 
      option.setName('id')
      .setDescription('ID của ảnh muốn tạo')
      .setRequired(true)
    ),

  async execute(interaction) {
    const id = interaction.options.getInteger('id');
    const listUrl = 'https://subhatde.id.vn/taoanhdep/list';
    const imageUrl = `https://subhatde.id.vn/taoanhdep/generate?id=${id}`;
    
    try {
      const response = await axios.get(listUrl);
      const list = response.data.listAnime;
      
      const selectedImage = list.find(item => item.ID === id);
      if (!selectedImage) {
        return interaction.reply('⚠️ Không tìm thấy ảnh với ID này. Vui lòng thử lại với ID hợp lệ.');
      }
      
      return interaction.reply(`🖼️ Ảnh của bạn: **${selectedImage.name}**\n📺 Thuộc phim: ${selectedImage.movie}\n🎨 Màu nền: ${selectedImage.colorBg}\n🔗 [Xem ảnh](${imageUrl})`);
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi tạo ảnh. Vui lòng thử lại sau.');
    }
  }
};
