import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const dataUserPath = path.join(process.cwd(), 'data/datauser.json');

const jobs = [
  {
    time: "45 12 * * *", // Thống kê Soul lúc 6:50 sáng
    message: () => {
      try {
        const data = JSON.parse(fs.readFileSync(dataUserPath, 'utf8'));
        const users = Object.entries(data.users || {}).map(([userId, userData]) => ({
          userId,
          soul: userData.soul || 0
        }));

        if (users.length === 0) return 'Hiện không có dữ liệu Soul nào.';

        users.sort((a, b) => b.soul - a.soul);
        const topUsers = users.slice(0, 10);

        let message = '🏆 **Top 10 người có nhiều Soul nhất:**\n';
        message += topUsers.map((u, i) => `${i + 1}. ${u.userId} - 💰 **${u.soul} Soul**`).join('\n');
        return message;
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu Soul:', error);
        return 'Đã xảy ra lỗi khi lấy dữ liệu Soul!';
      }
    },
  },
  {
    time: "00 22 * * *",
    message: () => `22 giờ rồi hmm \nChúc mọi người buổi khuya thật yên bình, nhớ làm việc ít thôi và đi ngủ sớm để có năng lượng cho ngày mai nhé.`,
  }
];

export default function autoSend() {
  cron.getTasks().forEach(task => task.stop());

  const timezone = global.config?.timezone || "Asia/Ho_Chi_Minh";
  if (!timezone) return;

  for (const job of jobs) {
    cron.schedule(job.time, () => {
      let i = 0;
      for (const tid of job.targetIDs || Array.from(global.data.threads.keys()) || []) {
        setTimeout(() => {
          global.api.sendMessage({
            body: job.message()
          }, tid);
        }, (i++) * 300);
      }
    }, {
      timezone: timezone
    });
  }
}
