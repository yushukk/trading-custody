#!/bin/bash

# ==========================================
# Trading Custody System - PM2 卸载脚本
# ==========================================
# 使用方法：
#   chmod +x uninstall.sh
#   ./uninstall.sh
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

# 确认卸载
confirm_uninstall() {
    print_header "Trading Custody System - 卸载确认"
    
    print_warning "⚠️  警告：此操作将："
    echo "  1. 停止并删除所有 PM2 服务"
    echo "  2. 删除 PM2 保存的配置"
    echo "  3. 可选：删除数据库和日志文件"
    echo "  4. 可选：删除项目文件"
    echo ""
    
    read -p "确定要卸载吗？(yes/no) " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "卸载已取消"
        exit 0
    fi
}

# 检查 PM2
check_pm2() {
    print_header "检查 PM2"
    
    if ! command_exists pm2; then
        print_warning "PM2 未安装，跳过服务停止步骤"
        return 1
    fi
    
    print_success "PM2 已安装"
    return 0
}

# 显示当前服务状态
show_current_status() {
    print_header "当前服务状态"
    
    if command_exists pm2; then
        pm2 list
    else
        print_info "PM2 未安装，无服务运行"
    fi
}

# 停止服务
stop_services() {
    print_header "停止服务"
    
    if ! command_exists pm2; then
        print_info "PM2 未安装，跳过"
        return
    fi
    
    # 检查是否有 trading-custody 相关服务
    if pm2 list | grep -q "trading-custody"; then
        print_info "停止后端服务..."
        pm2 delete trading-custody-backend 2>/dev/null || print_warning "后端服务未运行"
        
        print_info "停止前端服务..."
        pm2 delete trading-custody-frontend 2>/dev/null || print_warning "前端服务未运行"
        
        print_success "服务已停止"
    else
        print_info "没有发现运行中的 trading-custody 服务"
    fi
}

# 删除 PM2 配置
remove_pm2_config() {
    print_header "删除 PM2 配置"
    
    if ! command_exists pm2; then
        print_info "PM2 未安装，跳过"
        return
    fi
    
    print_info "删除 PM2 保存的配置..."
    pm2 save --force 2>/dev/null || true
    
    print_success "PM2 配置已清理"
}

# 删除开机自启
remove_startup() {
    print_header "删除开机自启"
    
    if ! command_exists pm2; then
        print_info "PM2 未安装，跳过"
        return
    fi
    
    echo ""
    read -p "是否删除 PM2 开机自启配置？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "删除开机自启配置..."
        pm2 unstartup 2>/dev/null || print_warning "未找到开机自启配置"
        print_success "开机自启配置已删除"
    else
        print_info "保留开机自启配置"
    fi
}

# 删除数据和日志
remove_data() {
    print_header "删除数据和日志"
    
    echo ""
    read -p "是否删除数据库和日志文件？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "正在删除数据和日志..."
        
        # 删除数据库
        if [ -f "server/data/database.db" ]; then
            rm -f server/data/database.db
            print_info "已删除数据库文件"
        fi
        
        # 删除日志
        if [ -d "logs" ]; then
            rm -rf logs
            print_info "已删除日志目录"
        fi
        
        # 删除 PM2 日志
        if [ -d "$HOME/.pm2/logs" ]; then
            rm -f "$HOME/.pm2/logs/trading-custody-*"
            print_info "已删除 PM2 日志"
        fi
        
        print_success "数据和日志已删除"
    else
        print_info "保留数据和日志文件"
    fi
}

# 删除项目文件
remove_project() {
    print_header "删除项目文件"
    
    echo ""
    read -p "是否删除整个项目目录？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "⚠️  最后确认：这将删除整个项目目录！"
        read -p "确定要删除吗？(yes/no) " -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            PROJECT_DIR=$(pwd)
            print_info "项目目录: $PROJECT_DIR"
            
            cd ..
            rm -rf "$PROJECT_DIR"
            
            print_success "项目目录已删除"
            echo ""
            print_info "卸载完成！感谢使用 Trading Custody System"
            exit 0
        else
            print_info "保留项目目录"
        fi
    else
        print_info "保留项目文件"
    fi
}

# 卸载 PM2（可选）
uninstall_pm2() {
    print_header "卸载 PM2"
    
    if ! command_exists pm2; then
        print_info "PM2 未安装，跳过"
        return
    fi
    
    echo ""
    read -p "是否卸载 PM2？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "正在卸载 PM2..."
        npm uninstall -g pm2
        print_success "PM2 已卸载"
    else
        print_info "保留 PM2"
    fi
}

# 显示卸载摘要
show_summary() {
    print_header "卸载摘要"
    
    print_success "卸载完成！"
    echo ""
    print_info "已执行的操作："
    echo "  ✓ 停止所有 trading-custody 服务"
    echo "  ✓ 删除 PM2 配置"
    echo ""
    
    if [ -d "server/data" ] || [ -d "logs" ]; then
        print_info "保留的文件："
        [ -d "server/data" ] && echo "  • 数据库文件: server/data/"
        [ -d "logs" ] && echo "  • 日志文件: logs/"
        echo ""
    fi
    
    print_info "如需完全清理，请手动删除："
    echo "  • 项目目录: $(pwd)"
    echo "  • PM2 配置: ~/.pm2/"
    echo ""
    
    print_info "感谢使用 Trading Custody System！"
}

# 主函数
main() {
    clear
    
    # 确认卸载
    confirm_uninstall
    
    # 显示当前状态
    show_current_status
    
    # 检查 PM2
    check_pm2
    PM2_INSTALLED=$?
    
    # 停止服务
    stop_services
    
    # 删除 PM2 配置
    remove_pm2_config
    
    # 删除开机自启
    remove_startup
    
    # 删除数据和日志
    remove_data
    
    # 删除项目文件
    remove_project
    
    # 卸载 PM2（可选）
    if [ $PM2_INSTALLED -eq 0 ]; then
        uninstall_pm2
    fi
    
    # 显示摘要
    show_summary
}

# 运行主函数
main
