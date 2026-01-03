// api/server.js (NİHAİ, HATASIZ VERSİYON)
const express = require('express');
const client = require('prom-client');
const app = express();
const port = 8000;

// --- Prometheus Kurulumu ---
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'node_app_' }); // Temel CPU/RAM metriklerini topla

// HTTP İsteklerinin Süresini ve Sayısını Ölçen Metrik
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10] // Gecikme kovaları (Latency)
});

// YENİ EK: İstekleri Ölçen Basit Middleware
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ route: req.baseUrl, code: res.statusCode, method: req.method });
  });
  next();
});
// --- /Prometheus Kurulumu ---

// --- Endpoint Tanımları ---
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics()); // Metrikleri sun
});

// Ana uygulama endpoint'i
app.get('/', (req, res) => {
  const dbHost = process.env.POSTGRES_HOST;
  const dbUser = process.env.POSTGRES_USER;
  res.send(`
    <h1>Chat Core API is Running! (Node.js)</h1>
    <p>Database Host: ${dbHost}</p>
    <p>Database User: ${dbUser}</p>
    <p>Metrics available at /metrics</p>
  `);
});

// Hata test endpoint'i
app.get('/nonexistent', (req, res) => {
  res.status(404).send('Not Found for Error Test');
});

app.listen(port, () => {
  console.log('Chat Core API listening at port ' + port);
});