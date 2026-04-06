#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node &> /dev/null; then
  echo "Node.jsがインストールされていません"
  open https://nodejs.org/ja/
  exit 1
fi
# ポート3003が使用中なら停止する
lsof -ti:3003 | xargs kill -9 2>/dev/null
sleep 1
open http://localhost:3003
node server.js
