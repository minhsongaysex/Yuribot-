const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ytsearch')
    .setDescription('Tìm kiếm video trên YouTube')
    .addStringOption(option => 
      option.setName('query')
      .setDescription('Nhập từ khóa tìm kiếm')
      .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const apiUrl = `https://subhatde.id.vn/youtube?q=${encodeURIComponent(query)}`;
    
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      
      if (!data.results || data.results.length === 0) {
        return interaction.reply('🔍 Không tìm thấy kết quả nào trên YouTube.');
      }
      
      const video = data.results[0].video;
      const uploader = data.results[0].uploader;
      
      const embed = new EmbedBuilder()
        .setTitle(video.title)
        .setURL(video.url)
        .setThumbnail(video.thumbnail_src)
        .addFields(
          { name: '⏳ Thời lượng', value: video.duration, inline: true },
          { name: '👁️ Lượt xem', value: video.views, inline: true },
          { name: '📅 Ngày đăng', value: video.upload_date, inline: true },
          { name: '📢 Kênh', value: `[${uploader.username}](${uploader.url})`, inline: true }
        )
        .setFooter({ text: 'Dữ liệu từ YouTube API', iconURL: 'https://www.youtube.com/s/desktop/dc07754e/img/favicon.ico' });
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi kết nối với API YouTube. Vui lòng thử lại sau.');
    }
  }
};
