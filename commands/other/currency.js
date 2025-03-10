const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API_KEY = '942b4898abfadc45c22f861d'; 
const BASE_API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('currency')
        .setDescription('Xem tỷ giá giữa hai loại tiền tệ')
        .addStringOption(option =>
            option.setName('Đổi mệnh giá tiền từ')
                .setDescription('Nhập mã tiền tệ nguồn (VD: JPY, USD, EUR)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sang')
                .setDescription('Nhập mã tiền tệ muốn chuyển đổi (VD: VND, USD, EUR)')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply(); 

        const fromCurrency = interaction.options.getString('from').toUpperCase();
        const toCurrency = interaction.options.getString('to').toUpperCase();

        try {
            
            const response = await axios.get(`${BASE_API_URL}${fromCurrency}`);
            const rates = response.data.conversion_rates;

            if (!rates || !rates[toCurrency]) {
                return interaction.editReply(`❌ Không tìm thấy tỷ giá từ **${fromCurrency}** sang **${toCurrency}**.`);
            }

            
            const exchangeRate = rates[toCurrency];

            
            const embed = new EmbedBuilder()
                .setTitle('💱 Tỷ Giá Tiền Tệ')
                .setColor('#0099ff')
                .setThumbnail('https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2llaXBubHd5cHVoZGw1b3g1bWhtMGF1MXNlZXljcnNqeHV5M2V6biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KmXKSyoulpBXuu2Cx2/giphy.gif')
                .addFields(
                    { name: `💰 1 ${fromCurrency} =`, value: `💸 **${exchangeRate.toFixed(2)}** ${toCurrency}`, inline: false }
                )
                .setFooter({ text: 'Tỷ giá cập nhật từ ExchangeRate-API' });

            
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            interaction.editReply('❌ Đã xảy ra lỗi khi lấy tỷ giá tiền tệ.');
        }
    },
};
