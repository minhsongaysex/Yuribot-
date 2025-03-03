const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dataFilePath = path.join(__dirname, '../data/datauser.json');

// Đảm bảo thư mục và file tồn tại
if (!fs.existsSync(path.dirname(dataFilePath))) {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
}
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
}

// Đọc dữ liệu từ file
function readData() {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// Ghi dữ liệu vào file
function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hthem')
        .setDescription('Quản lý tiền học thêm')
        .addSubcommand(subcommand =>
            subcommand.setName('themmon')
                .setDescription('Thêm môn học mới')
                .addStringOption(option =>
                    option.setName('mon')
                        .setDescription('Nhập tên môn học')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('gia')
                        .setDescription('Nhập giá tiền mặc định mỗi buổi')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('them')
                .setDescription('Thêm buổi học vào danh sách')
                .addStringOption(option =>
                    option.setName('ngay')
                        .setDescription('Nhập ngày học (DD/MM/YYYY)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('mon')
                        .setDescription('Chọn môn học')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('nghi')
                        .setDescription('Có nghỉ học không? (true = nghỉ, false = học)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('kiemtra')
                .setDescription('Kiểm tra số tiền học thêm đã đóng')
        ),

    async execute(interaction) {
        const data = readData();
        const userId = interaction.user.id;
        if (!data[userId]) {
            data[userId] = { hocThem: {}, tongTien: 0 };
        }

        if (interaction.options.getSubcommand() === 'themmon') {
            const mon = interaction.options.getString('mon');
            const gia = interaction.options.getInteger('gia');

            if (data[userId].hocThem[mon]) {
                return interaction.reply(`⚠️ Môn học **${mon}** đã tồn tại!`);
            }

            data[userId].hocThem[mon] = { buoiHoc: [], giaMacDinh: gia, tongTienMon: 0 };
            writeData(data);
            return interaction.reply(`✅ Đã thêm môn học **${mon}** với giá **${gia}** VNĐ mỗi buổi.`);
        }

        if (interaction.options.getSubcommand() === 'them') {
            const ngay = interaction.options.getString('ngay');
            const mon = interaction.options.getString('mon');
            const nghi = interaction.options.getBoolean('nghi');

            if (!data[userId].hocThem[mon]) {
                return interaction.reply(`❌ Môn học **${mon}** chưa được đăng ký. Hãy thêm bằng lệnh "/hthem themmon".`);
            }
            
            const gia = data[userId].hocThem[mon].giaMacDinh;
            data[userId].hocThem[mon].buoiHoc.push({ ngay, gia, nghi });
            
            if (!nghi) {
                data[userId].hocThem[mon].tongTienMon += gia;
                data[userId].tongTien += gia;
            }
            
            writeData(data);
            return interaction.reply(`✅ Đã thêm buổi học môn **${mon}** vào ngày **${ngay}** với giá **${gia}** VNĐ${nghi ? ' (Nghỉ học, không tính phí)' : ''}.`);
        }

        if (interaction.options.getSubcommand() === 'kiemtra') {
            const hocThem = data[userId].hocThem;
            const tongTien = data[userId].tongTien;
            
            if (!hocThem || Object.keys(hocThem).length === 0) {
                return interaction.reply('📌 Bạn chưa đăng ký buổi học nào!');
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📊 Tổng tiền học thêm')
                .setDescription(`💰 Tổng tiền cần đóng: **${tongTien}** VNĐ`);
            
            Object.keys(hocThem).forEach(mon => {
                const buoiHoc = hocThem[mon].buoiHoc;
                const totalCost = hocThem[mon].tongTienMon;
                const buoiHocStr = buoiHoc.map(b => `📅 Ngày: ${b.ngay} | ${b.nghi ? '❌ Nghỉ' : '✅ Học'} | 💰 ${b.gia} VNĐ`).join('\n');
                embed.addFields({ name: `📚 ${mon} (Tổng: ${totalCost} VNĐ)`, value: buoiHocStr || 'Chưa có buổi học nào' });
            });
            
            return interaction.reply({ embeds: [embed] });
        }
    }
};
