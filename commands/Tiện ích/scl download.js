const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundcloud')
    .setDescription('Tìm kiếm bài hát trên SoundCloud')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nhập tên bài hát bạn muốn tìm')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const apiUrl = `https://api.zetsu.xyz/api/scsearch?q=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      if (!response.data || !response.data.result || response.data.result.length === 0) {
        return interaction.editReply('🚫 Không tìm thấy bài hát nào!');
      }

      // Lấy danh sách bài hát từ API
      const songs = response.data.result.slice(0, 5); // Lấy tối đa 5 kết quả

      // Tạo Embed
      const embed = new EmbedBuilder()
        .setColor('#ff5500')
        .setTitle(`🔎 Kết quả tìm kiếm: "${query}"`)
        .setDescription(songs.map((song, index) => `**${index + 1}.** [${song.title}](${song.link})`).join('\n'))
        .setFooter({ text: '🎵 Chọn một link để nghe ngay!' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      interaction.editReply('❌ Có lỗi xảy ra khi tìm kiếm bài hát!');
    }
  }
};
