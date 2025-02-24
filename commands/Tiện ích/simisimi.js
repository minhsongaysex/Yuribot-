const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sim')
        .setDescription('Giao tiếp với Sim')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ask')
                .setDescription('Hỏi Sim một câu hỏi')
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('Nhập câu hỏi của bạn')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('teach')
                .setDescription('Dạy Sim một câu hỏi và câu trả lời mới')
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('Nhập câu hỏi mới')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('answer')
                        .setDescription('Nhập câu trả lời của Sim')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'ask') {
                const question = encodeURIComponent(interaction.options.getString('question'));
                const apiUrl = `https://subhatde.id.vn/sim?type=ask&ask=${question}`;
                const response = await axios.get(apiUrl);

                if (!response.data.answer) {
                    return interaction.editReply('❌ Sim không có câu trả lời cho câu hỏi này!');
                }

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('🗣 Hỏi Sim')
                    .setDescription(`**❓ Bạn:** ${decodeURIComponent(question)}\n**🤖 Sim:** ${response.data.answer}`)
                    .setFooter({ text: 'Dữ liệu từ subhatde.id.vn' });

                await interaction.editReply({ embeds: [embed] });
            }

            else if (subcommand === 'teach') {
                const question = encodeURIComponent(interaction.options.getString('question'));
                const answer = encodeURIComponent(interaction.options.getString('answer'));
                const apiUrl = `https://subhatde.id.vn/sim?type=teach&ask=${question}&ans=${answer}`;
                const response = await axios.get(apiUrl);

                if (response.data.error) {
                    return interaction.editReply(`❌ **Lỗi:** ${response.data.error}`);
                }

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('📚 Dạy Sim')
                    .setDescription(`✅ **Dạy Sim thành công!**\n\n**❓ Câu hỏi:** ${decodeURIComponent(question)}\n**💬 Trả lời:** ${decodeURIComponent(answer)}`)
                    .setFooter({ text: 'Dữ liệu từ subhatde.id.vn' });

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi gọi API Sim!');
        }
    }
};
