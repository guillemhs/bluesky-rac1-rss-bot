import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { getOgImageInfoFromUrl } from "./getOgImageInfoFromUrl";

dotenv.config();

export async function postWithLinkCard(title: string, url: string) {
    // Blueskyのアカウントに接続
    const agent = new BskyAgent({
      service: 'https://bsky.social',
    })
    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
  
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