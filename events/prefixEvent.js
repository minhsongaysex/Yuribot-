require('dotenv').config();
const { Events, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

const imageList = [
    "https://i.imgur.com/Wa1TBhG.jpeg",
    "https://i.imgur.com/evWBehM.jpeg",
    "https://i.imgur.com/wiNJLFu.jpeg",
    "https://i.imgur.com/TGhY0Mm.jpeg",
    "https://i.imgur.com/R6ofXSb.jpeg",
    "https://i.imgur.com/EdFwgEh.jpeg",
    "https://i.imgur.com/jLADYSo.jpeg",
    "https://i.imgur.com/5tSnJGG.jpeg",
    "https://i.imgur.com/UsHIocz.jpeg",
    "https://i.imgur.com/cA4EF2D.jpeg",
    "https://i.imgur.com/8pCl4YZ.jpeg",
    "https://i.imgur.com/z6M4oqT.jpeg",
    "https://i.imgur.com/4slR1lc.jpeg",
    "https://i.imgur.com/dczN4b4.jpeg",
    "https://i.imgur.com/2Kltm5g.jpeg",
    "https://i.imgur.com/BDEsESz.jpeg",
    "https://i.imgur.com/JTfjd9o.jpeg",
    "https://i.imgur.com/wyFJoYs.jpeg",
    "https://i.imgur.com/c9My7aR.jpeg",
    "https://i.imgur.com/JQhJ1D4.jpeg",
    "https://i.pinimg.com/564x/98/37/12/983712827beff24729da51c493cb2e76.jpg",
    "https://i.pinimg.com/564x/be/a0/57/bea0578abfd50232763574c825508abf.jpg",
    "https://i.pinimg.com/564x/66/30/70/663070c5f0455b3f0eac144c00b5731e.jpg",
    "https://i.pinimg.com/564x/50/d5/a8/50d5a8f055726d94b57cc7a33df50f92.jpg",
    "https://i.pinimg.com/564x/fb/23/2b/fb232b58aef8635ba8a2110938f08906.jpg",
    "https://i.pinimg.com/564x/b4/a3/e4/b4a3e435ca0fcb39417e9daf191a8c6a.jpg",
    "https://i.pinimg.com/564x/0c/87/68/0c87685c2b59dda035b73993390036df.jpg",
    "https://i.pinimg.com/564x/cb/85/89/cb858993e17d5fcff75098dd5da15bfb.jpg",
    "https://i.pinimg.com/564x/1e/ed/0e/1eed0e0bab45676b75ed29aa70412762.jpg"
];

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Bỏ qua tin nhắn từ bot
        if (message.author.bot) return;

        // Lấy prefix từ .env
        const PREFIX = process.env.PREFIX;
        if (!PREFIX) {
            console.error('❌ LỖI: Chưa thiết lập PREFIX trong file .env!');
            return;
        }

        // Kiểm tra nếu người dùng chỉ nhập prefix
        if (message.content.trim() === PREFIX) {
            try {
                // Chọn một ảnh ngẫu nhiên
                const imageUrl = imageList[Math.floor(Math.random() * imageList.length)];

                // Lấy câu thính từ API
                const response = await axios.get('https://raw.githubusercontent.com/Sang070801/api/main/thinh1.json');
                const data = response.data;
                const thinhArray = Object.values(data.data);
                const randomThinh = thinhArray[Math.floor(Math.random() * thinhArray.length)];

                // Tính thời gian uptime
                const uptime = process.uptime();
                const h = Math.floor(uptime / 3600);
                const m = Math.floor((uptime % 3600) / 60);
                const s = Math.floor(uptime % 60);

                // Gửi phản hồi
                await message.reply({
                    content: `―――⚠️ **『YURI SUPPORTS』**―――🗨️\n👀 **Thính**❄️: ${randomThinh}\n🌸 **Uptime**: ${h}h ${m}m ${s}s\n――――――――――――――`,
                    files: [imageUrl]
                });

            } catch (error) {
                console.error('❌ Lỗi khi xử lý event prefix:', error);
                await message.reply('❌ Đã xảy ra lỗi! Vui lòng thử lại sau.');
            }
        }
    }
};
