const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yuri')
    .setDescription('Trò chuyện với Yuri AI')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Câu hỏi của bạn cho Yuri AI')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply(); // Tránh timeout

    const userId = interaction.user.id;
    const question = interaction.options.getString('question'); // Lấy câu hỏi từ user
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(question)}&uid=${userId}&webSearch=off`;

    try {
      const response = await axios.get(apiUrl);
      const reply = response.data.response;

      if (!reply || reply.trim() === "") {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF69B4")
              .setTitle("🗨️✨ | YuriAI")
              .setDescription("━━━━━━━━━━━━━━━━\n𝐿𝑜̂̃𝑖, Yuri AI👻 𝑑𝑒́𝑜 𝑟𝑒𝑝 𝑑𝑢̛𝑜̛̣𝑐 𝑡𝑢̛̀ 𝐴𝑃𝐼\n━━━━━━━━━━━━━━━━")
          ]
        });
      }

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF69B4")
            .setTitle("🗨️✨ | Yuri AI")
            .setDescription(`━━━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━━━`)
        ]
      });

    } catch (error) {
      console.error(error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF69B4")
            .setTitle("🗨️✨ | YuriAI")
            .setDescription("━━━━━━━━━━━━━━━━\n𝐿𝑜̂̃𝑖, Yuri AI👻 𝑑𝑒́𝑜 𝑟𝑒𝑝 𝑑𝑢̛𝑜̛̣𝑐 𝑡𝑢̛̀ 𝐴𝑃𝐼\n━━━━━━━━━━━━━━━━")
        ]
      });
    }
  }
};
