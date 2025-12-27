#!/bin/bash

# ==========================================
# Trading Custody System - 快速部署脚本
# 自动下载并部署（无需 Git）
# ==========================================
# 使用方法：
#   wget https://raw.githubusercontent.com/yushukk/trading-custody/main/quick-deploy.sh
#   chmod +x quick-deploy.sh
#   ./quick-deploy.sh
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
REPO_URL="https://github.com/yushukk/trading-custody/archive/refs/heads/main.zip"
DOWNLOAD_FILE="trading-custody-main.zip"
EXTRACT_DIR="trading-custody-main"

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

# 检查下载工具
check_download_tool() {
    print_header "检查下载工具"
    
    if command_exists wget; then
        DOWNLOAD_TOOL="wget"
        print_success "使用 wget 下载"
    elif command_exists curl; then
        DOWNLOAD_TOOL="curl"
        print_success "使用 curl 下载"
    else
        print_error "未找到 wget 或 curl"
        print_info "请安装 wget 或 curl："
        echo "  Ubuntu/Debian: sudo apt-get install wget"
        echo "  CentOS/RHEL: sudo yum install wget"
        echo "  macOS: brew install wget"
        exit 1
    fi
}

# 检查解压工具
check_unzip() {
    print_header "检查解压工具"
    
    if ! command_exists unzip; then
        print_error "未找到 unzip"
        print_info "请安装 unzip："
        echo "  Ubuntu/Debian: sudo apt-get install unzip"
        echo "  CentOS/RHEL: sudo yum install unzip"
        echo "  macOS: brew install unzip"
        exit 1
    fi
    
    print_success "unzip 已安装"
}

# 下载项目
download_project() {
    print_header "下载项目"
    
    # 清理旧文件
    if [ -f "$DOWNLOAD_FILE" ]; then
        print_info "删除旧的下载文件..."
        rm -f "$DOWNLOAD_FILE"
    fi
    
    if [ -d "$EXTRACT_DIR" ]; then
        print_warning "发现已存在的项目目录"
        read -p "是否删除并重新下载？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$EXTRACT_DIR"
        else
            print_info "使用现有目录"
            return
        fi
    fi
    
    print_info "正在下载项目（这可能需要几分钟）..."
    
    if [ "$DOWNLOAD_TOOL" = "wget" ]; then
        wget -O "$DOWNLOAD_FILE" "$REPO_URL"
    else
        curl -L "$REPO_URL" -o "$DOWNLOAD_FILE"
    fi
    
    print_success "下载完成"
}

# 解压项目
extract_project() {
    print_header "解压项目"
    
    print_info "正在解压..."
    unzip -q "$DOWNLOAD_FILE"
    
    print_success "解压完成"
    
    # 清理下载文件
    print_info "清理下载文件..."
    rm -f "$DOWNLOAD_FILE"
}

# 运行部署脚本 
run_deploy() {
    print_header "运行部署脚本"
    
    cd "$EXTRACT_DIR"
    
    if [ ! -f "deploy.sh" ]; then
        print_error "未找到 deploy.sh 脚本"
        exit 1
    fi
    
    chmod +x deploy.sh
    
    print_info "开始执行部署..."
    echo ""
    
    ./deploy.sh
}

# 主函数
main() {
    clear
    print_header "Trading Custody System - 快速部署"
    
    print_info "此脚本将自动下载并部署 Trading Custody System"
    print_warning "无需安装 Git，适合任何服务器环境"
    echo ""
    
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "部署已取消"
        exit 0
    fi
    
    # 执行下载和解压步骤
    check_download_tool
    check_unzip
    download_project
    extract_project
    
    # 调用主部署脚本完成实际部署
    run_deploy
    
    echo ""
    print_success "快速部署完成！"
}

# 运行主函数
main
