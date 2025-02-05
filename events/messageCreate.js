const { Events } = require('discord.js');
const { activeDeobamUsers, activeCuongepUsers } = require('../commands/moderation/King'); // Cập nhật đúng đường dẫn file King.js

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return; // Bỏ qua tin nhắn từ bot

    const userId = message.author.id;

    // 👻 Xử lý người bị "đeo bám" (cấm gửi tin nhắn)
    if (activeDeobamUsers.has(userId)) {
      message.delete()
        .then(() => {
          message.channel.send(`👻 **${message.author.username}**, bạn đang bị bóng ma đeo bám! Dùng \`/king off\` để giải trừ.`)
            .then(msg => setTimeout(() => msg.delete(), 5000));
        })
        .catch(console.error);
      return;
    }

    // 🚨 Xử lý người bị "cưỡng ép" (phải gửi đúng câu)
    const requiredSentence = activeCuongepUsers.get(userId);
    if (requiredSentence && message.content !== requiredSentence) {
      message.delete()
        .then(() => {
          message.channel.send(`🚫 **${message.author.username}**, bạn phải viết đúng câu: **"${requiredSentence}"**!`)
            .then(msg => setTimeout(() => msg.delete(), 5000));
        })
        .catch(console.error);
    } else if (requiredSentence && message.content === requiredSentence) {
      activeCuongepUsers.delete(userId); // Giải phóng người chơi khi họ viết đúng
      message.channel.send(`🎉 **${message.author.username}** đã hoàn thành thử thách và được tự do!`).then(msg => setTimeout(() => msg.delete(), 5000));
    }
  }
};
