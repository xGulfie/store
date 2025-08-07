#!/bin/bash

./node_modules/.bin/pug -O src/products.json src/index.pug --out dist
cp src/*.css dist
cp src/img/* dist