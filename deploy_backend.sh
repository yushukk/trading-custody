#!/bin/bash

# 配置部分 - 请根据实际情况修改

GITHUB_REPO="https://codeload.github.com/yushukk/trading-custody/zip/refs/heads/login"
APP_DIR="/opt/trading_custody"
PORT=3000

# 创建工作目录
echo "创建工作目录..."
sudo mkdir -p $APP_DIR

# 下载源码
echo "下载源码..."
sudo wget -q $GITHUB_REPO -O /tmp/trading_custody.zip

# 解压文件
echo "解压文件..."
sudo unzip -q /tmp/trading_custody.zip -d /opt/

# 重命名解压目录（注意这里修正了目录名）
echo "重命名解压目录..."
sudo mv /opt/trading-custody-login $APP_DIR

# 安装依赖
echo "安装依赖..."
cd $APP_DIR
sudo npm install

# 启动服务
echo "启动后端服务..."
sudo nohup node server/server.js > /var/log/trading_custody.log 2>&1 &

# 显示运行状态
echo "服务已启动，监听端口 $PORT"
echo "日志文件: /var/log/trading_custody.log"
echo "进程ID: $!"