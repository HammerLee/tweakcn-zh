/**
 * 离线版里所有"给别人看的链接"都必须指向本机实例，不能写死 tweakcn.com。
 * 客户端用当前 origin；服务端回落到 BASE_URL。
 */
export function getAppOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.BASE_URL ?? "http://localhost:3000";
}
