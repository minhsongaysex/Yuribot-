const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataUserPath = path.join(__dirname, '/data/datauser.json');
const monsterPath = path.join(__dirname, '/data/data.json');
const magicPath = path.join(__dirname, '/data/magic.json');
const itemPath = path.join(__dirname, '/data/item.json');

function getUserData(userId) {
  const data = JSON.parse(fs.readFileSync(dataUserPath, 'utf8'));
  if (!data.users[userId]) {
    data.users[userId] = { soul: 10000, magic: [], weapons: [], exp: 0, level: 1, hp: 100, equippedWeapon: null, equippedMagic: null };
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
    userData.hp = 100 + userData.level * 20;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mushoku')
    .setDescription('Trải nghiệm thế giới Mushoku Tensei')
    .addSubcommand(subcommand =>
      subcommand.setName('trangbi')
      .setDescription('Trang bị vũ khí hoặc ma pháp')
      .addStringOption(option =>
        option.setName('loai')
          .setDescription('Chọn loại trang bị (vũ khí hoặc ma pháp)')
          .setRequired(true)
          .addChoices(
            { name: 'Vũ khí', value: 'weapon' },
            { name: 'Ma pháp', value: 'magic' }
          )
      )
      .addStringOption(option =>
        option.setName('ten')
          .setDescription('Tên vũ khí hoặc ma pháp muốn trang bị')
          .setRequired(true)
      )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('thongtin')
      .setDescription('Xem thông tin nhân vật của bạn')
    )
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
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    let userData = getUserData(userId);

    if (subcommand === 'trangbi') {
      const loai = interaction.options.getString('loai');
      const ten = interaction.options.getString('ten');

      if (loai === 'weapon') {
        if (userData.weapons.includes(ten)) {
          userData.equippedWeapon = ten;
          saveUserData(userId, userData);
          return interaction.reply(`✅ Bạn đã trang bị **${ten}** làm vũ khí!`);
        } else {
          return interaction.reply('❌ Bạn chưa sở hữu vũ khí này!');
        }
      }

      if (loai === 'magic') {
        if (userData.magic.includes(ten)) {
          userData.equippedMagic = ten;
          saveUserData(userId, userData);
          return interaction.reply(`✅ Bạn đã trang bị **${ten}** làm ma pháp!`);
        } else {
          return interaction.reply('❌ Bạn chưa sở hữu ma pháp này!');
        }
      }
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
          { name: '❤️ Máu', value: userData.hp.toString(), inline: true },
          { name: '🔄 Vũ khí hiện tại', value: userData.equippedWeapon || 'Chưa trang bị', inline: true },
          { name: '🔮 Ma pháp hiện tại', value: userData.equippedMagic || 'Chưa trang bị', inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'timquai') {
      const monsters = JSON.parse(fs.readFileSync(monsterPath, 'utf8')).monsters;
      const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
      randomMonster.currentHp = randomMonster.hp;

      const embed = new EmbedBuilder()
        .setTitle(`🐉 Bạn đã chạm trán **${randomMonster.name}**!`)
        .setDescription(`HP: ${randomMonster.currentHp}\nSát thương: ${randomMonster.attack}\nBạn muốn làm gì?`);

      const attackButton = new ButtonBuilder()
        .setCustomId(`attack_normal_${userId}_${randomMonster.name}`)
        .setLabel('🗡️ Chém thường')
        .setStyle(ButtonStyle.Primary);

      const magicButtons = userData.magic.map(spell =>
        new ButtonBuilder()
          .setCustomId(`attack_magic_${userId}_${spell}_${randomMonster.name}`)
          .setLabel(`✨ ${spell}`)
          .setStyle(ButtonStyle.Success)
      );

      const row = new ActionRowBuilder().addComponents([attackButton, ...magicButtons.slice(0, 4)]);
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (subcommand === 'muaphap') {
      const magic = JSON.parse(fs.readFileSync(magicPath, 'utf8')).magics;
      const availableMagic = magic.sort(() => 0.5 - Math.random()).slice(0, 5);
      const embed = new EmbedBuilder()
        .setTitle('🪄 Cửa hàng Ma Pháp')
        .setDescription('Chọn một ma pháp để mua');

      const buttons = availableMagic.map(spell =>
        new ButtonBuilder()
          .setCustomId(`buy_magic_${userId}_${spell.name}_${spell.price}`)
          .setLabel(`${spell.name} - ${spell.price} Soul`)
          .setStyle(ButtonStyle.Primary)
      );

      const row = new ActionRowBuilder().addComponents(buttons);
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (subcommand === 'muado') {
      const items = JSON.parse(fs.readFileSync(itemPath, 'utf8')).weapons;
      const availableItems = items.sort(() => 0.5 - Math.random()).slice(0, 5);
      const embed = new EmbedBuilder()
        .setTitle('⚔️ Cửa hàng Vũ Khí')
        .setDescription('Chọn một vũ khí để mua');

      const buttons = availableItems.map(item =>
        new ButtonBuilder()
          .setCustomId(`buy_item_${userId}_${item.name}_${item.price}`)
          .setLabel(`${item.name} - ${item.price} Soul`)
          .setStyle(ButtonStyle.Success)
      );

      const row = new ActionRowBuilder().addComponents(buttons);
      return interaction.reply({ embeds: [embed], components: [row] });
    }
  }
};




