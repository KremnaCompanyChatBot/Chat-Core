# Chatbot için Node.js Dockerfile
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Bağımlılık dosyalarını kopyala
COPY package*.json ./

# Prisma schema dosyasını kopyala (generate için gerekli)
COPY prisma ./prisma/

# Bağımlılıkları kur (postinstall otomatik prisma generate çalıştırır)
RUN npm install

# Uygulama kodunu kopyala
COPY . .

# Port
ENV PORT=3000
EXPOSE 3000

# Başlat
CMD ["node", "index.js"]

