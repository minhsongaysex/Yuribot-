const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const DATA_FILE = "commands/moderation/data/datauser.json"; // Đường dẫn file dữ liệu

// Đọc dữ liệu từ file JSON
function readUserData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

// Ghi dữ liệu vào file JSON
function writeUserData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('godness')
        .setDescription('Triệu hồi thảm họa hoặc ban phước lành.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('attack')
                .setDescription('Gọi một thảm họa tấn công người khác.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Chọn người bị tấn công')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bless')
                .setDescription('Ban phước lành để bảo vệ ai đó khỏi thảm họa và tặng tiền.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Chọn người để bảo vệ')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userData = readUserData();
        const userId = interaction.user.id;

        if (!(userId in userData)) {
            userData[userId] = { balance: 0, blessed: false };
        }

        if (subcommand === 'attack') {
            const target = interaction.options.getUser('target');
            const targetId = target.id;

            if (targetId === userId) {
                return interaction.reply({ content: '❌ Bạn không thể tự tấn công chính mình!', ephemeral: true });
            }

            if (!(targetId in userData)) {
                userData[targetId] = { balance: 0, blessed: false };
            }

            const disasters = [
                { name: 'Thiên thạch rơi', damage: '💥 Một thiên thạch khổng lồ lao xuống!', gif: 'https://media.tenor.com/bI9iz7cvHvsAAAAC/meteor-impact.gif' },
                { name: 'Bão lốc xoáy', damage: '🌪️ Một cơn bão cuốn phăng mọi thứ!', gif: 'https://media.tenor.com/NpSwqpp1HcsAAAAd/tornado-storm.gif' },
                { name: 'Sóng thần', damage: '🌊 Một cơn sóng thần khổng lồ ập đến!', gif: 'https://media.tenor.com/RqLy4psTZxYAAAAC/tsunami-wave.gif' },
                { name: 'Động đất', damage: '🌍 Mặt đất rung chuyển dữ dội!', gif: 'https://media.tenor.com/q1j1PZfOdMUAAAAC/earthquake-shaking.gif' },
                { name: 'Mưa sao băng', damage: '🔥 Một trận mưa sao băng tấn công!', gif: 'https://media.tenor.com/hXgALb3prhMAAAAC/meteorite.gif' }
            ];

            const disaster = disasters[Math.floor(Math.random() * disasters.length)];
            const loss = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

            if (userData[targetId].blessed) {
                userData[targetId].blessed = false;
                writeUserData(userData);
                return interaction.reply({
                    content: `✨ ${target.username} đã sử dụng **phước lành** và tránh được thảm họa!`,
                    ephemeral: false
                });
            }

            userData[targetId].balance = Math.max(0, userData[targetId].balance - loss);
            writeUserData(userData);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`⚠️ Thảm họa: ${disaster.name}`)
                .setDescription(`${disaster.damage} \n💸 **${target.username} bị mất ${loss} tiền!**`)
                .setImage(disaster.gif)
                .setFooter({ text: `Kẻ gây ra thảm họa: ${interaction.user.username}` });

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'bless') {
            const target = interaction.options.getUser('target');
            const targetId = target.id;

            if (!(targetId in userData)) {
                userData[targetId] = { balance: 0, blessed: false };
            }

            const reward = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;

            userData[targetId].balance += reward;
            userData[targetId].blessed = true;
            writeUserData(userData);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✨ Phước lành được ban xuống!')
                .setDescription(`**${target.username}** đã được bảo vệ khỏi một thảm họa và nhận được **${reward} tiền**.`)
                .setImage('https://media.tenor.com/23LKj6yXq9IAAAAC/blessing-light.gif')
                .setFooter({ text: `Phước lành được ban bởi: ${interaction.user.username}` });

            await interaction.reply({ embeds: [embed] });
        }
    }
};
