const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { get } = require('https');

// Nhập ID server và ID kênh mặc định
const DEFAULT_SERVER_IDS = ['1307554613796278362', '1345778086720831488']; // Thay bằng danh sách ID server mặc định
const DEFAULT_CHANNEL_IDS = ['1337029269791969391', '1345778087605964882']; // Thay bằng danh sách ID kênh mặc định

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendnoti')
        .setDescription('Gửi thông báo đến nhiều kênh hoặc toàn bộ server bot có mặt')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('Nhập nội dung thông báo')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('media_url')
                .setDescription('URL của ảnh, GIF hoặc video')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('server_ids')
                .setDescription('Danh sách ID server (phân tách bằng dấu phẩy)')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('channel_ids')
                .setDescription('Danh sách ID kênh (phân tách bằng dấu phẩy)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const messageContent = interaction.options.getString('message');
        const mediaUrl = interaction.options.getString('media_url');
        const serverIds = interaction.options.getString('server_ids')?.split(',') || DEFAULT_SERVER_IDS;
        const channelIds = interaction.options.getString('channel_ids')?.split(',') || DEFAULT_CHANNEL_IDS;
        
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('📢 **THÔNG BÁO MỚI**')
            .setDescription(`📌 **Nội dung:**
>>> ${messageContent}`)
            .setFooter({ text: `Gửi bởi ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (mediaUrl) embed.setImage(mediaUrl);

        let success = 0, failed = 0;

        for (const serverId of serverIds) {
            try {
                const guild = interaction.client.guilds.cache.get(serverId.trim());
                if (!guild) {
                    failed++;
                    continue;
                }
                
                for (const channelId of channelIds) {
                    try {
                        const channel = guild.channels.cache.get(channelId.trim());
                        if (!channel || !channel.isTextBased()) {
                            failed++;
                            continue;
                        }
                        
                        await channel.send({ embeds: [embed] });
                        success++;
                    } catch (error) {
                        failed++;
                    }
                }
            } catch (error) {
                failed++;
            }
        }

        await interaction.reply(`✅ Đã gửi thông báo đến **${success}** kênh. ❌ Không thể gửi đến **${failed}** kênh.`);
    }
};
