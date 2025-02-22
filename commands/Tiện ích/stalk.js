const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const API_ENDPOINTS = {
    github: "https://api.siputzx.my.id/api/stalk/github?user=",
    npm: "https://api.siputzx.my.id/api/stalk/npm?packageName=",
    steam: "https://api.popcat.xyz/steam?q=",
    imdb: "https://api.popcat.xyz/imdb?q="
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stalk")
        .setDescription("Lấy thông tin từ GitHub, NPM, Steam hoặc IMDb.")
        .addStringOption(option =>
            option.setName("platform")
                .setDescription("Nền tảng cần tìm kiếm")
                .setRequired(true)
                .addChoices(
                    { name: "GitHub", value: "github" },
                    { name: "NPM", value: "npm" },
                    { name: "Steam", value: "steam" },
                    { name: "IMDb", value: "imdb" }
                )
        )
        .addStringOption(option =>
            option.setName("query")
                .setDescription("Tên người dùng/gói/game/phim cần tìm kiếm")
                .setRequired(true)
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        const platform = interaction.options.getString("platform");
        const query = interaction.options.getString("query");
        const url = API_ENDPOINTS[platform] + encodeURIComponent(query);

        try {
            const response = await axios.get(url);
            const data = response.data;
            
            if (!data || (platform === "steam" && !data.name) || (platform === "imdb" && !data.title)) {
                return interaction.editReply({ content: `❌ Không tìm thấy kết quả cho **${query}** trên **${platform}**.`, ephemeral: true });
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
            } else if (platform === "steam") {
                embed.setTitle(`🎮 ${data.name}`)
                     .setURL(data.website || "https://store.steampowered.com/")
                     .setThumbnail(data.thumbnail)
                     .setImage(data.banner)
                     .setDescription(`📝 **Mô tả**:\n\`\`\`${data.description || "Không có mô tả"}\`\`\``)
                     .addFields(
                         { name: "💰 Giá", value: data.price || "Miễn phí", inline: true },
                         { name: "🎮 Hỗ trợ tay cầm", value: data.controller_support ? "✅ Có" : "❌ Không", inline: true },
                         { name: "🛠️ Nhà phát triển", value: data.developers.join(", ") || "Không rõ", inline: false },
                         { name: "📢 Nhà phát hành", value: data.publishers.join(", ") || "Không rõ", inline: false }
                     )
                     .setFooter({ text: "Dữ liệu từ Steam API (PopCat)" });

            } else if (platform === "imdb") {
                embed.setTitle(`🎬 ${data.title} (${data.year})`)
                     .setURL(data.imdburl)
                     .setThumbnail(data.poster)
                     .setDescription(`📝 **Mô tả**:\n\`\`\`${data.plot}\`\`\``)
                     .addFields(
                         { name: "📅 Ngày phát hành", value: new Date(data.released).toLocaleDateString(), inline: true },
                         { name: "🎭 Thể loại", value: data.genres, inline: true },
                         { name: "🎬 Đạo diễn", value: data.director, inline: true },
                         { name: "✍️ Biên kịch", value: data.writer, inline: true },
                         { name: "🌍 Ngôn ngữ", value: data.languages, inline: true },
                         { name: "🏆 Giải thưởng", value: data.awards || "Không có", inline: true },
                         { name: "🎭 Diễn viên", value: data.actors, inline: false },
                         { name: "💰 Doanh thu", value: data.boxoffice || "Không rõ", inline: true }
                     );

                // Thêm đánh giá nếu có
                if (data.ratings && data.ratings.length > 0) {
                    const ratings = data.ratings.map(r => `⭐ **${r.source}**: ${r.value}`).join("\n");
                    embed.addFields({ name: "📊 Đánh giá", value: ratings, inline: false });
                }

                embed.setFooter({ text: "Dữ liệu từ IMDb API (PopCat)" });
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`Lỗi khi lấy dữ liệu từ ${platform}:`, error);
            return interaction.editReply({ content: `❌ Đã xảy ra lỗi khi truy xuất dữ liệu từ **${platform}**.`, ephemeral: true });
        }
    }
};
