# Chat-Core

Chat Core projesi, PostgreSQL, Redis, Prometheus ve Ably kullanan bir backend chat sistemi.

## Proje Yapısı

```
Chat-Core-main/
├── docker-compose.yml    # Docker Compose yapılandırması
├── .env.example          # Ortam değişkenleri şablonu
├── api/                  # Chat Core API Servisi (Backend - Node.js)
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── chatbot/              # Chatbot Servisi (Ably Realtime)
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   └── prisma/
│       └── schema.prisma
└── prometheus/           # Prometheus Monitoring
    └── prometheus.yml
```

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd Chat-Core-main
```

2. Ortam değişkenlerini yapılandırın:
```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin ve `ABLY_API_KEY` değerini güncelleyin:
   - [Ably.com](https://ably.com)'dan API key alın
   - `ABLY_API_KEY` değerini güncelleyin
   - Gerekirse diğer değerleri de özelleştirin

4. Docker Compose ile servisleri başlatın:
```bash
docker-compose up -d
```

## Servisler

- **PostgreSQL**: Port 127.0.0.1:5432 (localhost only)
- **Redis**: Port 127.0.0.1:6379 (localhost only)
- **Prometheus**: Port 127.0.0.1:9090 (localhost only)
- **API Servisi**: Port 8000
- **Chatbot Servisi**: Port 3001

## Geliştirme

### API Servisi
```bash
cd api
npm install
npm start
```

### Chatbot Servisi
```bash
cd chatbot
npm install
npm run dev
```

## Veritabanı

Prisma ORM kullanılıyor. Veritabanı migrasyonları için:
```bash
cd chatbot
npx prisma migrate dev
```
