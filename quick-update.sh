#!/bin/bash

# ==========================================
# Trading Custody System - 快速更新脚本
# 自动下载并更新（无需 Git）
# ==========================================
# 使用方法：
#   wget -O quick-update.sh https://raw.githubusercontent.com/yushukk/trading-custody/main/quick-update.sh
#   chmod +x quick-update.sh
#   ./quick-update.sh
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
BACKUP_DIR="trading-custody-backup-$(date +%Y%m%d_%H%M%S)"

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

# 检查是否在项目目录
check_project_dir() {
    print_header "检查项目目录"
    
    if [ ! -f "package.json" ] || [ ! -f "server/server.js" ]; then
        print_error "当前目录不是 Trading Custody 项目目录"
        print_info "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    print_success "项目目录检查通过"
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
        exit 1
    fi
}

# 检查 PM2
check_pm2() {
    print_header "检查 PM2"
    
    if ! command_exists pm2; then
        print_warning "PM2 未安装，将无法自动重启服务"
        HAS_PM2=false
    else
        print_success "PM2 已安装"
        HAS_PM2=true
    fi
}

# 停止服务
stop_services() {
    if [ "$HAS_PM2" = true ]; then
        print_header "停止服务"
        
        if pm2 list | grep -q "trading-custody"; then
            print_info "停止现有服务..."
            pm2 stop all
            print_success "服务已停止"
        fi
    fi
}

# 备份当前版本
backup_current() {
    print_header "备份当前版本"
    
    print_info "创建备份目录: $BACKUP_DIR"
    mkdir -p "../$BACKUP_DIR"
    
    # 备份重要文件
    print_info "备份配置和数据..."
    cp -r .env "../$BACKUP_DIR/" 2>/dev/null || print_warning ".env 文件不存在"
    cp -r database.sqlite "../$BACKUP_DIR/" 2>/dev/null || print_warning "database.sqlite 文件不存在"
    cp -r node_modules "../$BACKUP_DIR/" 2>/dev/null || print_info "跳过 node_modules"
    cp -r logs "../$BACKUP_DIR/" 2>/dev/null || print_info "跳过 logs"
    
    print_success "备份完成: ../$BACKUP_DIR"
}

# 下载最新版本
download_latest() {
    print_header "下载最新版本"
    
    # 清理旧的下载文件
    rm -f "$DOWNLOAD_FILE"
    rm -rf "$EXTRACT_DIR"
    
    print_info "正在下载最新版本..."
    
    if [ "$DOWNLOAD_TOOL" = "wget" ]; then
        wget -O "$DOWNLOAD_FILE" "$REPO_URL"
    else
        curl -L "$REPO_URL" -o "$DOWNLOAD_FILE"
    fi
    
    print_success "下载完成"
}

# 解压新版本
extract_latest() {
    print_header "解压新版本"
    
    print_info "正在解压..."
    unzip -q "$DOWNLOAD_FILE"
    
    print_success "解压完成"
    
    # 清理下载文件
    rm -f "$DOWNLOAD_FILE"
}

# 恢复配置和数据
restore_config() {
    print_header "恢复配置和数据"
    
    # 恢复 .env
    if [ -f "../$BACKUP_DIR/.env" ]; then
        print_info "恢复 .env 配置..."
        cp "../$BACKUP_DIR/.env" "$EXTRACT_DIR/"
        print_success ".env 已恢复"
    fi
    
    # 恢复数据库
    if [ -f "../$BACKUP_DIR/database.sqlite" ]; then
        print_info "恢复数据库..."
        cp "../$BACKUP_DIR/database.sqlite" "$EXTRACT_DIR/"
        print_success "数据库已恢复"
    fi
    
    # 恢复日志
    if [ -d "../$BACKUP_DIR/logs" ]; then
        print_info "恢复日志..."
        cp -r "../$BACKUP_DIR/logs" "$EXTRACT_DIR/"
        print_success "日志已恢复"
    fi
}

# 替换旧版本
replace_old() {
    print_header "替换旧版本"
    
    print_warning "即将替换当前版本"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "更新已取消"
        print_info "备份保存在: ../$BACKUP_DIR"
        exit 0
    fi
    
    # 删除当前目录内容（保留隐藏文件）
    print_info "清理当前目录..."
    find . -mindepth 1 -maxdepth 1 ! -name '.*' -exec rm -rf {} +
    
    # 移动新版本文件
    print_info "安装新版本..."
    mv "$EXTRACT_DIR"/* .
    mv "$EXTRACT_DIR"/.* . 2>/dev/null || true
    rmdir "$EXTRACT_DIR"
    
    print_success "新版本已安装"
}

# 运行部署脚本
run_deploy_script() {
    print_header "运行部署脚本"
    
    if [ ! -f "deploy.sh" ]; then
        print_error "未找到 deploy.sh 脚本"
        exit 1
    fi
    
    chmod +x deploy.sh
    
    print_info "开始执行部署..."
    echo ""
    
    ./deploy.sh
}

# 清理备份
cleanup_backup() {
    print_header "清理备份"
    
    read -p "是否删除备份？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "../$BACKUP_DIR"
        print_success "备份已删除"
    else
        print_info "备份保存在: ../$BACKUP_DIR"
    fi
}

# 显示更新信息
show_update_info() {
    print_header "更新完成"
    
    print_success "Trading Custody System 已成功更新到最新版本！"
    echo ""
    print_info "更新内容："
    echo "  - 代码已更新到最新版本"
    echo "  - 配置文件已保留"
    echo "  - 数据库已保留"
    if [ "$HAS_PM2" = true ]; then
        echo "  - 服务已自动重启"
    fi
    echo ""
    print_info "查看服务状态："
    echo "  pm2 status"
    echo "  pm2 logs"
}

# 主函数
main() {
    clear
    print_header "Trading Custody System - 快速更新"
    
    print_warning "此脚本将更新系统到最新版本"
    print_info "更新过程中会自动备份当前版本"
    echo ""
    
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "更新已取消"
        exit 0
    fi
    
    # 执行更新步骤
    check_project_dir
    check_download_tool
    check_pm2
    stop_services
    backup_current
    download_latest
    extract_latest
    restore_config
    replace_old
    
    # 调用主部署脚本完成实际部署
    run_deploy_script
    
    cleanup_backup
    show_update_info
    
    echo ""
    print_success "更新完成！"
}

# 运行主函数
main
