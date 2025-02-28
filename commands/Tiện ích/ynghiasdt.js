const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('SDT')
        .setDescription('Kiểm tra phong thủy số điện thoại.')
        .addStringOption(option =>
            option.setName('number')
                .setDescription('Nhập số điện thoại cần kiểm tra')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const phoneNumber = interaction.options.getString('number');
        const apiUrl = `https://subhatde.id.vn/checkphone?phoneNumber=${encodeURIComponent(phoneNumber)}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data || !data.simNumber) {
                return interaction.editReply('❌ API không trả về dữ liệu hợp lệ!');
            }

            // Lấy thông tin cơ bản
            const { simNumber, price, network, meanings, nodeScore, elementalCompatibility, hexagram } = data;

            // Format cặp số & ý nghĩa
            const pairs = data.numberPairAnalysis.pairs
                .map(pair => `**${pair.pair}** → *${pair.meaning}*`)
                .join('\n');

            // Mệnh hợp & không hợp
            const compatible = elementalCompatibility.compatible.map(e => `✅ **${e.element}** (🌟 ${e.score}/10)`).join('\n') || "Không có";
            const incompatible = elementalCompatibility.incompatible.map(e => `❌ **${e.element}** (⚠️ ${e.score}/10)`).join('\n') || "Không có";

            // Tạo Embed trả về
            const embed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle(`📱 Phong thủy số điện thoại: ${simNumber}`)
                .setDescription(`📡 **Nhà mạng:** ${network}\n💰 **Giá bán:** ${price} VNĐ\n🎯 **Ý nghĩa chính:** ${meanings.join(', ')}`)
                .addFields(
                    { name: '🔢 Cặp số & Ý nghĩa', value: pairs || "Không có dữ liệu", inline: false },
                    { name: '🌟 Điểm phong thủy', value: `${nodeScore.score}/10 - *${nodeScore.meaning}*`, inline: true },
                    { name: '🔥 Hợp với mệnh', value: compatible, inline: true },
                    { name: '💧 Khắc với mệnh', value: incompatible, inline: true },
                    { name: '🔮 Quẻ bói', value: `**${hexagram.name}** (*${hexagram.type}*)\n_${hexagram.meaning}_`, inline: false }
                )
                .setFooter({ text: 'Dữ liệu từ subhatde.id.vn' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi lấy dữ liệu từ API!');
        }
    }
};
