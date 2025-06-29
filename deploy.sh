#!/bin/bash

GITHUB_REPO="https://codeload.github.com/yushukk/trading-custody/zip/refs/heads/login"
APP_DIR="/opt/trading_custody"

# 后端配置
BACKEND_PORT=3001

# 前端配置
FRONTEND_PORT=3000

# 公共函数
check_serve() {
  if ! command -v serve &> /dev/null; then
    echo "未检测到 serve，正在安装..."
    sudo npm install -g serve
  fi
}

# 下载源码
echo "下载源码..."
sudo wget -q $GITHUB_REPO -O /tmp/trading_custody.zip

# 解压文件
echo "解压文件..."
sudo unzip -q /tmp/trading_custody.zip -d /opt/

# 重命名解压目录
echo "重命名目录..."
sudo mv /opt/trading-custody-login $APP_DIR

# 安装依赖
echo "安装依赖..."
cd $APP_DIR
sudo npm install

# 部署后端
  echo "=== 部署后端开始 ==="
  
  
  # 启动服务
  echo "启动后端服务..."
  sudo nohup node server/server.js > /var/log/trading_custody_backend.log 2>&1 &
  echo "后端服务已启动，监听端口 $BACKEND_PORT"
  
  # 部署前端
  echo "=== 部署前端开始 ==="
  check_serve
  
  # 构建前端
  echo "构建前端..."
  sudo npm run build
  
  # 启动静态服务器
  echo "启动前端服务..."
  sudo nohup serve -s build -p $FRONTEND_PORT > /var/log/trading_custody_frontend.log 2>&1 &
  echo "前端服务已启动，监听端口 $FRONTEND_PORT"
  
  echo "部署完成，请检查日志文件：
  /var/log/trading_custody_backend.log
  /var/log/trading_custody_frontend.log"