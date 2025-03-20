const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { JSDOM } = require('jsdom'); // You'll need to install this package

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vuotlink')
    .setDescription('Bypass liên kết Yeumoney')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Nhập URL cần bypass')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('auto')
        .setDescription('Tự động chuyển trang')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const url = interaction.options.getString('url');
    const autoRedirect = interaction.options.getBoolean('auto') || false;
    
    try {
      // Thông báo đang xử lý
      await interaction.editReply('⚙️ Đang xử lý URL...');
      
      // Khởi tạo bypass
      const codexn = await getCodexn();
      if (!codexn) {
        return interaction.editReply('❌ Không thể lấy mã codexn. Vui lòng thử lại sau.');
      }
      
      // Chuẩn hóa URL
      const cleanUrl = url.replace(/\/$/, '');
      
      // Lấy mã xác thực đầu tiên
      const firstVerificationCode = await getVerificationCode(codexn, cleanUrl, 'https://www.google.com/', null);
      if (!firstVerificationCode) {
        return interaction.editReply('❌ Không thể lấy mã xác thực đầu tiên. URL có thể không hợp lệ.');
      }
      
      // Lấy mã codexn mới
      const newCodexn = await getCodexn(firstVerificationCode);
      if (!newCodexn) {
        return interaction.editReply('❌ Không thể lấy mã codexn mới. Vui lòng thử lại sau.');
      }
      
      // Lấy mã xác thực cuối cùng
      const adminUrl = cleanUrl + '/admin';
      const finalCode = await getVerificationCode(newCodexn, adminUrl, cleanUrl, firstVerificationCode);
      if (!finalCode) {
        return interaction.editReply('❌ Không thể lấy mã xác thực cuối cùng. Vui lòng thử lại.');
      }
      
      // Tạo kết quả bypass
      const directUrl = autoRedirect ? 
        `https://yeumoney.com/gt.php?code=${finalCode}` : 
        null;
      
      // Gửi kết quả
      if (directUrl) {
        await interaction.editReply({
          content: `✅ Đã bypass thành công!\n\n🔑 **Mã code**: \`${finalCode}\`\n🔗 **Link trực tiếp**: ${directUrl}`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: 'Mở Link',
                  url: directUrl
                }
              ]
            }
          ]
        });
      } else {
        await interaction.editReply({
          content: `✅ Đã bypass thành công!\n\n🔑 **Mã code**: \`${finalCode}\`\n\n(Sử dụng mã này với form submit tại yeumoney.com)`
        });
      }
    } catch (error) {
      console.error('Lỗi khi bypass:', error);
      await interaction.editReply('❌ Đã xảy ra lỗi khi bypass link. Vui lòng kiểm tra lại URL và thử lại sau.');
    }
  }
};

// Hàm để lấy mã codexn
async function getCodexn(clk = null) {
  try {
    const timestamp = Date.now();
    const referrer = 'https://www.google.com/';
    const data = `${timestamp},${referrer},,IOS900,hidden,null`;
    
    const url = `https://traffic-user.net/GET_VUATRAFFIC.php?data=${data}${clk ? '&clk=' + clk : ''}`;
    
    const response = await axios.post(url, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://yeumoney.com/'
      }
    });
    
    const match = response.data.match(/localStorage\.codexn\s*=\s*'([^']+)'/);
    if (match && match[1]) {
      return match[1];
    }
    
    throw new Error('Không thể lấy mã codexn');
  } catch (error) {
    console.error('Lỗi khi lấy codexn:', error);
    return null;
  }
}

// Hàm để lấy mã xác thực - đã sửa để không sử dụng DOMParser
async function getVerificationCode(codexn, url, referrer, clk = null) {
  try {
    const apiUrl = `https://traffic-user.net/GET_MA.php?codexn=${codexn}&url=${url}&loai_traffic=${referrer}${clk ? '&clk=' + clk : ''}`;
    
    const response = await axios.post(apiUrl, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://yeumoney.com/'
      }
    });
    
    // Kiểm tra mã xác thực trong phản hồi
    const clickMatch = response.data.match(/sessionStorage\.setItem\("ymnclk", (\d+)\)/);
    if (clickMatch && clickMatch[1]) {
      return clickMatch[1];
    }
    
    // Sử dụng JSDOM thay cho DOMParser
    const { window } = new JSDOM(response.data);
    const codeElement = window.document.querySelector('span#layma_me_vuatraffic');
    
    if (codeElement) {
      return codeElement.textContent.trim();
    }
    
    // Nếu không tìm thấy qua DOM, thử dùng regex
    const codeMatch = response.data.match(/<span id="layma_me_vuatraffic"[^>]*>([^<]+)<\/span>/);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1].trim();
    }
    
    throw new Error('Không thể lấy mã xác thực');
  } catch (error) {
    console.error('Lỗi khi lấy mã xác thực:', error);
    return null;
  }
}
