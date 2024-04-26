import ogs from "open-graph-scraper";
import sharp from "sharp";

type OpenGraph = {
  siteUrl: string;
  title: string;
  description: string;
  ogImageUrl: string;
  type: string;
  imageData: Uint8Array;
};

export async function getOpenGraphFromUrl(url: string): Promise<OpenGraph> {
  // open-graph-scraperでURLからOG情報を取得
  const { result } = await ogs({ url: url });
  
  // fetchで画像データを取得
  const res = await fetch(result.ogImage?.at(0)?.url || "");
  const buffer = await res.arrayBuffer();
  
  // 画像データが取得できなかった場合は、imageData を [] で返却
  if (buffer.byteLength === 0) {
    return {
      title: result.ogTitle || "",
      description: result.ogDescription || "",
      siteUrl: url,
      ogImageUrl: result.ogImage?.at(0)?.url || "",
      type: result.ogImage?.at(0)?.type || "",
      imageData: new Uint8Array([]),
    };
  }

  // sharpで800px二リサイズ
  const compressedImage = await sharp(buffer)
    .resize(800, null, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();
  return {
    siteUrl: url,
    title: result.ogTitle || "",
    description: result.ogDescription || "",
    ogImageUrl: result.ogImage?.at(0)?.url || "",
    type: result.ogImage?.at(0)?.type || "",
    imageData: new Uint8Array(compressedImage),
  };
}
