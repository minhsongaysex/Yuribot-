const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const dataFilePath = path.join(__dirname, '../data/thuebot.json');
const ADMIN_ID = '1306552024568959016'; // Thay ID admin của bạn tại đây

// Đảm bảo file tồn tại
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
}

// Đọc dữ liệu thuê bot
function readData() {
    try {
        const content = fs.readFileSync(dataFilePath, 'utf8');
        return content ? JSON.parse(content) : {};
    } catch (error) {
        console.error("Lỗi khi đọc data:", error);
        return {};
    }
}

// Ghi dữ liệu thuê bot
function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Lỗi khi ghi vào data:", error);
    }
}

// Hàm tính thời gian còn lại
function getRemainingTime(ngayHetHan) {
    const now = moment().tz("Asia/Ho_Chi_Minh");
    const endTime = moment(ngayHetHan, "DD/MM/YYYY").tz("Asia/Ho_Chi_Minh");

    if (now.isAfter(endTime)) {
        return "⏳ Đã hết hạn!";
    }

    const duration = moment.duration(endTime.diff(now));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    return `⏳ Còn **${days} ngày, ${hours} giờ, ${minutes} phút**`;
}

// Kiểm tra & tự động xóa người dùng khi hết hạn thuê bot
async function checkExpiration(interaction) {
    const data = readData();
    const userId = interaction.user.id;
    const today = moment().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

    if (data[userId] && moment(today, "DD/MM/YYYY").isAfter(moment(data[userId].ngayHetHan, "DD/MM/YYYY"))) {
        delete data[userId];
        writeData(data);

        await interaction.reply({
            content: '⛔ **BOT ĐÃ HẾT HẠN THUÊ!** Vui lòng liên hệ [Admin](https://www.facebook.com/lms.cutii) để gia hạn.',
            ephemeral: true
        });

        setTimeout(() => interaction.deleteReply(), 5000);
        return true;
    }
    return false;
}

// Tạo lệnh thuê bot
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rent')
        .setDescription('Quản lý thuê bot')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Thêm người thuê bot (Chỉ admin)')
                .addUserOption(option =>
                    option.setName('nguoi_thue')
                        .setDescription('Chọn người thuê bot')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('ngay_het_han')
                        .setDescription('Nhập ngày hết hạn (DD/MM/YYYY)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('info')
                .setDescription('Xem danh sách người thuê bot (Admin xem tất cả, user xem của mình)')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('del')
                .setDescription('Xóa thông tin thuê bot (Chỉ admin)')
                .addUserOption(option =>
                    option.setName('nguoi_thue')
                        .setDescription('Chọn người dùng để xóa')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('checktime')
                .setDescription('Admin kiểm tra thời gian thuê của một người')
                .addUserOption(option =>
                    option.setName('nguoi_thue')
                        .setDescription('Chọn người dùng cần kiểm tra')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (await checkExpiration(interaction)) return;

        const data = readData();
        const userId = interaction.options.getUser('nguoi_thue')?.id || interaction.user.id;
        const today = moment().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

        // Lệnh thêm người thuê bot (Chỉ admin)
        if (interaction.options.getSubcommand() === 'add') {
            if (interaction.user.id !== ADMIN_ID) {
                return interaction.reply({ content: '❌ Bạn không có quyền thêm người thuê!', ephemeral: true });
            }

            const ngayHetHan = interaction.options.getString('ngay_het_han');
            if (!moment(ngayHetHan, "DD/MM/YYYY", true).isValid()) {
                return interaction.reply({ content: '❌ Ngày hết hạn không hợp lệ!', ephemeral: true });
            }

            data[userId] = { ngayBatDau: today, ngayHetHan };
            writeData(data);

            return interaction.reply({
                content: `✅ **Đã thêm người thuê bot!**
👤 **Người thuê:** <@${userId}>
📆 **Ngày bắt đầu:** ${today}
⏳ **Hạn thuê:** ${ngayHetHan}`,
                ephemeral: true
            });
        }

        // Lệnh kiểm tra danh sách thuê bot
        if (interaction.options.getSubcommand() === 'info') {
            if (interaction.user.id === ADMIN_ID) {
                // Admin xem danh sách toàn bộ người thuê bot
                if (Object.keys(data).length === 0) {
                    return interaction.reply({ content: '❌ Hiện không có ai thuê bot!', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('📊 Danh Sách Người Thuê Bot')
                    .setDescription(Object.entries(data).map(([id, info]) => 
                        `👤 <@${id}> - Hạn thuê: **${info.ngayHetHan}** - ${getRemainingTime(info.ngayHetHan)}`
                    ).join('\n'));

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                // Người dùng chỉ xem được thông tin của họ
                if (!data[userId]) {
                    return interaction.reply({ content: '❌ Bạn chưa thuê bot!', ephemeral: true });
                }

                return interaction.reply({
                    content: `📊 **Thông Tin Thuê Bot**
👤 **Bạn:** <@${userId}>
📆 **Ngày bắt đầu:** ${data[userId].ngayBatDau}
⏳ **Hạn thuê:** ${data[userId].ngayHetHan}
${getRemainingTime(data[userId].ngayHetHan)}`,
                    ephemeral: true
                });
            }
        }
        if (interaction.options.getSubcommand() === 'del') {
            if (interaction.user.id !== ADMIN_ID) {
                return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
            }

            if (!data[userId]) {
                return interaction.reply({ content: '❌ Người dùng này không có trong danh sách thuê bot!', ephemeral: true });
            }

            delete data[userId];
            writeData(data);

            try {
                const user = await interaction.client.users.fetch(userId);
                await user.send('⚠️ Bạn đã bị xóa khỏi danh sách thuê bot. Nếu có vấn đề, vui lòng liên hệ [Admin](https://www.facebook.com/lms.cutii).');
            } catch (error) {
                console.error(`Không thể gửi tin nhắn đến ${userId}:`, error);
            }

            return interaction.reply({ content: `✅ **Đã xóa thông tin thuê bot của <@${userId}>.**`, ephemeral: true });
        }

        if (interaction.options.getSubcommand() === 'checktime') {
            if (interaction.user.id !== ADMIN_ID) {
                return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
            }

            if (!data[userId]) {
                return interaction.reply({ content: '❌ Người này chưa thuê bot!', ephemeral: true });
            }

            return interaction.reply({
                content: `📊 **Thông Tin Thuê Bot**\n👤 **Người thuê:** <@${userId}>\n⏳ **Hạn thuê:** ${data[userId].ngayHetHan}\n${getRemainingTime(data[userId].ngayHetHan)}`,
                ephemeral: true
            });
        }
    }
};
