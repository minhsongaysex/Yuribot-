const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soundcloud')
        .setDescription('Tìm kiếm hoặc tải bài hát từ SoundCloud')
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Tìm kiếm bài hát trên SoundCloud')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Nhập tên bài hát bạn muốn tìm')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('download')
                .setDescription('Tải bài hát từ SoundCloud')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('Nhập URL bài hát từ SoundCloud')
                        .setRequired(true))),
    
    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'search') {
            const query = interaction.options.getString('query');
            const searchApiUrl = `https://api.zetsu.xyz/api/scsearch?q=${encodeURIComponent(query)}`;

            try {
                const searchResponse = await axios.get(searchApiUrl);
                if (!searchResponse.data || !searchResponse.data.result || searchResponse.data.result.length === 0) {
                    return interaction.editReply('🚫 Không tìm thấy bài hát nào!');
                }

                // Lấy danh sách tối đa 5 bài hát
                const songs = searchResponse.data.result.slice(0, 5);

                // Tạo Embed danh sách bài hát
                const embed = new EmbedBuilder()
                    .setColor('#ff5500')
                    .setTitle(`🔎 Kết quả tìm kiếm: "${query}"`)
                    .setDescription(songs.map((song, index) => `**${index + 1}.** [${song.title}](${song.link})`).join('\n'))
                    .setFooter({ text: '🎵 Chọn một link để tải về bằng lệnh /soundcloud download <URL>' });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(error);
                interaction.editReply('❌ Có lỗi xảy ra khi tìm kiếm bài hát!');
            }

        } else if (subcommand === 'download') {
            const url = interaction.options.getString('url');
            const downloadApiUrl = `https://api.agatz.xyz/api/soundclouddl?url=${encodeURIComponent(url)}`;

            try {
                const downloadResponse = await axios.get(downloadApiUrl);

                // Kiểm tra phản hồi API có dữ liệu không
                if (!downloadResponse.data || !downloadResponse.data.data || !downloadResponse.data.data.download) {
                    return interaction.editReply('❌ Không thể lấy link tải bài hát!');
                }

                // Lấy dữ liệu bài hát
                const songTitle = downloadResponse.data.data.title;
                const songDuration = downloadResponse.data.data.duration;
                const songQuality = downloadResponse.data.data.quality;
                const songThumbnail = downloadResponse.data.data.thumbnail;
                const mp3Url = downloadResponse.data.data.download;

                const filePath = path.join(__dirname, 'downloaded.mp3');

                // Tải file MP3
                const mp3Response = await axios.get(mp3Url, { responseType: 'arraybuffer' });
                fs.writeFileSync(filePath, mp3Response.data);

                // Tạo attachment để gửi file nhạc lên Discord
                const attachment = new AttachmentBuilder(filePath, { name: `${songTitle}.mp3` });

                // Gửi embed kèm file
                const embed = new EmbedBuilder()
                    .setColor('#ff5500')
                    .setTitle('📥 Tải xuống thành công!')
                    .setDescription(`**🎵 Bài Hát:** ${songTitle}\n⏳ **Thời lượng:** ${songDuration}\n🔊 **Chất lượng:** ${songQuality}`)
                    .setThumbnail(songThumbnail)
                    .setFooter({ text: '🚀 Hãy thưởng thức bài hát của bạn!' });

                await interaction.editReply({ embeds: [embed], files: [attachment] });

                // Xóa file sau khi gửi để tiết kiệm bộ nhớ
                setTimeout(() => {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Lỗi khi xóa file:', err);
                    });
                }, 5000); // Xóa sau 5 giây

            } catch (error) {
                console.error(error);
                interaction.editReply('❌ Có lỗi xảy ra khi tải bài hát!');
            }
        }
    }
};

