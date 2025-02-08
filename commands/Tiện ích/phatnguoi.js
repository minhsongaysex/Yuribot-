const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('phatnguoi')
    .setDescription('Kiểm tra vi phạm giao thông theo biển số xe')
    .addStringOption(option => 
      option.setName('bienso')
      .setDescription('Nhập biển số xe cần kiểm tra')
      .setRequired(true)
    ),

  async execute(interaction) {
    const bienso = interaction.options.getString('bienso');
    const apiUrl = `https://subhatde.id.vn/checkpn?bienso=${encodeURIComponent(bienso)}`;
    
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      
      if (!data || !data.data || data.data.length === 0) {
        return interaction.reply('🚔 Không tìm thấy thông tin vi phạm cho biển số này.');
      }
      
      const violation = data.data[0];
      const embed = new EmbedBuilder()
        .setTitle(`📋 Thông tin vi phạm: ${bienso}`)
        .addFields(
          { name: '🚗 Loại phương tiện', value: violation.loai_phuong_tien, inline: true },
          { name: '🕒 Thời gian vi phạm', value: violation.thoi_gian_vi_pham, inline: true },
          { name: '📍 Địa điểm vi phạm', value: violation.dia_diem_vi_pham },
          { name: '⚖️ Hành vi vi phạm', value: violation.hanh_vi_vi_pham },
          { name: '📌 Trạng thái', value: violation.trang_thai, inline: true },
          { name: '🚓 Đơn vị phát hiện', value: violation.don_vi_phat_hien }
        )
        .setFooter({ text: 'Dữ liệu từ Subhatde API', iconURL: 'https://subhatde.id.vn/favicon.ico' });
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi truy xuất dữ liệu. Vui lòng thử lại sau.');
    }
  }
};
