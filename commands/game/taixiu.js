const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const path = require('path'); // ✅ Fix lỗi path is not defined

const moneyFile = path.join(__dirname, '../data/money.json'); // ✅ Đường dẫn chính xác

// Kiểm tra thư mục và file JSON trước khi sử dụng
if (!fs.existsSync(path.dirname(moneyFile))) {
    fs.mkdirSync(path.dirname(moneyFile), { recursive: true });
}

if (!fs.existsSync(moneyFile)) {
    fs.writeFileSync(moneyFile, JSON.stringify({}, null, 2));
}

// Đọc dữ liệu người chơi từ file
let moneyData = JSON.parse(fs.readFileSync(moneyFile, 'utf8'));


module.exports = {
    data: new SlashCommandBuilder()
        .setName('taixiu')
        .setDescription('Chơi tài xỉu (Tài/Xỉu/Bão)')
        .addStringOption(option =>
            option.setName('loai')
                .setDescription('Chọn tài/xỉu/bão')
                .setRequired(true)
                .addChoices(
                    { name: 'Tài', value: 'tai' },
                    { name: 'Xỉu', value: 'xiu' },
                    { name: 'Bão', value: 'bao' }
                )
        )
        .addIntegerOption(option =>
            option.setName('tien')
                .setDescription('Số tiền cược')
                .setRequired(true)
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userName = interaction.user.username;

        let moneyData = fs.existsSync(moneyFile) ? JSON.parse(fs.readFileSync(moneyFile, 'utf8')) : {};

        // Kiểm tra nếu người chơi chưa có tài khoản
        if (!moneyData[userId]) {
            moneyData[userId] = { money: 1000 };
            fs.writeFileSync(moneyFile, JSON.stringify(moneyData, null, 2));
            return interaction.reply(`✅ **Tài khoản của bạn đã được tạo!** Bạn nhận **1000$** để bắt đầu.`);
        }

        const loaiCuoc = interaction.options.getString('loai');
        const tienCuoc = interaction.options.getInteger('tien');

        if (tienCuoc < 20) {
            return interaction.reply('⚠️ Tiền cược tối thiểu là **20$**!');
        }
        if (moneyData[userId].money < tienCuoc) {
            return interaction.reply('❌ Bạn không đủ tiền cược!');
        }

        // Gửi thông báo ban đầu
        let message = await interaction.reply(`🎲 **${userName} đã đặt cược ${tienCuoc}$ vào ${loaiCuoc.toUpperCase()}!**\n⏳ Đang lắc xúc xắc... Vui lòng đợi **10 giây**`);

        // Cập nhật tin nhắn đếm ngược từng giây
        for (let i = 10; i > 0; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await message.edit(`🎲 **Xúc xắc đang lăn...** ⏳ Còn ${i} giây`);
        }

        try {
            const response = await axios.get('https://api.satoru.site/game/taixiu');
            const { total, result, gif, images } = response.data;
            const isBao = images[0] === images[1] && images[1] === images[2]; // Kiểm tra bộ ba đồng nhất

            let ketQua = '';
            let tienNhan = 0;

            // Chờ 15 giây tiếp theo trước khi hiển thị kết quả
            for (let i = 15; i > 0; i--) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await message.edit(`🎲 **Xúc xắc đang lăn...** ⏳ Còn ${i} giây`);
            }

            if (loaiCuoc === 'bao') {
                if (isBao) {
                    tienNhan = tienCuoc * 33; // Thắng bão x33 tiền cược
                    ketQua = `🎉 Bạn thắng **BÃO**! Nhận **${tienNhan}$**`;
                } else {
                    tienNhan = -tienCuoc;
                    ketQua = `❌ Không ra BÃO! Mất **${Math.abs(tienNhan)}$**`;
                }
            } else {
                if (isBao) {
                    tienNhan = -tienCuoc + Math.floor(tienCuoc * 0.3); // Hoàn lại 30% tiền cược nếu ra bão
                    ketQua = `⚡️ Xúc xắc ra **BÃO**! Bạn được hoàn lại **30%** (Nhận **${Math.abs(tienNhan)}$**)`;
                } else if ((loaiCuoc === 'tai' && result === 'tài') || (loaiCuoc === 'xiu' && result === 'xỉu')) { 

                    tienNhan = tienCuoc * 2; // Thắng x2 tiền cược
                    ketQua = `🎉 Bạn thắng cược! Nhận **${tienNhan}$**`;
                } else {
                    tienNhan = -tienCuoc;
                    ketQua = `❌ Bạn thua! Mất **${Math.abs(tienNhan)}$**`;
                }
            }

            // Cập nhật số dư
            moneyData[userId].money += tienNhan;
            fs.writeFileSync(moneyFile, JSON.stringify(moneyData, null, 2));

            const attachment = new AttachmentBuilder(gif);

            await message.edit({
                content: `🎲 **Kết quả**:\n🎯 Xúc xắc: ${total}\n🔢 Kết quả: **${result.toUpperCase()}**\n💰 ${ketQua}\n💵 Số dư mới: **${moneyData[userId].money}$**`,
                files: [attachment]
            });

        } catch (error) {
            console.error(error);
            await message.edit('❌ Lỗi khi lấy dữ liệu từ API.');
        }
    }
};
