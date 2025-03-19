const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baucua')
        .setDescription('Chơi bầu cua')
        .addStringOption(option => 
            option.setName('loai')
                .setDescription('Chọn bầu/cua/cá/nai/gà/tôm')
                .setRequired(true)
                .addChoices(
                    { name: 'Bầu', value: 'bau' },
                    { name: 'Cua', value: 'cua' },
                    { name: 'Cá', value: 'ca' },
                    { name: 'Nai', value: 'nai' },
                    { name: 'Gà', value: 'ga' },
                    { name: 'Tôm', value: 'tom' }
                )
        )
        .addIntegerOption(option => 
            option.setName('tien')
                .setDescription('Số tiền cược (tối thiểu 5000)')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        
        const userChoice = interaction.options.getString('loai');
        const betAmount = interaction.options.getInteger('tien');
        const userId = interaction.user.id;
        
        // Validate bet amount
        if (betAmount < 5000) {
            return interaction.editReply("❌ Số tiền đặt không được dưới 5000 đô!");
        }
        
        // Check user's money - using the correct data structure
        const moneyData = getUserMoney(userId);
        if (!moneyData) {
            return interaction.editReply("✅ **Tài khoản của bạn chưa được tạo!** Vui lòng sử dụng lệnh /b52 trước để nhận tiền.");
        }
        
        if (betAmount > moneyData.money) {
            return interaction.editReply("❌ Số tiền bạn đặt lớn hơn số dư của bạn!");
        }

        // Image URLs
        const imageUrls = {
            ga: 'https://i.imgur.com/jPdZ1Q8.jpg',
            tom: 'https://i.imgur.com/4214Xx9.jpg',
            bau: 'https://i.imgur.com/4KLd4EE.jpg',
            cua: 'https://i.imgur.com/s8YAaxx.jpg',
            ca: 'https://i.imgur.com/YbFzAOU.jpg',
            nai: 'https://i.imgur.com/UYhUZf8.jpg',
            gif: 'https://i.imgur.com/dlrQjRL.gif'
        };
        
        // Emoji mapping
        const emojis = {
            ga: "🐓",
            tom: "🦞",
            bau: "🍐",
            cua: "🦀",
            ca: "🐟",
            nai: "🦌"
        };

        // Send rolling animation
        const gifAttachment = new AttachmentBuilder(imageUrls.gif, { name: 'baucua.gif' });
        const loadingMessage = await interaction.editReply({ 
            content: "[𝑷𝑮🐧] => Đang Địt, À Không Đang Lắc!", 
            files: [gifAttachment] 
        });
        
        // Generate random results
        const slotItems = ["ga", "tom", "bau", "cua", "ca", "nai"];
        const results = Array(3).fill().map(() => slotItems[Math.floor(Math.random() * slotItems.length)]);
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get result images
        const resultImages = await Promise.all(results.map(item => axios.get(imageUrls[item], { responseType: 'arraybuffer' })));
        const attachments = resultImages.map((img, index) => 
            new AttachmentBuilder(img.data, { name: `${results[index]}.jpg` })
        );
        
        // Count matches and calculate winnings
        const matchCount = results.filter(item => item === userChoice).length;
        let winAmount = 0;
        let resultMessage = "";
        
        // First subtract the bet amount
        updateUserMoney(userId, -betAmount);
        
        if (matchCount > 0) {
            if (matchCount === 1) {
                winAmount = betAmount + 300;
                resultMessage = `[𝑷𝑮🐧] => Kết Quả : ${results.map(r => emojis[r]).join("|")}\n[✤] => Được ${winAmount} Đô, Vì Có 1 ${emojis[userChoice]}!`;
            } else if (matchCount === 2) {
                winAmount = betAmount * 2;
                resultMessage = `[𝑷𝑮🐧] => Kết Quả : ${results.map(r => emojis[r]).join("|")}\n[✤] => Được ${winAmount} Đô, Vì Có 2 ${emojis[userChoice]}!`;
            } else if (matchCount === 3) {
                winAmount = betAmount * 3;
                resultMessage = `[𝑷𝑮🐧] => Kết Quả : ${results.map(r => emojis[r]).join("|")}\n[✤] => Được ${winAmount} Đô, Vì Có 3 ${emojis[userChoice]}!`;
            }
            
            // Update user money (win)
            updateUserMoney(userId, winAmount);
        } else {
            resultMessage = `[𝑷𝑮🐧] => Kết Quả : ${results.map(r => emojis[r]).join("|")}\n[✤] => Trừ ${betAmount} Đô, Vì Có 0 ${emojis[userChoice]}!`;
            // No need to update money again as we already subtracted the bet amount
        }
        
        // Get updated money
        const updatedMoneyData = getUserMoney(userId);
        const currentBalance = updatedMoneyData ? updatedMoneyData.money : 0;
        
        // Create a canvas to combine the three result images
        const canvas = createCanvas(900, 300);
        const ctx = canvas.getContext('2d');
        
        // Load and draw the three images side by side
        try {
            const images = await Promise.all(resultImages.map(img => loadImage(img.data)));
            images.forEach((img, i) => {
                ctx.drawImage(img, i * 300, 0, 300, 300);
            });
            
            const combinedBuffer = canvas.toBuffer();
            const combinedAttachment = new AttachmentBuilder(combinedBuffer, { name: 'result.png' });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(matchCount > 0 ? 0x00FF00 : 0xFF0000)
                .setTitle('🎲 Kết Quả Bầu Cua')
                .setDescription(`${resultMessage}\n💵 **Số dư hiện tại:** ${currentBalance}$`)
                .setImage('attachment://result.png')
                .setFooter({ text: `Người chơi: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            
            await interaction.editReply({ content: null, embeds: [embed], files: [combinedAttachment] });
        } catch (error) {
            console.error('Error creating canvas:', error);
            await interaction.editReply({ 
                content: `${resultMessage}\n💵 **Số dư hiện tại:** ${currentBalance}$`, 
                files: attachments 
            });
        }
    }
};

// Function to get user money
function getUserMoney(userId) {
    const dataPath = path.join(__dirname, '../data/money.json');
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify({}));
        return null;
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return data[userId];
}

// Function to update user money
function updateUserMoney(userId, amount) {
    const dataPath = path.join(__dirname, '../data/money.json');
    let data = {};
    
    if (fs.existsSync(dataPath)) {
        data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    
    if (!data[userId]) {
        return false; // User doesn't exist
    }
    
    // Update money
    data[userId].money += amount;
    
    // Make sure money doesn't go below 0
    if (data[userId].money < 0) {
        data[userId].money = 0;
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
}
