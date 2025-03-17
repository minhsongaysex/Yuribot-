const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zwar')
        .setDescription('Chiến đấu với zombie trong trò chơi Zombie War')
        .addSubcommand(subcommand =>
            subcommand
                .setName('register')
                .setDescription('Đăng ký vào chiến trường')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shop')
                .setDescription('Mua súng, bán zombie và nâng cấp kho')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('prison')
                .setDescription('Xem những zombie bạn đã bắt được')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hunt')
                .setDescription('Đi săn zombie')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Xem hướng dẫn chơi Zombie War')
        ),

    async onLoad() {
        const dataPath = path.join(__dirname, '../data');
        
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        
        if (!fs.existsSync(path.join(dataPath, 'zombie.json'))) {
            (await axios({
                url: "https://raw.githubusercontent.com/J-JRT/zwar/mainV2/data.json",
                method: 'GET',
                responseType: 'stream'
            })).data.pipe(fs.createWriteStream(path.join(dataPath, 'zombie.json')));
        }
        
        if (!fs.existsSync(path.join(dataPath, 'gun.json'))) {
            (await axios({
                url: "https://raw.githubusercontent.com/J-JRT/zwar/mainV2/gun.json",
                method: 'GET',
                responseType: 'stream'
            })).data.pipe(fs.createWriteStream(path.join(dataPath, 'gun.json')));
        }
        
        if (!fs.existsSync(path.join(dataPath, 'huntzombie.json'))) {
            fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify({}));
        }
    },

    async execute(interaction) {
        try {
            // Load data
            const dataPath = path.join(__dirname, '../data');
            
            // Initialize data files if they don't exist
            if (!fs.existsSync(path.join(dataPath, 'huntzombie.json'))) {
                fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify({}));
            }
            
            const userData = JSON.parse(fs.readFileSync(path.join(dataPath, 'huntzombie.json'), 'utf8'));
            
            if (!userData[interaction.user.id]) {
                userData[interaction.user.id] = {
                    money: 1000, // Starting money
                    data: {
                        zwar: {}
                    }
                };
            }
            
            const userGameData = userData[interaction.user.id].data.zwar || {};
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'register':
                    await this.handleRegister(interaction, userData);
                    break;
                case 'shop':
                    await this.handleShop(interaction, userData);
                    break;
                case 'prison':
                    await this.handlePrison(interaction, userData);
                    break;
                case 'hunt':
                    await this.handleHunt(interaction, userData);
                    break;
                case 'help':
                    await this.handleHelp(interaction);
                    break;
                default:
                    await interaction.reply('Lệnh không hợp lệ!');
            }
            
            // Save data
            fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Đã xảy ra lỗi khi thực hiện lệnh!', ephemeral: true });
        }
    },

    async handleRegister(interaction, userData) {
        const userId = interaction.user.id;
        
        if (!userData[userId]) {
            userData[userId] = {
                money: 1000,
                data: {
                    zwar: {}
                }
            };
        }
        
        const userGameData = userData[userId].data.zwar;
        
        if (Object.entries(userGameData).length !== 0 && userGameData.new) {
            return interaction.reply({ content: '[ ZWar ] » Bạn đã có mặt trên chiến trường!', ephemeral: true });
        }
        
        userGameData.weapon = {
            name: "None",
            price: 0,
            time: 120,
            duribility: 0
        };
        userGameData.critters = [];
        userGameData.size = 10;
        userGameData.new = true;
        
        await interaction.reply('[ ZWar ] » Bạn đã đăng ký vào chiến trường thành công!');
    },

    async handleShop(interaction, userData) {
        const userId = interaction.user.id;
        const userGameData = userData[userId].data.zwar;
        
        if (Object.entries(userGameData).length === 0 || !userGameData.new) {
            return interaction.reply({ content: '[ ZWar ] » Bạn chưa có mặt trên chiến trường', ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('==== [ Shop Weapon ] ====')
            .setDescription('Chọn một trong các lựa chọn dưới đây:')
            .addFields(
                { name: '1️⃣ Mua Súng', value: 'Mua vũ khí để chiến đấu' },
                { name: '2️⃣ Bán Zombie', value: 'Bán zombie để kiếm tiền' },
                { name: '3️⃣ Nâng Cấp Kho', value: 'Nâng cấp kho để chứa nhiều zombie hơn' }
            )
            .setColor('#00FF00');
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buy_gun')
                    .setLabel('Mua Súng')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('1️⃣'),
                new ButtonBuilder()
                    .setCustomId('sell_zombie')
                    .setLabel('Bán Zombie')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('2️⃣'),
                new ButtonBuilder()
                    .setCustomId('upgrade_storage')
                    .setLabel('Nâng Cấp Kho')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('3️⃣')
            );
        
        await interaction.reply({ embeds: [embed], components: [row] });
        
        // Tạo collector để xử lý sự kiện nút bấm
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ 
            filter, 
            time: 60000 // 60 giây để chọn
        });
        
        collector.on('collect', async (buttonInteraction) => {
            // Xử lý các nút bấm
            switch (buttonInteraction.customId) {
                case 'buy_gun': {
                    const dataPath = path.join(__dirname, '../data');
                    const gunData = JSON.parse(fs.readFileSync(path.join(dataPath, 'gun.json'), 'utf8'));
                    
                    let gunList = '';
                    for (let i = 0; i < gunData.gun.length; i++) {
                        const gun = gunData.gun[i];
                        gunList += `${i + 1}. ${gun.name}: ${gun.price}$ \n» Độ bền: ${gun.duribility} \n» Thời Gian Chờ: ${gun.time} giây\n\n`;
                    }
                    
                    const gunEmbed = new EmbedBuilder()
                        .setTitle('==== [ SHOP WEAPON ] ====')
                        .setDescription(gunList + '\nHãy nhập số tương ứng với súng bạn muốn mua')
                        .setColor('#00FF00');
                    
                    await buttonInteraction.update({ 
                        embeds: [gunEmbed], 
                        components: [] 
                    });
                    
                    // Collector để xử lý tin nhắn trả lời
                    const messageFilter = m => m.author.id === interaction.user.id && 
                                              !isNaN(m.content) && 
                                              parseInt(m.content) > 0 && 
                                              parseInt(m.content) <= gunData.gun.length;
                    
                    const messageCollector = interaction.channel.createMessageCollector({ 
                        filter: messageFilter, 
                        max: 1,
                        time: 30000 // 30 giây để trả lời
                    });
                    
                    messageCollector.on('collect', async (msg) => {
                        const choice = parseInt(msg.content);
                        const selectedGun = gunData.gun[choice - 1];
                        
                        // Kiểm tra tiền
                        if (userData[userId].money < selectedGun.price) {
                            interaction.followUp({ 
                                content: `[ ERROR ] » Bạn không đủ tiền để mua súng này! Bạn cần thêm ${selectedGun.price - userData[userId].money}$`, 
                                ephemeral: true 
                            });
                            return;
                        }
                        
                        // Cập nhật dữ liệu
                        userData[userId].data.zwar.weapon = {
                            name: selectedGun.name,
                            price: selectedGun.price,
                            time: selectedGun.time,
                            duribility: selectedGun.duribility
                        };
                        
                        userData[userId].money -= selectedGun.price;
                        
                        // Lưu dữ liệu
                        fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
                        
                        interaction.followUp({ 
                            content: `[ SHOP ] » Bạn đã mua thành công ${selectedGun.name} với giá ${selectedGun.price}$` 
                        });
                    });
                    
                    messageCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'Hết thời gian chọn súng!', ephemeral: true });
                        }
                    });
                    break;
                }
                
                case 'sell_zombie': {
                    const dataPath = path.join(__dirname, '../data');
                    const userGameData = userData[userId].data.zwar;
                    
                    if (!userGameData.critters || userGameData.critters.length === 0) {
                        await buttonInteraction.update({ 
                            content: '[ ZWar ] » Bạn không có zombie nào để bán!', 
                            embeds: [], 
                            components: [] 
                        });
                        return;
                    }
                    
                    let totalPrice = 0;
                    userGameData.critters.forEach(zombie => totalPrice += zombie.price);
                    
                    userData[userId].money += totalPrice;
                    userData[userId].data.zwar.critters = [];
                    
                    fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
                    
                    const sellEmbed = new EmbedBuilder()
                        .setTitle('[ ZWar ] » Bán Zombie')
                        .setDescription(`Bạn đã bán tất cả zombie và nhận được ${totalPrice}$`)
                        .setColor('#00FF00');
                    
                    await buttonInteraction.update({ 
                        embeds: [sellEmbed], 
                        components: [] 
                    });
                    break;
                }
                
                case 'upgrade_storage': {
                    const dataPath = path.join(__dirname, '../data');
                    const userGameData = userData[userId].data.zwar;
                    
                    const upgradeEmbed = new EmbedBuilder()
                        .setTitle('[ = ] NÂNG CẤP KHO [ = ]')
                        .setDescription(`Hiện tại bạn đang có ${userGameData.critters.length}/${userGameData.size} vị trí trong kho đồ\n\nGiá nâng cấp: 2000$ cho mỗi vị trí\n\nNhập số lượng vị trí bạn muốn nâng cấp`)
                        .setColor('#0099ff');
                    
                    await buttonInteraction.update({ 
                        embeds: [upgradeEmbed], 
                        components: [] 
                    });
                    
                    // Collector để xử lý tin nhắn trả lời
                    const messageFilter = m => m.author.id === interaction.user.id && 
                                              !isNaN(m.content) && 
                                              parseInt(m.content) > 0;
                    
                    const messageCollector = interaction.channel.createMessageCollector({ 
                        filter: messageFilter, 
                        max: 1,
                        time: 30000 // 30 giây để trả lời
                    });
                    
                    messageCollector.on('collect', async (msg) => {
                        const slots = parseInt(msg.content);
                        const cost = slots * 2000;
                        
                        // Kiểm tra tiền
                        if (userData[userId].money < cost) {
                            interaction.followUp({ 
                                content: `[ ERROR ] » Bạn không đủ tiền để nâng cấp! Bạn cần thêm ${cost - userData[userId].money}$`, 
                                ephemeral: true 
                            });
                            return;
                        }
                        
                        // Cập nhật dữ liệu
                        userData[userId].data.zwar.size += slots;
                        userData[userId].money -= cost;
                        
                        // Lưu dữ liệu
                        fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
                        
                        interaction.followUp({ 
                            content: `[ SHOP ] » Bạn đã nâng cấp kho thành công thêm ${slots} vị trí với giá ${cost}$` 
                        });
                    });
                    
                    messageCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'Hết thời gian nâng cấp kho!', ephemeral: true });
                        }
                    });
                    break;
                }
            }
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: 'Bạn không chọn tùy chọn nào! Hãy thử lại.',
                    components: []
                }).catch(console.error);
            }
        });
    },

    async handleHunt(interaction, userData) {
        const userId = interaction.user.id;
        const userGameData = userData[userId].data.zwar;
        
        if (Object.entries(userGameData).length === 0 || !userGameData.new) {
            return interaction.reply({ content: '[ ZWar ] » Bạn chưa có mặt trên chiến trường', ephemeral: true });
        }
        
        const format = new Intl.NumberFormat();
        const currentTime = new Date().getTime();
        
        if (!userGameData.time) {
            userGameData.time = 0;
        }
        
        const dates = Math.floor((Math.abs(userGameData.time - currentTime) / 1000) / 60);
        
        if (userGameData.weapon.price === 0 || !userGameData.weapon.name || userGameData.weapon.name === "None") {
            return interaction.reply({ content: '[ ZWar ] » Bạn chưa có súng!', ephemeral: true });
        } else if (userGameData.time && dates < userGameData.weapon.time) {
            const timeLeft = userGameData.weapon.time - dates;
            return interaction.reply({ content: `[ ZWar ] » Bạn đang trong thời gian chờ, hãy thử lại sau ${timeLeft} phút!`, ephemeral: true });
        } else if (userGameData.weapon.duribility < 1) {
            userGameData.weapon = {
                name: "None",
                price: 0,
                time: 120,
                duribility: 0
            };
            return interaction.reply({ content: '[ ZWar ] » Súng của bạn đã hỏng, hãy mua súng mới!', ephemeral: true });
        }
        
        const zombieRarity = this.getRarity();
        const currentHour = new Date().getHours();
        const currentMonth = new Date().getMonth() + 1;
        
        // Load zombie data
        const zombieData = await this.getZombie(zombieRarity, currentHour, currentMonth);
        
        if (!zombieData || zombieData.length === 0) {
            return interaction.reply({ content: '[ ZWar ] » Hiện tại không có zombie để bắn', ephemeral: true });
        }
        
        const caught = zombieData[Math.floor(Math.random() * ((zombieData.length - 1) - 0 + 1)) + 0];
        caught.size = Math.abs(parseFloat(Math.random() * (caught.size[0] - caught.size[1]) + caught.size[1]).toFixed(1));
        
        if (userGameData.size > userGameData.critters.length) {
            userGameData.critters.push(caught);
        } else {
            return interaction.reply({ content: '[ ZWar ] » Túi của bạn không còn đủ không gian lưu trữ!', ephemeral: true });
        }
        
        userGameData.weapon.duribility--;
        userGameData.time = currentTime;
        
        const embed = new EmbedBuilder()
            .setTitle('[ ZWar ] » Bạn đã bắt được ' + caught.name)
            .addFields(
                { name: '===== [ Thông Tin Chung ] =====', value: 
                    `👤 Người bắt: ${interaction.user.username}\n` +
                    `✨ Kích cỡ: ${caught.size}m\n` +
                    `🧟‍♂️ Độ Hiếm Zombie: ${caught.rarity}\n` +
                    `💬 Mô Tả: ${caught.catch}\n` +
                    `💰 Giá trị: ${format.format(caught.price)}$`
                }
            )
            .setColor('#FF0000');
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleHelp(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('==== 「 Zombie War 」 ====')
            .setDescription('Một trò chơi giải trí về zombie, cầm súng lên và vào chiến trường chiến đấu với zombie nào.')
            .addFields(
                { name: 'Hướng dẫn chơi Zombie War:', value: 
                    '» `/zwar register`: Để đăng kí vào chiến trường\n' +
                    '» `/zwar shop`: Cửa hàng để cung cấp trang bị\n' +
                    '» `/zwar prison`: Xem những zombie bạn đã bắt được\n' +
                    '» `/zwar hunt`: Đi săn zombie\n' +
                    '» `/zwar help`: Xem hướng dẫn chơi Zombie War'
                }
            )
            .setColor('#00FF00');
        
        await interaction.reply({ embeds: [embed] });
    },

    getRarity() {
        return this.getRarityRecursion(Math.floor(Math.random() * Math.floor(100)), -1, 0);
    },

    getRarityRecursion(chance, index, number) {
        const catchChance = {
            'Siêu Bình Thường': 50,
            'Bình Thường': 50,
            'Trung Bình': 45,
            'Hiếm': 50,
            'Siêu Hiếm': 50,
            'Cực Hiếm': 50,
            'Cực Phẩm': 50
        };
        
        const rarityList = [
            'Siêu Bình Thường',
            'Bình Thường',
            'Trung Bình',
            'Hiếm',
            'Siêu Hiếm',
            'Cực Hiếm',
            'Cực Phẩm'
        ];

        if (index === 0 && chance <= catchChance[rarityList[0]]) return rarityList[0];
        else if (index >= rarityList.length - 1 && chance >= catchChance[rarityList[rarityList.length - 1]]) return rarityList[rarityList.length - 1];
        else if (chance > number && chance <= (number + catchChance[rarityList[index + 1]])) return rarityList[index + 1];
        else return this.getRarityRecursion(chance, index + 1, (number + catchChance[rarityList[index + 1]]));
    },

    async getZombie(zombieRarity, currentHour, currentMonth) {
        const dataPath = path.join(__dirname, '../data');
        const zombieData = JSON.parse(fs.readFileSync(path.join(dataPath, 'zombie.json'), 'utf8'));
        
        const newZombieData = zombieData.Zombie.filter(z => 
            (z.time.indexOf(parseInt(currentHour)) !== -1) && 
            (z.months.indexOf(parseInt(currentMonth)) !== -1) && 
            z.rarity === zombieRarity
        );
        
        return newZombieData;
    },

    // Handle button interactions for shop
    async handleShopButtons(interaction) {
        try {
            const buttonId = interaction.customId;
            const dataPath = path.join(__dirname, '../data');
            const userData = JSON.parse(fs.readFileSync(path.join(dataPath, 'huntzombie.json'), 'utf8'));
            const userId = interaction.user.id;
            
            if (!userData[userId] || !userData[userId].data.zwar || !userData[userId].data.zwar.new) {
                return interaction.reply({ content: '[ ZWar ] » Bạn chưa có mặt trên chiến trường', ephemeral: true });
            }
            
            const userGameData = userData[userId].data.zwar;
            
            switch (buttonId) {
                case 'buy_gun': {
                    const gunData = JSON.parse(fs.readFileSync(path.join(dataPath, 'gun.json'), 'utf8'));
                    
                    let gunList = '';
                    for (let i = 0; i < gunData.gun.length; i++) {
                        const gun = gunData.gun[i];
                        gunList += `${i + 1}. ${gun.name}: ${gun.price}$ \n» Độ bền: ${gun.duribility} \n» Thời Gian Chờ: ${gun.time} giây\n\n`;
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle('==== [ SHOP WEAPON ] ====')
                        .setDescription(gunList + '\nHãy chọn số tương ứng với súng bạn muốn mua')
                        .setColor('#00FF00');
                        
                    const collector = interaction.channel.createMessageComponentCollector({ 
                        filter: i => i.user.id === interaction.user.id,
                        time: 30000 
                    });
                    
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    
                    // Add message collector for gun selection
                    const filter = m => m.author.id === interaction.user.id && !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) <= gunData.gun.length;
                    
                    const collected = await interaction.channel.awaitMessages({ 
                        filter, 
                        max: 1, 
                        time: 30000,
                        errors: ['time'] 
                    }).catch(() => null);
                    
                    if (!collected) return interaction.followUp({ content: 'Hết thời gian lựa chọn!', ephemeral: true });
                    
                    const msg = collected.first();
                    const choice = parseInt(msg.content);
                    const selectedGun = gunData.gun[choice - 1];
                    
                    if (userData[userId].money < selectedGun.price) {
                        return interaction.followUp({ content: `[ ERROR ] » Bạn không đủ tiền để mua súng này! Bạn cần thêm ${selectedGun.price - userData[userId].money}$`, ephemeral: true });
                    }
                    
                    userData[userId].data.zwar.weapon = {
                        name: selectedGun.name,
                        price: selectedGun.price,
                        time: selectedGun.time,
                        duribility: selectedGun.duribility
                    };
                    
                    userData[userId].money -= selectedGun.price;
                    
                    fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
                    
                    return interaction.followUp({ content: `[ SHOP ] » Bạn đã mua thành công ${selectedGun.name} với giá ${selectedGun.price}$`, ephemeral: false });
                }
                case 'sell_zombie': {
                    const userGameData = userData[userId].data.zwar;
                    
                    if (!userGameData.critters || userGameData.critters.length === 0) {
                        return interaction.reply({ content: '[ ZWar ] » Bạn không có zombie nào để bán!', ephemeral: true });
                    }
                    
                    let totalPrice = 0;
                    userGameData.critters.forEach(zombie => totalPrice += zombie.price);
                    
                    userData[userId].money += totalPrice;
                    userData[userId].data.zwar.critters = [];
                    
                    fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
                    
                    return interaction.reply({ content: `[ ZWar ] » Bạn đã bán tất cả zombie và nhận được ${totalPrice}$`, ephemeral: false });
                }
                case 'upgrade_storage': {
                    const embed = new EmbedBuilder()
                        .setTitle('[ = ] NÂNG CẤP KHO [ = ]')
                        .setDescription(`Hiện tại bạn đang có ${userGameData.critters.length}/${userGameData.size} vị trí trong kho đồ\n\nGiá nâng cấp: 2000$ cho mỗi vị trí\n\nNhập số lượng vị trí bạn muốn nâng cấp`)
                        .setColor('#0099ff');
                        
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    
                    // Add message collector for slot upgrade
                    const filter = m => m.author.id === interaction.user.id && !isNaN(m.content) && parseInt(m.content) > 0;
                    
                    const collected = await interaction.channel.awaitMessages({ 
                        filter, 
                        max: 1, 
                        time: 30000,
                        errors: ['time'] 
                    }).catch(() => null);
                    
                    if (!collected) return interaction.followUp({ content: 'Hết thời gian lựa chọn!', ephemeral: true });
                    
                    const msg = collected.first();
                    const slots = parseInt(msg.content);
                    const cost = slots * 2000;
                    
                    if (userData[userId].money < cost) {
                        return interaction.followUp({ content: `[ ERROR ] » Bạn không đủ tiền để nâng cấp! Bạn cần thêm ${cost - userData[userId].money}$`, ephemeral: true });
                    }
                    
                    userData[userId].data.zwar.size += slots;
                    userData[userId].money -= cost;
                    
                    fs.writeFileSync(path.join(dataPath, 'huntzombie.json'), JSON.stringify(userData, null, 2));
                    
                    return interaction.followUp({ content: `[ SHOP ] » Bạn đã nâng cấp kho thành công thêm ${slots} vị trí với giá ${cost}$`, ephemeral: false });
                }
                default:
                    return interaction.reply({ content: 'Lựa chọn không hợp lệ!', ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Đã xảy ra lỗi khi xử lý yêu cầu!', ephemeral: true });
        }
    }
};
