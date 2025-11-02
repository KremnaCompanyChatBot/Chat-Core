# API/Backend için Node.js Dockerfile
# Node.js'in yalın (alpine) versiyonunu kullanıyoruz
FROM node:20-alpine

# Çalışma dizinini oluşturma
WORKDIR /app

# Bağımlılıkları kopyalama
# Yalnızca package.json dosyaları kopyalanır, cache'i optimize eder
COPY package*.json ./

# Bağımlılıkları kurma
RUN npm install

# Geri kalan tüm uygulama kodunu kopyalama
COPY . /app

# Portu açığa çıkarma (docker-compose'da 8000'e eşitledik)
EXPOSE 8000 

# Uygulamayı başlatma komutu
CMD ["npm", "start"]