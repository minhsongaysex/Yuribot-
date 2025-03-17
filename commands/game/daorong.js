const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the data files
const dataFile = path.join(__dirname, '../data/datadra.json');
const PET_STORE_PATH = path.join(__dirname, '../data/dragon.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daorong')
        .setDescription('🐉 Mini-game Đảo Rồng trên Discord!')
        .addSubcommand(subcommand =>
            subcommand.setName('register').setDescription('📜 Đăng ký tài khoản Đảo Rồng'))
        .addSubcommand(subcommand =>
            subcommand.setName('spin').setDescription('🎰 Quay thưởng may mắn'))
        .addSubcommand(subcommand =>
            subcommand.setName('build').setDescription('🏗️ Nâng cấp đảo của bạn'))
        .addSubcommand(subcommand =>
            subcommand.setName('shop').setDescription('🛒 Mua rồng mới'))
        .addSubcommand(subcommand =>
            subcommand.setName('battle').setDescription('⚔️ Thi đấu với người chơi khác')
            .addUserOption(option => 
                option.setName('opponent')
                .setDescription('Người chơi muốn thách đấu')
                .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('info').setDescription('📜 Xem thông tin cá nhân'))
        .addSubcommand(subcommand =>
            subcommand.setName('top').setDescription('🏆 Xem bảng xếp hạng')),

    async execute(interaction) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand(); // Fix: Define subcommand variable

        try {
            // Ensure data files exist
            if (!fs.existsSync(dataFile)) {
                fs.writeFileSync(dataFile, JSON.stringify({}, null, 2));
            }

            let userData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            let userPets = {}; // Initialize userPets object

            // Try to load monster data
            let monsterData;
            try {
                monsterData = JSON.parse(fs.readFileSync(PET_STORE_PATH, 'utf8'));
            } catch (err) {
                console.error('Error loading monster data:', err);
                monsterData = { dragons: [] }; // Provide a default if file doesn't exist
            }

            // Command: Register
            if (subcommand === 'register') {
                if (userData[userId]) {
                    return interaction.reply('⚠️ **Bạn đã có tài khoản Đảo Rồng rồi!**');
                }
                userData[userId] = {
                    name: interaction.user.username,
                    ID: userId,
                    shield: 3,
                    coins: 20000,
                    Island: {
                        level: 1,
                        coinsLV: 200,
                        data: {
                            tower: 0,
                            tree: 0,
                            pool: 0,
                            pet: 0
                        }
                    },
                    spin: 20,
                    dragons: [],
                    timeRegister: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                };
                fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
                return interaction.reply('✅ **Bạn đã đăng ký thành công!**');
            }

            // Check if user has an account for all other commands
            if (!userData[userId]) {
                return interaction.reply('❌ **Bạn chưa có tài khoản!** Hãy đăng ký trước bằng `/daorong register`.');
            }

            // Command: Info - Show user information
            if (subcommand === 'info') {
                const userInfo = userData[userId];
                const embed = new EmbedBuilder()
                    .setColor('#00FFFF')
                    .setTitle(`📜 Thông tin người chơi ${userInfo.name}`)
                    .setDescription(`
                        💰 **Số dư:** ${userInfo.coins} coins
                        🛡️ **Khiên bảo vệ:** ${userInfo.shield}
                        🎰 **Lượt quay còn lại:** ${userInfo.spin}
                        📊 **Cấp độ đảo:** ${userInfo.Island.level}
                        🏛️ **Tòa nhà:**
                        - Chuồng Nuôi: ${userInfo.Island.data.tower}/50
                        - Chuồng Ấp: ${userInfo.Island.data.tree}/50
                        - Chuồng Lai: ${userInfo.Island.data.pool}/50
                        - Môi Trường Sống: ${userInfo.Island.data.pet}/50
                        ⏰ **Ngày đăng ký:** ${userInfo.timeRegister}
                    `)
                    .setFooter({ text: 'Sử dụng /daorong shop để mua rồng mới' });

                return interaction.reply({ embeds: [embed] });
            }

            // Command: Top - Show leaderboard
            if (subcommand === 'top') {
                // Sort users by coins
                const sortedUsers = Object.values(userData)
                    .sort((a, b) => b.coins - a.coins)
                    .slice(0, 10); // Get top 10
                
                let leaderboardText = '';
                sortedUsers.forEach((user, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    leaderboardText += `${medal} **${user.name}** - 💰 ${user.coins.toLocaleString()} coins\n`;
                });
                
                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🏆 Bảng xếp hạng Đảo Rồng')
                    .setDescription(leaderboardText || 'Chưa có người chơi nào.')
                    .setFooter({ text: 'Cập nhật theo thời gian thực' });
                
                return interaction.reply({ embeds: [embed] });
            }

            // Command: Spin - Lucky spin
            if (subcommand === 'spin') {
                if (userData[userId].coins < 500) {
                    return interaction.reply('❌ **Bạn không đủ tiền để quay!** Cần ít nhất 500 coins.');
                }
                
                if (userData[userId].spin <= 0) {
                    return interaction.reply('❌ **Bạn đã hết lượt quay!** Hãy đợi đến ngày mai.');
                }
                
                // Deduct cost and spins
                userData[userId].coins -= 500;
                userData[userId].spin -= 1;
                
                // Random reward between 100-20000 coins
                const reward = Math.floor(Math.random() * 19901) + 100;
                userData[userId].coins += reward;
                
                // Save updated data
                fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
                
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🎰 Quay thưởng may mắn')
                    .setDescription(`
                        🎲 **Kết quả:** ${reward} coins
                        💰 **Số dư hiện tại:** ${userData[userId].coins} coins
                        🎯 **Lượt quay còn lại:** ${userData[userId].spin}
                    `)
                    .setFooter({ text: 'Mỗi lần quay tốn 500 coins' });
                
                return interaction.reply({ embeds: [embed] });
            }

            // Command: Shop - Buy dragons
            if (subcommand === 'shop') {
                try {
                    // Thử tìm file ở các vị trí khác nhau
                    let monsterDataPath;
                    let monsterData;
                    
                    // Danh sách các đường dẫn có thể tồn tại
                    const possiblePaths = [
                        path.join(__dirname, 'monsterdragon.json'),
                        path.join(__dirname, '..', 'monsterdragon.json'),
                        path.join(__dirname, '..', '..', 'monsterdragon.json'),
                        path.join(__dirname, '..', 'data', 'monsterdragon.json')
                    ];
                    
                    // Tìm file trong các đường dẫn có thể
                    for (const testPath of possiblePaths) {
                        try {
                            if (fs.existsSync(testPath)) {
                                monsterDataPath = testPath;
                                monsterData = JSON.parse(fs.readFileSync(monsterDataPath, 'utf8'));
                                console.log(`Found monster data at: ${monsterDataPath}`);
                                break;
                            }
                        } catch (err) {
                            // Tiếp tục tìm kiếm
                        }
                    }
                    
                    // Nếu không tìm thấy file, tạo file mới với dữ liệu mẫu
                    if (!monsterData) {
                        console.log('Creating new monster data file');
                        monsterDataPath = path.join(__dirname, '../data/dragon.json');
                        
                        // Dữ liệu mẫu cho file mới
                        monsterData = {
                            "dragons": [
                                {
                                    "name": "Rồng Đất",
                                    "emoji": "🐲",
                                    "price": 1000,
                                    "stats": {
                                        "attack": 150,
                                        "hp": 300,
                                        "healing": 0
                                    },
                                    "description": "Rồng mạnh mẽ có sức tấn công cao"
                                },
                                {
                                    "name": "Rồng Nước",
                                    "emoji": "🌊",
                                    "price": 1200,
                                    "stats": {
                                        "attack": 120,
                                        "hp": 350,
                                        "healing": 20
                                    },
                                    "description": "Rồng có khả năng hồi máu"
                                },
                                {
                                    "name": "Rồng Lửa",
                                    "emoji": "🔥",
                                    "price": 1500,
                                    "stats": {
                                        "attack": 200,
                                        "hp": 250,
                                        "healing": 0
                                    },
                                    "description": "Rồng có sức tấn công cực cao"
                                }
                            ]
                        };
                        
                        // Lưu file mới
                        try {
                            // Tạo thư mục nếu chưa tồn tại
                            const dir = path.dirname(monsterDataPath);
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            
                            fs.writeFileSync(monsterDataPath, JSON.stringify(monsterData, null, 2));
                            console.log(`Created new monster data file at: ${monsterDataPath}`);
                        } catch (err) {
                            console.error('Failed to create monster data file:', err);
                            return interaction.reply('❌ **Lỗi: Không thể tạo file dữ liệu rồng!**');
                        }
                    }
                    
                    // Make sure the dragons array exists
                    if (!monsterData.dragons || !Array.isArray(monsterData.dragons)) {
                        return interaction.reply('❌ **Lỗi: Không tìm thấy dữ liệu rồng trong file!**');
                    }
            
                    // Create embed for shop display
                    const embed = new EmbedBuilder()
                        .setColor('#00FFFF')
                        .setTitle('🐉 Shop Rồng')
                        .setDescription(`💰 **Số dư:** ${userData[userId].coins} coins\n\n**Danh sách rồng có thể mua:**`);
            
                    // Display all available dragons with their stats
                    let dragonList = '';
                    monsterData.dragons.forEach((dragon, index) => {
                        // Check if all required properties exist
                        if (!dragon.name || !dragon.price || !dragon.stats) {
                            console.error(`Missing required properties for dragon at index ${index}`, dragon);
                            return; // Skip this dragon
                        }
            
                        dragonList += `**${index + 1}. ${dragon.name}** ${dragon.emoji || ''}\n` +
                                      `💰 Giá: **${dragon.price} coins**\n` +
                                      `⚔️ Attack: **${dragon.stats.attack || 0}**\n` +
                                      `❤️ HP: **${dragon.stats.hp || 0}**\n` +
                                      `💉 Hồi máu: **${dragon.stats.healing || 0}**\n` +
                                      `💬 ${dragon.description || "Không có mô tả"}\n\n`;
                    });
            
                    if (dragonList === '') {
                        return interaction.reply('❌ **Không có rồng nào trong shop!**');
                    }
            
                    embed.setDescription(embed.data.description + '\n\n' + dragonList);
                    embed.setFooter({ text: 'Trả lời bằng số thứ tự để mua rồng' });
                    
                    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
                    
                    // Create collector for shop command
                    const filter = m => m.author.id === userId && !isNaN(m.content) && m.channelId === interaction.channelId;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });
                    
                    collector.on('collect', async msg => {
                        // Ensure this is only processed once by checking if collector is still active
                        if (collector.ended) return;
                        
                        const choice = parseInt(msg.content);
                        
                        // Validate choice
                        if (choice < 1 || choice > monsterData.dragons.length) {
                            await msg.reply('❌ **Số thứ tự không hợp lệ!**');
                            return;
                        }
                        
                        const selectedDragon = monsterData.dragons[choice - 1];
                        
                        // Check if user has enough coins
                        if (userData[userId].coins < selectedDragon.price) {
                            await msg.reply(`❌ **Bạn không đủ tiền để mua ${selectedDragon.name}!**`);
                            return;
                        }
                        
                        // Check if user already has this dragon
                        if (userData[userId].dragons.includes(selectedDragon.name)) {
                            await msg.reply(`❌ **Bạn đã sở hữu ${selectedDragon.name} rồi!**`);
                            return;
                        }
                        
                        // Add dragon to user's collection
                        userData[userId].dragons.push(selectedDragon.name);
                        
                        // Deduct coins from user
                        userData[userId].coins -= selectedDragon.price;
                        
                        // Save updated data
                        fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
                        
                        // Create purchase confirmation embed
                        const purchaseEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('✅ Mua thành công!')
                            .setDescription(`Bạn đã mua **${selectedDragon.name}** ${selectedDragon.emoji || ''} với giá **${selectedDragon.price} coins**!\n\n` +
                                           `⚔️ Attack: **${selectedDragon.stats.attack || 0}**\n` +
                                           `❤️ HP: **${selectedDragon.stats.hp || 0}**\n` +
                                           `💉 Hồi máu: **${selectedDragon.stats.healing || 0}**\n\n` +
                                           `💰 **Số dư còn lại:** ${userData[userId].coins} coins`)
                            .setFooter({ text: 'Sử dụng lệnh /daorong info để xem thông tin của bạn' });
                        
                        await msg.reply({ embeds: [purchaseEmbed] });
                        collector.stop();
                    });
                    
                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp('❌ **Hết thời gian chọn mua!**');
                        }
                    });
                    
                } catch (error) {
                    console.error('Shop command error:', error);
                    return interaction.reply(`❌ **Đã xảy ra lỗi khi thực hiện lệnh shop!** ${error.message}`);
                }
            }
            // Command: Build - Upgrade island
            if (subcommand === 'build') {
                const buildings = [
                    { name: 'Chuồng Nuôi', key: 'tower' },
                    { name: 'Chuồng Ấp', key: 'tree' },
                    { name: 'Chuồng Lai', key: 'pool' },
                    { name: 'Môi Trường Sống', key: 'pet' }
                ];
                
                const embed = new EmbedBuilder()
                    .setColor('#8E44AD')
                    .setTitle('🏗️ Nâng cấp đảo')
                    .setDescription(`💰 **Số dư:** ${userData[userId].coins} coins\n📊 **Cấp độ đảo:** ${userData[userId].Island.level}\n💬 **Chọn khu vực cần nâng cấp:**`)
                    .setFooter({ text: 'Trả lời bằng số thứ tự để nâng cấp' });
                
                let buildList = '';
                buildings.forEach((building, index) => {
                    let cost = userData[userId].Island.coinsLV * (userData[userId].Island.data[building.key] + 1);
                    buildList += `**${index + 1}. ${building.name}** - 💰 ${cost} coins (${userData[userId].Island.data[building.key]}/50)\n`;
                });
                
                embed.setDescription(embed.data.description + '\n\n' + buildList);
                
                const message = await interaction.reply({ embeds: [embed], fetchReply: true });
                
                // Fix: Use a unique message collector ID to prevent interference with other commands
                const buildCollectorId = `build_${userId}_${Date.now()}`;
                const filter = m => m.author.id === userId && !isNaN(m.content) && m.channelId === interaction.channelId;
                const collector = interaction.channel.createMessageCollector({ filter, time: 30000, dispose: true });
                
                collector.on('collect', async msg => {
                    // Ensure this is only processed once by checking if collector is still active
                    if (collector.ended) return;
                    
                    const choice = parseInt(msg.content);
                    if (choice < 1 || choice > buildings.length) {
                        await msg.reply('❌ **Số thứ tự không hợp lệ!**');
                        return;
                    }
            
                    const selectedBuilding = buildings[choice - 1];
                    let cost = userData[userId].Island.coinsLV * (userData[userId].Island.data[selectedBuilding.key] + 1);
            
                    if (userData[userId].coins < cost) {
                        await msg.reply('❌ **Bạn không đủ tiền để nâng cấp!**');
                        return;
                    }
            
                    if (userData[userId].Island.data[selectedBuilding.key] >= 50) {
                        await msg.reply(`❌ **${selectedBuilding.name} đã đạt cấp tối đa!**`);
                        return;
                    }
            
                    // Trừ tiền và tăng cấp
                    userData[userId].coins -= cost;
                    userData[userId].Island.data[selectedBuilding.key]++;
            
                    // Cập nhật dữ liệu
                    fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
            
                    const upgradeEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(`✅ Nâng cấp thành công!`)
                        .setDescription(`🏗️ **${selectedBuilding.name}** đã được nâng cấp lên cấp ${userData[userId].Island.data[selectedBuilding.key]}!\n💰 **Số dư còn lại:** ${userData[userId].coins} coins`);
            
                    await msg.reply({ embeds: [upgradeEmbed] });
                    
                    // End the collector after successful upgrade
                    collector.stop();
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.followUp('❌ **Hết thời gian chọn nâng cấp!**');
                    }
                });
            
                return;
            }
            
            // Improved battle command with area selection
            if (subcommand === 'battle') {
                // Define areas and their monsters
                const areas = {
                    "Đảo Núi Lửa": [
                        { name: "Rồng Lửa", health: 120, attack: 40 },
                        { name: "Thằn Lằn Magma", health: 80, attack: 25 },
                        { name: "Quỷ Sương Đỏ", health: 100, attack: 35 }
                    ],
                    "Đảo Tuyết": [
                        { name: "Bạch Long", health: 130, attack: 30 },
                        { name: "Quái Vật Tuyết", health: 150, attack: 25 },
                        { name: "Hổ Băng", health: 90, attack: 45 }
                    ],
                    "Đảo Rừng": [
                        { name: "Rồng Lá", health: 110, attack: 35 },
                        { name: "Thú Lùn", health: 70, attack: 50 },
                        { name: "Tinh Linh Rừng", health: 85, attack: 40 }
                    ],
                    "Đảo Sa Mạc": [
                        { name: "Rồng Cát", health: 100, attack: 45 },
                        { name: "Bọ Cạp Khổng Lồ", health: 70, attack: 60 },
                        { name: "Xác Ướp", health: 140, attack: 30 }
                    ]
                };
            
                // Check if user has a pet
                if (!userPets[interaction.user.id] || !userPets[interaction.user.id].currentPet) {
                    return interaction.reply('❌ Bạn chưa có pet! Hãy dùng `/pet buy` để mua.');
                }
            
                // Check if user selected an opponent or wants to fight area monsters
                const opponent = interaction.options.getUser('opponent');
                
                if (opponent) {
                    // PvP battle logic
                    const opponentID = opponent.id;
                    
                    if (!userPets[opponentID] || !userPets[opponentID].currentPet) {
                        return interaction.reply(`❌ **${opponent.username}** chưa có pet!`);
                    }
                    
                    let playerPetName = userPets[interaction.user.id].currentPet;
                    let opponentPetName = userPets[opponentID].currentPet;
                    
                    let playerPet = userPets[interaction.user.id].pets[playerPetName];
                    let opponentPet = userPets[opponentID].pets[opponentPetName];
                    
                    // Kiểm tra nếu pet bị undefined
                    if (!playerPet || !opponentPet) {
                        return interaction.reply('❌ Lỗi: Một trong hai pet không tồn tại. Hãy kiểm tra lại dữ liệu!');
                    }
                    
                    let playerHP = playerPet.stats.defense * 10;
                    let opponentHP = opponentPet.stats.defense * 10;
                    
                    let battleMessage = await interaction.reply({ 
                        content: `🐾 **Trận chiến giữa ${playerPetName} và ${opponentPetName} bắt đầu...**\n\n` +
                                 `🐉 **${playerPetName}**: ❤️ ${playerHP} | ⚔️ ${playerPet.stats.strength}\n` +
                                 `🦄 **${opponentPetName}**: ❤️ ${opponentHP} | ⚔️ ${opponentPet.stats.strength}`,
                        fetchReply: true 
                    });
                    
                    let round = 1;
                    while (playerHP > 0 && opponentHP > 0 && round <= 10) {
                        let playerDamage = Math.max(1, playerPet.stats.strength - Math.floor(opponentPet.stats.defense / 2));
                        let opponentDamage = Math.max(1, opponentPet.stats.strength - Math.floor(playerPet.stats.defense / 2));
                        
                        opponentHP -= playerDamage;
                        playerHP -= opponentDamage;
                        
                        await battleMessage.edit(`**Round ${round}** ⚔️\n` +
                             `🐉 **${playerPetName}**: ❤️ ${Math.max(0, playerHP)} | ⚔️ ${playerPet.stats.strength} | 🛡️ ${playerPet.stats.defense} | 💥 -${opponentDamage}\n` +
                             `🦄 **${opponentPetName}**: ❤️ ${Math.max(0, opponentHP)} | ⚔️ ${opponentPet.stats.strength} | 🛡️ ${opponentPet.stats.defense} | 💥 -${playerDamage}`);
                        
                        round++;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        if (playerHP <= 0 || opponentHP <= 0) break;
                    }
                    
                    // Calculate rewards
                    const baseReward = 50;
                    let rewardCoins = 0;
                    
                    if (playerHP > 0) {
                        rewardCoins = baseReward + Math.floor(opponentPet.stats.strength * 0.5);
                        userData[interaction.user.id].coins += rewardCoins;
                        
                        await battleMessage.edit(`🏆 **Pet của bạn (${playerPetName}) đã chiến thắng ${opponentPetName}!** 🎉\n💰 Nhận được: ${rewardCoins} coins`);
                    } else {
                        await battleMessage.edit(`💀 **Pet của bạn (${playerPetName}) đã bại trận trước ${opponentPetName}!** 🤕`);
                    }
                    
                    // Update user data
                    fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
                    return;
                } else {
                    // PvE battle - Area selection
                    const areaEmbed = new EmbedBuilder()
                        .setColor('#FF9900')
                        .setTitle('🗺️ Chọn Vùng Đất')
                        .setDescription('Chọn vùng đất để chiến đấu:')
                        .setFooter({ text: 'Trả lời bằng số thứ tự để chọn vùng đất' });
                    
                    let areaList = '';
                    Object.keys(areas).forEach((area, index) => {
                        areaList += `**${index + 1}. ${area}**\n`;
                        // Thêm danh sách quái vật cho mỗi khu vực
                        areas[area].forEach(monster => {
                            areaList += `   • ${monster.name} - ⚔️ ${monster.attack} | ❤️ ${monster.health}\n`;
                        });
                        areaList += '\n';
                    });
                    
                    areaEmbed.setDescription(areaEmbed.data.description + '\n\n' + areaList);
                    
                    const areaMessage = await interaction.reply({ embeds: [areaEmbed], fetchReply: true });
                    
                    // Area selection collector
                    const areaFilter = m => m.author.id === interaction.user.id && m.channelId === interaction.channelId;
                    const areaCollector = interaction.channel.createMessageCollector({ filter: areaFilter, time: 30000 });
                    
                    areaCollector.on('collect', async msg => {
                        // Kiểm tra xem nội dung tin nhắn có phải là dạng "số hòn đảo, loại rồng" không
                        const inputParts = msg.content.split(',').map(part => part.trim());
                        
                        if (inputParts.length < 2) {
                            return msg.reply('❌ **Vui lòng chọn theo định dạng: [số thứ tự đảo], [tên rồng của bạn]**');
                        }
                        
                        const areaChoice = parseInt(inputParts[0]);
                        const dragonName = inputParts[1];
                        
                        if (isNaN(areaChoice) || areaChoice < 1 || areaChoice > Object.keys(areas).length) {
                            return msg.reply('❌ **Số thứ tự đảo không hợp lệ!**');
                        }
                        
                        // Kiểm tra xem người dùng có pet này không
                        const playerPetName = dragonName;
                        
                        if (!userPets[interaction.user.id].pets[playerPetName]) {
                            return msg.reply(`❌ **Bạn không có pet tên ${playerPetName}!**`);
                        }
                        
                        const playerPet = userPets[interaction.user.id].pets[playerPetName];
                        
                        const selectedArea = Object.keys(areas)[areaChoice - 1];
                        const monsters = areas[selectedArea];
                        
                        // Hiển thị danh sách quái vật
                        const monsterEmbed = new EmbedBuilder()
                            .setColor('#FF5500')
                            .setTitle(`🏞️ ${selectedArea}`)
                            .setDescription(`Bạn đã chọn chiến đấu tại ${selectedArea} với ${playerPetName}!\nChọn quái vật để chiến đấu:`)
                            .setFooter({ text: 'Trả lời bằng số thứ tự để chọn quái vật' });
                        
                        let monsterList = '';
                        monsters.forEach((monster, index) => {
                            monsterList += `**${index + 1}. ${monster.name}** - ❤️ ${monster.health} | ⚔️ ${monster.attack}\n`;
                        });
                        
                        monsterEmbed.setDescription(monsterEmbed.data.description + '\n\n' + monsterList);
                        const monsterMessage = await msg.reply({ embeds: [monsterEmbed] });
                        
                        // Monster selection collector
                        const monsterFilter = m => m.author.id === interaction.user.id && !isNaN(m.content) && m.channelId === interaction.channelId;
                        const monsterCollector = interaction.channel.createMessageCollector({ filter: monsterFilter, time: 30000 });
                        
                        monsterCollector.on('collect', async monsterMsg => {
                            const monsterChoice = parseInt(monsterMsg.content);
                            if (monsterChoice < 1 || monsterChoice > monsters.length) {
                                return monsterMsg.reply('❌ **Số thứ tự không hợp lệ!**');
                            }
                            
                            const selectedMonster = monsters[monsterChoice - 1];
                            
                            // Battle logic
                            let playerHP = playerPet.stats.defense * 10;
                            let monsterHP = selectedMonster.health;
                            
                            const battleMessage = await monsterMsg.reply({ 
                                content: `🐾 **Trận chiến giữa ${playerPetName} và ${selectedMonster.name} bắt đầu...**\n\n` +
                                         `🐉 **${playerPetName}**: ❤️ ${playerHP} | ⚔️ ${playerPet.stats.strength}\n` +
                                         `👹 **${selectedMonster.name}**: ❤️ ${monsterHP} | ⚔️ ${selectedMonster.attack}`,
                                fetchReply: true 
                            });
                            
                            let round = 1;
                            while (playerHP > 0 && monsterHP > 0 && round <= 10) {
                                let playerDamage = Math.max(1, playerPet.stats.strength - Math.floor(selectedMonster.attack / 4));
                                let monsterDamage = Math.max(1, selectedMonster.attack - Math.floor(playerPet.stats.defense / 2));
                                
                                monsterHP -= playerDamage;
                                playerHP -= monsterDamage;
                                
                                await battleMessage.edit(`**Round ${round}** ⚔️\n` +
                                     `🐉 **${playerPetName}**: ❤️ ${Math.max(0, playerHP)} | ⚔️ ${playerPet.stats.strength} | 🛡️ ${playerPet.stats.defense} | 💥 -${monsterDamage}\n` +
                                     `👹 **${selectedMonster.name}**: ❤️ ${Math.max(0, monsterHP)} | ⚔️ ${selectedMonster.attack} | 💥 -${playerDamage}`);
                                
                                round++;
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                
                                if (playerHP <= 0 || monsterHP <= 0) break;
                            }
                            
                            // Calculate rewards
                            const baseReward = 50;
                            let rewardCoins = 0;
                            let rewardExp = 0;
                            
                            if (playerHP > 0) {
                                rewardCoins = baseReward + Math.floor(selectedMonster.attack * 0.5);
                                rewardExp = Math.floor(selectedMonster.health * 0.1);
                                
                                userData[interaction.user.id].coins += rewardCoins;
                                if (!playerPet.exp) playerPet.exp = 0;
                                playerPet.exp += rewardExp;
                                
                                await battleMessage.edit(`🏆 **${playerPetName} đã chiến thắng ${selectedMonster.name}!** 🎉\n💰 Nhận được: ${rewardCoins} coins\n✨ EXP: +${rewardExp}`);
                                
                                // Check for level up
                                const expNeeded = (playerPet.level || 1) * 100;
                                if (playerPet.exp >= expNeeded) {
                                    playerPet.level = (playerPet.level || 1) + 1;
                                    playerPet.exp -= expNeeded;
                                    playerPet.stats.strength += 2;
                                    playerPet.stats.defense += 1;
                                    
                                    await interaction.followUp(`🌟 **${playerPetName} đã lên cấp ${playerPet.level}!**\n⚔️ Sức mạnh +2\n🛡️ Phòng thủ +1`);
                                }
                            } else {
                                await battleMessage.edit(`💀 **${playerPetName} đã bại trận trước ${selectedMonster.name}!** 🤕`);
                            }
                            
                            // Update user data
                            fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
                            fs.writeFileSync(petFile, JSON.stringify(userPets, null, 2));
                            
                            monsterCollector.stop();
                        });
                        
                        monsterCollector.on('end', (collected) => {
                            if (collected.size === 0) {
                                interaction.followUp('❌ **Hết thời gian chọn quái vật!**');
                            }
                        });
                        
                        areaCollector.stop();
                    });
                    areaCollector.on('end', (collected) => { if (collected.size === 0) { interaction.followUp('❌ **Hết thời gian chọn vùng đất!**'); } }); } } } catch (error) { console.error('Command execution error:', error); return interaction.reply({ content: '❌ **Đã xảy ra lỗi khi thực hiện lệnh!**', ephemeral: true }); } } };
