const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Bỏ qua tin nhắn từ bot
        if (message.author.bot) return;

        // Danh sách câu phản hồi
        const responses = {
            "hi": "chào aiu 🥰",
            "tớ buồn quá": "vui lên nè ;3",
            "bot ngu quá": "🥺 huhu đừng nói vậy mà...",
            "hôm nay trời đẹp quá": "Ừa, trời đẹp như cậu vậy đó 😘",
            "ăn cơm chưa": "Chưa nè, cậu bao tớ ăn không? 🤭",
            "địt nhau khong": "dăm quá à😡",
            "alo": "gọi gì đang bạn à nha",
            "bot": "im coiii tao đang hoc",
            "admins đâu": "Bố con bận ngắm gái https://www.facebook.com/lms.cutii",
            "yêu bot": "cút🤕bao giờ LMS có ny thì yuri mới iu"
                };

        // Chuyển nội dung tin nhắn thành chữ thường để so sánh
        const userMessage = message.content.toLowerCase();

        // Kiểm tra xem có phản hồi không
        if (responses[userMessage]) {
            await message.reply(responses[userMessage]);
        }
    }
};
