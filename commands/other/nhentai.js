const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nhentai')
        .setDescription('Lấy thông tin doujinshi từ WholesomeList!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('Lấy một doujinshi ngẫu nhiên'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('random-licensed')
                .setDescription('Lấy một doujinshi có bản quyền'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Tìm doujinshi theo mã 6 chữ số')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Nhập mã doujinshi (6 chữ số)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('updates')
                .setDescription('Xem các doujinshi mới cập nhật'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('features')
                .setDescription('Xem danh sách doujinshi nổi bật'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Xem danh sách doujinshi gợi ý')),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        let apiUrl = '';

        switch (subcommand) {
            case 'random':
                apiUrl = 'https://wholesomelist.com/api/random';
                break;
            case 'random-licensed':
                apiUrl = 'https://wholesomelist.com/api/random-licensed';
                break;
            case 'updates':
                apiUrl = 'https://wholesomelist.com/api/updates';
                break;
            case 'features':
                apiUrl = 'https://wholesomelist.com/api/features';
                break;
            case 'list':
                apiUrl = 'https://wholesomelist.com/api/list';
                break;
            case 'check':
                const code = interaction.options.getString('code');
                if (!/^\d{6}$/.test(code)) {
                    return interaction.editReply('❌ Vui lòng nhập mã **6 chữ số hợp lệ**!');
                }
                apiUrl = `https://wholesomelist.com/api/check?code=${code}`;
                break;
            default:
                return interaction.editReply('❌ Lệnh không hợp lệ!');
        }

        try {
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data || (!data.entry && !data.table)) {
                return interaction.editReply('❌ Không tìm thấy thông tin!');
            }

            let embed;

            if (data.entry) {
                let links = [];
                if (data.entry.nh) links.push(`[Nhentai](${data.entry.nh})`);
                if (data.entry.eh) links.push(`[E-Hentai](${data.entry.eh})`);
                if (data.entry.hm) links.push(`[HMarket](${data.entry.hm})`);

                embed = new EmbedBuilder()
                    .setColor('Purple')
                    .setTitle(`📖 ${data.entry.title}`)
                    .setURL(data.entry.link)
                    .setDescription(`🔹 **Tác giả:** ${data.entry.author}\n🔹 **Tier:** ${data.entry.tier}\n🔹 **Số trang:** ${data.entry.pages}\n🔹 **Tags:** ${data.entry.siteTags.tags.join(', ') || 'Không có'}`)
                    .setThumbnail(data.entry.image)
                    .addFields({ name: '📌 Link', value: links.length > 0 ? links.join(' | ') : 'Không có' })
                    .setFooter({ text: 'Dữ liệu từ WholesomeList' });

            } else if (data.table) {
                const doujinList = data.table.slice(0, 5).map(d =>
                    `📖 [${d.title}](${d.link}) - **${d.tier}**\n👤 **Tác giả:** ${d.author}`
                ).join('\n\n');

                embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle(`📚 Danh sách doujinshi`)
                    .setDescription(doujinList)
                    .setFooter({ text: 'Dữ liệu từ WholesomeList' });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Lỗi khi gọi API hoặc mã không tồn tại!');
        }
    }
};

