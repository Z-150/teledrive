"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const grammy_1 = require("grammy");
const model_1 = require("./model");
exports.bot = null;
if (process.env.TG_BOT_TOKEN) {
    exports.bot = new grammy_1.Bot(process.env.TG_BOT_TOKEN);
    exports.bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!ctx.from)
            return;
        const tgUsername = ctx.from.username;
        const tgId = ctx.from.id.toString();
        if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/start ')) {
            return next();
        }
        const user = yield model_1.prisma.users.findFirst({
            where: { OR: [{ tg_id: tgId }, { username: tgUsername }] }
        });
        if (!user)
            return;
        ctx.dbUser = user;
        return next();
    }));
    exports.bot.command('start', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const payload = ctx.match;
        if (payload) {
            const reg = yield model_1.prisma.registrations.findFirst({
                where: { otp: payload, status: 'PENDING_OTP' }
            });
            if (!reg) {
                return ctx.reply('❌ Token registrasi tidak valid atau sudah kadaluarsa.');
            }
            yield model_1.prisma.registrations.update({
                where: { id: reg.id },
                data: {
                    status: 'PENDING_ADMIN',
                    tg_username: ((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.username) || null,
                    tg_id: (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id.toString(),
                    tg_phone: null
                }
            });
            ctx.reply('✅ Kode OTP berhasil diverifikasi!\n\n⏳ Mohon tunggu admin untuk menyetujui pendaftaran Anda.');
            const adminTgId = process.env.TG_BOT_OWNER_ID;
            if (adminTgId) {
                const keyboard = new grammy_1.Keyboard()
                    .text('✅ Terima').success().row()
                    .text('❌ Tolak').danger()
                    .placeholder('Terima atau Tolak pendaftaran ini?')
                    .selected();
                exports.bot === null || exports.bot === void 0 ? void 0 : exports.bot.api.sendMessage(adminTgId, `🔔 *Pendaftaran Baru*\n\nUsername: @${((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.username) || 'Tidak ada'}\nID: ${(_d = ctx.from) === null || _d === void 0 ? void 0 : _d.id}\nIP: ${reg.ip_address}\n\nApakah Anda menyetujui pendaftaran ini?`, { parse_mode: 'Markdown', reply_markup: keyboard }).catch(() => { });
            }
            return;
        }
        const user = ctx.dbUser;
        if (user.role === 'admin') {
            const keyboard = new grammy_1.InlineKeyboard()
                .text('👥 Manajemen User', 'manage_users').row()
                .text('⚙️ Pengaturan', 'settings');
            return ctx.reply('👑 *Selamat Datang Admin!*', {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
        else {
            const keyboard = new grammy_1.InlineKeyboard()
                .webApp('🌐 Buka Teledrive', process.env.WEBAPP_URL || 'https://teledriveapp.com');
            return ctx.reply('👋 *Selamat Datang di Teledrive Bot!*\n\nKlik tombol di bawah ini untuk membuka Teledrive WebApp.', {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }));
    exports.bot.hears('✅ Terima', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        if (((_e = ctx.dbUser) === null || _e === void 0 ? void 0 : _e.role) !== 'admin')
            return;
        const reg = yield model_1.prisma.registrations.findFirst({
            where: { status: 'PENDING_ADMIN' },
            orderBy: { created_at: 'asc' }
        });
        if (!reg)
            return ctx.reply('Tidak ada pendaftaran yang menunggu persetujuan.', { reply_markup: { remove_keyboard: true } });
        yield model_1.prisma.registrations.update({
            where: { id: reg.id },
            data: { status: 'APPROVED' }
        });
        if (reg.tg_username) {
            const existingUser = yield model_1.prisma.users.findFirst({ where: { username: reg.tg_username } });
            if (!existingUser) {
                yield model_1.prisma.users.create({
                    data: {
                        username: reg.tg_username,
                        plan: 'free',
                        name: reg.tg_username,
                        tg_id: reg.tg_id
                    }
                });
            }
        }
        ctx.reply(`✅ Pendaftaran dari @${reg.tg_username || 'user'} telah Disetujui.`, { reply_markup: { remove_keyboard: true } });
    }));
    exports.bot.hears('❌ Tolak', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _f;
        if (((_f = ctx.dbUser) === null || _f === void 0 ? void 0 : _f.role) !== 'admin')
            return;
        const reg = yield model_1.prisma.registrations.findFirst({
            where: { status: 'PENDING_ADMIN' },
            orderBy: { created_at: 'asc' }
        });
        if (!reg)
            return ctx.reply('Tidak ada pendaftaran yang menunggu persetujuan.', { reply_markup: { remove_keyboard: true } });
        yield model_1.prisma.registrations.update({
            where: { id: reg.id },
            data: { status: 'REJECTED' }
        });
        ctx.reply(`🔴 Pendaftaran dari @${reg.tg_username || 'user'} telah Ditolak.`, { reply_markup: { remove_keyboard: true } });
    }));
    exports.bot.callbackQuery('manage_users', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const users = yield model_1.prisma.users.findMany();
        let text = '<pre>| Username         | Plan    |\n|------------------|---------|\n';
        users.forEach(u => {
            const uname = u.username.substring(0, 16).padEnd(16, ' ');
            const plan = (u.plan || 'free').substring(0, 7).padEnd(7, ' ');
            text += `| ${uname} | ${plan} |\n`;
        });
        text += '</pre>\n\nKirim perintah <code>/setpremium &lt;username&gt;</code> untuk menjadikan user Premium, atau <code>/deluser &lt;username&gt;</code> untuk menghapus.';
        ctx.editMessageText(`👥 <b>Daftar Pengguna:</b>\n\n${text}`, { parse_mode: 'HTML' });
        ctx.answerCallbackQuery();
    }));
    exports.bot.command('adduser', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        if (((_g = ctx.dbUser) === null || _g === void 0 ? void 0 : _g.role) !== 'admin')
            return;
        const match = ctx.match;
        if (!match)
            return ctx.reply('Format: /adduser <username>');
        const username = match.split(' ')[0].replace('@', '');
        const existingUser = yield model_1.prisma.users.findFirst({ where: { username } });
        if (existingUser)
            return ctx.reply(`❌ User @${username} sudah ada di database.`);
        yield model_1.prisma.users.create({
            data: {
                username,
                plan: 'free',
                name: username
            }
        });
        ctx.reply(`✅ @${username} berhasil ditambahkan!`);
    }));
    exports.bot.command('setpremium', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        if (((_h = ctx.dbUser) === null || _h === void 0 ? void 0 : _h.role) !== 'admin')
            return;
        const match = ctx.match;
        if (!match)
            return ctx.reply('Format: /setpremium <username>');
        const username = match.split(' ')[0].replace('@', '');
        yield model_1.prisma.users.updateMany({ where: { username }, data: { plan: 'premium' } });
        ctx.reply(`✅ @${username} sekarang adalah Premium!`);
    }));
    exports.bot.command('deluser', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _j;
        if (((_j = ctx.dbUser) === null || _j === void 0 ? void 0 : _j.role) !== 'admin')
            return;
        const match = ctx.match;
        if (!match)
            return ctx.reply('Format: /deluser <username>');
        const username = match.split(' ')[0].replace('@', '');
        yield model_1.prisma.users.deleteMany({ where: { username } });
        ctx.reply(`✅ @${username} berhasil dihapus!`);
    }));
    exports.bot.start().then(() => console.log('Telegram Bot started!')).catch(console.error);
}
//# sourceMappingURL=bot.js.map