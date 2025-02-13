const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Xem thông tin thời tiết hiện tại và dự báo.')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Nhập tên địa điểm (ví dụ: Hanoi, Vietnam)')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const location = interaction.options.getString('location');
    const apiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}`;

    await interaction.deferReply(); // Tránh lỗi timeout

    try {
      const response = await axios.get(apiUrl);
      const weatherData = response.data;

      if (!weatherData || Object.keys(weatherData).length === 0) {
        return interaction.editReply('❌ Không tìm thấy thông tin thời tiết cho địa điểm này.');
      }

      // Chọn địa điểm đầu tiên nếu có nhiều kết quả
      const weather = weatherData[0];
      const current = weather.current;
      const forecast = weather.forecast.slice(0, 3); // Lấy dự báo 3 ngày

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`🌤 Thời tiết tại ${weather.location.name}`)
        .setDescription(`**${current.skytext}** - ${current.temperature}°C`)
        .setThumbnail(current.imageUrl)
        .addFields(
          { name: '📍 Vị trí', value: weather.location.name, inline: true },
          { name: '🌡 Cảm giác như', value: `${current.feelslike}°C`, inline: true },
          { name: '💧 Độ ẩm', value: `${current.humidity}%`, inline: true },
          { name: '💨 Gió', value: current.winddisplay, inline: true },
          { name: '📅 Ngày', value: `${current.day}, ${current.date}`, inline: true }
        );

      // Thêm dự báo thời tiết
      forecast.forEach(day => {
        embed.addFields({
          name: `📆 ${day.day} (${day.date})`,
          value: `🌡 ${day.low}°C - ${day.high}°C\n🌥 ${day.skytextday}\n🌧 Mưa: ${day.precip}%`,
          inline: false
        });
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Lỗi khi lấy dữ liệu thời tiết. Hãy thử lại sau.');
    }
  }
};
