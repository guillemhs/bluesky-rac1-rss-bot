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
  // ポストの本文を構築
  const richText = new RichText({ 
    text: `${title}\n\n${url}` 
  })
  await richText.detectFacets(agent);
  
  // リンクカードとしてポストに埋め込む情報を構築
  const openGraph = await getOpenGraphFromUrl(url);
  const uploadedImage = await agent.uploadBlob(openGraph.imageData, {
    encoding: "image/jpeg",
  });
  const embed = {
    $type: "app.bsky.embed.external",
    external: {
      uri: openGraph.siteUrl,
      thumb: {
        $type: "blob",
        ref: {
          $link: uploadedImage.data.blob.ref.toString(),
        },
        mimeType: uploadedImage.data.blob.mimeType,
        size: uploadedImage.data.blob.size,
      },
      title: openGraph.title,
      description: openGraph.description,
    },
  }
    
  // ポストを投稿
  await agent.post({
    text: richText.text,
    facets: richText.facets,
    embed: embed,
  });
}

async function main() {
  console.log(`[INFO] RSS_FEED_URL is ${process.env.RSS_FEED_URL}`)
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
  newTechBlogRssFeedItems.sort((a, b) => a.pubDate.getTime() - b.pubDate.getTime());

  if (newTechBlogRssFeedItems.length === 0) {
    console.log('[DONE] finished because there are no new feeds.')
    return;
  }

  // 新規のRSSフィードをBlueskyに投稿する
  for (const item of newTechBlogRssFeedItems) {
    await postWithLinkCard(agent, item.title, item.url)
    console.log(`[INFO] posted ${item.title}`)
  };
  console.log("[DONE] posted complete!")
}

main();
