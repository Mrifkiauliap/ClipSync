FROM node:20-slim

# Timezone setting
ENV TZ=Asia/Jakarta

RUN apt-get update && \
  apt-get install -y tzdata && \
  ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
  echo $TZ > /etc/timezone && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (better cache)
COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]
