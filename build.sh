#!/usr/bin/bash

rm -rf node_modules && rm package-lock.json
npm install

# npm start

rm -rf dist
npm run build
