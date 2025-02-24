const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('canva')
        .setDescription('Tạo ảnh từ API Subhatde')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lienquan')
                .setDescription('Tạo ảnh Liên Quân')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Nhập ID tướng')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Nhập văn bản')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('giangsinh')
                .setDescription('Tạo ảnh Giáng Sinh')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Nhập văn bản')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fbcover')
                .setDescription('Tạo ảnh bìa Facebook')
                .addStringOption(option => option.setName('name').setDescription('Tên chính').setRequired(true))
                .addStringOption(option => option.setName('uid').setDescription('User ID Facebook').setRequired(true))
                .addStringOption(option => option.setName('address').setDescription('Địa chỉ').setRequired(true))
                .addStringOption(option => option.setName('email').setDescription('Email').setRequired(true))
                .addStringOption(option => option.setName('subname').setDescription('Tên phụ').setRequired(true))
                .addStringOption(option => option.setName('sdt').setDescription('Số điện thoại').setRequired(true))
                .addStringOption(option => option.setName('color').setDescription('Màu sắc').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        try {
            let imageUrl = "";

            if (subcommand === 'lienquan') {
                const id = interaction.options.getInteger('id');
                const word = encodeURIComponent(interaction.options.getString('word'));
                imageUrl = `https://subhatde.id.vn/lienquan?id=${id}&word=${word}`;
            }

            else if (subcommand === 'giangsinh') {
                const text = encodeURIComponent(interaction.options.getString('text'));
                imageUrl = `https://subhatde.id.vn/giangsinh?text=${text}`;
            }

            else if (subcommand === 'fbcover') {
                const name = encodeURIComponent(interaction.options.getString('name'));
                const uid = encodeURIComponent(interaction.options.getString('uid'));
                const address = encodeURIComponent(interaction.options.getString('address'));
                const email = encodeURIComponent(interaction.options.getString('email'));
                const subname = encodeURIComponent(interaction.options.getString('subname'));
                const sdt = encodeURIComponent(interaction.options.getString('sdt'));
                const color = encodeURIComponent(interaction.options.getString('color'));

                imageUrl = `https://subhatde.id.vn/fbcover/v1?name=${name}&uid=${uid}&address=${address}&email=${email}&subname=${subname}&sdt=${sdt}&color=${color}`;
            }

            // Kiểm tra nếu API trả về lỗi
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            if (!response || response.status !== 200) {
                return interaction.editReply('❌ Không thể tạo ảnh từ API!');
            }

            // Gửi Embed chứa ảnh
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📸 Ảnh đã được tạo!`)
                .setImage(imageUrl)
                .setFooter({ text: 'Dữ liệu từ subhatde.id.vn' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Có lỗi xảy ra khi gọi API!');
        }
    }
};
