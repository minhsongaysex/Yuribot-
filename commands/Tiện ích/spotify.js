const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spotify")
    .setDescription("Tìm kiếm và tải nhạc từ Spotify")
    .addSubcommand(subcommand =>
      subcommand
        .setName("search")
        .setDescription("Tìm kiếm bài hát trên Spotify bằng lời nhạc")
        .addStringOption(option =>
          option.setName("lyrics")
            .setDescription("Nhập một phần lời bài hát")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("download")
        .setDescription("Tải nhạc từ Spotify bằng link bài hát")
        .addStringOption(option =>
          option.setName("song_link")
            .setDescription("URL bài hát trên Spotify")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply(); // Hiển thị trạng thái bot đang xử lý

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "search") {
      const lyrics = interaction.options.getString("lyrics");

      try {
        const response = await axios.get(`https://kaiz-apis.gleeze.com/api/spotify-search?q=${encodeURIComponent(lyrics)}`);
        const song = response.data[0]; // Lấy bài hát đầu tiên trong danh sách

        if (!song || !song.trackUrl) {
          return interaction.editReply("❌ Không tìm thấy bài hát nào phù hợp với lời nhạc này.");
        }

        const embed = new EmbedBuilder()
          .setColor("#1DB954")
          .setTitle(song.title)
          .setURL(song.trackUrl)
          .setDescription(`🎤 **Nghệ sĩ**: ${song.author || "Không rõ"}\n📅 **Phát hành**: ${song.release_date || "Không rõ"}\n🕒 **Thời lượng**: ${song.duration || "Không rõ"}`)
          .setThumbnail(song.thumbnail)
          .setFooter({ text: "Nguồn: Spotify API" });

        return interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        return interaction.editReply("❌ Đã xảy ra lỗi khi tìm kiếm bài hát! Vui lòng thử lại sau.");
      }
    }

    if (subcommand === "download") {
      const songLink = interaction.options.getString("song_link");

      try {
        const response = await axios.get(`https://kaiz-apis.gleeze.com/api/spotify-down?url=${encodeURIComponent(songLink)}`);
        const songData = response.data;

        if (!songData.attachments || !songData.attachments[0] || !songData.attachments[0].url) {
          return interaction.editReply("❌ Không thể tải bài hát này.");
        }

        const audioUrl = songData.attachments[0].url;
        const fileName = `spotify_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, "..", "downloads", fileName);

        const writer = fs.createWriteStream(filePath);
        const { data } = await axios.get(audioUrl, { responseType: "stream" });
        data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const file = new AttachmentBuilder(filePath, { name: `${songData.title}.mp3` });

        const embed = new EmbedBuilder()
          .setColor("#1DB954")
          .setTitle(songData.title)
          .setURL(songData.trackUrl)
          .setDescription(`🎤 **Nghệ sĩ**: ${songData.author || "Không rõ"}\n📅 **Phát hành**: ${songData.release_date || "Không rõ"}\n🕒 **Thời lượng**: ${songData.duration || "Không rõ"}`)
          .setThumbnail(songData.thumbnail)
          .setFooter({ text: "Nguồn: Spotify API" });

        await interaction.editReply({ embeds: [embed], files: [file] });

        // Xóa file sau khi gửi
        setTimeout(() => fs.unlinkSync(filePath), 30000);
      } catch (error) {
        console.error(error);
        return interaction.editReply("❌ Đã xảy ra lỗi khi tải bài hát! Vui lòng thử lại sau.");
      }
    }
  }
};
