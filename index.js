import express from 'express';
import path from 'path';
import { Telegraf } from 'telegraf';
import fs from 'fs';
import dotenv from 'dotenv';

import { getSchedule, getScheduleDetail } from './modules/schoolModule.js';
import { getScore, getScoreTable, getSummaryScore } from './modules/scoreModule.js';
import axios from 'axios';

dotenv.config()

const expressApp = express()

const port = process.env.PORT || 3000;
expressApp.use(express.static('static'))
expressApp.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

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

bot.command('chat', async ctx => {
  // get the chat content (except /chat)
  console.log(ctx.from)
  const chatContent = ctx.message.text.split(' ').slice(1).join(' ');

  const payload = {
    "text": chatContent
  }

  var response = await axios.post('http://127.0.0.1:8000/get-intent/', payload)

  console.log(response.data['intent'])

  if (response.data.intent == 'get_schedule') {
    getScheduleDetailFromUrl(ctx)
  }
  else if (response.data.intent == 'get_score') {
    getAllSubjectScore(ctx)
  }
  else {
    ctx.reply('Không hiểu ý bạn lắm, bạn có thể nói lại được không?')
  }
})

async function getScheduleDetailFromUrl(ctx) {
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
}

bot.command('school', async ctx => {
  console.log(ctx.from)
  getScheduleDetailFromUrl(ctx)
})

async function getAllSubjectScore(ctx) {
  const user = process.env.USER;
  const pass = process.env.PASS;

  // const score = await getScore("https://ketquahoctap.tdtu.edu.vn/Home/LayHocKy_KetQuaHocTap?mssv=520H0074&namvt=2020&hedaotao=H&time=1694624044804", user, pass);

  const userId = user.split("")

  const url = `https://ketquahoctap.tdtu.edu.vn/Home/LayDiemTongHop?mssv=${user}&namvt=20${userId[1]+userId[2]}&hedaotao=${userId[3]}`;

  console.log("Get summary score url:", url)
  
  const summaryScore = await getSummaryScore(url, user, pass);

  let response = "";
  let i = 0;

  summaryScore.data.forEach((score) => {
    response += `Tên môn học: ${score.TenMH} - Số tín chỉ: ${score.SoTC} - Điểm trung bình: ${score.DTB} \n`
    i+=1;
    if (i == 5) {
      bot.telegram.sendMessage(ctx.chat.id, response, {
      })
      response = "";
      i = 0;
    }
  })

}

bot.command('score', async ctx => {
  console.log(ctx.from)
  getAllSubjectScore(ctx)

});

bot.launch()