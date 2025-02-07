const { SlashCommandBuilder } = require('discord.js');
const User = require('../../database/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Quản lý tài khoản ngân hàng')
    .addSubcommand(subcommand => 
      subcommand.setName('balance')
      .setDescription('Kiểm tra số dư của bạn')
    )
    .addSubcommand(subcommand => 
      subcommand.setName('deposit')
      .setDescription('Gửi tiền vào ngân hàng')
      .addIntegerOption(option => option.setName('amount').setDescription('Số tiền muốn gửi').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('withdraw')
      .setDescription('Rút tiền từ ngân hàng')
      .addIntegerOption(option => option.setName('amount').setDescription('Số tiền muốn rút').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('transfer')
      .setDescription('Chuyển tiền cho người khác')
      .addUserOption(option => option.setName('user').setDescription('Người nhận').setRequired(true))
      .addIntegerOption(option => option.setName('amount').setDescription('Số tiền muốn chuyển').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('history')
      .setDescription('Xem lịch sử giao dịch')
    )
    .addSubcommand(subcommand => 
      subcommand.setName('loan')
      .setDescription('Vay tiền từ ngân hàng')
      .addIntegerOption(option => option.setName('amount').setDescription('Số tiền muốn vay').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('repay')
      .setDescription('Trả nợ ngân hàng')
      .addIntegerOption(option => option.setName('amount').setDescription('Số tiền muốn trả').setRequired(true))
    )
    .addSubcommand(subcommand => 
      subcommand.setName('setmoney')
      .setDescription('Cộng tiền vào tài khoản')
      .addIntegerOption(option => option.setName('amount').setDescription('Số tiền muốn thêm').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const user = await User.findOne({ userId: interaction.user.id });

    if (!user) {
      return interaction.reply({ content: 'Bạn chưa có tài khoản ngân hàng.', ephemeral: true });
    }

    switch (subcommand) {
      case 'balance':
        return interaction.reply(`🏦 | **${interaction.user.username}**, bạn có **${user.cash} cash💵** và **${user.bank} trong ngân hàng💳**.`);
      
      case 'deposit': {
        const amount = interaction.options.getInteger('amount');
        if (user.cash < amount) {
          return interaction.reply({ content: 'Bạn không đủ tiền mặt để gửi vào ngân hàng.', ephemeral: true });
        }
        user.cash -= amount;
        user.bank += amount;
        await user.save();
        return interaction.reply(`✅ Bạn đã gửi **${amount}💵** vào ngân hàng!`);
      }
      
      case 'withdraw': {
        const amount = interaction.options.getInteger('amount');
        if (user.bank < amount) {
          return interaction.reply({ content: 'Bạn không có đủ tiền trong ngân hàng.', ephemeral: true });
        }
        user.bank -= amount;
        user.cash += amount;
        await user.save();
        return interaction.reply(`✅ Bạn đã rút **${amount}💵** từ ngân hàng!`);
      }
      
      case 'transfer': {
        const recipient = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const recipientData = await User.findOne({ userId: recipient.id });

        if (!recipientData) {
          return interaction.reply({ content: 'Người nhận chưa có tài khoản ngân hàng.', ephemeral: true });
        }
        if (user.bank < amount) {
          return interaction.reply({ content: 'Bạn không có đủ tiền trong ngân hàng.', ephemeral: true });
        }

        user.bank -= amount;
        recipientData.bank += amount;
        await user.save();
        await recipientData.save();
        return interaction.reply(`✅ Bạn đã chuyển **${amount}💵** cho **${recipient.username}**!`);
      }
      
      case 'history': {
        let historyMsg = '**📜 Lịch sử giao dịch:**\n';
        user.history.slice(-5).forEach((entry, index) => {
          historyMsg += `${index + 1}. ${entry}\n`;
        });
        return interaction.reply(historyMsg || 'Bạn chưa có giao dịch nào.');
      }
      
      case 'loan': {
        const amount = interaction.options.getInteger('amount');
        user.bank += amount;
        user.debt += amount;
        await user.save();
        return interaction.reply(`✅ Bạn đã vay **${amount}💵** từ ngân hàng!`);
      }
      
      case 'repay': {
        const amount = interaction.options.getInteger('amount');
        if (user.bank < amount) {
          return interaction.reply({ content: 'Bạn không có đủ tiền trong ngân hàng để trả nợ.', ephemeral: true });
        }
        user.bank -= amount;
        user.debt -= amount;
        await user.save();
        return interaction.reply(`✅ Bạn đã trả **${amount}💵** nợ ngân hàng!`);
      }
      
      case 'setmoney': {
        const amount = interaction.options.getInteger('amount');
        user.cash += amount;
        await user.save();
        return interaction.reply(`✅ Bạn đã nhận **${amount}💵** vào tài khoản!`);
      }
    }
  }
};
