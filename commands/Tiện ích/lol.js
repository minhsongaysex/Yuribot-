const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lol')
        .setDescription('Lấy thông tin về tướng trong Liên Minh Huyền Thoại')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Xem danh sách tất cả tướng'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('champion')
                .setDescription('Xem thông tin chi tiết của một tướng')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tên tướng')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'list') {
                const apiUrl = 'https://subhatde.id.vn/lol/list';
                const response = await axios.get(apiUrl);
                const data = response.data;

                if (!data || !data.champ_names) {
                    return interaction.editReply('❌ API không trả về danh sách tướng hợp lệ!');
                }

                const embed = new EmbedBuilder()
                    .setColor('Purple')
                    .setTitle('📜 Danh sách tướng Liên Minh Huyền Thoại')
                    .setDescription(`🛡 **Số lượng tướng:** ${data.count}\n\n${data.champ_names.join(', ')}`)
                    .setFooter({ text: 'Dữ liệu từ subhatde.id.vn' });

                await interaction.editReply({ embeds: [embed] });
            }

            else if (subcommand === 'champion') {
                const championName = interaction.options.getString('name');
                const apiUrl = `https://subhatde.id.vn/lol?champion=${encodeURIComponent(championName)}`;
                const response = await axios.get(apiUrl);
                const champ = response.data;

                if (!champ || !champ.name) {
                    return interaction.editReply(`❌ Không tìm thấy tướng **${championName}**!`);
                }

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle(`🛡 ${champ.name} - Thông tin`)
                    .setThumbnail(champ.images)
                    .addFields(
                        { name: '❤️ Máu', value: `${champ.hp} (+${champ.hp_gain_per_lvl}/lvl)`, inline: true },
                        { name: '🛡 Giáp', value: `${champ.armor} (+${champ.armor_gain_per_lvl}/lvl)`, inline: true },
                        { name: '🌀 Kháng phép', value: `${champ.magic_resist} (+${champ.magic_resist_gain_per_lvl}/lvl)`, inline: true },
                        { name: '⚔ Sát thương', value: `${champ.attack_damage} (+${champ.attack_damage_gain_per_lvl}/lvl)`, inline: true },
                        { name: '⚡ Tốc đánh', value: `${champ.attack_speed} (+${champ.attack_speed_gain_per_lvl}/lvl)`, inline: true },
                        { name: '🏃 Tốc độ di chuyển', value: `${champ.movement_speed}`, inline: true }
                    )
                    .setFooter({ text: 'Dữ liệu từ subhatde.id.vn' });

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi lấy dữ liệu từ API!');
        }
    }
};
