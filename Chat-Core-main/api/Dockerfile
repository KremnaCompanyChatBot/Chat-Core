# API için Node.js Dockerfile
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Bağımlılık dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları kur
RUN npm install

# Uygulama kodunu kopyala
COPY . .

# Port
ENV PORT=8000
EXPOSE 8000

# Başlat
CMD ["npm", "start"]