const { Events } = require('discord.js');
const King = require('../commands/moderation/King'); // Đường dẫn chuẩn tới King.js

module.exports = {
  name: Events.MessageCreate,
  execute(message) {
    King.checkDeobam(message);
  },
};
