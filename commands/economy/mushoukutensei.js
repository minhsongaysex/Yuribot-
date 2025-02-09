const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataUserPath = path.join(__dirname, 'data/datauser.json');
const monsterPath = path.join(__dirname, 'data/data.json');
const magicPath = path.join(__dirname, 'data/magic.json');
const itemPath = path.join(__dirname, 'data/item.json');

function getUserData(userId) {
  const data = JSON.parse(fs.readFileSync(dataUserPath, 'utf8'));
  if (!data.users[userId]) {
    data.users[userId] = { soul: 10000, magic: [], weapons: [], exp: 0, level: 1, hp: 100 };
    fs.writeFileSync(dataUserPath, JSON.stringify(data, null, 2));
  }
  return data.users[userId];
}

function saveUserData(userId, userData) {
  const data = JSON.parse(fs.readFileSync(dataUserPath, 'utf8'));
  data.users[userId] = userData;
  fs.writeFileSync(dataUserPath, JSON.stringify(data, null, 2));
}

function levelUp(userData) {
  const expNeeded = userData.level * 500;
  if (userData.exp >= expNeeded) {
    userData.exp -= expNeeded;
    userData.level += 1;
    userData.hp = 100 + userData.level * 20; // Tăng máu khi lên cấp
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mushoku')
    .setDescription('Trải nghiệm thế giới Mushoku Tensei')
    .addSubcommand(subcommand =>
      subcommand.setName('timquai')
      .setDescription('Tìm kiếm quái vật để chiến đấu')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('muaphap')
      .setDescription('Mua ma pháp từ cửa hàng')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('muado')
      .setDescription('Mua vật phẩm từ cửa hàng')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('thongtin')
      .setDescription('Xem thông tin nhân vật của bạn')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    let userData = getUserData(userId);

    if (subcommand === 'timquai') {
      const monsters = JSON.parse(fs.readFileSync(monsterPath, 'utf8')).monsters;
      const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
      
      const embed = new EmbedBuilder()
        .setTitle(`🐉 Bạn đã chạm trán **${randomMonster.name}**!`)
        .setDescription(`HP: ${randomMonster.hp}\nSát thương: ${randomMonster.attack}\nBạn muốn làm gì?`);
      
      const attackButton = new ButtonBuilder()
        .setCustomId(`attack_normal_${randomMonster.name}`)
        .setLabel('🗡️ Chém thường')
        .setStyle(ButtonStyle.Primary);
      
      const magicButtons = userData.magic.map(spell =>
        new ButtonBuilder()
          .setCustomId(`attack_magic_${spell}`)
          .setLabel(`✨ ${spell}`)
          .setStyle(ButtonStyle.Success)
      );
      
      const row = new ActionRowBuilder().addComponents([attackButton, ...magicButtons.slice(0, 4)]);
      return interaction.reply({ embeds: [embed], components: [row] });
    }
    
    if (subcommand === 'muaphap') {
      const magic = JSON.parse(fs.readFileSync(magicPath, 'utf8')).magics;
      const availableMagic = magic.sort(() => 0.5 - Math.random()).slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle('🪄 Cửa hàng Ma Pháp')
        .setDescription('Chọn một ma pháp để mua');
      
      const buttons = availableMagic.map(spell =>
        new ButtonBuilder()
          .setCustomId(`buy_magic_${spell.name}`)
          .setLabel(`${spell.name} - ${spell.price} Soul`)
          .setStyle(ButtonStyle.Primary)
      );
      
      const row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));
      saveUserData(userId, userData);
      return interaction.reply({ embeds: [embed], components: [row] });
    }
    
    if (subcommand === 'muado') {
      const items = JSON.parse(fs.readFileSync(itemPath, 'utf8')).weapons;
      const availableItems = items.sort(() => 0.5 - Math.random()).slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle('⚔️ Cửa hàng Vũ Khí')
        .setDescription('Chọn một vũ khí để mua');
      
      const buttons = availableItems.map(item =>
        new ButtonBuilder()
          .setCustomId(`buy_item_${item.name}`)
          .setLabel(`${item.name} - ${item.price} Soul`)
          .setStyle(ButtonStyle.Success)
      );
      
      const row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));
      saveUserData(userId, userData);
      return interaction.reply({ embeds: [embed], components: [row] });
    }
    
    if (subcommand === 'thongtin') {
      const embed = new EmbedBuilder()
        .setTitle(`📜 Thông tin nhân vật: ${interaction.user.username}`)
        .addFields(
          { name: '💰 Soul', value: userData.soul.toString(), inline: true },
          { name: '🔮 Ma pháp đã mua', value: userData.magic.length ? userData.magic.join(', ') : 'Chưa có', inline: true },
          { name: '⚔️ Vũ khí đã mua', value: userData.weapons.length ? userData.weapons.join(', ') : 'Chưa có', inline: true },
          { name: '📈 Cấp độ', value: userData.level.toString(), inline: true },
          { name: '✨ Kinh nghiệm', value: userData.exp.toString(), inline: true },
          { name: '❤️ Máu', value: userData.hp.toString(), inline: true }
        );
      return interaction.reply({ embeds: [embed] });
        }
  }
};
  



