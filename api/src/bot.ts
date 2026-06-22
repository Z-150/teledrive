import { Bot, InlineKeyboard, Keyboard } from 'grammy'
import { prisma } from './model'

export let bot: Bot | null = null

if (process.env.TG_BOT_TOKEN) {
  bot = new Bot(process.env.TG_BOT_TOKEN)

  bot.use(async (ctx, next) => {
    if (!ctx.from) return
    const tgUsername = ctx.from.username
    const tgId = ctx.from.id.toString()

    if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/start ')) {
      return next() // Allow /start <otp> commands
    }

    const user = await prisma.users.findFirst({
      where: { OR: [{ tg_id: tgId }, { username: tgUsername }] }
    })

    if (!user) return

    (ctx as any).dbUser = user
    return next()
  })

  bot.command('start', async (ctx) => {
    const payload = ctx.match
    // /start <otp> — registrasi OTP flow
    if (payload) {
      const reg = await prisma.registrations.findFirst({
        where: { otp: payload as string, status: 'PENDING_OTP' }
      })
      if (!reg) {
        return ctx.reply('❌ Token registrasi tidak valid atau sudah kadaluarsa.')
      }

      await prisma.registrations.update({
        where: { id: reg.id },
        data: {
          status: 'PENDING_ADMIN',
          tg_username: ctx.from?.username || null,
          tg_id: ctx.from?.id.toString(),
          tg_phone: null
        }
      })

      ctx.reply('✅ Kode OTP berhasil diverifikasi!\n\n⏳ Mohon tunggu admin untuk menyetujui pendaftaran Anda.')

      const adminTgId = process.env.TG_BOT_OWNER_ID
      if (adminTgId) {
        const keyboard = new Keyboard()
          .text('✅ Terima').success().row()
          .text('❌ Tolak').danger()
          .placeholder('Terima atau Tolak pendaftaran ini?')
          .selected()

        bot?.api.sendMessage(
          adminTgId,
          `🔔 *Pendaftaran Baru*\n\nUsername: @${ctx.from?.username || 'Tidak ada'}\nID: ${ctx.from?.id}\nIP: ${reg.ip_address}\n\nApakah Anda menyetujui pendaftaran ini?`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        ).catch(() => {})
      }
      return
    }

    // Cek apakah user sudah ada di DB
    const tgId = ctx.from?.id.toString()
    const tgUsername = ctx.from?.username
    const user = await prisma.users.findFirst({
      where: { OR: [{ tg_id: tgId }, ...(tgUsername ? [{ username: tgUsername }] : [])] }
    })

    const webAppUrl = process.env.WEBAPP_URL || 'https://teledriveapp.com'

    // User belum ada di DB → suruh login/daftar dulu
    if (!user) {
      const keyboard = new InlineKeyboard()
        .webApp('🔐 Login / Daftar ke Teledrive', webAppUrl)

      return ctx.reply(
        '👋 Halo! Selamat datang di *Teledrive Bot*.\n\n' +
        'Sepertinya kamu belum memiliki akun Teledrive.\n\n' +
        '📱 Silakan buka WebApp di bawah ini untuk *Login dengan QR Code* atau *Daftar* terlebih dahulu.\n\n' +
        '_Setelah login, kembali ke sini dan ketik /start lagi untuk menggunakan fitur bot._',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )
    }

    // User sudah ada di DB → tampilkan menu manage drive
    if (user.role === 'admin') {
      const keyboard = new InlineKeyboard()
        .webApp('📁 Buka Drive Saya', webAppUrl).row()
        .text('👥 Manajemen User', 'manage_users').row()
        .text('⚙️ Pengaturan', 'settings')

      return ctx.reply(
        `👑 *Selamat Datang Admin!*\n\nHalo, *${user.name || user.username}*! Apa yang ingin kamu kelola hari ini?`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )
    } else {
      // Hitung file user
      const fileCount = await prisma.files.count({
        where: { user_id: user.id, deleted_at: null }
      })

      const keyboard = new InlineKeyboard()
        .webApp('📁 Buka Drive Saya', webAppUrl).row()
        .webApp('⬆️ Upload File', webAppUrl).row()
        .text('📊 Info Akun Saya', 'my_account_info')

      return ctx.reply(
        `👋 Halo, *${user.name || user.username}*!\n\n` +
        `📦 Kamu memiliki *${fileCount} file* di drive kamu.\n\n` +
        `Apa yang ingin kamu lakukan?`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )
    }
  })

  bot.hears('✅ Terima', async (ctx) => {
    if ((ctx as any).dbUser?.role !== 'admin') return
    const reg = await prisma.registrations.findFirst({
      where: { status: 'PENDING_ADMIN' },
      orderBy: { created_at: 'asc' }
    })
    if (!reg) return ctx.reply('Tidak ada pendaftaran yang menunggu persetujuan.', { reply_markup: { remove_keyboard: true } })

    await prisma.registrations.update({
      where: { id: reg.id },
      data: { status: 'APPROVED' }
    })

    if (reg.tg_username) {
      const existingUser = await prisma.users.findFirst({ where: { username: reg.tg_username } })
      if (!existingUser) {
        await prisma.users.create({
          data: {
            username: reg.tg_username,
            plan: 'free',
            name: reg.tg_username,
            tg_id: reg.tg_id
          }
        })
      }
    }

    ctx.reply(`✅ Pendaftaran dari @${reg.tg_username || 'user'} telah Disetujui.`, { reply_markup: { remove_keyboard: true } })
  })

  bot.hears('❌ Tolak', async (ctx) => {
    if ((ctx as any).dbUser?.role !== 'admin') return
    const reg = await prisma.registrations.findFirst({
      where: { status: 'PENDING_ADMIN' },
      orderBy: { created_at: 'asc' }
    })
    if (!reg) return ctx.reply('Tidak ada pendaftaran yang menunggu persetujuan.', { reply_markup: { remove_keyboard: true } })

    await prisma.registrations.update({
      where: { id: reg.id },
      data: { status: 'REJECTED' }
    })

    ctx.reply(`🔴 Pendaftaran dari @${reg.tg_username || 'user'} telah Ditolak.`, { reply_markup: { remove_keyboard: true } })
  })

  bot.callbackQuery('manage_users', async (ctx) => {
    const users = await prisma.users.findMany()
    let text = '<pre>| Username         | Plan    |\n|------------------|---------|\n'
    users.forEach(u => {
      const uname = u.username.substring(0, 16).padEnd(16, ' ')
      const plan = (u.plan || 'free').substring(0, 7).padEnd(7, ' ')
      text += `| ${uname} | ${plan} |\n`
    })
    text += '</pre>\n\nKirim perintah <code>/setpremium &lt;username&gt;</code> untuk menjadikan user Premium, atau <code>/deluser &lt;username&gt;</code> untuk menghapus.'

    ctx.editMessageText(`👥 <b>Daftar Pengguna:</b>\n\n${text}`, { parse_mode: 'HTML' })
    ctx.answerCallbackQuery()
  })

  bot.callbackQuery('my_account_info', async (ctx) => {
    const tgId = ctx.from?.id.toString()
    const tgUsername = ctx.from?.username
    const user = await prisma.users.findFirst({
      where: { OR: [{ tg_id: tgId }, ...(tgUsername ? [{ username: tgUsername }] : [])] }
    })
    if (!user) return ctx.answerCallbackQuery('User tidak ditemukan.')

    const fileCount = await prisma.files.count({ where: { user_id: user.id, deleted_at: null } })
    const totalSize = await prisma.files.aggregate({
      where: { user_id: user.id, deleted_at: null },
      _sum: { size: true }
    })

    const sizeBytes = Number(totalSize._sum.size || 0)
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2)
    const sizeGB = (sizeBytes / 1024 / 1024 / 1024).toFixed(2)
    const sizeDisplay = sizeBytes > 1024 * 1024 * 1024 ? `${sizeGB} GB` : `${sizeMB} MB`

    const webAppUrl = process.env.WEBAPP_URL || 'https://teledriveapp.com'
    const keyboard = new InlineKeyboard()
      .webApp('📁 Buka Drive Saya', webAppUrl)

    ctx.editMessageText(
      `📊 *Info Akun Saya*\n\n` +
      `👤 Username: @${user.username}\n` +
      `💎 Plan: ${user.plan || 'free'}\n` +
      `📁 Total File: *${fileCount} file*\n` +
      `💾 Total Ukuran: *${sizeDisplay}*`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    )
    ctx.answerCallbackQuery()
  })

  bot.command('adduser', async (ctx) => {
    if ((ctx as any).dbUser?.role !== 'admin') return
    const match = ctx.match
    if (!match) return ctx.reply('Format: /adduser <username>')
    const username = match.split(' ')[0].replace('@', '')

    const existingUser = await prisma.users.findFirst({ where: { username } })
    if (existingUser) return ctx.reply(`❌ User @${username} sudah ada di database.`)

    await prisma.users.create({
      data: {
        username,
        plan: 'free',
        name: username
      }
    })
    ctx.reply(`✅ @${username} berhasil ditambahkan!`)
  })

  bot.command('setpremium', async (ctx) => {
    if ((ctx as any).dbUser?.role !== 'admin') return
    const match = ctx.match
    if (!match) return ctx.reply('Format: /setpremium <username>')
    const username = match.split(' ')[0].replace('@', '')
    await prisma.users.updateMany({ where: { username }, data: { plan: 'premium' } })
    ctx.reply(`✅ @${username} sekarang adalah Premium!`)
  })

  bot.command('deluser', async (ctx) => {
    if ((ctx as any).dbUser?.role !== 'admin') return
    const match = ctx.match
    if (!match) return ctx.reply('Format: /deluser <username>')
    const username = match.split(' ')[0].replace('@', '')
    await prisma.users.deleteMany({ where: { username } })
    ctx.reply(`✅ @${username} berhasil dihapus!`)
  })

  bot.start().then(() => console.log('Telegram Bot started!')).catch(console.error)
}
