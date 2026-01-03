const express = require('express');
const Ably = require('ably');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
        res.json(user);
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
        res.json(user);
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
        res.json({
            items: rooms
        });
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
        res.json({
            items: messages
        });
    } catch (err) {
        res.status(500).json({ error: 'Mesajlar getirilemedi', detail: err });
    }
});

// Websocket ile mesaj gönderme
app.post('/send-message', async (req, res) => {
    try {
        // req.body kontrolü - undefined ise hata döndür
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ 
                error: 'Geçersiz request body', 
                detail: 'Content-Type: application/json header\'ı ile JSON body gönderilmelidir'
            });
        }
        
        const { roomId, userId, content } = req.body;
        
        // Input validation
        if (!roomId || !userId || !content) {
            return res.status(400).json({ 
                error: 'Eksik alanlar', 
                detail: 'roomId, userId ve content alanları zorunludur'
            });
        }
        
        // Convert to integers
        const parsedRoomId = parseInt(roomId, 10);
        const parsedUserId = parseInt(userId, 10);
        
        if (isNaN(parsedRoomId) || isNaN(parsedUserId)) {
            return res.status(400).json({ 
                error: 'Geçersiz ID formatı', 
                detail: 'roomId ve userId sayısal değer olmalıdır'
            });
        }
        
        if (typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Geçersiz içerik', 
                detail: 'content boş olamaz'
            });
        }
        
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: parsedUserId }
        });
        if (!user) {
            return res.status(404).json({ 
                error: 'Kullanıcı bulunamadı', 
                detail: `UserId: ${parsedUserId} bulunamadı`
            });
        }
        
        // Check if room exists
        const room = await prisma.room.findUnique({
            where: { id: parsedRoomId }
        });
        if (!room) {
            return res.status(404).json({ 
                error: 'Oda bulunamadı', 
                detail: `RoomId: ${parsedRoomId} bulunamadı`
            });
        }
        
        // Create message
        const message = await prisma.message.create({
            data: { 
                roomId: parsedRoomId, 
                userId: parsedUserId, 
                content: content.trim(), 
                oldContent: content.trim() 
            }
        });
        
        // Publish to Ably
        if (!ablyRealtime) {
            return res.json(message);
        }
        
        try {
            const channel = ablyRealtime.channels.get(`room-${parsedRoomId}`);
            await channel.publish('message', { message });
        } catch (ablyError) {
            // Message is already saved, so return success but log the Ably error
            console.error('Ably publish hatası:', ablyError);
        }
        
        res.json(message);
        
    } catch (err) {
        // Handle specific Prisma errors
        if (err.code === 'P2002') {
            return res.status(409).json({ 
                error: 'Çakışma hatası', 
                detail: err.meta || err.message
            });
        }
        
        if (err.code === 'P2003') {
            return res.status(400).json({ 
                error: 'Foreign key hatası', 
                detail: 'Geçersiz roomId veya userId'
            });
        }
        
        res.status(500).json({ 
            error: 'Mesaj gönderilemedi', 
            detail: err.message,
            code: err.code,
            type: err.constructor.name
        });
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
