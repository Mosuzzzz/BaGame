export function parseUrlOrEmbed(input: string): { url: string; embedCode: string | undefined } {
  const trimmed = input.trim();
  if (trimmed.startsWith('<iframe') && trimmed.endsWith('</iframe>')) {
    const srcMatch = trimmed.match(/src="([^"]+)"/);
    return {
      url: srcMatch ? srcMatch[1] : '',
      embedCode: trimmed,
    };
  }
  return {
    url: trimmed,
    embedCode: undefined,
  };
}
