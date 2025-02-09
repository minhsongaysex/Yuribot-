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

function getMaxWeaponDamage(weapons) {
  const items = JSON.parse(fs.readFileSync(itemPath, 'utf8')).weapons;
  let maxDamage = 0;
  for (const weapon of weapons) {
    const item = items.find(i => i.name === weapon);
    if (item && item.damage > maxDamage) {
      maxDamage = item.damage;
    }
  }
  return maxDamage;
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
      const randomMonster = { ...monsters[Math.floor(Math.random() * monsters.length)] };
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
      await interaction.reply({ embeds: [embed], components: [row] });

      const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

      collector.on('collect', async i => {
        if (i.customId.startsWith('attack_normal')) {
          const damage = getMaxWeaponDamage(userData.weapons) || 10;
          randomMonster.currentHp -= damage;
          if (randomMonster.currentHp <= 0) {
            return i.reply(`🎉 Bạn đã tiêu diệt **${randomMonster.name}**!`);
          }
          return i.reply(`🗡️ Bạn đã gây ${damage} sát thương. Quái còn lại **${randomMonster.currentHp}** HP.`);
        }

        if (i.customId.startsWith('attack_magic')) {
          const spellName = i.customId.split('_')[3];
          const magicData = JSON.parse(fs.readFileSync(magicPath, 'utf8')).magics.find(m => m.name === spellName);
          if (magicData) {
            randomMonster.currentHp -= magicData.damage;
            if (randomMonster.currentHp <= 0) {
              return i.reply(`🎉 Bạn đã tiêu diệt **${randomMonster.name}** bằng ma pháp **${spellName}**!`);
            }
            return i.reply(`✨ Bạn đã gây ${magicData.damage} sát thương bằng ma pháp **${spellName}**. Quái còn lại **${randomMonster.currentHp}** HP.`);
          }
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('⏰ Thời gian chiến đấu đã kết thúc.');
      });
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
      await interaction.reply({ embeds: [embed], components: [row] });

      const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

      collector.on('collect', async i => {
        if (i.customId.startsWith('buy_magic_')) {
          const [_, buyerId, spellName, spellPrice] = i.customId.split('_');
          if (buyerId !== userId) return;

          if (userData.soul < parseInt(spellPrice)) {
            return i.reply({ content: `❌ Bạn không đủ Soul để mua **${spellName}**!`, ephemeral: true });
          }

          userData.soul -= parseInt(spellPrice);
          userData.magic.push(spellName);
          saveUserData(userId, userData);
          return i.reply({ content: `✅ Bạn đã mua thành công **${spellName}**! Số dư còn lại: ${userData.soul} Soul.`, ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('⏰ Thời gian mua hàng đã kết thúc.');
      });
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
      await interaction.reply({ embeds: [embed], components: [row] });

      const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

      collector.on('collect', async i => {
        if (i.customId.startsWith('buy_item_')) {
          const [_, buyerId, itemName, itemPrice] = i.customId.split('_');
          if (buyerId !== userId) return;

          if (userData.soul < parseInt(itemPrice)) {
            return i.reply({ content: `❌ Bạn không đủ Soul để mua **${itemName}**!`, ephemeral: true });
          }

          userData.soul -= parseInt(itemPrice);
          userData.weapons.push(itemName);
          saveUserData(userId, userData);
          return i.reply({ content: `✅ Bạn đã mua thành công **${itemName}**! Số dư còn lại: ${userData.soul} Soul.`, ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('⏰ Thời gian mua hàng đã kết thúc.');
      });
    }
  }
};
