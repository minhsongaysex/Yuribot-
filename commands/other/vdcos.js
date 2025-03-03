const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vdcos')
        .setDescription('Gửi một video cosplay ngẫu nhiên!'),

    async execute(interaction) {
        await interaction.deferReply();

        // Danh sách link video cosplay
        const links = [
            "https://duongkum999.tech/cos/01enm1R.mp4",
            "https://duongkum999.tech/cos/02poLSP.mp4",
            "https://duongkum999.tech/cos/0au0egg.mp4",
            "https://duongkum999.tech/cos/0DhSnO5.mp4",
            "https://duongkum999.tech/cos/0mwwku.mp4",
            "https://duongkum999.tech/cos/0SQnk77.mp4",
            "https://duongkum999.tech/cos/0tlz67.mp4",
            "https://duongkum999.tech/cos/0xud45.mp4",
            "https://duongkum999.tech/cos/1008326870645804.mp4",
        ];

        // Chọn một video ngẫu nhiên
        const randomVideo = links[Math.floor(Math.random() * links.length)];

        // Tải video về tạm thời
        const filePath = path.join(__dirname, "vdcos.mp4");

        try {
            const response = await axios.get(randomVideo, { responseType: 'stream' });
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            writer.on('finish', async () => {
                const attachment = new AttachmentBuilder(filePath, { name: 'vdcos.mp4' });

                await interaction.editReply({
                    content: `🎥 **Đây là video cosplay ngẫu nhiên!**\nSố video hiện có: ${links.length}`,
                    files: [attachment]
                });

                // Xóa file sau khi gửi để tiết kiệm bộ nhớ
                fs.unlinkSync(filePath);
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply("❌ **Có lỗi xảy ra khi gửi video cosplay!**");
        }
    }
};
