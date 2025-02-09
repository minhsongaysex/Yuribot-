const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime-info')
    .setDescription('Hiển thị thông tin anime mùa hè 2008, lịch phát sóng Chủ nhật và top anime.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Chọn mùa anime, lịch phát sóng, hoặc top anime (season, schedule, top)')
        .setRequired(true)
        .addChoices(
          { name: 'Anime Mùa Hè 2008', value: 'season' },
          { name: 'Lịch phát sóng Chủ Nhật', value: 'schedule' },
          { name: 'Top Anime', value: 'top' }
        )
    ),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    let apiUrl;
    let embed;

    try {
      if (type === 'season') {
        apiUrl = 'https://api.jikan.moe/v4/seasons/2008/summer?sfw';
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || !data.data || data.data.length === 0) {
          return interaction.reply({ content: "Không tìm thấy thông tin anime cho mùa hè năm 2008.", ephemeral: true });
        }

        const anime = data.data[0];
        embed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle(anime.title)
          .setURL(anime.url)
          .setDescription(anime.synopsis || "Không có mô tả.")
          .setThumbnail(anime.images.jpg.image_url)
          .addFields(
            { name: 'Loại', value: anime.type || 'Không rõ', inline: true },
            { name: 'Số tập', value: `${anime.episodes || 'Không rõ'}`, inline: true },
            { name: 'Điểm số', value: `${anime.score || 'Không có'}`, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Nguồn: Jikan API' });

      } else if (type === 'schedule') {
        apiUrl = 'https://api.jikan.moe/v4/schedules/sunday?sfw';
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || !data.data || data.data.length === 0) {
          return interaction.reply({ content: "Không tìm thấy lịch phát sóng anime cho Chủ nhật.", ephemeral: true });
        }

        const animeList = data.data.slice(0, 5).map(anime => `- [${anime.title}](${anime.url}) (${anime.airing_start ? anime.airing_start.slice(0, 10) : 'Không rõ'})`).join('\n');
        embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('Lịch phát sóng anime vào Chủ nhật')
          .setDescription(animeList)
          .setTimestamp()
          .setFooter({ text: 'Nguồn: Jikan API' });

      } else if (type === 'top') {
        apiUrl = 'https://api.jikan.moe/v4/top/anime?sfw';
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || !data.data || data.data.length === 0) {
          return interaction.reply({ content: "Không tìm thấy thông tin top anime.", ephemeral: true });
        }

        const topAnimeList = data.data.slice(0, 5).map((anime, index) => `**${index + 1}. [${anime.title}](${anime.url})** - Điểm số: ${anime.score || 'Không có'}`).join('\n');
        embed = new EmbedBuilder()
          .setColor('Purple')
          .setTitle('Top 5 Anime')
          .setDescription(topAnimeList)
          .setTimestamp()
          .setFooter({ text: 'Nguồn: Jikan API' });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      await interaction.reply({ content: "Đã xảy ra lỗi khi lấy thông tin anime. Vui lòng thử lại sau.", ephemeral: true });
    }
  },
};
