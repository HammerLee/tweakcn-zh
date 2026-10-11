import useSWR from "swr";

/**
 * 离线：不再请求 api.github.com。
 * 调用方（home/figma 头部的 star 数）保留接口，数量恒为 0 且不触发网络。
 */
async function fetchGithubStars(_owner: string, _repo: string): Promise<number> {
  return 0;
}

export function useGithubStars(owner: string, repo: string) {
  const { data, isLoading, error } = useSWR([owner, repo], ([owner, repo]) =>
    fetchGithubStars(owner, repo)
  );

  return {
    stargazersCount: data ?? 0,
    isLoading,
    error: error as Error | null,
  };
}

