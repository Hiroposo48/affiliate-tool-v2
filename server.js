const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { fetchOgp } = require('./proxy');

const PORT = 3003;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const server = http.createServer(async (req, res) => {

  // GET / → index.html
  if (req.method === 'GET' && req.url === '/') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(500); res.end('index.html が見つかりません'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  // POST /search-rakuten → 楽天商品検索
  if (req.method === 'POST' && req.url === '/search-rakuten') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { keyword, appId } = JSON.parse(body);
        if (!keyword || !appId) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'キーワードとアプリIDが必要です' }));
          return;
        }
        const params = new URLSearchParams({
          applicationId: appId,
          keyword: keyword,
          hits: 6,
          imageFlag: 1,
          sort: 'standard',
        });
        const apiUrl = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?' + params.toString();
        const result = await new Promise((resolve, reject) => {
          https.get(apiUrl, (r) => {
            let data = '';
            r.on('data', (chunk) => (data += chunk));
            r.on('end', () => {
              try { resolve(JSON.parse(data)); }
              catch (e) { reject(new Error('楽天APIのレスポンスが不正です')); }
            });
          }).on('error', reject);
        });
        if (result.error) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: result.error_description || '楽天APIエラー' }));
          return;
        }
        const items = (result.Items || []).map(({ Item: i }) => ({
          title: i.itemName,
          price: i.itemPrice,
          image: i.mediumImageUrls[0]?.imageUrl || '',
          url: i.itemUrl,
          shop: i.shopName,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ items }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /fetch-ogp → OGP取得（Amazon用）
  if (req.method === 'POST' && req.url === '/fetch-ogp') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body);
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'URLを入力してください' }));
          return;
        }
        const ogp = await fetchOgp(url);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(ogp));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('サーバー起動中: http://localhost:' + PORT);
  console.log('ANTHROPIC_API_KEY: ' + (API_KEY ? '設定済み ✓' : '未設定 ✗'));
});
