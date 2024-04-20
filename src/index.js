"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@atproto/api");
const dotenv = __importStar(require("dotenv"));
const process = __importStar(require("process"));
const getOpenGraphFromUrl_1 = require("./getOpenGraphFromUrl");
const getNewTechBlogRssFeedItems_1 = require("./getNewTechBlogRssFeedItems");
dotenv.config();
function getLastPostedBlogUrl(agent) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        // @tech-blog-rss-feed.bsky.social の最新のポストを取得
        const authorFeed = yield agent.getAuthorFeed({
            actor: process.env.BLUESKY_USERNAME,
            limit: 1
        });
        if (((_a = authorFeed.data) === null || _a === void 0 ? void 0 : _a.feed.length) === 0) {
            console.log('[INFO] No author feed data.');
            return null;
        }
        const latestItem = authorFeed.data.feed[0];
        // 最新のポストで投稿しているブログ記事のURLを取得
        let lastPostedBlogUrl;
        if (((_c = (_b = latestItem === null || latestItem === void 0 ? void 0 : latestItem.post) === null || _b === void 0 ? void 0 : _b.embed) === null || _c === void 0 ? void 0 : _c.external) !== undefined && ((_e = (_d = latestItem === null || latestItem === void 0 ? void 0 : latestItem.post) === null || _d === void 0 ? void 0 : _d.embed) === null || _e === void 0 ? void 0 : _e.external) !== null) {
            if (typeof ((_g = (_f = latestItem === null || latestItem === void 0 ? void 0 : latestItem.post) === null || _f === void 0 ? void 0 : _f.embed) === null || _g === void 0 ? void 0 : _g.external) === 'object' && 'uri' in ((_j = (_h = latestItem === null || latestItem === void 0 ? void 0 : latestItem.post) === null || _h === void 0 ? void 0 : _h.embed) === null || _j === void 0 ? void 0 : _j.external) && typeof ((_l = (_k = latestItem === null || latestItem === void 0 ? void 0 : latestItem.post) === null || _k === void 0 ? void 0 : _k.embed) === null || _l === void 0 ? void 0 : _l.external['uri']) === 'string') {
                lastPostedBlogUrl = (_o = (_m = latestItem === null || latestItem === void 0 ? void 0 : latestItem.post) === null || _m === void 0 ? void 0 : _m.embed) === null || _o === void 0 ? void 0 : _o.external['uri'];
            }
            else {
                lastPostedBlogUrl = null;
            }
        }
        else {
            lastPostedBlogUrl = null;
        }
        return lastPostedBlogUrl;
    });
}
function postWithLinkCard(agent, title, url) {
    return __awaiter(this, void 0, void 0, function* () {
        // ポストの本文を構築
        const richText = new api_1.RichText({
            text: `${title}\n\n${url}`
        });
        yield richText.detectFacets(agent);
        // リンクカードとしてポストに埋め込む情報を構築
        const openGraph = yield (0, getOpenGraphFromUrl_1.getOpenGraphFromUrl)(url);
        const uploadedImage = yield agent.uploadBlob(openGraph.imageData, {
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
        };
        // ポストを投稿
        yield agent.post({
            text: richText.text,
            facets: richText.facets,
            embed: embed,
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Blueskyのアカウントに接続
        const agent = new api_1.BskyAgent({
            service: 'https://bsky.social',
        });
        yield agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD });
        // 最後にBlueskyに投稿したブログ記事のURLを取得する
        const lastPostedBlogUrl = yield getLastPostedBlogUrl(agent);
        console.log(`[INFO] lastPostedBlogUrl: ${lastPostedBlogUrl}`);
        if (lastPostedBlogUrl === null) {
            console.log('[ERROR] finished because last posted blog url could not be retrieved.');
            return;
        }
        // 新規のRSSフィードを取得する
        const newTechBlogRssFeedItems = yield (0, getNewTechBlogRssFeedItems_1.getNewTechBlogRssFeedItems)(lastPostedBlogUrl);
        newTechBlogRssFeedItems.sort((a, b) => a.pubDate.getTime() - b.pubDate.getTime());
        if (newTechBlogRssFeedItems.length === 0) {
            console.log('[DONE] finished because there are no new feeds.');
            return;
        }
        // 新規のRSSフィードをBlueskyに投稿する
        for (const item of newTechBlogRssFeedItems) {
            yield postWithLinkCard(agent, item.title, item.url);
            console.log(`posted ${item.title}`);
        }
        ;
        console.log("[DONE] posted complete!");
    });
}
main();
