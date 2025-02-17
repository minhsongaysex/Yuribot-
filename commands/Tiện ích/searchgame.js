const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const API_ENDPOINTS = {
    apkmody: "https://api.siputzx.my.id/api/apk/apkmody?search=",
    happymod: "https://api.siputzx.my.id/api/apk/happymod?search=",
    playstore: "https://api.siputzx.my.id/api/apk/playstore?query=",
    appstore: "https://api.siputzx.my.id/api/apk/appstore?search="
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('searchgame')
        .setDescription('Tìm kiếm game trên nhiều nền tảng')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Tên game cần tìm kiếm')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const gameName = interaction.options.getString('game');
        let results = [];

        for (const [platform, url] of Object.entries(API_ENDPOINTS)) {
            try {
                const response = await fetch(url + encodeURIComponent(gameName));
                const data = await response.json();
                if (data.status && data.data.length > 0) {
                    results.push(`**${platform.toUpperCase()}**`);
                    data.data.slice(0, 3).forEach(game => {
                        results.push(`🎮 **${game.title}** (v${game.version})\n🔗 [Tải ngay](${game.link})\n⭐ Đánh giá: ${game.rating.stars} sao`);
                    });
                }
            } catch (error) {
                console.error(`Lỗi khi lấy dữ liệu từ ${platform}:`, error);
            }
        }

        if (results.length === 0) {
            return interaction.reply({ content: `Không tìm thấy kết quả nào cho **${gameName}**.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Kết quả tìm kiếm cho: ${gameName}`)
            .setDescription(results.join("\n\n"))
            .setColor(0x00AE86);

        await interaction.reply({ embeds: [embed] });
    }
};
