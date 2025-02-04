module.exports = {
  name: 'messageCreate',
  execute(message) {
    const kingCommand = require('../commands/King'); // Đường dẫn file King.js
    kingCommand.checkDeobam(message);
  },
};
