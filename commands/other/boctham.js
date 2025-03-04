const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boctham')
        .setDescription('Bốc thăm may mắn với các gói tiền'),

    async execute(interaction) {
        const prizeOptions = [
            { label: '🎁', value: '10000', chance: 40, image: 'https://example.com/10k.png' },
            { label: '🎁', value: '20000', chance: 30, image: 'https://example.com/20k.png' },
            { label: '🎁', value: '50000', chance: 15, image: 'https://example.com/50k.png' },
            { label: '🎁', value: '100000', chance: 10, image: 'https://example.com/100k.png' },
            { label: '🎁', value: '200000', chance: 4, image: 'https://example.com/200k.png' },
        ];

        const row = new ActionRowBuilder()
            .addComponents(prizeOptions.map(prize =>
                new ButtonBuilder()
                    .setCustomId(`boctham_${prize.value}`)
                    .setLabel(prize.label)
                    .setStyle(ButtonStyle.Primary)
            ));

        const embed = new EmbedBuilder()
            .setColor(0xffcc00)
            .setTitle('🎋 Bốc Thăm Trúng Thưởng 🎋')
            .setDescription('📦 Hãy chọn một hộp quà để thử vận may!')
            .setImage('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3ZmcXRsaGV4ZW9lNjZubnc4b294aDZha2h2Y2JkbmNuNnoxdGdqMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/69ocantqVQ1QaTmmRi/giphy.gif');

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async buttonInteraction => {
            const selectedPrize = prizeOptions.find(p => `boctham_${p.value}` === buttonInteraction.customId);
            if (!selectedPrize) return;

            const randomChance = Math.random() * 100;
            let wonPrize = 10000;

            for (const prize of prizeOptions) {
                if (randomChance <= prize.chance) {
                    wonPrize = prize.value;
                    break;
                }
            }

            const prizeEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('Skibidi quá đã ời!')
                .setDescription(`Bạn đã bốc được🌸 **${wonPrize} 💵🤑VNĐ**!`)
                .setImage(selectedPrize.image);

            await buttonInteraction.update({
                content: '🎁 Kết quả bốc thăm:',
                embeds: [prizeEmbed],
                components: []
            });
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                await interaction.editReply({
                    content: '⏳ Bạn đã không chọn quà! Hãy thử lại.',
                    components: []
                });
            }
        });
    }
};
