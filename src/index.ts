import { CronJob } from 'cron';
import RssParser  from 'rss-parser';
import { postWithLinkCard } from "./postWithLinkCard";

async function main() {
  const rssParser = new RssParser();
  const feed = await rssParser.parseURL('https://yamadashy.github.io/tech-blog-rss-feed/feeds/rss.xml');

  feed.items.forEach(item => {
    console.log(item.title);
    console.log(item.link);
  });

  postWithLinkCard("カンバン方式でチーム開発を改善しました | ONE CAREER Tech Blog", "https://note.com/dev_onecareer/n/n556b04cfc5ee")
  
}

main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();
