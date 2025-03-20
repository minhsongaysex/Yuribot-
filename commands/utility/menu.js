const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('menu')
        .setDescription('Xem danh sách nhóm lệnh, thông tin lệnh')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Tên lệnh cụ thể để xem thông tin')
                .setRequired(false)),
    
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        
        // Get commands directory structure
        const commandFolders = getCommandFolders();
        const commands = getAllCommands(interaction.client);
        const filteredCommands = getFilteredCommands(commands, interaction.user.id);
        
        if (commandName) {
            // If a specific command is requested
            if (commandName === 'all') {
                let txt = '╭─────────────⭓\n';
                let count = 0;
                
                for (const cmd of filteredCommands) {
                    txt += `│${++count}. ${cmd.data.name} | ${cmd.data.description}\n`;
                }
                
                txt += `│────────⭔\n│ Tổng cộng: ${filteredCommands.length} lệnh\n╰─────────────⭓`;
                
                await interaction.reply({ 
                    content: txt,
                    ephemeral: true
                });
                return;
            }
            
            // Find the specific command
            const command = filteredCommands.find(cmd => cmd.data.name === commandName);
            
            if (command) {
                const infoEmbed = createCommandInfoEmbed(command);
                await interaction.reply({ 
                    embeds: [infoEmbed],
                    ephemeral: true
                });
            } else {
                // Find similar commands
                const arrayCmds = filteredCommands.map(cmd => cmd.data.name);
                const { StringSimilarity } = require('string-similarity-js');
                const similarity = new StringSimilarity();
                
                const matches = similarity.findBestMatch(commandName, arrayCmds);
                
                if (matches.bestMatch.rating >= 0.3) {
                    await interaction.reply({
                        content: `"${commandName}" là lệnh gần giống là "${matches.bestMatch.target}" ?`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `Không tìm thấy lệnh "${commandName}"`,
                        ephemeral: true
                    });
                }
            }
        } else {
            // Display command categories based on folder structure
            const commandCategoriesCount = Object.keys(commandFolders).length;
            const totalCommandsCount = filteredCommands.length;
            
            let txt = '╭─────────────⭓\n';
            txt += `│1. Thành Viên - ${totalCommandsCount} lệnh\n`;
            txt += `│────────⭔\n`;
            txt += `│Hiện có ${totalCommandsCount} lệnh\n`;
            txt += `│Reply số từ 1 đến ${commandCategoriesCount} để chọn\n`;
            txt += `╰─────────────⭓`;
            
            // Add installed packages info
            const packageInfo = getInstalledPackages();
            if (packageInfo.length > 0) {
                txt += `\n\n**𝙔𝙐𝙍𝙄 𝙋𝘼𝘾𝙆𝘼𝙂𝙀📂:**\n${packageInfo}`;
            }
            
            const message = await interaction.reply({
                content: txt,
                fetchReply: true,
                ephemeral: false
            });
            
            // Create a collector for replies
            const filter = m => m.author.id === interaction.user.id && !isNaN(m.content);
            const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });
            
            collector.on('collect', async m => {
                const choice = parseInt(m.content);
                
                if (choice === 1) { // Only one category "Thành Viên" as per your screenshot
                    // Display folder structure
                    let folderText = '╭─────────────⭓\n';
                    folderText += `│Thành Viên\n│─────⭔\n`;
                    
                    let folderCount = 0;
                    for (const [folderName, fileInfo] of Object.entries(commandFolders)) {
                        folderText += `│${++folderCount}. ${folderName} - ${fileInfo.files.length} lệnh\n`;
                    }
                    
                    folderText += `│────────⭔\n│Reply số từ 1 đến ${Object.keys(commandFolders).length} để xem chi tiết thư mục\n╰─────────────⭓`;
                    
                    const folderMessage = await interaction.followUp({
                        content: folderText,
                        fetchReply: true,
                        ephemeral: false
                    });
                    
                    // Create a collector for folder selection
                    const folderFilter = m => m.author.id === interaction.user.id && !isNaN(m.content);
                    const folderCollector = interaction.channel.createMessageCollector({ filter: folderFilter, time: 60000 });
                    
                    folderCollector.on('collect', async m => {
                        const folderChoice = parseInt(m.content);
                        
                        if (folderChoice >= 1 && folderChoice <= Object.keys(commandFolders).length) {
                            const folderName = Object.keys(commandFolders)[folderChoice - 1];
                            const folderInfo = commandFolders[folderName];
                            
                            let fileText = '╭─────────────⭓\n';
                            fileText += `│${folderName}\n│─────⭔\n`;
                            
                            let fileCount = 0;
                            for (const file of folderInfo.files) {
                                const extension = path.extname(file);
                                const baseName = path.basename(file, extension);
                                const icon = extension === '.js' ? 'JS' : '📁';
                                fileText += `│${++fileCount}. ${icon} ${file}\n`;
                            }
                            
                            fileText += `│────────⭔\n│Reply số từ 1 đến ${folderInfo.files.length} để xem chi tiết lệnh\n╰─────────────⭓`;
                            
                            const fileMessage = await interaction.followUp({
                                content: fileText,
                                fetchReply: true,
                                ephemeral: false
                            });
                            
                            // Create a collector for file selection
                            const fileFilter = m => m.author.id === interaction.user.id && !isNaN(m.content);
                            const fileCollector = interaction.channel.createMessageCollector({ filter: fileFilter, time: 60000 });
                            
                            fileCollector.on('collect', async m => {
                                const fileChoice = parseInt(m.content);
                                
                                if (fileChoice >= 1 && fileChoice <= folderInfo.files.length) {
                                    const fileName = folderInfo.files[fileChoice - 1];
                                    const baseName = path.basename(fileName, path.extname(fileName));
                                    const command = filteredCommands.find(cmd => cmd.data.name === baseName);
                                    
                                    if (command) {
                                        const infoEmbed = createCommandInfoEmbed(command);
                                        await interaction.followUp({
                                            embeds: [infoEmbed],
                                            ephemeral: true
                                        });
                                    } else {
                                        await interaction.followUp({
                                            content: `Không tìm thấy thông tin lệnh cho ${fileName}`,
                                            ephemeral: true
                                        });
                                    }
                                    
                                    m.delete().catch(console.error);
                                    fileCollector.stop();
                                }
                            });
                            
                            fileCollector.on('end', () => {
                                // Optional: Delete the file message after timeout
                            });
                            
                            m.delete().catch(console.error);
                            folderCollector.stop();
                        }
                    });
                    
                    folderCollector.on('end', () => {
                        // Optional: Delete the folder message after timeout
                    });
                    
                    m.delete().catch(console.error);
                    collector.stop();
                }
            });
            
            collector.on('end', () => {
                // Optional: Delete the original message after timeout
            });
        }
    }
};

