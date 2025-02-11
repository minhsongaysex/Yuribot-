const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bmi')
    .setDescription('Tính BMI và tuổi từ thông tin người dùng')
    .addNumberOption(option => 
      option.setName('cannang')
        .setDescription('Nhập cân nặng (kg)')
        .setRequired(true))
    .addNumberOption(option => 
      option.setName('chieucao')
        .setDescription('Nhập chiều cao (m)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('ngaysinh')
        .setDescription('Nhập ngày sinh (yyyy-mm-dd)')
        .setRequired(true)),

  async execute(interaction) {
    const cannang = interaction.options.getNumber('cannang');
    const chieucao = interaction.options.getNumber('chieucao');
    const ngaysinh = interaction.options.getString('ngaysinh');

    try {
      await interaction.deferReply();

      // Gọi API tính BMI
      const bmiResponse = await axios.get(`https://huu-tri-api.onrender.com/bmi?cannang=${cannang}&chieucao=${chieucao}`);
      const bmiData = bmiResponse.data;

      // Gọi API tính tuổi
      const ageResponse = await axios.get(`https://huu-tri-api.onrender.com/tinhtuoi?ngaysinh=${ngaysinh}`);
      const ageData = ageResponse.data;

      // Gộp kết quả và gửi về người dùng
      const resultMessage = `
📊 **Kết quả tính toán BMI và tuổi**
- 🔢 BMI: **${bmiData.bmi}** (${bmiData.classification})
- 🎂 Tuổi: **${ageData.age} tuổi**
- 👤 Tác giả API: [Mson tricker](${bmiData.author})
      `;

      await interaction.editReply(resultMessage);
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      await interaction.editReply('Đã xảy ra lỗi khi gọi API. Vui lòng thử lại sau!');
    }
  },
};
