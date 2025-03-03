const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tientri')
        .setDescription('Tiên tri về bạn')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Chọn người muốn tiên tri')
                .setRequired(false)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const name = target.username;
        const avatar = target.displayAvatarURL({ format: 'png', size: 512 });
        
        const nn = ["Kế toán", "Ca sĩ", "Thợ sửa ổ khóa", "Bán ve chai", "Đào mỏ", "Bác sĩ", "Streamer", "Tài xế", "Youtuber", "Giang hồ", "Nhà tiên tri"];
        const randomStat = () => Math.floor(Math.random() * 101);
        const chet = Math.floor(Math.random() * 150);

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle(`🔮 Tiên Tri Về ${name}`)
            .setThumbnail(avatar)
            .addFields(
                { name: '🧠 Thông Minh', value: `${randomStat()}%`, inline: true },
                { name: '🎀 Nghề Nghiệp', value: nn[Math.floor(Math.random() * nn.length)], inline: true },
                { name: '💪 Sức Mạnh', value: `${randomStat()}%`, inline: true },
                { name: '🧛‍♂️ Sinh Tồn', value: `${randomStat()}%`, inline: true },
                { name: '🧟‍♀️ Trình Xạo Lồn', value: `${randomStat()}%`, inline: true },
                { name: '💸 Sự Giàu Có', value: `${randomStat()}%`, inline: true },
                { name: '⏳ Tuổi Thọ', value: `${chet}`, inline: true }
            )
            .setFooter({ text: 'Dự đoán bởi Nhà Tiên Tri', iconURL: avatar });
        
        await interaction.reply({ embeds: [embed] });
    }
};
