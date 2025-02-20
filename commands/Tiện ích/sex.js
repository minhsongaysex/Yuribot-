const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sex')
        .setDescription('Tìm kiếm hoặc tải video từ API.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Tìm kiếm video theo từ khóa.')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Nhập từ khóa tìm kiếm')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('download')
                .setDescription('Tải video từ URL.')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL của video cần tải')
                        .setRequired(true))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const requestTime = new Date();

        if (subcommand === 'search') {
            const query = interaction.options.getString('query');
            const searchUrl = `https://markdevs-last-api-p2y6.onrender.com/xnxx/search/${encodeURIComponent(query)}`;

            await interaction.deferReply();

            try {
                const response = await fetch(searchUrl);
                const data = await response.json();

                if (!data.status || !data.result || data.result.length === 0) {
                    return interaction.editReply('❌ Không tìm thấy kết quả nào.');
                }

                // Giới hạn hiển thị 5 kết quả đầu tiên
                const results = data.result.slice(0, 5);
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`🔎 Kết quả tìm kiếm: ${query}`)
                    .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}` })
                    .setTimestamp();

                results.forEach((video, index) => {
                    embed.addFields({
                        name: `#${index + 1} - ${video.title}`,
                        value: `⏳ ${video.duration} • 📤 [${video.uploaderName}](${video.uploaderProfile})\n🔗 [Xem video](${video.video})`
                    });
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Lỗi khi tìm kiếm:', error);
                await interaction.editReply('❌ Đã xảy ra lỗi khi tìm kiếm.');
            }

        } else if (subcommand === 'download') {
            const videoUrl = interaction.options.getString('url');
            const apiUrl = `https://markdevs-last-api-p2y6.onrender.com/xnxx/download?url=${encodeURIComponent(videoUrl)}`;

            await interaction.deferReply();

            try {
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (!data.status || !data.result) {
                    return interaction.editReply('❌ Không thể lấy dữ liệu từ API.');
                }

                const { name, description, thumbnailUrl, contentUrl, interactionStatistic } = data.result;

                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(name)
                    .setDescription(description || 'Không có mô tả')
                    .setThumbnail(thumbnailUrl[0])
                    .addFields(
                        { name: '📅 Ngày upload', value: data.result.uploadDate || 'Không rõ', inline: true },
                        { name: '👀 Lượt xem', value: interactionStatistic?.userInteractionCount || 'Không rõ', inline: true },
                        { name: '🔗 Link tải HD', value: `[Nhấn để tải](${contentUrl.HD_Quality})` },
                        { name: '📂 Link tải Low', value: `[Nhấn để tải](${contentUrl.Low_Quality})` }
                    )
                    .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Lỗi khi tải video:', error);
                await interaction.editReply('❌ Đã xảy ra lỗi khi tải video.');
            }
        }
    },
};
