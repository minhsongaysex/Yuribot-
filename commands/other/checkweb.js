const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkweb')
        .setDescription('Kiểm tra độ uy tín của một trang web')
        .addStringOption(option => 
            option.setName('domain')
                .setDescription('Nhập tên miền cần kiểm tra')
                .setRequired(true)
        ),

    async execute(interaction) {
        const domain = interaction.options.getString('domain');
        await interaction.deferReply(); // Tránh bị timeout khi lấy dữ liệu

        try {
            const res = await axios.get(`https://scam.vn/check-website?domain=${encodeURIComponent(domain)}`);
            const dom = cheerio.load(res.data);
            const div = dom('.container.text-center');

            const date_register = div.find('div:eq(0) > div:eq(0) > h6').text().split(' ').pop();
            const [like, dis_like] = ['#improve_web', '#report_web'].map($ => div.find(`${$} > span`).text());
            const do_tin_cay = div.find('.col-md-12.bg-warning.p-3 > a').text();
            const warn = [0, 1].map($ => div.find('.col-md-6.mt-2').eq($).text().trim());

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📊 Kiểm Tra Độ Uy Tín Web')
                .addFields(
                    { name: '🌍 Tên Miền', value: domain, inline: true },
                    { name: '📆 Ngày Đăng Ký', value: date_register || 'Không rõ', inline: true },
                    { name: '👍 Lượt Thích', value: like || '0', inline: true },
                    { name: '👎 Lượt Không Thích', value: dis_like || '0', inline: true },
                    { name: '🧠 Độ Tin Cậy', value: do_tin_cay || 'Không có thông tin', inline: false },
                    { name: '⚠️ Cảnh Báo', value: warn.join('\n') || 'Không có cảnh báo', inline: false }
                )
                .setFooter({ text: 'Nguồn: scam.vn', iconURL: 'https://scam.vn/favicon.ico' });
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Lỗi khi kiểm tra web:', error);
            await interaction.editReply('❌ Không thể lấy thông tin trang web. Hãy thử lại sau!');
        }
    }
};
