const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mihoyo')
        .setDescription('Lấy thông tin từ HoYoverse API')
        .addSubcommand(subcommand =>
            subcommand
                .setName('codes')
                .setDescription('Lấy mã code đổi quà từ HoYoverse')
                .addStringOption(option =>
                    option.setName('game')
                        .setDescription('Chọn game để lấy code')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Genshin Impact', value: 'genshin' },
                            { name: 'Honkai: Star Rail', value: 'starrail' },
                            { name: 'Honkai Impact 3rd', value: 'honkai' },
                            { name: 'Zenless Zone Zero', value: 'zenless' },
                            { name: 'Tears of Themis', value: 'themis' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('calendar')
                .setDescription('Lấy lịch sự kiện từ HoYoverse')
                .addStringOption(option =>
                    option.setName('game')
                        .setDescription('Chọn game để xem lịch sự kiện')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Genshin Impact', value: 'genshin' },
                            { name: 'Honkai: Star Rail', value: 'starrail' },
                            { name: 'Honkai Impact 3rd', value: 'honkai' },
                            { name: 'Zenless Zone Zero', value: 'zenless' },
                            { name: 'Tears of Themis', value: 'themis' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const game = interaction.options.getString('game');

        if (subcommand === 'codes') {
            const apiUrl = `https://api.ennead.cc/mihoyo/${game}/codes`;

            try {
                const response = await axios.get(apiUrl);
                const codes = response.data.active || [];

                if (codes.length === 0) {
                    return interaction.editReply(`🚫 Không có mã code nào khả dụng cho **${game}**!`);
                }

                // Format danh sách code + phần thưởng
                const codeList = codes.map((code, index) =>
                    `**${index + 1}.** \`${code.code}\`\n🎁 ${code.rewards.join(', ')}`).join('\n\n');

                // Gửi Embed
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`🎁 Mã Code HoYoverse - ${game}`)
                    .setDescription(codeList)
                    .setFooter({ text: 'Cập nhật mới nhất từ HoYoverse API' });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(error);
                await interaction.editReply('❌ Có lỗi xảy ra khi lấy mã code từ API!');
            }
        }

        else if (subcommand === 'calendar') {
            const apiUrl = `https://api.ennead.cc/mihoyo/${game}/calendar`;

            try {
                const response = await axios.get(apiUrl);
                const events = response.data.events || [];

                if (events.length === 0) {
                    return interaction.editReply(`🚫 Hiện không có sự kiện nào cho **${game}**!`);
                }

                // Hiển thị tối đa 3 sự kiện mới nhất
                const eventList = events.slice(0, 3).map(event => {
                    return {
                        name: `🎉 **${event.name}**`,
                        value: `🗓 **Bắt đầu:** <t:${Math.floor(event.start_time)}>\n⏳ **Kết thúc:** <t:${Math.floor(event.end_time)}>\n🔍 ${event.description}`,
                        image: event.image || null // Lấy ảnh nếu có
                    };
                });

                // Tạo Embed
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`📅 Lịch sự kiện - ${game}`)
                    .setDescription(eventList.map(event => `${event.name}\n${event.value}`).join('\n\n'))
                    .setFooter({ text: 'Cập nhật mới nhất từ HoYoverse API' });

                // Nếu có ảnh, thêm vào Embed
                if (eventList[0].image) {
                    embed.setImage(eventList[0].image);
                }

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(error);
                await interaction.editReply('❌ Có lỗi xảy ra khi lấy lịch sự kiện từ API!');
            }
        }
    }
};
