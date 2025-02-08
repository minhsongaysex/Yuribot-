const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Lấy thông tin hồ sơ Roblox của người dùng')
    .addStringOption(option => 
      option.setName('username')
      .setDescription('Tên người dùng Roblox')
      .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const apiUrl = `https://huu-tri-api.onrender.com/roblox-profile?username=${encodeURIComponent(username)}`;
    
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      
      if (data.status !== 200) {
        return interaction.reply('⚠️ Không tìm thấy người dùng Roblox.');
      }
      
      const profile = data.profile;
      const embed = new EmbedBuilder()
        .setTitle(`Hồ sơ Roblox: ${profile.displayname}`)
        .setURL(`https://www.roblox.com/users/${profile.userid}/profile`)
        .setDescription(profile.description || 'Không có mô tả')
        .setThumbnail(profile.avatarurl)
        .addFields(
          { name: 'Tên người dùng', value: profile.username, inline: true },
          { name: 'User ID', value: profile.userid.toString(), inline: true },
          { name: 'Ngày tạo', value: new Date(profile.created).toLocaleDateString(), inline: true },
          { name: 'Bị khóa?', value: profile.isbanned ? 'Có 🚫' : 'Không ✅', inline: true }
        )
        .setFooter({ text: 'Dữ liệu từ Huu Tri API', iconURL: 'https://www.roblox.com/favicon.ico' });
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply('⚠️ Lỗi khi lấy dữ liệu hồ sơ Roblox. Vui lòng thử lại sau.');
    }
  }
};
