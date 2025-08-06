#!/bin/bash

./node_modules/.bin/pug -O src/products.json src/shop.pug
mv shop.html dist