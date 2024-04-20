import RssParser  from 'rss-parser';

type TechBlogRssFeedItem = {
  title: string;
  url: string;
  pubDate: Date;
}

export async function getNewTechBlogRssFeedItems(lastPostedBlogUrl: string): Promise<Array<TechBlogRssFeedItem>> {
  const rssParser = new RssParser();
  const feed = await rssParser.parseURL('https://yamadashy.github.io/tech-blog-rss-feed/feeds/rss.xml');
  let newTechBlogRssFeedItems: Array<TechBlogRssFeedItem> = [];
  for (const item of feed.items) {
    if (item.link !== undefined && item.pubDate !== undefined) {
      // Blueskyに投稿済みのブログ記事まで処理が進んだら、その時点で処理を終了する。
      if (item.link === lastPostedBlogUrl) {
        break;
      } else {   
        newTechBlogRssFeedItems.push({
          title: item.title || "",
          url: item.link,
          pubDate: new Date(item.pubDate)
        });
      }
    }
  }
  return newTechBlogRssFeedItems;
}