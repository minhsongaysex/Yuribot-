const { Events, Client } = require('discord.js');
require('dotenv').config();

const ADMIN_ID = '1306552024568959016'; // ID của admin
const CHANNEL_IDS = ['1337029269791969391', '1343927655572967478' , '1000928985481478194']; // Danh sách ID kênh cần giám sát

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Bỏ qua tin nhắn từ bot
        if (message.author.bot) return;

        // Kiểm tra nếu tin nhắn chứa "pastebin.com"
        if (message.content.includes('pastebin.com')) {
            try {
                const client = message.client;
                const user = message.author;
                const channelId = message.channel.id;
                const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

                // Kiểm tra xem tin nhắn có nằm trong danh sách kênh giám sát không
                if (!CHANNEL_IDS.includes(channelId)) return;

                // Gửi tin nhắn riêng cho Admin
                const adminUser = await client.users.fetch(ADMIN_ID);
                if (adminUser) {
                    await adminUser.send(`🗃️ **𝙋𝙀́ 𝙔𝙐𝙍𝙄:𝟯 𝘿𝘼̃ 𝙏𝙄̀𝙈 𝙏𝙃𝘼̂́𝙔 𝙇𝙄𝙉𝙆 𝙋𝘼𝙎𝙏𝙀𝘽𝙄𝙉 𝘾𝙃𝙊 𝙈𝙄𝙉𝙃𝙎𝙊𝙉𝙉🌸!**\n⏰ **Thời gian:** ${time}\n👤 **Người gửi:** ${user.username} (${user.id})\n🔗 **Nội dung🗒️:** ${message.content}`);
                }

                console.log(`🔍 💝𝙋𝙀́ 𝙋𝙃𝘼́𝙏 𝙃𝙄𝙀̣̂𝙉 𝙇𝙄𝙉𝙆 𝙏𝙐̛̀⚠️ ${user.username} (${user.id}) tại ${time}`);

            } catch (error) {
                console.error('❌ Lỗi khi xử lý event autopaste:', error);
            }
        }
    }
};
