import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

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

async function getScore(url, user, pass) {
  const loginRes = await login(user, pass);
  await setCookie(loginRes.url);

  const setScoreCookie = await client.get("https://ketquahoctap.tdtu.edu.vn");
  
  const res = await client.get(url);
  return res;
}

async function getScoreTable(url, user, pass) {
  const loginRes = await login(user, pass);
  await setCookie(loginRes.url);

  const setScoreCookie = await client.get("https://ketquahoctap.tdtu.edu.vn");

}

async function getSummaryScore(url, user, pass) {
  const loginRes = await login(user, pass);
  await setCookie(loginRes.url);

  const setScoreCookie = await client.get("https://ketquahoctap.tdtu.edu.vn");
  
  const res = await client.get(url);
  return res;
}

export { getScore, getScoreTable, getSummaryScore }