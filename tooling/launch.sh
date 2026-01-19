#!/usr/bin/env bash
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
fi

npm run dev
