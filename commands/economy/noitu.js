const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('noituvuive')
        .setDescription('Chơi trò nối từ với bot')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('Nhập từ để bắt đầu')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        let word = interaction.options.getString('word'); // Từ người chơi nhập ban đầu

        try {
            let apiUrl = `https://subhatde.id.vn/game/linkword?word=${encodeURIComponent(word)}`;
            let response = await axios.get(apiUrl);

            if (response.data.error) {
                return interaction.editReply(`❌ **Lỗi:** ${response.data.error}`);
            }

            let data = response.data.data;
            let botWord = data.text; // Từ của bot
            let expectedHead = data.tail; // Người chơi phải nối tiếp bằng từ bắt đầu với phần cuối của từ bot

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('🔗 Trò chơi nối từ')
                .setDescription(`
                    📝 **Từ của bạn:** ${word}
                    🤖 **Từ của bot:** ${botWord}
                    🔄 **Hãy nối tiếp bằng một từ bắt đầu với: "${expectedHead}"!**
                    
                    ⏳ Bạn có **30 giây** để phản hồi!
                `)
                .setFooter({ text: 'Trả lời tin nhắn này để tiếp tục nối từ!' });

            await interaction.editReply({ embeds: [embed] });

            // Thu thập phản hồi từ người chơi
            const filter = msg => msg.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

            collector.on('collect', async msg => {
                let playerWord = msg.content.trim();

                // Kiểm tra nếu từ người chơi không bắt đầu bằng phần cuối của từ bot
                if (!playerWord.startsWith(expectedHead + " ")) {
                    return msg.reply(`❌ **Từ của bạn phải bắt đầu bằng "${expectedHead}"!**`);
                }

                try {
                    apiUrl = `https://subhatde.id.vn/game/linkword?word=${encodeURIComponent(playerWord)}`;
                    response = await axios.get(apiUrl);

                    if (response.data.error) {
                        return msg.reply(`❌ **Lỗi:** ${response.data.error}`);
                    }

                    data = response.data.data;
                    botWord = data.text;
                    expectedHead = data.tail;

                    // Cập nhật Embed với từ mới
                    const newEmbed = new EmbedBuilder()
                        .setColor('Blue')
                        .setTitle('🔗 Trò chơi nối từ')
                        .setDescription(`
                            📝 **Từ của bạn:** ${playerWord}
                            🤖 **Từ của bot:** ${botWord}
                            🔄 **Hãy nối tiếp bằng một từ bắt đầu với: "${expectedHead}"!**
                            
                            ⏳ Bạn có **30 giây** để phản hồi!
                        `)
                        .setFooter({ text: 'Trả lời tin nhắn này để tiếp tục nối từ!' });

                    await interaction.editReply({ embeds: [newEmbed] });

                } catch (error) {
                    console.error(error);
                    return msg.reply('❌ Có lỗi xảy ra khi kiểm tra từ nối tiếp!');
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: '⏳ **Bạn đã hết thời gian!** Trò chơi kết thúc.', embeds: [] });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi gọi API nối từ!');
        }
    }
};
