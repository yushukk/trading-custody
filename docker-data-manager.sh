#!/bin/bash

# ==========================================
# Trading Custody System - Docker 数据管理脚本
# ==========================================
# 使用方法：
#   chmod +x docker-data-manager.sh
#   ./docker-data-manager.sh [命令]
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
VOLUME_NAME="trading_custody_backend-data"

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

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# 显示帮助信息
show_help() {
    cat << EOF
Trading Custody System - Docker 数据管理工具

使用方法：
  ./docker-data-manager.sh [命令]

可用命令：
  status          查看数据卷状态和大小
  backup          备份数据库到本地
  restore         从备份恢复数据库
  export          导出数据库文件到本地
  import          从本地导入数据库文件
  reset           重置数据库（清空所有数据）
  inspect         查看数据卷详细信息
  list-backups    列出所有备份文件
  help            显示此帮助信息

示例：
  ./docker-data-manager.sh status
  ./docker-data-manager.sh backup
  ./docker-data-manager.sh restore backups/database-20231221.db

EOF
}

# 检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
}

# 查看数据卷状态
show_status() {
    print_header "数据卷状态"
    
    # 检查 Volume 是否存在
    if docker volume inspect ${VOLUME_NAME} &> /dev/null; then
        print_success "数据卷存在: ${VOLUME_NAME}"
        
        # 获取 Volume 信息
        echo ""
        echo "数据卷详情："
        docker volume inspect ${VOLUME_NAME} | grep -E "Name|Mountpoint|CreatedAt" || true
        
        # 获取数据库文件大小
        echo ""
        echo "数据库文件："
        docker run --rm -v ${VOLUME_NAME}:/data alpine ls -lh /data/ 2>/dev/null || print_warning "无法读取数据卷内容"
        
        # 检查容器状态
        echo ""
        echo "相关容器："
        docker ps -a --filter volume=${VOLUME_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" || true
    else
        print_warning "数据卷不存在: ${VOLUME_NAME}"
        print_info "首次部署时会自动创建数据卷"
    fi
}

# 备份数据库
backup_database() {
    print_header "备份数据库"
    
    # 创建备份目录
    mkdir -p ${BACKUP_DIR}
    
    # 生成备份文件名
    BACKUP_FILE="${BACKUP_DIR}/database-$(date +%Y%m%d-%H%M%S).db"
    
    print_info "正在备份数据库..."
    
    # 从 Volume 复制数据库文件
    docker run --rm \
        -v ${VOLUME_NAME}:/data \
        -v $(pwd)/${BACKUP_DIR}:/backup \
        alpine cp /data/database.db /backup/$(basename ${BACKUP_FILE})
    
    if [ -f "${BACKUP_FILE}" ]; then
        BACKUP_SIZE=$(ls -lh ${BACKUP_FILE} | awk '{print $5}')
        print_success "备份完成: ${BACKUP_FILE} (${BACKUP_SIZE})"
    else
        print_error "备份失败"
        exit 1
    fi
}

# 恢复数据库
restore_database() {
    if [ -z "$1" ]; then
        print_error "请指定备份文件路径"
        print_info "用法: ./docker-data-manager.sh restore <备份文件路径>"
        print_info "示例: ./docker-data-manager.sh restore backups/database-20231221.db"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "${BACKUP_FILE}" ]; then
        print_error "备份文件不存在: ${BACKUP_FILE}"
        exit 1
    fi
    
    print_header "恢复数据库"
    
    print_warning "此操作将覆盖当前数据库！"
    read -p "确认恢复？(yes/no) " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "已取消恢复操作"
        exit 0
    fi
    
    # 停止服务
    print_info "停止服务..."
    docker-compose --env-file ${ENV_FILE} down 2>/dev/null || true
    
    # 恢复数据库
    print_info "正在恢复数据库..."
    docker run --rm \
        -v ${VOLUME_NAME}:/data \
        -v $(pwd)/$(dirname ${BACKUP_FILE}):/backup \
        alpine cp /backup/$(basename ${BACKUP_FILE}) /data/database.db
    
    print_success "数据库恢复完成"
    
    # 重启服务
    print_info "重启服务..."
    docker-compose --env-file ${ENV_FILE} up -d
    
    print_success "服务已重启"
}

