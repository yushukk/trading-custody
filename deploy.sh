#!/bin/bash

# ==========================================
# Trading Custody System - 服务器一键部署脚本
# ==========================================
# 使用方法：
#   chmod +x deploy.sh
#   ./deploy.sh
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印标题
print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Node.js
check_nodejs() {
    print_header "检查 Node.js 环境"
    
    if ! command_exists node; then
        print_error "Node.js 未安装！"
        print_info "请访问 https://nodejs.org/ 安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js 版本过低！当前版本: $(node -v)，需要 16+"
        exit 1
    fi
    
    print_success "Node.js 版本: $(node -v)"
    print_success "npm 版本: $(npm -v)"
}

# 检查 PM2
check_pm2() {
    print_header "检查 PM2"
    
    if ! command_exists pm2; then
        print_warning "PM2 未安装，正在安装..."
        npm install -g pm2
        print_success "PM2 安装完成"
    else
        print_success "PM2 已安装: $(pm2 -v)"
    fi
}

# 安装依赖
install_dependencies() {
    print_header "安装项目依赖"
    
    print_info "正在安装依赖（这可能需要几分钟）..."
    # 跳过 husky 的 prepare 脚本，避免在生产环境报错
    npm install --production --ignore-scripts
    
    # 重新编译 sqlite3（原生模块需要编译）
    print_info "编译 sqlite3 原生模块..."
    npm rebuild sqlite3
    
    print_success "依赖安装完成"
}

# 配置环境变量
setup_env() {
    print_header "配置环境变量"
    
    ENV_FILE=".env"
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f .env.example ]; then
            print_info "从 .env.example 创建 .env 文件"
            cp .env.example .env
            
            # 设置生产环境
            sed -i.bak "s/NODE_ENV=development/NODE_ENV=production/g" .env
            rm -f .env.bak
            
            print_success ".env 文件已创建"
            print_info "系统将在首次启动时自动生成 JWT 密钥"
        else
            print_error "未找到 .env.example 文件"
            exit 1
        fi
    else
        print_success ".env 文件已存在"
    fi
    
    echo ""
    print_warning "⚠️  重要提示："
    echo "1. 系统会在首次启动时自动生成 JWT 密钥"
    echo "2. 如果是集群部署，请确保所有节点使用相同的 JWT 密钥"
    echo "3. 集群部署时，请在首个节点启动后，将生成的密钥复制到其他节点的 .env 文件中"
    echo ""
    
    # 提示用户检查配置
    print_info "当前完整配置："
    echo "----------------------------------------"
    cat .env | grep -v "^#" | grep -v "^$"
    echo "----------------------------------------"
    echo ""
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "请手动编辑 .env 文件后重新运行脚本"
        exit 1
    fi
}

# 设置部署模式
select_deploy_mode() {
    print_header "准备部署"
    
    print_info "将进行完整部署（包含前端和后端）"
    DEPLOY_MODE="full"
}

# 构建前端
build_frontend() {
    print_header "检查前端构建"
    
    if [ -d "build" ]; then
        print_success "发现已构建的前端文件"
        print_info "跳过前端构建步骤"
    else
        print_warning "未找到 build 目录"
        print_info "生产环境建议："
        echo "  1. 在本地运行: npm run build"
        echo "  2. 将 build 目录上传到服务器"
        echo "  3. 或使用 CI/CD 自动构建"
        echo ""
        read -p "是否在服务器上构建前端？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_warning "正在服务器上构建（不推荐用于生产环境）..."
            
            print_info "安装构建工具..."
            npm install --ignore-scripts
            
            print_info "正在构建前端（这可能需要几分钟）..."
            npm run build
            
            print_info "清理开发依赖..."
            npm prune --production
            
            print_success "前端构建完成"
        else
            print_error "部署已取消"
            print_info "请先构建前端后再运行部署脚本"
            exit 1
        fi
    fi
}

