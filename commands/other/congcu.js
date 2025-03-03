const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const moment = require('moment-timezone');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('congcu')
        .setDescription('Đếm mọi thứ trong server bot')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Chọn loại thông tin muốn xem')
                .setRequired(true)
                .addChoices(
                    { name: 'Tổng số thành viên', value: 'allusers' },
                    { name: 'Số nhóm', value: 'allthreads' },
                    { name: 'Số quản trị viên', value: 'admin' },
                    { name: 'Số tin nhắn của bạn', value: 'mymess' },
                    { name: 'Ping bot', value: 'ping' },
                    { name: 'Uptime bot', value: 'uptime' },
                    { name: 'Thời gian hiện tại', value: 'time' },
                    { name: 'Ca dao', value: 'cadao' },
                    { name: 'Ngôn tình', value: 'love' },
                    { name: 'Bói toán', value: 'boi' }
                )
        ),

    async execute(interaction) {
        const type = interaction.options.getString('type');
        const guild = interaction.guild;
        let response = '';

        switch (type) {
            case 'allusers':
                response = `👥 Tổng số thành viên trong server: **${guild.memberCount}**`;
                break;
            case 'allthreads':
                response = `📌 Số kênh trong server: **${guild.channels.cache.size}**`;
                break;
            case 'admin':
                const admins = guild.members.cache.filter(member => member.permissions.has('Administrator'));
                response = `🔧 Số quản trị viên: **${admins.size}**`;
                break;
            case 'mymess':
                response = `📨 Discord không hỗ trợ đếm tin nhắn cá nhân!`;
                break;
            case 'ping':
                response = `🏓 Ping bot: **${interaction.client.ws.ping}ms**`;
                break;
            case 'uptime':
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);
                response = `⏳ Uptime bot: **${hours}h ${minutes}m ${seconds}s**`;
                break;
            case 'time':
                const now = moment().tz("Asia/Ho_Chi_Minh").format("D/MM/YYYY || HH:mm:ss");
                response = `⏰ Thời gian hiện tại: **${now} (GMT+7)**`;
                break;
            case 'cadao':
                const cadao = await axios.get('https://jrt-api.j-jrt-official.repl.co/cadao');
                response = `📜 Ca dao Việt Nam:
${cadao.data.data}`;
                break;
            case 'love':
                const love = await axios.get('https://jrt-api.j-jrt-official.repl.co/love');
                response = `💖 Ngôn tình:
${love.data.data}`;
                break;
            case 'boi':
                const boi = await axios.get('https://jrt-api.j-jrt-official.repl.co/thayboi');
                response = `🔮 Bói toán:
${boi.data.data}`;
                break;
            default:
                response = '❌ Lệnh không hợp lệ!';
                break;
        }

        await interaction.reply({ content: response, ephemeral: false });
    }
};
