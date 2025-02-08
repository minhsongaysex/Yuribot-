const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../moderation/data/datauser.json');

function getUserData(userId) {
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  if (!data[userId]) {
    data[userId] = { soul: 10000 }; // 10,000 Soul mặc định
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  }
  return data[userId];
}

function saveUserData(userId, userData) {
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  data[userId] = userData;
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('baucua')
    .setDescription('Chơi trò chơi Bầu Cua với tiền ảo')
    .addStringOption(option => 
      option.setName('choice')
      .setDescription('Chọn một trong Bầu, Cua, Tôm, Cá, Nai, Gà')
      .setRequired(true)
    )
    .addIntegerOption(option => 
      option.setName('bet')
      .setDescription('Số Soul muốn cược')
      .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const choice = interaction.options.getString('choice');
    const bet = interaction.options.getInteger('bet');
    const validChoices = ['Bầu', 'Cua', 'Tôm', 'Cá', 'Nai', 'Gà'];
    
    if (!validChoices.includes(choice)) {
      return interaction.reply('⚠️ Lựa chọn không hợp lệ! Vui lòng chọn một trong: Bầu, Cua, Tôm, Cá, Nai, Gà.');
    }

    let userData = getUserData(userId);
    
    if (userData.soul < bet) {
      return interaction.reply('💸 Bạn không có đủ Soul để cược số tiền này!');
    }

    try {
      const response = await axios.get('https://huu-tri-api.onrender.com/baucua1');
      const { result } = response.data;
      
      let win = result.includes(choice);
      let winnings = win ? bet * 2 : 0;
      let message = `🎲 Kết quả: ${result.join(', ')}\n`;
      
      if (win) {
        userData.soul += winnings;
        message += `🎉 Chúc mừng! Bạn đã thắng ${winnings} Soul!`;
      } else {
        userData.soul -= bet;
        message += `😢 Rất tiếc! Bạn đã thua ${bet} Soul.`;
      }
      
      saveUserData(userId, userData);
      return interaction.reply(message);
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi kết nối với API Bầu Cua. Vui lòng thử lại sau.');
    }
  }
};
