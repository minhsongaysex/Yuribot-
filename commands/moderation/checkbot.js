const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbot')
        .setDescription('Kiểm tra độ trễ của bot, thông tin server, số may mắn và thời tiết Hà Nội.'),
    
    async execute(interaction) {
        await interaction.reply({ content: '🔍 Đang thu thập thông tin...', fetchReply: true });

        // Kiểm tra ping bot & API
        const sent = await interaction.fetchReply();
        const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        // Xác định trạng thái bot dựa trên ping
        let botStatus;
        if (botLatency < 100) {
            botStatus = "🟢 Bot ổn định";
        } else if (botLatency >= 200 && botLatency <= 500) {
            botStatus = "🟠 Bot hơi lag";
        } else {
            botStatus = "🔴 Bot đã isekai!";
        }

        // Lấy số may mắn từ API
        let luckyNumber = "Đang tải...";
        try {
            const luckyResponse = await axios.get('https://huu-tri-api.onrender.com/somayman?nhonhat=1&lonnhat=30');
            luckyNumber = luckyResponse.data.luckynumber;
        } catch (error) {
            luckyNumber = "Không lấy được số may mắn 😢";
        }

        // Lấy dữ liệu thời tiết tại Hà Nội từ API
        let weatherInfo = {};
        try {
            const weatherResponse = await axios.get('https://kaiz-apis.gleeze.com/api/weather?q=hanoi');
            const weather = weatherResponse.data;
            const current = weather.current;
            weatherInfo = {
                location: weather.location.name,
                temperature: `${current.feelslike}°C`,
                humidity: `${current.humidity}%`,
                wind: current.winddisplay,
                date: `${current.day}, ${current.date}`
            };
        } catch (error) {
            weatherInfo = {
                location: "Không xác định",
                temperature: "N/A",
                humidity: "N/A",
                wind: "N/A",
                date: "Không có dữ liệu"
            };
        }

        // Xác định tình trạng thời tiết hôm nay: Mưa 🌧️ hoặc Nắng ☀️
        const weatherToday = Math.random() < 0.5 ? "☀️ Trời nắng" : "🌧️ Trời mưa";

        // Xác định tâm trạng ngày hôm nay: Tồi tệ 😭, Bình thường 😐, Vui vẻ 😄
        const moods = ["😭 Một ngày tồi tệ", "😐 Một ngày bình thường", "😄 Một ngày vui vẻ"];
        const todayMood = moods[Math.floor(Math.random() * moods.length)];

        // Thông tin server
        const guild = interaction.guild;
        const serverOwner = `<@${guild.ownerId}>` || "Không xác định";
        const memberCount = guild.memberCount;
        const serverRegion = guild.preferredLocale;

        // Embed thông tin bot, server, thời tiết, và số may mắn
        const embed = new EmbedBuilder()
            .setColor(botLatency < 100 ? 'Green' : botLatency < 500 ? 'Orange' : 'Red')
            .setTitle('📡 Kiểm Tra Bot')
            .addFields(
                { name: '🤖 Tên Bot', value: 'LMS Bot', inline: true },
                { name: '👑 Chủ Bot', value: 'LMS', inline: true },
                { name: '📊 Độ Trễ Bot', value: `${botLatency}ms`, inline: true },
                { name: '🌐 Độ Trễ API', value: `${apiLatency}ms`, inline: true },
                { name: '📌 Trạng thái', value: botStatus, inline: true },
                { name: '🎲 Số May Mắn', value: `🔢 ${luckyNumber}`, inline: true },
                { name: '📍 Vị trí', value: weatherInfo.location, inline: true },
                { name: '🌡 Cảm giác như', value: weatherInfo.temperature, inline: true },
                { name: '💧 Độ ẩm', value: weatherInfo.humidity, inline: true },
                { name: '💨 Gió', value: weatherInfo.wind, inline: true },
                { name: '📅 Ngày', value: weatherInfo.date, inline: true },
                { name: '🌦️ Thời tiết hôm nay', value: weatherToday, inline: true },
                { name: '🎭 Dự báo ngày', value: todayMood, inline: true },
                { name: '🌍 Sever', value: guild.name, inline: true },
                { name: '📍 Vùng Đất', value: serverRegion, inline: true },
                { name: '👥 Số Thành Viên', value: `${memberCount}`, inline: true },
                { name: '💼 Chủ Sever', value: serverOwner, inline: true },
                { name: '🆔 ID Sever', value: guild.id, inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};

