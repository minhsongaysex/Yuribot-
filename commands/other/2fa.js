const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('get2fa')
    .setDescription('Lấy mã 2FA cho bạn')
    .addStringOption(option => 
      option.setName('code')
        .setDescription('Nhập mã 2FA cần lấy')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');
    try {
      const res = await axios.get(`https://2fa.live/tok/${code}`);
      const codee = res.data.token;
      return interaction.reply(`===⚡️ Mã xác thực 2 yếu tố của bạn là: **${codee}**===`);
    } catch (error) {
      return interaction.reply('===❌ Đã xảy ra lỗi khi lấy mã 2FA. Vui lòng kiểm tra lại mã của bạn!===');
    }
  }
};

