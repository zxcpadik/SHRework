module.exports = {
    BotRun,
    LoadMessages
};

const TelegramBot = require('node-telegram-bot-api');
const FileSystem = require('fs');
const { DBv2 } = require('./dbv2.js');
const db = new DBv2(process.env.DB_CONNECT);
const secure = require('./secure.js');
const token = "5882374364:AAFrmDwNudOtBLX2ZCwcpsdKcNXfP7fXpJ0";
var messages = [];
const bot = new TelegramBot(token, { polling: true });

function LoadMessages(file) {
    const raw = JSON.parse(FileSystem.readFileSync(file, 'utf8'));

    for (var i = 0; i < raw.messages.lenght; i++) {
        let msg = raw.messages[i];
        messages[msg.name] = msg.value;
    }
}

function CreateUser(userID) {
    if (users[userID] == undefined) users[userID] = {userID: userID, username: '', password: ''};
}
function SendAuth(userID, msg) {
    secure.Auth(users[userID], (error, result) => {
        if (error != null) {
            bot.sendMessage(userID, messages['error']);
        } else {
            if (!result.ok) {
                bot.sendMessage(userID, messages['auth_error']);
            }
        }
    });

    if (false) {
        var opts = {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: `X1 - ${this.GetUpdateX1(userId)}р`, callback_data: 'update_critMul_x1' }]
                ]
            })
        };
    }
}

var users = [];
var userstatus = [];

function BotRun() {
    bot.onText(/\/start/, (msg, match) => {
        const userId = msg.chat.id;
        CreateUser(userId);
        SendAuth(userId, msg);
    });

    bot.on('callback_query', function onCallbackQuery(callbackQuery) {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        const userId = callbackQuery.message.chat.id;
        CreateUser(userId, msg.from.username);
        SendAuth(userId, msg);
    
        if (action === 'auth') {
            Shop(msg);
        }
    });
}