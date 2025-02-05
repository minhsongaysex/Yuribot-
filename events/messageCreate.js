const { Events } = require('discord.js');
const kingCommand = require('../commands/moderation/King');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Bỏ qua tin nhắn từ bot hoặc tin nhắn không có nội dung
    if (message.author.bot || !message.content) return;

    // Kiểm tra và xử lý các trạng thái "deobam" và "cuongep"
    kingCommand.handleMessage(message);
  }
};

