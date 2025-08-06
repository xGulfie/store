import puppeteer from 'puppeteer';
import fs from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process';
import assert from 'node:assert'

// Or import puppeteer from 'puppeteer-core';

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({headless:false});

async function getRbDesigns(browser, url){
        
    const page = await browser.newPage();

    // Navigate the page to a URL.
    await page.goto(url);

    // Set screen size.
    await page.setViewport({width: 1080, height: 1024});
    await page.waitForSelector('a') // wait for them to show up lol

    const productLinks = await page.evaluate(`
        Array.from(document.querySelectorAll('a')).map(a=>a.getAttribute('href')).filter(a=>a.indexOf('/shop/ap/') > -1)
    `)

    const rbDesigns=[]
    for (var i = 0; i < productLinks.length; i++){
        await page.goto(productLinks[i])
        rbDesigns.push({
            url: productLinks[i],
            site: 'RedBubble',
            price:'varies by product',
            title: await page.evaluate(`document.querySelector('h1').textContent`),
            description: await page.evaluate(`document.querySelector('h1~div>div').textContent`),
            imageUrl: await page.evaluate(`document.querySelector('main div>div>div>div>div>div>img').src`),
            items: await page.evaluate(`Array.from(document.querySelectorAll('main a>div>div>div>div>span')).map(l=>l.textContent)`)
        });
    }
    return rbDesigns
}

async function getPrintfulDesigns(browser, url){
    
    const page = await browser.newPage();

    // Navigate the page to a URL.
    await page.goto(url);

    // Set screen size.
    await page.setViewport({width: 1080, height: 1024});

    await page.waitForSelector('a.flex') // wait for them to show up lol

    const productLinks = await page.evaluate(`
        Array.from(document.querySelectorAll('a.flex')).filter(a=>a.href.indexOf('product') > -1).map(a=>a.href)
    `)
    const productImages = await page.evaluate(`
        Array.from(document.querySelectorAll('img.object-contain')).map(img=>img.src)
    `)
    const productTitles = await page.evaluate(`
        Array.from(document.querySelectorAll('a.flex')).filter(a=>a.href.indexOf('product') > -1).map(a=>a.querySelector('span').textContent) 
    `)
    const prices = await page.evaluate(`
        Array.from(document.querySelectorAll('a.flex')).filter(a=>a.href.indexOf('product') > -1).map(a=>Array.from(a.querySelectorAll('span')).pop().textContent) 
    `)
    var products = []
    for (var i = 0; i < productLinks.length; i++){
        products.push({
            url: productLinks[i],
            site: "Printful",
            imageUrl: productImages[i],
            title:productTitles[i],
            items:[],
            price:prices[i],
            description:""
        })
    }

    if (products.length < 1){
        console.error('oh no did not get any printful stuff??')
        exit(1)
    }
    return products
}

async function getKofiProducts(browser, url){
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector('a.kfds-c-shop-item')

    return await page.evaluate(()=>{
        var links = Array.from(document.querySelectorAll('a.kfds-c-shop-item'));
        return links.map(a=>{
            return {
                url: a.href,
                site: "Ko-fi",
                imageUrl: a.querySelector('img').src,
                items:[],
                price:a.querySelectorAll('span')[0].textContent,
                title:a.querySelectorAll('span')[1].textContent,
                description:a.querySelectorAll('span')[2].textContent,
            }
        });
        }
    )

}

async function downloadImages(){
    const page = await browser.newPage()
    for (var i = 0; i < allProducts.length; i++){
        await downloadImage(page, allProducts[i].imageUrl, allProducts[i].localImageUrl)
    }
}
async function downloadImage(page, src, dst){
    const viewSource = await page.goto(src)
    const buffer = await viewSource.buffer()
    fs.writeFileSync(dst, buffer)
}

const printfulDesigns = await getPrintfulDesigns(browser, 'https://gulfie.printful.me')
const kofiProducts = await getKofiProducts(browser, 'https://ko-fi.com/gulfie/shop')
const rbDesigns = await getRbDesigns(browser, 'https://www.redbubble.com/people/gulfie/explore/');
assert.ok(printfulDesigns.legnth > 0)
assert.ok(kofiProducts.legnth > 0)
assert.ok(rbDesigns.legnth > 0)

const allProducts = [...printfulDesigns,...kofiProducts, ...rbDesigns];

// hydrate the allproducts
allProducts.forEach((p)=>{
    const newUrl = p.title.replace(/\W/g,'-')+path.parse(p.imageUrl).ext;
    console.log(newUrl)
    p.localImageUrl = path.posix.join('./img/', newUrl)
    if (p.price.toLowerCase().indexOf('from') > -1){
        p.price = p.price.replace(/[^$.0-9]/g,'')+'+';
    }
})

fs.writeFileSync('products.json',JSON.stringify({products:allProducts},null,2))

await downloadImages()
await browser.close();