const { Events } = require('discord.js');
const King = require('../commands/moderation/King'); // Cập nhật đúng đường dẫn file King.js

module.exports = {
  name: Events.MessageCreate,
  execute(message) {
    King.handleMessage(message);
  },
};
