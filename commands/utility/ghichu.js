const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const { join, resolve } = require("path");
const moment = require("moment-timezone");
const { PasteClient } = require('pastebin-api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ghichu')
    .setDescription('Áp dụng code từ pastebin và github')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Tên file')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link pastebin/github')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Chỉ cho phép bạn (owner) sử dụng lệnh này
    const allowedIds = ["1306552024568959016"]; // Thay bằng Discord ID của bạn
    if (!allowedIds.includes(interaction.user.id)) {
      return interaction.reply({
        content: "Đã báo cáo về admin vì tội dùng lệnh cấm",
        ephemeral: true
      });
    }

    // Thời gian hiện tại
    const gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
    
    // Thời gian bot đã hoạt động
    const lon = process.uptime();
    const hieu = Math.floor(lon / (60 * 60));
    const simp = Math.floor((lon % (60 * 60)) / 60);
    const rin = Math.floor(lon % 60);
    
    // Thông tin người dùng
    const username = interaction.user.username;
    const userId = interaction.user.id;
    const channelName = interaction.channel.name;
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss (D/MM/YYYY) (dddd)");
    
    // Ghi log khi có người sử dụng lệnh (luôn hiển thị link facebook của bạn)
    console.log(`Channel: ${channelName}\nUser: ${username} đã dùng lệnh ghichu\nLink Facebook: https://www.facebook.com/lms.cutii\nTime: ${time}`);
    
    const name = interaction.options.getString('name');
    const link = interaction.options.getString('link');
    
    // Nếu không có link, kiểm tra xem có tên file hay không
    if (!link) {
      // Nếu chỉ có tên file, upload lên pastebin
      if (name) {
        try {
          const data = fs.readFileSync(`${__dirname}/${name}.js`, "utf-8");
          const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");
          
          const url = await client.createPaste({
            code: data,
            expireDate: 'N',
            format: "javascript",
            name: name || 'noname',
            publicity: 1
          });
          
          const id = url.split('/')[3];
          const rawLink = 'https://pastebin.com/raw/' + id;
          
          return interaction.reply(`Link pastebin cho file ${name}.js: ${rawLink}`);
        } catch (err) {
          return interaction.reply(`Lệnh ${name} không tồn tại!`);
        }
      } else {
        // Hiển thị menu nếu không có tham số
        return interaction.reply({
          content: `=== [ 𝗠𝗘𝗡𝗨 ] ====
━━━━━━━━━━━━━━━━━━

→ 𝟭. /ghichu name link_pastebin để upload mdl lên file
→ 𝟮. /ghichu name để upcode lên pastebin

Bot đã online được tổng cộng ${hieu} Giờ ${simp} Phút ${rin} Giây
[ ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY")} ]
━━━━━━━━━━━━━━━━━━`
        });
      }
    } else {
      // Nếu có link, download và lưu code
      const urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
      const urlMatch = link.match(urlR);
      
      if (!urlMatch) {
        return interaction.reply("Link không hợp lệ.");
      }
      
      const url = urlMatch[0];
      
      // Đã reply tạm thời để user biết lệnh đang xử lý
      await interaction.deferReply();
      
      if (url.includes('pastebin') || url.includes('github') || url.includes('phamvandien')) {
        try {
          const response = await axios.get(url);
          const data = response.data;
          
          fs.writeFileSync(`${__dirname}/${name}.js`, data, "utf-8");
          
          return interaction.editReply(`Đã áp dụng code vào ${name}.js, sử dụng command load để sử dụng!`);
        } catch (err) {
          return interaction.editReply(`Đã xảy ra lỗi khi áp dụng code vào ${name}.js`);
        }
      }
      
      if (url.includes('buildtool') || url.includes('tinyurl.com')) {
        const options = {
          method: 'GET',
          url: url
        };
        
        request(options, function (error, response, body) {
          if (error) {
            return interaction.editReply('Vui lòng chỉ cung cấp link (không chứa gì khác ngoài link)');
          }
          
          const load = cheerio.load(body);
          let codeFound = false;
          
          load('.language-js').each((index, el) => {
            if (index !== 0) return;
            codeFound = true;
            
            const code = el.children[0].data;
            fs.writeFileSync(`${__dirname}/${name}.js`, code, "utf-8");
            
            interaction.editReply(`Đã thêm code này vào "${name}.js", sử dụng command load để sử dụng!`);
          });
          
          if (!codeFound) {
            interaction.editReply('Không tìm thấy code JavaScript trong link.');
          }
        });
        
        return;
      }
      
      if (url.includes('drive.google')) {
        const id = url.match(/[-\w]{25,}/);
        if (!id) {
          return interaction.editReply('ID của Google Drive không hợp lệ.');
        }
        
        const path = resolve(__dirname, `${name}.js`);
        
        try {
          const response = await axios({
            method: 'GET',
            url: `https://drive.google.com/u/0/uc?id=${id[0]}&export=download`,
            responseType: 'text'
          });
          
          fs.writeFileSync(path, response.data, 'utf-8');
          
          return interaction.editReply(`Đã thêm code này vào "${name}.js" nếu xảy ra lỗi thì đổi file drive thành txt nhé!`);
        } catch (e) {
          return interaction.editReply(`Đã xảy ra lỗi khi áp dụng code mới cho "${name}.js".`);
        }
      }
      
      return interaction.editReply('Link không được hỗ trợ. Vui lòng sử dụng pastebin, github, buildtool, tinyurl hoặc Google Drive.');
    }
  }
};
