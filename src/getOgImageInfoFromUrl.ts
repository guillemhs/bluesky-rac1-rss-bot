import ogs from "open-graph-scraper";
import sharp from "sharp";

type OgInfo = {
  siteUrl: string;
  ogImageUrl: string;
  type: string;
  description: string;
  title: string;
  imageData: Uint8Array;
};

export async function getOgImageInfoFromUrl(url: string): Promise<OgInfo> {
  // open-graph-scraperでURLからOG情報を取得
  const { result } = await ogs({ url: url });
  
  // fetchで画像データを取得
  const res = await fetch(result.ogImage?.at(0)?.url || "");
  const buffer = await res.arrayBuffer();
  
  // sharpで800px二リサイズ
  const compressedImage = await sharp(buffer)
    .resize(800, null, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();
  
  return {
    siteUrl: url,
    ogImageUrl: result.ogImage?.at(0)?.url || "",
    type: result.ogImage?.at(0)?.type || "",
    description: result.ogDescription || "",
    title: result.ogTitle || "",
    imageData: new Uint8Array(compressedImage),
  };
}
