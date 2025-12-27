#!/bin/bash

# ==========================================
# Trading Custody System - Docker 一键部署脚本
# ==========================================
# 使用方法：
#   chmod +x docker-deploy.sh
#   ./docker-deploy.sh
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

# 检查 Docker 和 Docker Compose
check_docker() {
    print_header "检查 Docker 环境"
    
    if ! command_exists docker; then
        print_error "Docker 未安装！"
        print_info "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
        exit 1
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose 未安装！"
        print_info "请访问 https://docs.docker.com/compose/install/ 安装 Docker Compose"
        exit 1
    fi
    
    print_success "Docker 版本: $(docker --version)"
    if command_exists docker-compose; then
        print_success "Docker Compose 版本: $(docker-compose --version)"
    else
        print_success "Docker Compose 版本: $(docker compose version)"
    fi
}

# 检查环境变量文件
check_env_file() {
    print_header "检查环境变量配置"
    
    ENV_FILE=".env"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error ".env 文件不存在！"
        
        # 检查 .env.example 是否存在
        if [ -f .env.example ]; then
            print_info "检测到 .env.example 文件"
            read -p "是否从 .env.example 创建 .env 文件？(y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp .env.example .env
                print_success ".env 文件已创建"
                print_warning "请检查并修改 .env 文件中的配置（特别是API 地址）"
                print_info "按任意键继续..."
                read -n 1 -s -r
            else
                print_error "部署已取消"
                exit 1
            fi
        else
            print_error "未找到 .env.example 文件"
            print_info "请手动创建 .env 文件"
            exit 1
        fi
    fi
    
    
    # 检查 API 地址配置
    if grep -q "http://localhost:3001" "$ENV_FILE"; then
        print_warning "前端 API 地址配置为 localhost"
        print_info "如果部署到服务器，请修改 REACT_APP_API_BASE_URL 为实际地址"
        read -p "是否继续部署？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "环境变量配置检查完成"
}

# 停止现有容器
stop_containers() {
    print_header "停止现有容器"
    
    if docker ps -a | grep -q "trading-custody"; then
        print_info "发现现有容器，正在停止..."
        docker-compose --env-file "$ENV_FILE" down
        print_success "现有容器已停止"
    else
        print_info "没有发现运行中的容器"
    fi
}

# 构建镜像
build_images() {
    print_header "构建 Docker 镜像"
    
    print_info "开始构建镜像（这可能需要几分钟）..."
    docker-compose --env-file "$ENV_FILE" build --no-cache
    print_success "镜像构建完成"
}

# 启动服务
start_services() {
    print_header "启动服务"
    
    print_info "启动所有服务..."
    docker-compose --env-file "$ENV_FILE" up -d
    print_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_header "等待服务就绪"
    
    print_info "等待后端服务启动..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose --env-file "$ENV_FILE" ps | grep -q "healthy"; then
            print_success "后端服务已就绪"
            break
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        print_warning "服务启动超时，请检查日志"
    fi
}

# 显示服务状态
show_status() {
    print_header "服务状态"
    
    docker-compose --env-file "$ENV_FILE" ps
    
    echo ""
    print_info "查看日志命令："
    echo "  docker-compose --env-file $ENV_FILE logs -f"
    echo ""
    print_info "查看后端日志："
    echo "  docker-compose --env-file $ENV_FILE logs -f backend"
    echo ""
    print_info "查看前端日志："
    echo "  docker-compose --env-file $ENV_FILE logs -f frontend"
}

# 显示访问信息
show_access_info() {
    print_header "部署完成"
    
    # 获取配置的端口
    SERVER_PORT=$(grep "^SERVER_PORT=" "$ENV_FILE" | cut -d '=' -f2)
    APP_PORT=$(grep "^APP_PORT=" "$ENV_FILE" | cut -d '=' -f2)
    
    # 设置默认值
    SERVER_PORT=${SERVER_PORT:-3001}
    APP_PORT=${APP_PORT:-80}
    
    print_success "Trading Custody System 已成功部署！"
    echo ""
    echo "访问地址："
    echo "  前端应用: http://localhost:${APP_PORT}"
    echo "  后端 API: http://localhost:${SERVER_PORT}"
    echo "  健康检查: http://localhost:${SERVER_PORT}/health"
    echo ""
    
    if [ "$APP_PORT" != "80" ]; then
        print_warning "前端端口不是 80，请使用 http://localhost:${APP_PORT} 访问"
    fi
    
    echo "常用命令："
    echo "  停止服务: docker-compose --env-file $ENV_FILE down"
    echo "  重启服务: docker-compose --env-file $ENV_FILE restart"
    echo "  查看日志: docker-compose --env-file $ENV_FILE logs -f"
    echo "  进入容器: docker-compose --env-file $ENV_FILE exec backend sh"
    echo ""
}

# 主函数
main() {
    clear
    print_header "Trading Custody System - Docker 一键部署"
    
    # 执行部署步骤
    check_docker
    check_env_file
    stop_containers
    build_images
    start_services
    wait_for_services
    show_status
    show_access_info
    
    print_success "部署流程完成！"
}

main