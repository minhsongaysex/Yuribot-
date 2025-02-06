const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

const API_KEY = "bc6a1dadaf0843518b5f6f20cfc4761c";
const API_BASE_URL = "https://api.spoonacular.com/recipes";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cook')
    .setDescription('Nhận thông tin về công thức nấu ăn và thành phần món ăn.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Tên món ăn hoặc thành phần')
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString('name');

    if (!query) {
      return interaction.reply({ content: "Vui lòng cung cấp tên món ăn hoặc thành phần!", ephemeral: true });
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/complexSearch?query=${encodeURIComponent(query)}&apiKey=${API_KEY}`
      );
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return interaction.reply({ content: "Không tìm thấy công thức phù hợp.", ephemeral: true });
      }

      const recipe = data.results[0];

      await interaction.reply({
        embeds: [{
          color: 0x0099ff,
          title: recipe.title,
          description: "Một công thức ngon lành cho bạn!",
          thumbnail: {
            url: recipe.image,
          },
          fields: [
            {
              name: "Link công thức",
              value: `https://spoonacular.com/recipes/${recipe.title.replace(/ /g, "-")}-${recipe.id}`,
            }
          ],
          timestamp: new Date(),
          footer: {
            text: "Nguồn: Spoonacular API",
          }
        }]
      });

    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      interaction.reply({ content: "Đã xảy ra lỗi khi lấy thông tin. Vui lòng thử lại sau.", ephemeral: true });
    }
  }
};
