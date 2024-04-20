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
exports.getOpenGraphFromUrl = void 0;
const open_graph_scraper_1 = __importDefault(require("open-graph-scraper"));
const sharp_1 = __importDefault(require("sharp"));
function getOpenGraphFromUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        // open-graph-scraperでURLからOG情報を取得
        const { result } = yield (0, open_graph_scraper_1.default)({ url: url });
        // fetchで画像データを取得
        const res = yield fetch(((_b = (_a = result.ogImage) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.url) || "");
        const buffer = yield res.arrayBuffer();
        // sharpで800px二リサイズ
        const compressedImage = yield (0, sharp_1.default)(buffer)
            .resize(800, null, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
        return {
            siteUrl: url,
            ogImageUrl: ((_d = (_c = result.ogImage) === null || _c === void 0 ? void 0 : _c.at(0)) === null || _d === void 0 ? void 0 : _d.url) || "",
            type: ((_f = (_e = result.ogImage) === null || _e === void 0 ? void 0 : _e.at(0)) === null || _f === void 0 ? void 0 : _f.type) || "",
            description: result.ogDescription || "",
            title: result.ogTitle || "",
            imageData: new Uint8Array(compressedImage),
        };
    });
}
exports.getOpenGraphFromUrl = getOpenGraphFromUrl;
