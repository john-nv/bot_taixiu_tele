const express = require('express');
const http = require('http');
const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8100;
const TOKEN_BOT_TELEGRAM = process.env.TOKEN_BOT_TELEGRAM;
const admin = process.env.ID_ADMIN;
// const ID_GROUP_TELEGRAM = process.env.ID_GROUP_TELEGRAM;

const bot = new TelegramBot(TOKEN_BOT_TELEGRAM, { polling: true });

const sticker1 = { sticker: 'emoj/1.tgs', name: '1', number: 1 };
const sticker2 = { sticker: 'emoj/2.tgs', name: '2', number: 2 };
const sticker3 = { sticker: 'emoj/3.tgs', name: '3', number: 3 };
const sticker4 = { sticker: 'emoj/4.tgs', name: '4', number: 4 };
const sticker5 = { sticker: 'emoj/5.tgs', name: '5', number: 5 };
const sticker6 = { sticker: 'emoj/6.tgs', name: '6', number: 6 };
const stickerFilePaths = {
    1: { sticker: sticker1.sticker, number: 1 },
    2: { sticker: sticker2.sticker, number: 2 },
    3: { sticker: sticker3.sticker, number: 3 },
    4: { sticker: sticker4.sticker, number: 4 },
    5: { sticker: sticker5.sticker, number: 5 },
    6: { sticker: sticker6.sticker, number: 6 }
};

let setCountDown = 2
let change = false
let change1 = 0
let change2 = 0
let change3 = 0

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;
    if (userId != admin) {
        bot.sendMessage(chatId, "Bạn không có quyền sử dụng lệnh này.");
        return;
    }

    if (text.startsWith('/lac')) return await lac(bot, chatId);
    if (text.startsWith('/sua')) return await sua(bot, chatId, text);
    if (text.startsWith('/time')) return await time(bot, chatId, text);
});

async function sua(bot, chatId, text) {
    try {
        const parts = text.split(' ');
        const numbers = parts.slice(1);
        const numbersArray = numbers.map(Number);
        const sum = numbersArray.reduce((total, num) => total + num, 0);

        change = true
        change1 = numbersArray[0]
        change2 = numbersArray[1]
        change3 = numbersArray[2]

        bot.sendMessage(chatId, 'Sửa thông tin: ' + numbersArray.join(',') + ' | Tổng : ' + sum);
    } catch (error) {
        bot.sendMessage(chatId, error.message);
        console.error(error);
    }
}

async function time(bot, chatId, text) {
    try {
        const parts = text.split(' ');
        const numbers = parts.slice(1);
        const numbersArray = numbers.map(Number);

        setCountDown = numbersArray[0]

        bot.sendMessage(chatId, `Sửa thời gian chờ thành : ${numbersArray[0]} giây`);
    } catch (error) {
        bot.sendMessage(chatId, error.message);
        console.error(error);
    }
}

async function lac(bot, chatId) {
    try {
        let countDown = setCountDown;
        const interval = setInterval(async () => {
            if (countDown >= 1) {
                bot.sendMessage(chatId, countDown);
                countDown--;
            } else {
                clearInterval(interval);
                await showSticker(change, chatId)
                change = false
            }
        }, 1500);
    } catch (error) {
        bot.sendMessage(chatId, error.message);
        console.error(error.message);
    }
}

async function showSticker(change, chatId) {
    try {
        let stk1, stk2, stk3
        console.log('showSticker start');
        if (!change) {
            console.log('không lừa đảo');
            stk1 = getStickerFile(false);
            stk2 = getStickerFile(false);
            stk3 = getStickerFile(false);
        } else {
            stk1 = getStickerFile(true, change1)
            stk2 = getStickerFile(true, change2)
            stk3 = getStickerFile(true, change3)
        }

        const formData1 = new FormData();
        formData1.append('chat_id', chatId);
        formData1.append('sticker', stk1.file);

        const formData2 = new FormData();
        formData2.append('chat_id', chatId);
        formData2.append('sticker', stk2.file);

        const formData3 = new FormData();
        formData3.append('chat_id', chatId);
        formData3.append('sticker', stk3.file);

        await axios.post(`https://api.telegram.org/bot${TOKEN_BOT_TELEGRAM}/sendSticker`, formData1, { headers: { ...formData1.getHeaders() } });
        await axios.post(`https://api.telegram.org/bot${TOKEN_BOT_TELEGRAM}/sendSticker`, formData2, { headers: { ...formData2.getHeaders() } });
        await axios.post(`https://api.telegram.org/bot${TOKEN_BOT_TELEGRAM}/sendSticker`, formData3, { headers: { ...formData3.getHeaders() } });

        await axios.post(`https://api.telegram.org/bot${TOKEN_BOT_TELEGRAM}/sendMessage`, {
            chat_id: chatId,
            text: `Kết quả là : ${stk1.number} + ${stk2.number} + ${stk3.number} | Tổng = ${stk1.number + stk2.number + stk3.number}`
        });

        change = false
    } catch (error) {
        console.log(error.message);
        console.log(error);
        await axios.post(`https://api.telegram.org/bot${TOKEN_BOT_TELEGRAM}/sendMessage`, {
            chat_id: chatId,
            text: `Lỗi kết nối ở phiên này, vui lòng thử lại`
        });
    }
}

// 1 -> 6
function getRandomNumber() {
    return Math.floor(Math.random() * 6) + 1;
}

// check file theo số ngẫu nhiên
function getStickerFile(change, number) {
    let randomNumber = getRandomNumber();
    if (change == true) {
        console.log('lua dao')
        randomNumber = number
    }
    console.log(change)
    console.log(randomNumber)
    const stickerPath = stickerFilePaths[randomNumber].sticker;
    return {
        file: fs.createReadStream(stickerPath),
        number: randomNumber
    };
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
