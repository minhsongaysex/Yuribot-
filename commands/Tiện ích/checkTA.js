const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exchange-rate')
    .setDescription('Kiểm tra giá Bitcoin hoặc Ethereum bằng tiền Việt Nam.')
    .addStringOption(option =>
      option.setName('currency')
        .setDescription('Nhập loại tiền điện tử bạn muốn kiểm tra (bitcoin hoặc ethereum)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const currency = interaction.options.getString('currency').toLowerCase();

    if (!['bitcoin', 'ethereum'].includes(currency)) {
      return interaction.reply({ content: 'Vui lòng chỉ nhập bitcoin hoặc ethereum.', ephemeral: true });
    }

    try {
      const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=vnd`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data[currency] || !data[currency].vnd) {
        return interaction.reply({ content: "Không tìm thấy dữ liệu cho loại tiền này.", ephemeral: true });
      }

      const priceInVND = data[currency].vnd.toLocaleString('vi-VN');

      const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle(`Tỉ giá của ${currency.charAt(0).toUpperCase() + currency.slice(1)}`)
        .setDescription(`💰 Giá trị hiện tại: **${priceInVND} VND**`)
        .setTimestamp()
        .setFooter({ text: 'Nguồn: CoinGecko API' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      await interaction.reply({ content: "Đã xảy ra lỗi khi lấy thông tin tỉ giá. Vui lòng thử lại sau.", ephemeral: true });
    }
  },
};
