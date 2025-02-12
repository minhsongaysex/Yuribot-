const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundcloud')
    .setDescription('Tải và gửi nhạc từ SoundCloud')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Nhập link bài hát trên SoundCloud')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply(); // Chờ bot xử lý

    const url = interaction.options.getString('url');
    const apiUrl = `https://subhatde.id.vn/scl/download?url=${encodeURIComponent(url)}`;

    try {
      // Gọi API để lấy thông tin bài hát
      const response = await axios.get(apiUrl);
      if (!response.data || !response.data.attachments || response.data.attachments.length === 0) {
        return interaction.editReply('Không tìm thấy bài hát hoặc không thể tải xuống!');
      }

      const song = response.data;
      const songUrl = song.attachments[0].url; // Đường dẫn tải file
      const filePath = path.join(__dirname, 'soundcloud_song.mp3');

      // Tải file nhạc về
      const fileResponse = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(filePath);
      fileResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Kiểm tra kích thước file (Discord giới hạn 25MB cho tài khoản thường, 50MB cho Nitro)
      const fileSize = fs.statSync(filePath).size / (1024 * 1024); // Đổi sang MB
      if (fileSize > 25) {
        const compressedPath = path.join(__dirname, 'compressed_song.mp3');
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -i ${filePath} -b:a 128k ${compressedPath}`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        fs.unlinkSync(filePath); // Xóa file gốc
        filePath = compressedPath;
      }

      // Gửi file nhạc lên Discord
      const attachment = new AttachmentBuilder(filePath, { name: 'soundcloud_song.mp3' });
      await interaction.editReply({
        content: `🎶 **${song.title}** của ${song.author} đã được tải về!`,
        files: [attachment]
      });

      fs.unlinkSync(filePath); // Xóa file sau khi gửi
    } catch (error) {
      console.error(error);
      interaction.editReply('Có lỗi xảy ra khi tải bài hát!');
    }
  }
};