# 停止现有服务
stop_services() {
    print_header "停止现有服务"
    
    if pm2 list | grep -q "trading-custody"; then
        print_info "停止现有服务..."
        pm2 delete trading-custody-backend 2>/dev/null || true
        pm2 delete trading-custody-frontend 2>/dev/null || true
        print_success "现有服务已停止"
    else
        print_info "没有发现运行中的服务"
    fi
}

# 启动后端服务
start_backend() {
    print_header "启动后端服务"
    
    print_info "启动后端 API 服务..."
    pm2 start server/server.js --name trading-custody-backend --time
    print_success "后端服务已启动"
}

# 启动前端服务
start_frontend() {
    print_header "启动前端服务"
    
    # 获取端口配置
    FRONTEND_PORT=$(grep "^APP_PORT=" .env | cut -d'=' -f2 || echo "80")
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    
    print_info "启动前端静态文件服务（端口: $FRONTEND_PORT）..."
    pm2 start "serve -s build -l $FRONTEND_PORT" --name trading-custody-frontend --time
    print_success "前端服务已启动"
}

# 保存 PM2 配置
save_pm2() {
    print_header "保存 PM2 配置"
    
    pm2 save
    print_success "PM2 配置已保存"
    
    # 设置开机自启
    print_info "设置开机自启动..."
    pm2 startup | tail -n 1 | sh || print_warning "请手动运行上面的命令以启用开机自启"
}

# 显示服务状态
show_status() {
    print_header "服务状态"
    
    pm2 list
    
    echo ""
    print_info "常用命令："
    echo "  查看日志: pm2 logs"
    echo "  查看后端日志: pm2 logs trading-custody-backend"
    echo "  查看前端日志: pm2 logs trading-custody-frontend"
    echo "  重启服务: pm2 restart all"
    echo "  停止服务: pm2 stop all"
    echo "  查看监控: pm2 monit"
}

# 显示访问信息
show_access_info() {
    print_header "部署完成"
    
    # 获取配置的端口
    SERVER_PORT=$(grep "^PORT=" .env | cut -d'=' -f2 || echo "3001")
    SERVER_PORT=${SERVER_PORT:-3001}
    FRONTEND_PORT=$(grep "^APP_PORT=" .env | cut -d'=' -f2 || echo "80")
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    
    print_success "Trading Custody System 已成功部署！"
    echo ""
    echo "访问地址："
    echo "  前端应用: http://localhost:${FRONTEND_PORT}"
    echo "  后端 API: http://localhost:${SERVER_PORT}"
    echo "  健康检查: http://localhost:${SERVER_PORT}/health"
    echo ""
    print_info "默认管理员账号："
    echo "  用户名: admin"
    echo "  密码: admin"
    print_warning "请立即登录并修改默认密码！"
}

# 生成 Nginx 配置（可选）
generate_nginx_config() {
    print_header "生成 Nginx 配置（可选）"
    
    read -p "是否生成 Nginx 配置文件？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SERVER_PORT=$(grep "^PORT=" .env | cut -d'=' -f2 || echo "3001")
        SERVER_PORT=${SERVER_PORT:-3001}
        
        cat > nginx-site.conf << EOF
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名

    # 前端静态文件
    location / {
        root $(pwd)/build;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF
        
        print_success "Nginx 配置已生成: nginx-site.conf"
        print_info "使用方法："
        echo "  sudo cp nginx-site.conf /etc/nginx/sites-available/trading-custody"
        echo "  sudo ln -s /etc/nginx/sites-available/trading-custody /etc/nginx/sites-enabled/"
        echo "  sudo nginx -t"
        echo "  sudo systemctl reload nginx"
    fi
}

# 主函数
main() {
    clear
    print_header "Trading Custody System - 服务器一键部署"
    
    # 执行部署步骤
    check_nodejs
    check_pm2
    select_deploy_mode
    install_dependencies
    setup_env
    build_frontend
    stop_services
    start_backend
    start_frontend
    save_pm2
    show_status
    show_access_info
    generate_nginx_config
    
    echo ""
    print_success "部署完成！"
}

# 运行主函数
main
