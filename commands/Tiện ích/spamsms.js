const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spamsms')
    .setDescription('Gửi tin nhắn spam đến số điện thoại.')
    .addStringOption(option =>
      option.setName('phone')
        .setDescription('Nhập số điện thoại')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Số lần gửi tin nhắn (tối đa 100)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('interval')
        .setDescription('Khoảng thời gian giữa các tin nhắn (ms)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const phone = interaction.options.getString('phone');
    let count = interaction.options.getInteger('count');
    let interval = interaction.options.getInteger('interval');

    // ✅ Giới hạn hợp lý
    if (count > 100) count = 100;
    if (interval < 500) interval = 500; // Ít nhất 500ms để tránh quá tải

    const apiUrl = `https://kaiz-apis.gleeze.com/api/spamsms?phone=${phone}&count=${count}&interval=${interval}`;

    await interaction.deferReply();

    try {
      const response = await axios.get(apiUrl);
      console.log(response.data);

      if (response.data.error) {
        return interaction.editReply(`❌ Lỗi: ${response.data.error}`);
      }

      return interaction.editReply(`✅ Đã gửi **${count} tin nhắn** đến **${phone}** với khoảng cách **${interval}ms**.`);
      
    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Có lỗi xảy ra khi gửi tin nhắn! Vui lòng thử lại sau.');
    }
  }
};
