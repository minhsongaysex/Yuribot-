const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkhost')
        .setDescription('Kiểm tra HTTP của một trang web')
        .addSubcommand(subcommand =>
            subcommand
                .setName('http')
                .setDescription('Kiểm tra HTTP của trang web')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('Nhập URL để kiểm tra')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const url = interaction.options.getString('url');
        const apiUrl = `https://check-host.net/check-http?host=${encodeURIComponent(url)}&max_nodes=10`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.ok) {
                return interaction.editReply('❌ Không thể kiểm tra trang web này!');
            }

            // Danh sách IP từ các node
            const nodes = Object.entries(data.nodes)
                .map(([node, details]) => `🌍 **${details[1]}, ${details[2]}** - 🏷️ IP: \`${details[3]}\``)
                .join('\n');

            // Tạo Embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🔍 Kiểm tra HTTP - ${url}`)
                .setDescription(`🔗 **[Xem chi tiết báo cáo](${data.permanent_link})**\n\n${nodes}`)
                .setFooter({ text: 'Dữ liệu từ Check-Host.net' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi kiểm tra trang web!');
        }
    }
};
