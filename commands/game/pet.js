const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const PET_DATA_PATH = path.join(__dirname, '../data/pet.json');
const PET_STORE_PATH = path.join(__dirname, '../data/datapet.json');

function loadJSON(filePath) {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pet')
        .setDescription('Quản lý thú cưng của bạn')
        .addSubcommand(subcommand =>
            subcommand.setName('buy')
                .setDescription('Mua một pet mới')
                .addStringOption(option =>
                    option.setName('petname')
                        .setDescription('Tên pet bạn muốn mua')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('Hiển thị danh sách pet có thể mua'))
        .addSubcommand(subcommand =>
            subcommand.setName('profile')
                .setDescription('Xem thông tin pet của bạn'))
        .addSubcommand(subcommand =>
            subcommand.setName('switch')
                .setDescription('Đổi pet hiện tại')
                .addStringOption(option =>
                    option.setName('petname')
                        .setDescription('Tên pet bạn muốn sử dụng')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('battle')
                .setDescription('Tham gia một trận chiến pet!')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('Chọn người chơi khác để thách đấu')
                        .setRequired(true))),

    async execute(interaction) {
        const userID = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        let userPets = loadJSON(PET_DATA_PATH);
        let petStore = loadJSON(PET_STORE_PATH);

        // 📌 **Mua pet**
        if (subcommand === 'buy') {
            const petName = interaction.options.getString('petname');
            if (!petStore[petName]) return interaction.reply('❌ Pet này không tồn tại trong cửa hàng!');
            
            const petData = petStore[petName]; // Lấy dữ liệu pet từ petStore
            const petPrice = petData.price;
            
            if (!userPets[userID]) {
                userPets[userID] = { pets: {}, currentPet: null, money: 1000 };
            }
            
            if (userPets[userID].money < petPrice) {
                return interaction.reply(`❌ Bạn không có đủ tiền! 💰 Cần **${petPrice}**, nhưng bạn chỉ có **${userPets[userID].money}**.`);
            }
            
            if (userPets[userID].pets[petName]) {
                return interaction.reply('❌ Bạn đã sở hữu pet này rồi!');
            }
            
            // Trừ tiền và thêm pet vào danh sách của người dùng
            userPets[userID].money -= petPrice;
            userPets[userID].pets[petName] = petData;
            if (!userPets[userID].currentPet) {
                userPets[userID].currentPet = petName;
            }
            
            saveJSON(PET_DATA_PATH, userPets);
            
            // Tạo Embed hiển thị thông tin pet mới mua
            const embed = new EmbedBuilder()
                .setTitle(`🎉 Bạn đã mua ${petName}!`)
                .setDescription(`💰 **Số tiền còn lại:** ${userPets[userID].money}`)
                .addFields(
                    { name: 'Sức mạnh🧛🏻', value: `${petData.stats.strength}`, inline: true },
                    { name: 'Phòng thủ⚔️', value: `${petData.stats.defense}`, inline: true }
                )
                .setImage(petData.image)
                .setColor('Green');
            
            return interaction.reply({ embeds: [embed] });
            
        }
    

        // 📌 **Danh sách pet có thể mua**
        if (subcommand === 'list') {
            let petList = Object.keys(petStore)
                .map(pet => `🐾 **${pet}** - ${petStore[pet].stats.strength} STR / ${petStore[pet].stats.defense} DEF`)
                .join('\n');

            return interaction.reply(`📜 **Danh sách Pet có thể mua:**\n${petList}`);
        }

        // 📌 **Xem thông tin pet**
        if (subcommand === 'profile') {
            if (!userPets[userID] || !userPets[userID].currentPet) {
                return interaction.reply('❌ Bạn chưa có pet nào cả!');
            }

            let petName = userPets[userID].currentPet;
            let petInfo = userPets[userID].pets[petName];

            const embed = new EmbedBuilder()
                .setTitle(`🐾 Hồ sơ Pet: ${petName}`)
                .setDescription(`**Chủ nhân:** <@${userID}>`)
                .addFields(
                    { name: 'Sức mạnh⚔️', value: `${petInfo.stats.strength}`, inline: true },
                    { name: 'Phòng thủ🛡️', value: `${petInfo.stats.defense}`, inline: true }
                )
                .setColor('Green');

            return interaction.reply({ embeds: [embed] });
        }

        // 📌 **Đổi pet**
        if (subcommand === 'switch') {
            const newPet = interaction.options.getString('petname');
            if (!userPets[userID] || !userPets[userID].pets[newPet]) {
                return interaction.reply('❌ Bạn không sở hữu pet này!');
            }

            userPets[userID].currentPet = newPet;
            saveJSON(PET_DATA_PATH, userPets);
            return interaction.reply(`✅ Bạn đã đổi pet sang **${newPet}**!`);
        }

        // 📌 **Chiến đấu pet**
        if (subcommand === 'battle') {
            const opponent = interaction.options.getUser('opponent');
            const opponentID = opponent.id;
        
            if (!userPets[userID] || !userPets[userID].currentPet) {
                return interaction.reply('❌ Bạn chưa có pet! Hãy dùng `/pet buy` để mua.');
            }
        
            if (!userPets[opponentID] || !userPets[opponentID].currentPet) {
                return interaction.reply(`❌ **${opponent.username}** chưa có pet!`);
            }
        
            let playerPetName = userPets[userID].currentPet;
            let opponentPetName = userPets[opponentID].currentPet;
        
            let playerPet = userPets[userID].pets[playerPetName];
            let opponentPet = userPets[opponentID].pets[opponentPetName];
        
            // Kiểm tra nếu pet bị undefined
            if (!playerPet || !opponentPet) {
                return interaction.reply('❌ Lỗi: Một trong hai pet không tồn tại. Hãy kiểm tra lại dữ liệu!');
            }
        
            let playerPower = playerPet.stats.strength + playerPet.stats.defense;
            let opponentPower = opponentPet.stats.strength + opponentPet.stats.defense;
        
            let battleMessage = await interaction.reply({ content: '🐾 Trận chiến bắt đầu...', fetchReply: true });
        
            if (playerPower < opponentPower) {
                return battleMessage.edit(`💀 **Pet của bạn (${playerPetName}) đã bại trận trước ${opponentPetName}!**`);
            }
        
            let playerHP = playerPet.stats.defense * 10;
            let opponentHP = opponentPet.stats.defense * 10;
        
            let round = 1;
            while (playerHP > 0 && opponentHP > 0) {
                let playerDamage = Math.max(1, playerPet.stats.strength - opponentPet.stats.defense);
                let opponentDamage = Math.max(1, opponentPet.stats.strength - playerPet.stats.defense);
        
                opponentHP -= playerDamage;
                playerHP -= opponentDamage;
        
                await battleMessage.edit(`**Round ${round}** ⚔️
                🐉 **${playerPetName}**: ❤️ ${Math.max(0, playerHP)}
                🦄 **${opponentPetName}**: ❤️ ${Math.max(0, opponentHP)}`);
        
                round++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        
            if (playerHP > 0) {
                await battleMessage.edit(`🏆 **Pet của bạn (${playerPetName}) đã chiến thắng💵 ${opponentPetName}!** 🎉`);
            } else {
                await battleMessage.edit(`💀 **Pet của bạn (${playerPetName}) đã bại trận trước🤕 ${opponentPetName}!**`);
            }
        }
    }
};
