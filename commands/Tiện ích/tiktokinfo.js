const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tiktok")
    .setDescription("Lấy thông tin chi tiết từ TikTok")
    .addSubcommand(subcommand =>
      subcommand
        .setName("info")
        .setDescription("Lấy thông tin người dùng TikTok")
        .addStringOption(option =>
          option.setName("username")
            .setDescription("Username của TikTok")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply(); // Hiển thị trạng thái bot đang xử lý

    const username = interaction.options.getString("username");

    try {
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/tikstalk?username=${encodeURIComponent(username)}`);
      const user = response.data;

      if (!user.username) {
        return interaction.editReply("❌ Không tìm thấy người dùng TikTok này!");
      }

      const embed = new EmbedBuilder()
        .setColor("#FF0050")
        .setTitle(user.nickname || user.username)
        .setURL(`https://www.tiktok.com/@${user.username}`)
        .setDescription(`🆔 **ID**: ${user.id}\n📌 **Username**: [@${user.username}](https://www.tiktok.com/@${user.username})\n🔹 **Tiểu sử**:\n\`\`\`${user.signature || "Không có"}\`\`\``)
        .setThumbnail(user.avatarLarger)
        .addFields(
          { name: "📽️ Số video", value: `${user.videoCount}`, inline: true },
          { name: "👥 Người theo dõi", value: `${user.followerCount}`, inline: true },
          { name: "👤 Đang theo dõi", value: `${user.followingCount}`, inline: true },
          { name: "❤️ Tổng tim", value: `${user.heartCount}`, inline: true }
        )
        .setFooter({ text: "Nguồn: TikTok API" });

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.editReply("❌ Đã xảy ra lỗi! Vui lòng thử lại sau.");
    }
  }
};
