const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const API_ENDPOINTS = {
    github: "https://api.siputzx.my.id/api/stalk/github?user=",
    npm: "https://api.siputzx.my.id/api/stalk/npm?packageName=",
    tiktok: "https://kaiz-apis.gleeze.com/api/tikstalk?username="
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stalk")
        .setDescription("Lấy thông tin người dùng từ các nền tảng")
        .addStringOption(option =>
            option.setName("platform")
                .setDescription("Nền tảng cần lấy thông tin (github, npm, tiktok)")
                .setRequired(true)
                .addChoices(
                    { name: "GitHub", value: "github" },
                    { name: "NPM", value: "npm" },
                    { name: "TikTok", value: "tiktok" }
                )
        )
        .addStringOption(option =>
            option.setName("username")
                .setDescription("Tên người dùng hoặc gói cần tìm kiếm")
                .setRequired(true)
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        const platform = interaction.options.getString("platform");
        const username = interaction.options.getString("username");
        const url = API_ENDPOINTS[platform] + encodeURIComponent(username);

        try {
            const response = await axios.get(url);
            const data = response.data;
            
            if (!data.status) {
                return interaction.editReply({ content: `Không tìm thấy thông tin cho **${username}** trên **${platform}**.`, ephemeral: true });
            }

            let embed = new EmbedBuilder().setColor("#00AE86");
            
            if (platform === "github") {
                embed.setTitle(`GitHub: ${data.data.nickname}`)
                     .setURL(data.data.url)
                     .setThumbnail(data.data.profile_pic)
                     .addFields(
                         { name: "Công ty", value: data.data.company || "N/A", inline: true },
                         { name: "Blog", value: data.data.blog || "N/A", inline: true },
                         { name: "Người theo dõi", value: `${data.data.followers}`, inline: true },
                         { name: "Kho lưu trữ công khai", value: `${data.data.public_repo}`, inline: true },
                         { name: "Tham gia từ", value: new Date(data.data.created_at).toLocaleDateString(), inline: true }
                     );
            } else if (platform === "npm") {
                embed.setTitle(`NPM Package: ${data.data.name}`)
                     .addFields(
                         { name: "Phiên bản mới nhất", value: data.data.versionLatest, inline: true },
                         { name: "Lần cập nhật gần nhất", value: new Date(data.data.latestPublishTime).toLocaleString(), inline: true },
                         { name: "Số lần cập nhật", value: `${data.data.versionUpdate}`, inline: true }
                     );
            } else if (platform === "tiktok") {
                const user = data;
                embed.setTitle(user.data.nickname || user.data.uniqueId)
                     .setURL(`https://www.tiktok.com/@${user.data.uniqueId}`)
                     .setThumbnail(user.data.avatarLarger)
                     .setDescription(`🆔 **ID**: ${user.data.id}\n📌 **Username**: [@${user.data.uniqueId}](https://www.tiktok.com/@${user.data.uniqueId})\n🔹 **Tiểu sử**:\n\`\`\`${user.data.signature || "Không có"}\`\`\``)
                     .addFields(
                         { name: "📽️ Số video", value: `${user.data.videoCount}`, inline: true },
                         { name: "👥 Người theo dõi", value: `${user.data.followerCount}`, inline: true },
                         { name: "👤 Đang theo dõi", value: `${user.data.followingCount}`, inline: true },
                         { name: "❤️ Tổng tim", value: `${user.data.heartCount}`, inline: true },
                         { name: "🔗 Link tiểu sử", value: user.data.bioLink?.link || "Không có", inline: true }
                     )
                     .setFooter({ text: "Nguồn: TikTok API" });
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`Lỗi khi lấy dữ liệu từ ${platform}:`, error);
            return interaction.editReply({ content: `Đã xảy ra lỗi khi truy xuất dữ liệu từ **${platform}**.`, ephemeral: true });
        }
    }
};
