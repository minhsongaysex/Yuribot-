const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbot')
        .setDescription('Kiểm tra độ trễ của bot và thông tin server.'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Đang kiểm tra...', fetchReply: true });
        const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        // Xác định trạng thái của bot dựa trên ping
        let botStatus;
        if (botLatency < 100) {
            botStatus = "🟢 Bot ổn định";
        } else if (botLatency >= 200 && botLatency <= 500) {
            botStatus = "🟠 Bot hơi lag";
        } else {
            botStatus = "🔴 Bot đã isekai!";
        }

        // Thông tin về server
        const guild = interaction.guild;
        const serverOwner = `<@${guild.ownerId}>` || "Không xác định";
        const memberCount = guild.memberCount;
        const serverRegion = guild.preferredLocale;

        // Embed thông tin bot và server
        const embed = new EmbedBuilder()
            .setColor(botLatency < 100 ? 'Green' : botLatency < 500 ? 'Orange' : 'Red')
            .setTitle('📡 Kiểm Tra Bot')
            .addFields(
                { name: '🤖 Tên Bot', value: 'LMS Bot', inline: true },
                { name: '👑 Chủ Bot', value: 'LMS', inline: true },
                { name: '📊 Độ Trễ Bot', value: `${botLatency}ms`, inline: true },
                { name: '🌐 Độ Trễ API', value: `${apiLatency}ms`, inline: true },
                { name: '📌 Trạng thái', value: botStatus, inline: true },
                { name: '🌍 Sever', value: guild.name, inline: true },
                { name: '📍 Vùng Đất', value: serverRegion, inline: true },
                { name: '👥 Số Thành Viên', value: `${memberCount}`, inline: true },
                { name: '💼 Chủ Sever', value: serverOwner, inline: true },
                { name: '🆔 ID Sever', value: guild.id, inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
