const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const moneyFile = path.join(__dirname, '../data/money.json');
const dataFile = path.join(__dirname, '../data/data.json');
const itemFile = path.join(__dirname, '../data/item.json');
const userFile = path.join(__dirname, '../data/datausercraft.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('🎮 Mini-game Minecraft trên Discord!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('register')
                .setDescription('📜 Đăng ký tài khoản Minecraft'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('shop')
                .setDescription('🛒 Xem cửa hàng cúp và mua'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bag')
                .setDescription('🎒 Kiểm tra túi đồ'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mine')
                .setDescription('⛏️ Đào tài nguyên'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('land')
                .setDescription('🌍 Chọn vùng đất để đào'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('change')
                .setDescription('🔄 Đổi cúp hiện tại')),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userName = interaction.user.username;

        let moneyData = JSON.parse(fs.readFileSync(moneyFile, 'utf8'));
        let userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
        let itemData = JSON.parse(fs.readFileSync(itemFile, 'utf8'));
        let gameData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

        // Nếu chưa đăng ký
        if (interaction.options.getSubcommand() === 'register') {
            if (!userData[userId]) {
                userData[userId] = {
                    name: userName,
                    inventory: [],
                    pickaxe: null,
                    land: "🌍 The Overworld"
                };
                moneyData[userId] = { money: 1000 };
                fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
                fs.writeFileSync(moneyFile, JSON.stringify(moneyData, null, 2));

                return interaction.reply("✅ **Bạn đã đăng ký thành công!** Nhận **1000$**.");
            } else {
                return interaction.reply("⚠️ **Bạn đã có tài khoản Minecraft rồi!**");
            }
        }

        if (!userData[userId]) {
            return interaction.reply("❌ **Bạn chưa có tài khoản Minecraft!** Hãy dùng /minecraft register để đăng ký.");
        }

        // Cửa hàng cúp
        if (interaction.options.getSubcommand() === 'shop') {
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏪 Cửa hàng Cúp Minecraft')
                .setDescription(`🔹 **Số dư:** ${moneyData[userId].money}$\n🛍️ **Chọn cúp để mua**:\n`)
                .setFooter({ text: '💰 Trả lời bằng số thứ tự để mua.' });
        
            let itemList = "";
            itemData.forEach((item, index) => {
                itemList += `**${index + 1}. ${item.name}** - ${item.price}$ - 🛠️ Độ bền: ${item.durability}\n`;
            });
        
            await interaction.reply({
                embeds: [embed.setDescription(embed.data.description + itemList)],
                withResponse: true // Thay fetchReply: true bằng withResponse
            });
        
            const filter = msg => msg.author.id === userId && !isNaN(msg.content);
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });
        
            collector.on('collect', async msg => {
                const index = parseInt(msg.content) - 1;
                if (index < 0 || index >= itemData.length) {
                    return msg.reply('❌ **Số thứ tự không hợp lệ!**');
                }
        
                const selectedItem = itemData[index];
        
                if (moneyData[userId].money < selectedItem.price) {
                    return msg.reply('❌ **Bạn không đủ tiền!**');
                }
        
                // Kiểm tra xem người chơi đã sở hữu cúp này chưa
                const pickaxeExists = userData[userId].inventory.some(item => item.name === selectedItem.name);
                if (pickaxeExists) {
                    return msg.reply(`❌ Bạn đã sở hữu **${selectedItem.name}** rồi!`);
                }
        
                // Nếu chưa có, thêm vào túi đồ
                if (!userData[userId].inventory) {
                    userData[userId].inventory = [];
                }
                userData[userId].inventory.push(selectedItem);
        
               
                moneyData[userId].money -= selectedItem.price;
                fs.writeFileSync(moneyFile, JSON.stringify(moneyData, null, 2));
                fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
        
                // Hiển thị thông báo đã mua
                const itemEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`✅ Bạn đã mua ${selectedItem.name}!`)
                    .setDescription(`💰 **Giá:** ${selectedItem.price}$\n🛠️ **Độ bền:** ${selectedItem.durability}`)
                    .setImage(selectedItem.image)
                    .setFooter({ text: `💵 Số dư còn lại: ${moneyData[userId].money}$` });
        
                return msg.reply({ embeds: [itemEmbed] });
            });
        }        

///////////////IM DARKNESS👻/////////////////

       

if (interaction.options.getSubcommand() === 'mine') {
    if (!userData[userId].inventory || !Array.isArray(userData[userId].inventory) || userData[userId].inventory.length === 0) {
        return interaction.reply('❌ Bạn chưa có cúp nào để đào! Hãy mua trong /shop.');
    }

    const location = userData[userId].land;
    if (!location) {
        return interaction.reply('❌ Bạn chưa chọn vùng đất để đào! Hãy dùng /land để chọn.');
    }

 
    const planet = gameData.find(p => p.location === location);
    if (!planet || !Array.isArray(planet.area) || planet.area.length === 0) {
        return interaction.reply('❌ Không có vùng đất hợp lệ tại hành tinh này.');
    }


    const selectedArea = planet.area[Math.floor(Math.random() * planet.area.length)];

    if (!Array.isArray(selectedArea.creature) || selectedArea.creature.length === 0) {
        return interaction.reply('❌ Không có tài nguyên nào để đào tại vùng đất này.');
    }


    const foundOre = selectedArea.creature[Math.floor(Math.random() * selectedArea.creature.length)];

 
    if (!moneyData[userId]) moneyData[userId] = { money: 0 };
    moneyData[userId].money += foundOre.sell;
    fs.writeFileSync(moneyFile, JSON.stringify(moneyData, null, 2));

    const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('⛏️ Đào tài nguyên!')
        .setDescription(`🎉 **${userName}** đã đào được **${foundOre.name}**!\n💰 **Giá trị:** ${foundOre.sell} tiền\n📏 **Kích thước:** ${foundOre.size} cm\n🏆 **Phân loại:** ${foundOre.category}`)
        .setImage(foundOre.image)
        .setFooter({ text: '💎 Tiếp tục đào để kiếm thêm tiền!' });

    return interaction.reply({ embeds: [embed] });
}


        if (interaction.options.getSubcommand() === 'land') {
            let landList = gameData.map((area, index) => `**${index + 1}. ${area.location}**`).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('🌍 Chọn vùng đất để đào')
                .setDescription(landList + "\n\n💬 **Nhập số thứ tự của vùng đất bạn muốn đến!**");

            await interaction.reply({ embeds: [embed], fetchReply: true });

            const filter = msg => msg.author.id === userId && !isNaN(msg.content);
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

            collector.on('collect', async msg => {
                const index = parseInt(msg.content) - 1;
                if (index < 0 || index >= gameData.length) {
                    return msg.reply('❌ **Số thứ tự không hợp lệ! Vui lòng chọn lại.**');
                }

                userData[userId].land = gameData[index].location;
                fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));

                collector.stop();
                return msg.reply(`✅ **Bạn đã chọn vùng đất ${userData[userId].land}!**`);
            });
        }

        if (interaction.options.getSubcommand() === 'bag') {
            const userBag = userData[userId].inventory || [];
            if (userBag.length === 0) {
                return interaction.reply('🎒 Túi đồ của bạn đang trống.');
            }

            let bagList = userBag.map((item, index) => `**${index + 1}. ${item.name}**`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`🎒 Túi đồ của ${userName}`)
                .setDescription(bagList);
        
            return interaction.reply({ embeds: [embed] });
        }
        


        if (interaction.options.getSubcommand() === 'change') {
            if (userData[userId].inventory.length === 0) {
                return interaction.reply('❌ **Bạn chưa có cúp nào!** Hãy mua tại `/minecraft shop`.');
            }
        
            let pickaxeList = userData[userId].inventory.map((item, index) => `**${index + 1}. ${item.name}**`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🔄 Đổi cúp hiện tại')
                .setDescription(pickaxeList);
        
            await interaction.reply({ embeds: [embed], fetchReply: true });
        
            const filter = msg => msg.author.id === userId && !isNaN(msg.content);
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });
        
            collector.on('collect', async msg => {
                const index = parseInt(msg.content) - 1;
                if (index < 0 || index >= userData[userId].inventory.length) {
                    return msg.reply('❌ **Số thứ tự không hợp lệ!**');
                }
        
                userData[userId].pickaxe = userData[userId].inventory[index].name;
fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));


return msg.reply({
    content: `✅ **Bạn đã đổi sang cúp ${userData[userId].pickaxe}!**`,
    ephemeral: true 
        });
    });
   }
  }
};
