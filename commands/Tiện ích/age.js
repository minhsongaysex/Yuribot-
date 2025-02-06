const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('age')
    .setDescription('Dự đoán giới tính và độ tuổi dựa trên tên.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Tên bạn muốn kiểm tra')
        .setRequired(true)
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name');

    try {
      const response = await fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
      const data = await response.json();

      if (!data.gender) {
        return interaction.reply({ content: "Không thể dự đoán giới tính cho tên này.", ephemeral: true });
      }

      const genderText = data.gender === 'male' ? 'Nam' : 'Nữ';
      const probability = (data.probability * 100).toFixed(2);

      await interaction.reply({
        embeds: [{
          color: 0x1abc9c,
          title: "Dự đoán Giới tính",
          fields: [
            { name: "Tên", value: name, inline: true },
            { name: "Giới tính", value: genderText, inline: true },
            { name: "Độ tin cậy", value: `${probability}%`, inline: true }
          ],
          timestamp: new Date(),
          footer: {
            text: "Nguồn: Genderize API",
          }
        }]
      });
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      interaction.reply({ content: "Đã xảy ra lỗi khi dự đoán giới tính. Vui lòng thử lại sau.", ephemeral: true });
    }
  }
};
