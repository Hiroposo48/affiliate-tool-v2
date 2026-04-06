#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node &> /dev/null; then
  echo "Node.jsがインストールされていません"
  open https://nodejs.org/ja/
  exit 1
fi
open http://localhost:3003
node server.js