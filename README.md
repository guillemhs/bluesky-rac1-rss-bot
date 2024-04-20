![Node.js - Static Badge](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript - Static Badge](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

# Bluesky RSS Bot 🦋

## RSS Feed

#### 企業テックブログRSS

* Bluesky: https://bsky.app/profile/tech-blog-rss-feed.bsky.social
* Site: https://yamadashy.github.io/tech-blog-rss-feed/
* RSS: https://yamadashy.github.io/tech-blog-rss-feed/feeds/rss.xml

#### ログミーTech RSS

* Bluesky: https://bsky.app/profile/logmi-tech.bsky.social
* Site: https://logmi.jp/tech
* RSS: https://logmi.jp/feed/public-tech.xml

## Set Up

Install TypeScript and Node.

```
npm i -g typescript
npm i -g ts-node
```

Install the dependencies.

```
npm ci
```

Copy the `example.env` file to `.env`.

```
cp example.env .env
```

Fill in `.env` with RSS feed url and your Bluesky username and password.

## Running the script 

You can run the script locally: 

```
npx ts-node src/index.ts
```
## License

MIT License. See [LICENSE](./LICENSE) for details.

