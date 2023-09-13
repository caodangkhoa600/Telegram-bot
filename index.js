const express = require('express');
const path = require('path')
const { Telegraf } = require('telegraf');
const { CookieJar } = require('tough-cookie');

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const dotenv = require('dotenv')
const fs = require('fs');

const { getSchedule, getScheduleDetail } = require('./modules/schoolModule.js');
const { getScore, getScoreTable } = require('./modules/scoreModule.js');

dotenv.config()

const expressApp = express()

const port = process.env.PORT || 3000;
expressApp.use(express.static('static'))
expressApp.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage([])
bot.use(session())
bot.use(stage.middleware())

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

bot.command('start', ctx => {
  console.log('from:', ctx.from)
  bot.telegram.sendMessage(ctx.chat.id, 'Chào bạn tới bot của Cao Đăng Khoa', {
  })
})

bot.command('send', ctx => {
  bot.telegram.sendMessage(5793184796, 'hello em iu của anh', {
  })
})

bot.command('school', async ctx => {
  console.log(ctx.from)
  const user = process.env.USER;
  const pass = process.env.PASS;

  var schedule = await getSchedule("https://lichhoc-lichthi.tdtu.edu.vn", user, pass);

  fs.writeFileSync('schedule.html', schedule.data, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

  const scheduleDetail = getScheduleDetail(schedule.data);

  let message = "";

  scheduleDetail.forEach((subject) => {
    message += `${subject.date} - ${subject.period} - ${subject.subject} - ${subject.room} \n`
  })

  bot.telegram.sendMessage(ctx.chat.id, message, {
  })

  console.log("Done get schedule")
})

bot.command('score', async ctx => {

  const user = process.env.USER;
  const pass = process.env.PASS;

  // const score = await getScore("https://ketquahoctap.tdtu.edu.vn/Home/LayHocKy_KetQuaHocTap?mssv=520H0074&namvt=2020&hedaotao=H&time=1694624044804", user, pass);
  ctx.reply('Chọn học kỳ', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Học kỳ 1', callback_data: 'semester 1' },
          { text: 'Học kỳ 2', callback_data: 'semester 2' },
        ],
        [
          { text: 'Học kỳ hè', callback_data: 'semester 3' },
        ]
      ]
    }
  })


});



bot.launch()