function getCommandFolders() {
    const commandsDir = path.join(process.cwd(), 'commands');
    if (!fs.existsSync(commandsDir)) {
        return {};
    }
    
    const folders = {};
    
    // Get all directories in the commands folder
    const dirEntries = fs.readdirSync(commandsDir, { withFileTypes: true });
    
    for (const dirent of dirEntries) {
        if (dirent.isDirectory()) {
            const folderPath = path.join(commandsDir, dirent.name);
            const files = fs.readdirSync(folderPath);
            
            // Filter out non-JS files
            const jsFiles = files.filter(file => path.extname(file) === '.js');
            
            folders[dirent.name] = {
                path: folderPath,
                files: jsFiles
            };
        }
    }
    
    return folders;
}

function getAllCommands(client) {
    return Array.from(client.commands.values());
}

function isAdminUser(userId) {
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    return adminIds.includes(userId);
}

function getFilteredCommands(commands, userId) {
    if (isAdminUser(userId)) {
        return commands;
    }
    
    return commands.filter(cmd => {
        const category = cmd.category || "Thành Viên";
        return category !== "Admin";
    });
}

function createCommandInfoEmbed(command) {
    const embed = new EmbedBuilder()
        .setTitle(`Thông tin lệnh: ${command.data.name}`)
        .setColor('#0099ff')
        .addFields(
            { name: '📔 Tên lệnh', value: command.data.name, inline: true },
            { name: '🌴 Phiên bản', value: command.version || '1.0.0', inline: true },
            { name: '🔐 Quyền hạn', value: permissionText(command.permission || 0), inline: true },
            { name: '👤 Tác giả', value: command.credits || 'Unknown', inline: true },
            { name: '🌾 Mô tả', value: command.data.description || 'Không có mô tả', inline: false },
            { name: '📎 Thuộc nhóm', value: command.category || 'Thành Viên', inline: true },
            { name: '📝 Cách dùng', value: command.usage || command.data.name, inline: false },
            { name: '⏳ Thời gian chờ', value: `${command.cooldown || 5} giây`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Discord Bot Menu System' });
    
    return embed;
}

function permissionText(permission) {
    switch (parseInt(permission)) {
        case 0: return 'Thành Viên';
        case 1: return 'Quản Trị Viên';
        case 2: return 'Admin';
        default: return 'ADMINBOT';
    }
}

function getInstalledPackages() {
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packagePath)) {
            return "";
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const dependencies = packageJson.dependencies || {};
        
        let result = "";
        for (const [name, version] of Object.entries(dependencies)) {
            result += `"${name}": "${version}", npm i ${name}\n`;
        }
        
        return result;
    } catch (error) {
        console.error("Error reading package.json:", error);
        return "";
    }
}
