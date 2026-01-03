const express = require('express');
const Ably = require('ably');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const ablyApiKey = process.env.ABLY_API_KEY || 'zShz7g.EWNeGg:ZQnGcNpLoSRljn781M9vY8uoqkGnqKC1j9p6mGpISHg';
let ablyRealtime;
const prisma = new PrismaClient();

try {
    ablyRealtime = new Ably.Realtime(ablyApiKey);
    console.log('Ably bağlantısı başarılı.');
} catch (error) {
    console.error('Ably bağlantı hatası:', error);
}

// Register
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await prisma.user.create({
            data: { username, email, password },
        });
        res.json({ user });
    } catch (err) {
        res.status(400).json({ error: 'Kayıt hatası', detail: err });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                username,
                password
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı veya şifre hatalı' });
        }
        res.json({ user });
    } catch (err) {
        res.status(400).json({ error: 'Giriş hatası', detail: err });
    }
});

// Kullanıcıya ait roomlar
app.get('/user-rooms/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const rooms = await prisma.room.findMany({
            where: {
                deletedAt: null,
                members: {
                    some: {
                        userId: Number(userId),
                        deletedAt: null
                    }
                }
            }
        });
        res.json({ rooms });
    } catch (err) {
        res.status(500).json({ error: 'Roomları getirirken hata oluştu', detail: err });
    }
});

// Oda ve mesajlar
app.get('/room-messages/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await prisma.message.findMany({
            where: {
                roomId: Number(roomId),
                deletedAt: null
            }
        });
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ error: 'Mesajlar getirilemedi', detail: err });
    }
});

// Websocket ile mesaj gönderme
app.post('/send-message', async (req, res) => {
    try {
        const { roomId, userId, content } = req.body;
        const message = await prisma.message.create({
            data: { roomId, userId, content, oldContent: content }
        });
        const channel = ablyRealtime.channels.get(`room-${roomId}`);
        channel.publish('message', { message });
        res.json({ message });
    } catch (err) {
        res.status(500).json({ error: 'Mesaj gönderilemedi', detail: err });
    }
});

// Ably websocket'ten mesaj kabulü
app.post('/ably-receive', (req, res) => {
    // Bu endpoint'e client Ably webhook veya REST olarak ulaşabilir
    try {
        const { roomId, data } = req.body;
        const channel = ablyRealtime.channels.get(`room-${roomId}`);
        channel.publish('received', { data });
        res.json({ status: 'Mesaj broadcast edildi.' });
    } catch (err) {
        res.status(500).json({ error: 'Mesaj broadcast edilemedi', detail: err });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
