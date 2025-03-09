const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const ADMIN_ID = "1306552024568959016"; // Thay ID của bạn

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autofacebook')
        .setDescription('Tạo tài khoản Facebook tự động')
        .addIntegerOption(option =>
            option.setName('so_luong')
                .setDescription('Số lượng tài khoản cần tạo')
                .setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== ADMIN_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }

        const soLuong = interaction.options.getInteger('so_luong');
        if (soLuong <= 0) {
            return interaction.reply({ content: '❌ Số lượng phải lớn hơn 0!', ephemeral: true });
        }

        await interaction.reply(`🚀 **Bắt đầu tạo ${soLuong} tài khoản Facebook...**`);

        let progressMessage = await interaction.fetchReply();
        let createdAccounts = [];

        for (let i = 1; i <= soLuong; i++) {
            const account = await fakeFacebookAccount(i); // Giả lập tạo tài khoản
            createdAccounts.push(account);

            // Cập nhật tin nhắn tiến trình
            await progressMessage.edit(`⏳ **Đang tạo tài khoản... (${i}/${soLuong})**`);
        }

        // Thống kê chi tiết khi hoàn thành
        let resultMessage = createdAccounts.map((acc, index) =>
            `📌 **Tài khoản #${index + 1}**\n` +
            `👤 **Tên**: ${acc.name}\n` +
            `📧 **Email**: ${acc.email}\n` +
            `🔑 **Mật khẩu**: ${acc.password}\n` +
            `📜 **Mã xác nhận**: ${acc.verifyCode}\n` +
            `✅ **ID Đăng Ký**: ${acc.registeredId}\n` +
            `🔗 **Cookie**: ${acc.cookie}\n`
        ).join("\n──────────────\n");

        await progressMessage.edit(`✅ **Hoàn tất! Đã tạo ${soLuong} tài khoản.**\n${resultMessage}`);
    }
};

// 🔥 Giả lập tạo tài khoản Facebook
async function fakeFacebookAccount(index) {
    const email = `user${Math.floor(Math.random() * 100000)}@gmail.com`;
    const password = Math.random().toString(36).slice(-8);
    const name = `User_${Math.floor(Math.random() * 10000)}`;
    const verifyCode = Math.floor(100000 + Math.random() * 900000);
    const registeredId = `615${Math.floor(Math.random() * 100000000)}`;
    const cookie = `xs=4A3xRtaEpc...FAKE_COOKIE_${index}`;

    await new Promise(resolve => setTimeout(resolve, 2000)); // Giả lập thời gian tạo tài khoản

    return { name, email, password, verifyCode, registeredId, cookie };
}
