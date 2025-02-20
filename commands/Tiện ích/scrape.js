const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scrape')
        .setDescription('Scrape một trang web và trích xuất thông tin meta')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Nhập URL của trang web cần scrape')
                .setRequired(true)),
    
    async execute(interaction) {
        const url = interaction.options.getString('url');
        const apiURL = `https://kaiz-apis.gleeze.com/api/scrape?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiURL);
            const result = response.data;

            if (!result || !result.data) {
                return interaction.reply({ content: 'Không thể lấy dữ liệu từ URL này.', ephemeral: true });
            }

            const htmlContent = result.data;

            // Trích xuất thông tin meta phổ biến với các regex cơ bản
            const titleMatch = htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            const imageMatch = htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
            const urlMatch = htmlContent.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
            const descriptionMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

            const title = titleMatch ? titleMatch[1] : 'Không tìm thấy tiêu đề';
            const image = imageMatch ? imageMatch[1] : null;
            const webpageUrl = urlMatch ? urlMatch[1] : url;
            const description = descriptionMatch ? descriptionMatch[1] : '';

            // Tạo embed hiển thị thông tin thu được
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(title)
                .setURL(webpageUrl)
                .setDescription(description)
                .setFooter({ text: 'Scraped via Kaiz-APIs' })
                .setTimestamp();

            if (image) embed.setThumbnail(image);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({ content: 'Có lỗi khi scrape dữ liệu.', ephemeral: true });
        }
    },
};
