![Node.js - Static Badge](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript - Static Badge](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)


# 企業テックブログRSS（Bluesky Bot 🦋）

https://bsky.app/profile/tech-blog-rss-feed.bsky.social

## RSS

https://yamadashy.github.io/tech-blog-rss-feed/feeds/rss.xml

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

Fill in `.env` with your Bluesky username and password.

## Running the script 

You can run the script locally: 

```
npx ts-node src/index.ts
```
## License

MIT License. See [LICENSE](./LICENSE) for details.

