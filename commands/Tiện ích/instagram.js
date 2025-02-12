const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("instagram")
    .setDescription("Tìm kiếm người dùng hoặc lấy thông tin từ Instagram")
    .addSubcommand(subcommand =>
      subcommand
        .setName("search")
        .setDescription("Tìm kiếm người dùng Instagram theo tên")
        .addStringOption(option =>
          option.setName("name")
            .setDescription("Tên người dùng cần tìm")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("info")
        .setDescription("Lấy thông tin chi tiết của một tài khoản Instagram")
        .addStringOption(option =>
          option.setName("username")
            .setDescription("Username của người dùng Instagram")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply(); // Trả lời chờ bot xử lý

    const subcommand = interaction.options.getSubcommand();
    const query = interaction.options.getString(subcommand === "search" ? "name" : "username");

    try {
      if (subcommand === "search") {
        const response = await axios.get(`https://subhatde.id.vn/instagram/search?q=${encodeURIComponent(query)}`);
        const users = response.data;

        if (!users.length) {
          return interaction.editReply("❌ Không tìm thấy người dùng nào với tên này!");
        }

        const user = users[0]; // Lấy người đầu tiên trong danh sách

        const embed = new EmbedBuilder()
          .setColor("#0095F6")
          .setTitle(user.fullName || "Không có tên")
          .setURL(`https://instagram.com/${user.username}`)
          .setDescription(`🔎 **Username**: [${user.username}](https://instagram.com/${user.username})\n🆔 **ID**: ${user.id}`)
          .setThumbnail(user.profilePic)
          .setFooter({ text: "Nguồn: Instagram API" });

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === "info") {
        const response = await axios.get(`https://subhatde.id.vn/instagram/info?q=${encodeURIComponent(query)}`);
        const user = response.data[0];

        if (!user) {
          return interaction.editReply("❌ Không tìm thấy thông tin người dùng!");
        }

        const embed = new EmbedBuilder()
          .setColor("#E1306C")
          .setTitle(user.full_name || "Không có tên")
          .setURL(`https://instagram.com/${user.username}`)
          .setDescription(`🔎 **Username**: [${user.username}](https://instagram.com/${user.username})\n👥 **Follower**: ${user.follower_count}\n👤 **Following**: ${user.following_count}\n📸 **Số bài đăng**: ${user.media_count}\n🔐 **Riêng tư**: ${user.is_private ? "✅ Có" : "❌ Không"}\n✅ **Xác thực**: ${user.is_verified ? "✅ Có" : "❌ Không"}`)
          .setThumbnail(user.hd_profile_pic_url_info.url)
          .setFooter({ text: "Nguồn: Instagram API" });

        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply("❌ Đã xảy ra lỗi! Vui lòng thử lại sau.");
    }
  }
};
