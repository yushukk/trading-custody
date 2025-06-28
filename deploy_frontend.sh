#!/bin/bash

# 配置部分 - 请根据实际情况修改
GITHUB_REPO="https://github.com/yourusername/yourrepo/archive/refs/heads/main.zip"
APP_DIR="/opt/trading_custody"
FRONTEND_DIR="$APP_DIR/src"
PORT=80

# 检查是否已安装 serve
if ! command -v serve &> /dev/null
then
    echo "未检测到 serve，正在安装..."
    sudo npm install -g serve
fi

# 下载源码
echo "下载源码..."
sudo wget -q $GITHUB_REPO -O /tmp/trading_custody.zip

# 解压文件
echo "解压文件..."
sudo unzip -q /tmp/trading_custody.zip -d /opt/

# 重命名解压目录（注意这里修正了目录名）
echo "重命名解压目录..."
sudo mv /opt/trading-custody-main $APP_DIR

# 安装依赖
echo "安装依赖..."
cd $FRONTEND_DIR
sudo npm install

# 构建前端
echo "构建前端..."
sudo npm run build

# 启动静态服务器
echo "启动前端服务..."
sudo nohup serve -s build -p $PORT > /var/log/trading_custody_frontend.log 2>&1 &

# 显示运行状态
echo "前端服务已启动，监听端口 $PORT"
echo "日志文件: /var/log/trading_custody_frontend.log"
echo "进程ID: $!"