#!/bin/bash

check_serve() {
  if ! command -v serve &> /dev/null; then
    echo "未检测到 serve，正在安装..."
    npm install -g serve
  fi
}

APP_DIR=${1:-"/Users/erik/cdapp"}
APP_CODE=${2:-"https://github.com/yushukk/trading-custody/archive/refs/tags/v1.0.0.zip"}
APP_VERSION=${3:-"1.0.0"}

# 后端配置
BACKEND_PORT=3001

# 前端配置
FRONTEND_PORT=3000

echo "应用目录: $APP_DIR"
echo "应用代码: $APP_CODE"

# 删除源码
echo "删除旧源码..."
# sudo rm -f $APP_DIR/trading-custody.zip
sudo rm -rf $APP_DIR/trading-custody-$APP_VERSION

# 下载源码 存在源码则不下载
echo "下载源码..."
echo "检查文件: $APP_DIR/trading-custody.zip"

sudo wget -q $APP_CODE -O $APP_DIR/trading-custody.zip
# if [ ! -f "$APP_DIR/trading-custody.zip" ]; then
#     echo "源码不存在，开始下载..."
#     sudo wget -q $APP_CODE -O $APP_DIR/trading-custody.zip
# else
#   echo "源码已存在，跳过下载..."
# fi

# 解压文件
echo "解压文件..."
sudo unzip -q $APP_DIR/trading-custody.zip -d $APP_DIR

# 移动源码文件
echo "移动源码文件..."

if [ ! -d "$APP_DIR/trading-custody" ]; then
  echo "创建目录: $APP_DIR/trading-custody"
  sudo mkdir -p $APP_DIR/trading-custody
fi

sudo rm -rf $APP_DIR/trading-custody/src $APP_DIR/trading-custody/server $APP_DIR/trading-custody/public
sudo rm -f $APP_DIR/trading-custody/package.json
sudo mv $APP_DIR/trading-custody-$APP_VERSION/src $APP_DIR/trading-custody
sudo mv $APP_DIR/trading-custody-$APP_VERSION/server $APP_DIR/trading-custody
sudo mv $APP_DIR/trading-custody-$APP_VERSION/public $APP_DIR/trading-custody
sudo mv $APP_DIR/trading-custody-$APP_VERSION/package.json $APP_DIR/trading-custody

sudo rm -rf $APP_DIR/trading-custody-$APP_VERSION


# 停止应用
echo "停止应用..."
sudo pkill -f "node server/server.js"
# 停止前端服务
sudo pkill -f "serve -s build -p $FRONTEND_PORT"

# exit(0)

# 安装依赖
echo "安装依赖..."
cd $APP_DIR/trading-custody
#sudo tnpm install -d
npm install -d


# 部署后端
echo "=== 部署后端开始 ==="


# 启动服务
echo "启动后端服务..."
nohup node server/server.js > $APP_DIR/trading_custody_backend.log 2>&1 &
echo "后端服务已启动，监听端口 $BACKEND_PORT"

# 部署前端
echo "=== 部署前端开始 ==="
check_serve

# 构建前端
echo "构建前端..."
npm run build

# 启动静态服务器
echo "启动前端服务..."
nohup serve -s build -p $FRONTEND_PORT > $APP_DIR/trading_custody_frontend.log 2>&1 &
echo "前端服务已启动，监听端口 $FRONTEND_PORT"

echo "部署完成，请检查日志文件：
$APP_DIR/trading_custody_backend.log
$APP_DIR/trading_custody_frontend.log"