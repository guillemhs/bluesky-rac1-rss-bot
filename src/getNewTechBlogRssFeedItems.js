"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewTechBlogRssFeedItems = void 0;
const rss_parser_1 = __importDefault(require("rss-parser"));
function getNewTechBlogRssFeedItems(lastPostedBlogUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const rssParser = new rss_parser_1.default();
        const feed = yield rssParser.parseURL('https://yamadashy.github.io/tech-blog-rss-feed/feeds/rss.xml');
        let newTechBlogRssFeedItems = [];
        for (const item of feed.items) {
            if (item.link !== undefined && item.pubDate !== undefined) {
                // Blueskyに投稿済みのブログ記事まで処理が進んだら、その時点で処理を終了する。
                if (item.link === lastPostedBlogUrl) {
                    break;
                }
                else {
                    newTechBlogRssFeedItems.push({
                        title: item.title || "",
                        url: item.link,
                        pubDate: new Date(item.pubDate)
                    });
                }
            }
        }
        return newTechBlogRssFeedItems;
    });
}
exports.getNewTechBlogRssFeedItems = getNewTechBlogRssFeedItems;
