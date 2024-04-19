import { CronJob } from 'cron';
import RssParser  from 'rss-parser';
import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { getOgImageInfoFromUrl } from "./getOgImageInfoFromUrl";

dotenv.config();

const agent = new BskyAgent({
    service: 'https://bsky.social',
})

async function postWithLinkCard(title: string, url: string) {  
    // ポストの本文を構築
    const richText = new RichText({ 
      text: `${title}\n\n${url}` 
    })
    await richText.detectFacets(agent);
  
    // リンクカードとしてポストに埋め込む情報を構築
    const ogInfo = await getOgImageInfoFromUrl(url);
    const uploadedImage = await agent.uploadBlob(ogInfo.imageData, {
      encoding: "image/jpeg",
    });
    const embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: ogInfo.siteUrl,
        thumb: {
          $type: "blob",
          ref: {
            $link: uploadedImage.data.blob.ref.toString(),
          },
          mimeType: uploadedImage.data.blob.mimeType,
          size: uploadedImage.data.blob.size,
        },
        title: ogInfo.title,
        description: ogInfo.description,
      },
    }
    
    // ポストを投稿
    await agent.post({
      text: richText.text,
      facets: richText.facets,
      embed: embed,
    });
    console.log("Just posted!")
}

type Entry = {
  title: string;
  url: string;
}

async function getLatestPostBlogUri(): Promise<string | null> {
  const timeline = await agent.getTimeline({
    limit: 1
  });
  if (!timeline.data?.feed) {
    console.log('No timeline data');
    return null;
  }
  const latestItem = timeline.data.feed[0]
  let latestPostBlogUri:string | null
  if (latestItem?.post?.embed?.external !== undefined && latestItem?.post?.embed?.external !== null) {
    if (typeof latestItem?.post?.embed?.external === 'object' && 'uri' in latestItem?.post?.embed?.external && typeof latestItem?.post?.embed?.external['uri'] === 'string') {
      console.log(latestItem?.post?.embed?.external['uri']);
      latestPostBlogUri = latestItem?.post?.embed?.external['uri']
    } else {
      latestPostBlogUri = null
    }
  } else {
    latestPostBlogUri = null
  }
  return latestPostBlogUri;
}

async function main() {
  // Blueskyのアカウントに接続
  await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
  const latestPostBlogUri = await getLatestPostBlogUri();
  if (latestPostBlogUri === null) return;

  const rssParser = new RssParser();
  const feed = await rssParser.parseURL('https://yamadashy.github.io/tech-blog-rss-feed/feeds/rss.xml');
  let new_entries: Array<Entry> = [];
  for (const item of feed.items) {
    if (item.link !== undefined) {
      if (item.link === latestPostBlogUri) {
        console.log(item.title);
        console.log(item.link);
        break;
      } else {
        new_entries.push({
          title: item.title || "",
          url: item.link,
        });
      }
    }
  }
  
  new_entries.forEach(entry => {
    postWithLinkCard(entry.title, entry.url)
  });

  //postWithLinkCard("カンバン方式でチーム開発を改善しました | ONE CAREER Tech Blog", "https://note.com/dev_onecareer/n/n556b04cfc5ee")
  
}

main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();
