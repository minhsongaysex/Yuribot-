const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../moderation/data/datauser.json');
const transactionFee = 0.02; // 2% phí duy trì khi lỗ

function getUserData(userId) {
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  if (!data[userId]) {
    data[userId] = { soul: 10000, portfolio: {} }; // 10,000 Soul mặc định
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
    .setName('chungkhoan')
    .setDescription('Mô phỏng thị trường chứng khoán trên Discord')
    .addSubcommand(subcommand => 
      subcommand.setName('buy')
      .setDescription('Mua cổ phiếu')
      .addStringOption(option => option.setName('symbol').setDescription('Mã cổ phiếu').setRequired(true))
      .addIntegerOption(option => option.setName('quantity').setDescription('Số lượng muốn mua').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('sell')
      .setDescription('Bán cổ phiếu')
      .addStringOption(option => option.setName('symbol').setDescription('Mã cổ phiếu').setRequired(true))
      .addIntegerOption(option => option.setName('quantity').setDescription('Số lượng muốn bán').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('portfolio')
      .setDescription('Xem danh mục đầu tư của bạn')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    let userData = getUserData(userId);
    
    switch (subcommand) {
      case 'buy': {
        const symbol = interaction.options.getString('symbol').toUpperCase();
        const quantity = interaction.options.getInteger('quantity');
        const price = (Math.random() * (500 - 50) + 50).toFixed(2); // Giá ngẫu nhiên từ 50 - 500
        const cost = quantity * price;
        
        if (userData.soul < cost) {
          return interaction.reply('💸 Bạn không đủ Soul để mua cổ phiếu này.');
        }
        
        userData.soul -= cost;
        if (!userData.portfolio[symbol]) {
          userData.portfolio[symbol] = { quantity: 0, avgPrice: 0 };
        }
        const stock = userData.portfolio[symbol];
        stock.avgPrice = ((stock.quantity * stock.avgPrice) + cost) / (stock.quantity + quantity);
        stock.quantity += quantity;
        
        saveUserData(userId, userData);
        return interaction.reply(`✅ Bạn đã mua ${quantity} cổ phiếu **${symbol}** với giá ${price} Soul mỗi cổ phiếu.`);
      }
      
      case 'sell': {
        const symbol = interaction.options.getString('symbol').toUpperCase();
        const quantity = interaction.options.getInteger('quantity');
        const price = (Math.random() * (500 - 50) + 50).toFixed(2);
        
        if (!userData.portfolio[symbol] || userData.portfolio[symbol].quantity < quantity) {
          return interaction.reply('❌ Bạn không có đủ cổ phiếu để bán.');
        }
        
        const stock = userData.portfolio[symbol];
        const totalSell = quantity * price;
        let fee = 0;
        
        if (price < stock.avgPrice) {
          fee = totalSell * transactionFee;
          userData.soul -= fee;
        }
        
        userData.soul += totalSell;
        stock.quantity -= quantity;
        if (stock.quantity === 0) delete userData.portfolio[symbol];
        
        saveUserData(userId, userData);
        return interaction.reply(`✅ Bạn đã bán ${quantity} cổ phiếu **${symbol}** với giá ${price} Soul mỗi cổ phiếu. Phí lỗ: ${fee.toFixed(2)} Soul.`);
      }
      
      case 'portfolio': {
        if (Object.keys(userData.portfolio).length === 0) {
          return interaction.reply('📉 Bạn chưa sở hữu cổ phiếu nào.');
        }
        
        let message = `💰 Số dư: ${userData.soul.toFixed(2)} Soul\n📊 Danh mục đầu tư:\n`;
        for (const [symbol, stock] of Object.entries(userData.portfolio)) {
          message += `🔹 **${symbol}**: ${stock.quantity} cổ phiếu, Giá trung bình: ${stock.avgPrice.toFixed(2)} Soul\n`;
        }
        
        return interaction.reply(message);
      }
    }
  }
};