# 导出数据库
export_database() {
    print_header "导出数据库"
    
    EXPORT_FILE="database-export-$(date +%Y%m%d-%H%M%S).db"
    
    print_info "正在导出数据库到当前目录..."
    
    docker run --rm \
        -v ${VOLUME_NAME}:/data \
        -v $(pwd):/export \
        alpine cp /data/database.db /export/${EXPORT_FILE}
    
    if [ -f "${EXPORT_FILE}" ]; then
        print_success "导出完成: ${EXPORT_FILE}"
    else
        print_error "导出失败"
        exit 1
    fi
}

# 导入数据库
import_database() {
    if [ -z "$1" ]; then
        print_error "请指定数据库文件路径"
        print_info "用法: ./docker-data-manager.sh import <数据库文件路径>"
        exit 1
    fi
    
    DB_FILE="$1"
    
    if [ ! -f "${DB_FILE}" ]; then
        print_error "数据库文件不存在: ${DB_FILE}"
        exit 1
    fi
    
    print_header "导入数据库"
    
    print_warning "此操作将覆盖当前数据库！"
    read -p "确认导入？(yes/no) " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "已取消导入操作"
        exit 0
    fi
    
    # 停止服务
    print_info "停止服务..."
    docker-compose --env-file ${ENV_FILE} down 2>/dev/null || true
    
    # 导入数据库
    print_info "正在导入数据库..."
    docker run --rm \
        -v ${VOLUME_NAME}:/data \
        -v $(pwd)/$(dirname ${DB_FILE}):/import \
        alpine cp /import/$(basename ${DB_FILE}) /data/database.db
    
    print_success "数据库导入完成"
    
    # 重启服务
    print_info "重启服务..."
    docker-compose --env-file ${ENV_FILE} up -d
    
    print_success "服务已重启"
}

# 重置数据库
reset_database() {
    print_header "重置数据库"
    
    print_error "警告：此操作将删除所有数据，且无法恢复！"
    read -p "确认重置数据库？请输入 'DELETE ALL DATA' 确认: " -r
    echo
    
    if [ "$REPLY" != "DELETE ALL DATA" ]; then
        print_info "已取消重置操作"
        exit 0
    fi
    
    # 停止服务
    print_info "停止服务..."
    docker-compose --env-file ${ENV_FILE} down 2>/dev/null || true
    
    # 删除数据库文件
    print_info "删除数据库文件..."
    docker run --rm \
        -v ${VOLUME_NAME}:/data \
        alpine rm -f /data/database.db /data/database.db-shm /data/database.db-wal
    
    print_success "数据库已重置"
    
    # 重启服务（会自动创建新数据库）
    print_info "重启服务..."
    docker-compose --env-file ${ENV_FILE} up -d
    
    print_success "服务已重启，数据库将重新初始化"
}

# 查看数据卷详细信息
inspect_volume() {
    print_header "数据卷详细信息"
    
    if docker volume inspect ${VOLUME_NAME} &> /dev/null; then
        docker volume inspect ${VOLUME_NAME}
    else
        print_warning "数据卷不存在: ${VOLUME_NAME}"
    fi
}

# 列出所有备份
list_backups() {
    print_header "备份文件列表"
    
    if [ -d "${BACKUP_DIR}" ] && [ "$(ls -A ${BACKUP_DIR})" ]; then
        echo "备份目录: ${BACKUP_DIR}"
        echo ""
        ls -lh ${BACKUP_DIR}/*.db 2>/dev/null | awk '{print $9, "("$5")", $6, $7, $8}' || print_info "没有找到备份文件"
    else
        print_info "没有找到备份文件"
        print_info "使用 './docker-data-manager.sh backup' 创建备份"
    fi
}

# 主函数
main() {
    check_docker
    
    case "${1:-help}" in
        status)
            show_status
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$2"
            ;;
        export)
            export_database
            ;;
        import)
            import_database "$2"
            ;;
        reset)
            reset_database
            ;;
        inspect)
            inspect_volume
            ;;
        list-backups)
            list_backups
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
