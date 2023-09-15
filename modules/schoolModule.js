import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import cheerio from 'cheerio';
import fs from 'fs';

const client = wrapper(axios.create({
  jar: new CookieJar(),
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
  },
}));

async function login(user, pass) {
  const url = process.env.AUTHEN_URL;
  const body = new FormData();
  body.append('user', user);
  body.append('pass', pass);
  console.log('login url:', url)
  const res = await client.post(url, body);
  console.log('login response:', res.data)

  return res.data;
}

async function setCookie(url) {
  console.log('After login url:', url);
  await client.post(url);
}

function getScheduleDetail(res) {
  const subjectList = [];

  const $ = cheerio.load(res);

  const table = $("#ThoiKhoaBieu1_tbTKBTheoTuan > tbody");
  table.find(".rowContent").each(function (i) {
    let start = i + 1; // start period from 1
    let dateIdx = 1;

    $(this)
      .find(".cell")
      .each(function () {
        dateIdx++;

        if (!$(this).attr("rowspan")) return; // skip td has no subject

        const periodLength = parseInt($(this).attr("rowspan")); // number of period

        const date = table.find(".Headerrow td:nth-child(" + dateIdx + ")").text();

        const text = $(this).text();
        const subjEndIdx = text.indexOf("|");
        const groupIdx = text.indexOf("Groups");
        const subGroupIdx = text.indexOf("Sub-group");
        const roomIdx = text.indexOf("Room");
        const noteIdx = text.indexOf("GV ");

        subjectList.push({
          date: (dateIdx === 8 ? "CN " : date.slice(0, 6)) + date.slice(-7, date.length),
          subject: text.slice(0, subjEndIdx),
          period: Array.from({ length: periodLength }, (ele, i) => i + start).join(","),
          group: text.slice(groupIdx + 8, groupIdx + 10).replace(/[^0-9a-z]/gi, ""),
          subGroup: subGroupIdx === -1
            ? "0"
            : text.slice(subGroupIdx + 11, subGroupIdx + 13).replace(/[^0-9a-z]/gi, ""),
          room: text
            .slice(roomIdx + 6)
            .replace("GV báo vắng", "")
            .replace(" GV dạy bù", ""),
          note: noteIdx === -1 ? "" : text.slice(noteIdx, text.length),
        });
      });
  });
  return subjectList;
}

async function getSchedule(url, user, pass) {
  const loginRes = await login(user, pass);
  setCookie(loginRes.url);
  const setCookieUrl = url + "/tkb2.aspx";

  console.log('get schedule data:', setCookieUrl);

  const setScheduleCookie = await client.get(setCookieUrl)
  
  fs.writeFileSync('scheduleBefore.html', setScheduleCookie.data, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

  const $ = cheerio.load(setScheduleCookie.data);

  const semester =  parseInt($("#ThoiKhoaBieu1_cboHocKy").find(":selected").val());

  const payload = new URLSearchParams({
    "ThoiKhoaBieu1$radChonLua": "radXemTKBTheoTuan",
    "ThoiKhoaBieu1$cboHocKy": 121,
    "__EVENTTARGET": "ThoiKhoaBieu1$radXemTKBTheoTuan",
    "__EVENTARGUMENT": "",
    "__LASTFOCUS": "",
    "__VIEWSTATE": $("#__VIEWSTATE").val(),
    "__VIEWSTATEGENERATOR": $("#__VIEWSTATEGENERATOR").val()
  });

  console.log('get schedule url:', url + "/" + $("#form1").attr("action"));

  const res = await client.post(url + "/" + $("#form1").attr("action"), payload);

  return res;
}

export { getSchedule, getScheduleDetail }