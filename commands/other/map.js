const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('Tìm kiếm địa điểm trên Google Maps.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nhập địa điểm cần tìm')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');

        const apiUrl = 'https://google.serper.dev/maps';
        const apiKey = '1065458b8210534712e88b7254940292a5b1597f';

        const requestData = {
            q: query,
            hl: 'vi'
        };

        try {
            const response = await axios.post(apiUrl, requestData, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            if (!data.places || data.places.length === 0) {
                return interaction.editReply('❌ Không tìm thấy địa điểm nào phù hợp!');
            }

            const place = data.places[0]; // Lấy kết quả đầu tiên
            const googleMapsLink = `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`📍 ${place.title}`)
                .setDescription(`🗺 **Địa chỉ:** ${place.address}\n📌 **Tọa độ:** ${place.latitude}, ${place.longitude}`)
                .setURL(googleMapsLink)
                .setFooter({ text: `Google Maps | Độ tín dụng còn lại: ${data.credits}` });

            if (place.thumbnailUrl) {
                embed.setThumbnail(place.thumbnailUrl);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi lấy dữ liệu từ Google Maps!');
        }
    }
};
