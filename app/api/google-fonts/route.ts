import { LOCAL_FONT_INFOS } from "@/config/local-fonts";
import { type PaginatedFontsResponse } from "@/types/fonts";
import { type NextRequest, NextResponse } from "next/server";

/**
 * 字体搜索接口。离线：目录就是内置字体清单（config/local-fonts.ts），
 * 不再打 Google Fonts API，也不需要 GOOGLE_FONTS_API_KEY。
 */
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category")?.toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  let filteredFonts = LOCAL_FONT_INFOS;

  if (query) {
    filteredFonts = filteredFonts.filter((font) => font.family.toLowerCase().includes(query));
  }

  if (category && category !== "all") {
    filteredFonts = filteredFonts.filter((font) => font.category === category);
  }

  const response: PaginatedFontsResponse = {
    fonts: filteredFonts.slice(offset, offset + limit),
    total: filteredFonts.length,
    offset,
    limit,
    hasMore: offset + limit < filteredFonts.length,
  };

  return NextResponse.json(response);
}
