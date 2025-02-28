const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dhbc')
        .setDescription('Chơi trò Đuổi Hình Bắt Chữ!'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const apiUrl = 'https://subhatde.id.vn/game/dhbcv3';
            const response = await axios.get(apiUrl);
            const data = response.data.data;

            if (!data || !data.emoji1 || !data.emoji2 || !data.firstword) {
                return interaction.editReply('❌ API không trả về dữ liệu hợp lệ!');
            }

            const correctAnswer = data.wordcomplete.trim().toLowerCase();
            const questionEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('🔍 Đuổi Hình Bắt Chữ!')
                .setDescription(`🧩 **Gợi ý:** ${data.emoji1} + ${data.emoji2}`)
                .setFooter({ text: 'Trả lời tin nhắn này để đoán từ!' });

            const gameMessage = await interaction.editReply({ embeds: [questionEmbed] });

            // Tạo collector để thu thập câu trả lời từ người chơi
            const filter = msg => msg.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

            collector.on('collect', async msg => {
                const userAnswer = msg.content.trim().toLowerCase();

                if (userAnswer === correctAnswer) {
                    collector.stop(); // Dừng collector khi trả lời đúng

                    // Lấy câu đố mới từ API
                    const newResponse = await axios.get(apiUrl);
                    const newData = newResponse.data.data;
                    const newCorrectAnswer = newData.wordcomplete.trim().toLowerCase();

                    const newEmbed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('✅ Chính xác! Tiếp tục câu đố mới:')
                        .setDescription(`🧩 **Gợi ý:** ${newData.emoji1} + ${newData.emoji2}`)
                        .setFooter({ text: 'Trả lời tin nhắn này để tiếp tục chơi!' });

                    gameMessage.edit({ embeds: [newEmbed] });

                    // Cập nhật câu hỏi mới cho collector
                    collector.resetTimer();
                } else {
                    msg.reply('❌ Sai rồi! Thử lại nào.');
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: '⏳ **Bạn đã hết thời gian!** Trò chơi kết thúc.', embeds: [] });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi lấy câu đố từ API!');
        }
    }
};
