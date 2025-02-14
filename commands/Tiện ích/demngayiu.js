const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const loveDataPath = path.join(__dirname, '../data/loveData.json');

// Hàm lấy dữ liệu người dùng hoặc tạo mới
function getUserLoveData(userId) {
  if (!fs.existsSync(loveDataPath)) {
    fs.writeFileSync(loveDataPath, JSON.stringify({}), 'utf8');
  }
  const data = JSON.parse(fs.readFileSync(loveDataPath, 'utf8'));
  return data[userId] || null;
}

// Hàm lưu dữ liệu ngày yêu
function saveUserLoveData(userId, partnerId, date) {
  const data = JSON.parse(fs.readFileSync(loveDataPath, 'utf8'));
  data[userId] = { partnerId, date };
  data[partnerId] = { partnerId: userId, date }; // Lưu ngược lại cho đối phương
  fs.writeFileSync(loveDataPath, JSON.stringify(data, null, 2));
}

// Hàm tính số ngày yêu
function demNgayYeu(ngayBatDau) {
  const ngayHienTai = new Date();
  const ngayBatDauDate = new Date(ngayBatDau);
  const soMiligiayMotNgay = 1000 * 60 * 60 * 24;
  return Math.floor((ngayHienTai - ngayBatDauDate) / soMiligiayMotNgay);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demngayyeu')
    .setDescription('Đếm số ngày yêu của bạn')
    .addUserOption(option =>
      option.setName('partner')
        .setDescription('Tag người yêu của bạn')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Nhập ngày yêu nhau theo định dạng YYYY-MM-DD')
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const partner = interaction.options.getUser('partner');
    const ngayNhap = interaction.options.getString('date');

    if (ngayNhap && partner) {
      saveUserLoveData(userId, partner.id, ngayNhap);
      return interaction.reply(`💖 Bạn đã lưu ngày yêu với <@${partner.id}> vào ngày **${ngayNhap}**. Dùng lại lệnh để xem số ngày yêu!`);
    }

    const loveData = getUserLoveData(userId);
    if (!loveData) {
      return interaction.reply('❌ Bạn chưa lưu ngày yêu! Hãy nhập ngày yêu bằng lệnh `/demngayyeu @nguoithuong YYYY-MM-DD`');
    }

    const soNgayYeu = demNgayYeu(loveData.date);
    const embed = new EmbedBuilder()
      .setTitle('💑 Đếm Ngày Yêu 💖')
      .setDescription(`<@${userId}> và <@${loveData.partnerId}> đã yêu nhau được **${soNgayYeu} ngày**! 🥰`)
      .setColor('#ff66b2');
    
    return interaction.reply({ embeds: [embed] });
  }
};
