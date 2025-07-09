export const getProviderFavicon = (provider: string): string => {
  const faviconMap: Record<string, string> = {
    openai: "https://www.openai.com/favicon.ico",
    anthropic: "https://www.anthropic.com/favicon.ico",
    google: "https://www.google.com/favicon.ico",
    meta: "https://www.meta.com/favicon.ico",
    microsoft: "https://www.microsoft.com/favicon.ico",
    cohere: "https://www.cohere.com/favicon.ico",
    mistral: "https://www.mistral.ai/favicon.ico",
  };

  return (
    faviconMap[provider.toLowerCase()] || "https://www.google.com/favicon.ico"
  );
};

export const getProviderDisplayName = (provider: string): string => {
  const displayNames: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    meta: "Meta",
    microsoft: "Microsoft",
    cohere: "Cohere",
    mistral: "Mistral",
  };

  return displayNames[provider.toLowerCase()] || provider;
};
