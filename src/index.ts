import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { getOpenGraphFromUrl } from "./getOpenGraphFromUrl";
import { getNewRssFeedItems } from "./getNewRssFeedItems";

dotenv.config();

async function getLastPostedBlogUrl(agent: BskyAgent): Promise<string | null> {
  if (!process.env.BLUESKY_USERNAME) {
    console.error('[ERROR] BLUESKY_USERNAME is missing or undefined.');
    return null;
  }

  try {
    const authorFeed = await agent.getAuthorFeed({
      actor: process.env.BLUESKY_USERNAME!,
      limit: 1,
    });

    if (authorFeed.data?.feed.length === 0) {
      console.log('[INFO] No author feed data.');
      return null;
    }

    const latestItem = authorFeed.data.feed[0];

    let lastPostedBlogUrl: string | null = null;
    if (
      latestItem?.post?.embed?.external !== undefined &&
      latestItem?.post?.embed?.external !== null &&
      typeof latestItem?.post?.embed?.external === 'object' &&
      'uri' in latestItem?.post?.embed?.external &&
      typeof latestItem?.post?.embed?.external['uri'] === 'string'
    ) {
      lastPostedBlogUrl = latestItem?.post?.embed?.external['uri'];
    }
    return lastPostedBlogUrl;
  } catch (error) {
    console.error('[ERROR] Failed to fetch author feed.');
    console.error(error);
    return null;
  }
}

async function postWithLinkCard(agent: BskyAgent, title: string, url: string): Promise<void> {
  let embedExternal;

  try {
    const openGraph = await getOpenGraphFromUrl(url);
    if (openGraph.imageData.byteLength === 0) {
      embedExternal = {
        uri: url,
        title: openGraph.title,
        description: openGraph.description,
      };
    } else {
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
      };
    }
  } catch (error) {
    console.error(`[ERROR] Failed to retrieve OpenGraph data for ${url}.`);
    console.error(error);
    embedExternal = {
      uri: url,
      title: title,
      description: '',
    };
  }

  try {
    await agent.post({
      text: title,
      langs: ['ja'],
      embed: {
        $type: 'app.bsky.embed.external',
        external: embedExternal,
      },
    });
  } catch (error) {
    console.error('[ERROR] Failed to post to Bluesky.');
    console.error(error);
  }
}

async function main() {
  if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_PASSWORD || !process.env.RSS_FEED_URL) {
    console.error('[ERROR] Required environment variables are missing.');
    console.error('Ensure BLUESKY_USERNAME, BLUESKY_PASSWORD, and RSS_FEED_URL are defined in your .env file.');
    return;
  }

  console.log(`[INFO] RSS_FEED_URL: ${process.env.RSS_FEED_URL}`);

  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  try {
    await agent.login({
      identifier: process.env.BLUESKY_USERNAME!,
      password: process.env.BLUESKY_PASSWORD!,
    });
  } catch (error) {
    console.error('[ERROR] Failed to log in to Bluesky. Check your username and password.');
    console.error(error);
    return;
  }

  const lastPostedBlogUrl = await getLastPostedBlogUrl(agent);
  console.log(`[INFO] lastPostedBlogUrl: ${lastPostedBlogUrl}`);
  if (lastPostedBlogUrl === null) {
    console.error('[ERROR] Finished because last posted blog URL could not be retrieved.');
    return;
  }

  const newTechBlogRssFeedItems = await getNewRssFeedItems(process.env.RSS_FEED_URL, lastPostedBlogUrl);
  console.log(`[INFO] New RSS feed items count: ${newTechBlogRssFeedItems.length}`);
  if (newTechBlogRssFeedItems.length === 0) {
    console.log('[DONE] Finished because there are no new feeds.');
    return;
  }

  const limit = 5;
  let counter = 0;
  for (const item of newTechBlogRssFeedItems) {
    try {
      await postWithLinkCard(agent, item.title, item.url);
      console.log(`[DONE] Posted ${item.url}`);
    } catch (error) {
      console.log(`[ERROR] Failed to post. ${item.url}`);
      console.error(error);
    }
    counter += 1;
    if (counter >= limit) {
      console.log(`[DONE] Posted ${limit} items, so stopping.`);
      break;
    }
  }
  console.log("[DONE] Posting complete!");
}

main();