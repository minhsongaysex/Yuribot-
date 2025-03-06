const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imgur')
        .setDescription('Tải ảnh/GIF/video lên Imgur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('upload')
                .setDescription('Nhập lệnh trước, sau đó trả lời tin nhắn bot với hình ảnh!')),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.user;
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('=== [ 𝗜𝗠𝗚𝗨𝗥 𝗨𝗣𝗟𝗢𝗔𝗗 ] ===')
            .setDescription(`━━━━━━━━━━━━━━━━━━\n[🍑] → **Người Dùng:** ${user.username}\n[🥨] → **Vào Lúc:** ${hours}:${minutes}:${seconds}\n[🖼] **Vui lòng trả lời tin nhắn này với ảnh/GIF/video để tải lên Imgur!**\n⏳ Bạn có **30 giây** để gửi tệp.\n━━━━━━━━━━━━━━━━━━`)
            .setFooter({ text: 'Chỉ hỗ trợ ảnh, GIF và video!' });

        // Gửi tin nhắn và lưu ID của nó để xử lý phản hồi
        const botMessage = await interaction.editReply({ embeds: [embed] });

        // Chờ người dùng trả lời tin nhắn này với ảnh/GIF/video
        const filter = response => response.reference?.messageId === botMessage.id && response.attachments.size > 0;
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

        collector.on('collect', async response => {
            collector.stop(); // Dừng thu thập phản hồi sau khi nhận được tin nhắn đầu tiên

            let uploadedLinks = [];
            let failedCount = 0;

            for (const attachment of response.attachments.values()) {
                try {
                    const imgurResponse = await axios.get(`https://subhatde.id.vn/imgur?link=${encodeURIComponent(attachment.url)}`);
                    uploadedLinks.push(imgurResponse.data.url);
                } catch (error) {
                    console.error(`Lỗi khi tải lên Imgur:`, error);
                    failedCount++;
                }
            }

            if (!uploadedLinks.length) {
                return response.reply('❌ Không thể tải lên bất kỳ file nào!');
            }

            const resultEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('=== [ 𝗜𝗠𝗚𝗨𝗥 𝗨𝗣𝗟𝗢𝗔𝗗 𝗛𝗢𝗔̀𝗡 𝗧𝗔̂́𝗧 ] ===')
                .setDescription(`━━━━━━━━━━━━━━━━━━\n[🍑] → **Người Dùng:** ${user.username}\n[🥨] → **Vào Lúc:** ${hours}:${minutes}:${seconds}\n[🍒] → **Thành Công:** ${uploadedLinks.length}\n[🫐] → **Thất Bại:** ${failedCount}\n━━━━━━━━━━━━━━━━━━`)
                .addFields(uploadedLinks.map((link, index) => ({ name: `📸 File ${index + 1}`, value: `[Xem trên Imgur](${link})`, inline: true })))
                .setFooter({ text: 'Ảnh/GIF/video đã tải lên thành công!' });

            await response.reply({ embeds: [resultEmbed] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '⏳ **Bạn đã hết thời gian!** Hãy nhập lệnh lại nếu muốn thử lại.', embeds: [] });
            }
        });
    }
};
