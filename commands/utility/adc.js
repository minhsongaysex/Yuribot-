const PASTEBIN_API_KEY = "jzQc_LIjrbJdXsLg6l73q-fC7M7fGC6x";
const ADMIN_ID = "1306552024568959016"; // ID admin

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adc')
        .setDescription('Up code lên Pastebin hoặc lưu code từ URL')
        .addStringOption(option =>
            option.setName('filename')
                .setDescription('Tên file hoặc URL cần xử lý')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Nội dung để upload lên Pastebin')
                .setRequired(false)),

    async execute(interaction) {
        const userID = interaction.user.id;
        if (userID !== ADMIN_ID) {
            return interaction.reply({ content: "❌ Bạn không có quyền sử dụng lệnh này!", ephemeral: true });
        }

        const filename = interaction.options.getString('filename');
        const content = interaction.options.getString('content');

        // Kiểm tra nếu là URL
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        if (urlRegex.test(filename)) {
            try {
                const response = await axios.get(filename);
                const filePath = path.join(__dirname, `${Date.now()}.js`);

                fs.writeFileSync(filePath, response.data, "utf-8");
                return interaction.reply(`✅ Đã lưu code từ URL vào: \`${filePath}\``);
            } catch (error) {
                return interaction.reply(`⚠️ Lỗi khi tải code từ URL: ${error.message}`);
            }
        }

        // Nếu không phải URL, thì upload lên Pastebin
        if (content) {
            try {
                const client = new PasteClient(PASTEBIN_API_KEY);
                const pasteUrl = await client.createPaste({
                    code: content,
                    expireDate: 'N',
                    format: "javascript",
                    name: filename,
                    publicity: 1
                });

                const pasteId = pasteUrl.split('/').pop();
                return interaction.reply(`✅ Link Pastebin (Raw): https://pastebin.com/raw/${pasteId}`);
            } catch (error) {
                return interaction.reply(`⚠️ Lỗi khi up code lên Pastebin: ${error.message}`);
            }
        }

        return interaction.reply("❎ Vui lòng nhập nội dung để upload hoặc một URL hợp lệ!");
    }
};
