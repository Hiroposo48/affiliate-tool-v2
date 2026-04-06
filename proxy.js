const https = require('https');
const http = require('http');
const { StringDecoder } = require('string_decoder');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

function fetchOgp(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Connection': 'keep-alive',
      }
    };

    const req = protocol.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchOgp(res.headers.location).then(resolve).catch(reject);
      }

      // 文字コード判定
      const contentType = res.headers['content-type'] || '';
      const isEucJp = contentType.toLowerCase().includes('euc-jp');

      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
        const total = chunks.reduce((a, b) => a + b.length, 0);
        if (total > 200000) res.destroy();
      });
      res.on('close', () => {
        let html;
        if (isEucJp) {
          // EUC-JPをUTF-8に変換
          const buf = Buffer.concat(chunks);
          const iconv = require('./iconv_simple');
          html = iconv(buf);
        } else {
          html = Buffer.concat(chunks).toString('utf8');
        }

        // titleタグからも取得を試みる
        const ogTitle = (html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i) || [])[1];
        const ogImage = (html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i) || [])[1];
        const titleTag = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1];

        const title = ogTitle || titleTag || '';
        const image = ogImage || '';

        if (!title && !image) return reject(new Error('OGP情報が取得できませんでした'));
        resolve({ title: title.trim(), image: image.trim() });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('タイムアウト')); });
    req.end();
  });
}

module.exports = { fetchOgp };
