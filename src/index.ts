import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { getOpenGraphFromUrl } from "./getOpenGraphFromUrl";
import { getNewRssFeedItems } from "./getNewRssFeedItems";

dotenv.config();

async function getLastPostedBlogUrl(agent: BskyAgent): Promise<string | null> {
  // 最新のポストを取得
  const authorFeed = await agent.getAuthorFeed({
    actor: process.env.BLUESKY_USERNAME!,
    limit: 1
  });
  if (authorFeed.data?.feed.length === 0) {
    console.log('[INFO] No author feed data.');
    return null;
  }
  const latestItem = authorFeed.data.feed[0]

  // 最新のポストで投稿しているブログ記事のURLを取得
  let lastPostedBlogUrl:string | null
  if (latestItem?.post?.embed?.external !== undefined && latestItem?.post?.embed?.external !== null) {
    if (typeof latestItem?.post?.embed?.external === 'object' && 'uri' in latestItem?.post?.embed?.external && typeof latestItem?.post?.embed?.external['uri'] === 'string') {
      lastPostedBlogUrl = latestItem?.post?.embed?.external['uri']
    } else {
      lastPostedBlogUrl = null
    }
  } else {
    lastPostedBlogUrl = null
  }
  return lastPostedBlogUrl;
}

async function postWithLinkCard(agent: BskyAgent, title: string, url: string): Promise<void> {  
  var embedExternal;
  // リンクカードとしてポストに埋め込む情報を構築
  try {
    const openGraph = await getOpenGraphFromUrl(url);
    if (openGraph.imageData.byteLength === 0) {
      // サムネイル画像なし
      embedExternal = {
        uri: url,
        title: openGraph.title,
        description: openGraph.description,
      }
    } else {
      // サムネイル画像あり
      const uploadedImage = await agent.uploadBlob(openGraph.imageData, {
        encoding: "image/jpeg",
      });
      embedExternal = {
        uri: url,
        title: openGraph.title,
        description: openGraph.description,
        thumb: {
          $type: "blob",
          ref: {
            $link: uploadedImage.data.blob.ref.toString(),
          },
          mimeType: uploadedImage.data.blob.mimeType,
          size: uploadedImage.data.blob.size,
        },
      }
    }
  } catch { 
    console.log(`[ERROR] OG情報の取得に失敗. ${url}`)
    embedExternal = {
      uri: url,
      title: title,
      description: '',
    }
  }

  // ポストを投稿
  await agent.post({
    text: title,
    embed: {
      $type: "app.bsky.embed.external",
      external: embedExternal,
    },
  });
}

async function main() {
  console.log(`[INFO] RSS_FEED_URL: ${process.env.RSS_FEED_URL}`)
  if (process.env.RSS_FEED_URL === undefined) {
    console.error('[ERROR] finished because RSS_FEED_URL is undefined')
    return;
  }

  // Blueskyのアカウントに接続
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  })
  await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})

  // 最後にBlueskyに投稿したブログ記事のURLを取得する
  const lastPostedBlogUrl = await getLastPostedBlogUrl(agent);
  console.log(`[INFO] lastPostedBlogUrl: ${lastPostedBlogUrl}`);
  if (lastPostedBlogUrl === null) {
    console.error('[ERROR] finished because last posted blog url could not be retrieved.')
    return;
  }

  // 新規のRSSフィードを取得する
  const newTechBlogRssFeedItems = await getNewRssFeedItems(process.env.RSS_FEED_URL, lastPostedBlogUrl)
  console.log(`[INFO] 新規RSSフィードの件数: ${newTechBlogRssFeedItems.length}`)
  if (newTechBlogRssFeedItems.length === 0) {
    console.log('[DONE] finished because there are no new feeds.')
    return;
  }

  // 新規のRSSフィードをBlueskyに投稿する
  var counter = 0
  for (const item of newTechBlogRssFeedItems) {
    try {
      await postWithLinkCard(agent, item.title, item.url)
      console.log(`[DONE] posted ${item.url}`)
    } catch {
      console.log(`[ERROR] ポストに失敗. ${item.url}`)
    }
    counter += 1
    if (counter >= 5) {
      console.log("[DONE] 5件ポストしたので終了")
      break;
    }
  };
  console.log("[DONE] posted complete!")
}

main();
