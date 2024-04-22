import RssParser  from 'rss-parser';

type TechBlogRssFeedItem = {
  title: string;
  url: string;
}

export async function getNewRssFeedItems(rssFeedUrl: string, lastPostedBlogUrl: string): Promise<Array<TechBlogRssFeedItem>> {
  const rssParser = new RssParser();
  const feed = await rssParser.parseURL(rssFeedUrl);

  // 新着記事を抽出する
  let newTechBlogRssFeedItems: Array<TechBlogRssFeedItem> = [];
  for (const item of feed.items) {
    if (item.link !== undefined) {
      // Blueskyに投稿済みのブログ記事まで処理が進んだら、その時点で処理を終了する。
      if (item.link === lastPostedBlogUrl) {
        break;
      } else {   
        newTechBlogRssFeedItems.push({
          title: item.title || "",
          url: item.link,
        });
      }
    }
  }

  // 新着記事を古い順にソートして返却
  return newTechBlogRssFeedItems.reverse();
}