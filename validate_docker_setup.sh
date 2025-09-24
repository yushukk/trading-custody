#!/bin/bash
# Docker部署验证脚本

echo "验证Docker部署文件..."

# 检查必需的文件是否存在
files=("Dockerfile.backend" "Dockerfile.frontend" "docker-compose.yml" "nginx.conf" ".dockerignore")

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file 存在"
  else
    echo "✗ $file 不存在"
    exit 1
  fi
done

# 检查Dockerfile.backend
if grep -q "FROM node:16-alpine" Dockerfile.backend; then
  echo "✓ Dockerfile.backend 使用正确的基础镜像"
else
  echo "✗ Dockerfile.backend 基础镜像不正确"
fi

# 检查Dockerfile.frontend
if grep -q "FROM node:16-alpine AS builder" Dockerfile.frontend; then
  echo "✓ Dockerfile.frontend 使用多阶段构建"
else
  echo "✗ Dockerfile.frontend 多阶段构建配置不正确"
fi

# 检查docker-compose.yml
if grep -q "services:" docker-compose.yml; then
  echo "✓ docker-compose.yml 包含服务定义"
else
  echo "✗ docker-compose.yml 服务定义不正确"
fi

# 检查nginx.conf
if grep -q "proxy_pass http://backend:3001" nginx.conf; then
  echo "✓ nginx.conf 包含正确的反向代理配置"
else
  echo "✗ nginx.conf 反向代理配置不正确"
fi

echo "验证完成！"