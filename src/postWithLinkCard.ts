import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { getOgImageInfoFromUrl } from "./getOgImageInfoFromUrl";

dotenv.config();

const agent = new BskyAgent({
    service: 'https://bsky.social',
})

export async function postWithLinkCard(title: string, url: string) {
    // Blueskyのアカウントに接続
    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
  
    const timeline = await agent.getTimeline({
        limit: 1
    });
    if (!timeline.data?.feed) {
        console.log('No timeline data');
        return;
    }
    const latestItem = timeline.data.feed[0]
    let latestPostUri 
    if (latestItem?.post?.embed?.external !== undefined && latestItem?.post?.embed?.external !== null) {
        console.log(latestItem?.post?.embed?.external);
        if (typeof latestItem?.post?.embed?.external === 'object' && 'uri' in latestItem?.post?.embed?.external) {
          console.log(latestItem?.post?.embed?.external['uri']);
          latestPostUri = latestItem?.post?.embed?.external['uri']
        }
    }
    console.log(latestPostUri);


    // timeline.data.feed.forEach(item => {
    //     if (item?.post?.embed?.external !== undefined && item?.post?.embed?.external !== null) {
    //       console.log(item?.post?.embed?.external);
    //       if (typeof item?.post?.embed?.external === 'object' && 'uri' in item?.post?.embed?.external) {
    //         console.log(item?.post?.embed?.external['uri']);
    //       }
    //     }
    // });
    
    return;
    
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