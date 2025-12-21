#!/bin/bash

# ==========================================
# Trading Custody System - Docker 镜像发布脚本
# ==========================================
# 使用方法：
#   chmod +x docker-publish.sh
#   ./docker-publish.sh [版本号]
#   例如: ./docker-publish.sh v1.0.0
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置项
DOCKER_REGISTRY="docker.io"  # Docker Hub
DOCKER_USERNAME="yushu"  # Docker Hub 用户名
IMAGE_NAME_BACKEND="trading-custody-backend"  # 后端镜像名称
IMAGE_NAME_FRONTEND="trading-custody"  # 前端镜像名称

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

# 检查 Docker
check_docker() {
    print_header "检查 Docker 环境"
    
    if ! command_exists docker; then
        print_error "Docker 未安装！"
        exit 1
    fi
    
    print_success "Docker 版本: $(docker --version)"
}

# 获取版本号
get_version() {
    if [ -z "$1" ]; then
        print_warning "未指定版本号，使用默认版本: latest"
        VERSION="latest"
    else
        VERSION="$1"
    fi
    
    print_info "镜像版本: ${VERSION}"
}

# 检查配置
check_config() {
    print_header "检查配置"
    
    if [ "$DOCKER_USERNAME" == "your-dockerhub-username" ]; then
        print_error "请先修改脚本中的 DOCKER_USERNAME 配置！"
        print_info "编辑 docker-publish.sh，将 DOCKER_USERNAME 改为你的 Docker Hub 用户名"
        exit 1
    fi
    
    print_success "配置检查完成"
}

# Docker 登录
docker_login() {
    print_header "登录 Docker Registry"
    
    print_info "正在登录 ${DOCKER_REGISTRY}..."
    print_warning "请输入 Docker Hub 密码（或访问令牌）："
    
    if docker login ${DOCKER_REGISTRY} -u ${DOCKER_USERNAME}; then
        print_success "登录成功"
    else
        print_error "登录失败"
        exit 1
    fi
}

# 构建镜像
build_images() {
    print_header "构建 Docker 镜像"
    
    # 构建后端镜像
    print_info "构建后端镜像..."
    docker build -f Dockerfile.backend \
        -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:${VERSION} \
        -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:latest \
        .
    print_success "后端镜像构建完成"
    
    # 构建前端镜像
    print_info "构建前端镜像..."
    docker build -f Dockerfile.frontend \
        --build-arg REACT_APP_API_BASE_URL=http://localhost:3001 \
        -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:${VERSION} \
        -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:latest \
        .
    print_success "前端镜像构建完成"
}

# 推送镜像
push_images() {
    print_header "推送镜像到仓库"
    
    # 推送后端镜像
    print_info "推送后端镜像 (${VERSION})..."
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:${VERSION}
    
    print_info "推送后端镜像 (latest)..."
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:latest
    
    print_success "后端镜像推送完成"
    
    # 推送前端镜像
    print_info "推送前端镜像 (${VERSION})..."
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:${VERSION}
    
    print_info "推送前端镜像 (latest)..."
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:latest
    
    print_success "前端镜像推送完成"
}

# 显示镜像信息
show_image_info() {
    print_header "镜像发布完成"
    
    print_success "镜像已成功发布到 Docker Hub！"
    echo ""
    echo "镜像信息："
    echo "  后端镜像: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:${VERSION}"
    echo "  前端镜像: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:${VERSION}"
    echo ""
    echo "查看镜像："
    echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}"
    echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}"
    echo ""
    echo "拉取镜像命令："
    echo "  docker pull ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:${VERSION}"
    echo "  docker pull ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:${VERSION}"
    echo ""
    echo "部署命令："
    echo "  使用 docker-compose.simple.yml 进行部署"
    echo ""
}

# 清理本地镜像（可选）
cleanup_local() {
    print_header "清理本地镜像"
    
    read -p "是否清理本地构建的镜像？(y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "清理本地镜像..."
        docker rmi ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_BACKEND}:${VERSION} || true
        docker rmi ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME_FRONTEND}:${VERSION} || true
        print_success "清理完成"
    else
        print_info "跳过清理"
    fi
}

# 主函数
main() {
    clear
    print_header "Trading Custody System - Docker 镜像发布"
    
    # 获取版本号
    get_version "$1"
    
    # 执行发布步骤
    check_docker
    check_config
    build_images
    docker_login
    push_images
    show_image_info
    cleanup_local
    
    print_success "发布流程完成！"
}

# 运行主函数
main "$@"
