const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getimg')
        .setDescription('Tìm kiếm hình ảnh từ API')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nhập từ khóa tìm kiếm ảnh')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiUrl = `https://sandipbaruwal.onrender.com/image?name=${encodeURIComponent(query)}`;

        try {
            // Gọi API để lấy danh sách hình ảnh
            const response = await axios.get(apiUrl);
            const images = response.data.images;

            if (!images || images.length === 0) {
                return interaction.editReply('🚫 Không tìm thấy hình ảnh nào!');
            }

            // Chọn một hình ảnh ngẫu nhiên từ danh sách API trả về
            const randomImage = images[Math.floor(Math.random() * images.length)];

            // Tạo Embed chứa hình ảnh
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🔎 Kết quả tìm kiếm: "${query}"`)
                .setImage(randomImage)
                .setFooter({ text: '📸 Hình ảnh được lấy từ API' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.editReply('❌ Có lỗi xảy ra khi tìm kiếm hình ảnh!');
        }
    }
};
