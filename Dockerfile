FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:18-bullseye-slim

RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list \
    && sed -i 's|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list

WORKDIR /workspace

# 复制 package.json 先安装依赖（利用缓存）
COPY package*.json ./
RUN npm install

# 再复制其余文件
COPY . .

EXPOSE 8090

# 关键：监听 0.0.0.0
CMD ["npm","run","dev","--","--host","0.0.0.0"]