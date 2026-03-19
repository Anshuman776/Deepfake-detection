function sniffUrlMediaType(url) {
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)$/.test(clean)) return "image";
  if (/\.(mp4|mov|webm|avi|mkv|m4v|ogv)$/.test(clean))       return "video";
  if (/\.(mp3|wav|ogg|aac|flac|m4a|opus)$/.test(clean))      return "audio";
  if (/\/(photo|image|img|media|picture|pic)\//i.test(url))   return "image";
  if (/\/(video|reel|watch|clip|shorts)\//i.test(url))        return "video";
  if (/\/(audio|track|sound|music|podcast)\//i.test(url))     return "audio";
  if (/(pbs\.twimg\.com|imgur\.com|i\.redd\.it|cdn\.discordapp\.com|images\.|img\.|photos\.)/.test(url)) return "image";
  if (/(youtube\.com\/watch|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv\/videos)/.test(url))        return "video";
  if (/(soundcloud\.com|spotify\.com\/track|open\.spotify|audio\.|podcast\.)/.test(url))                 return "audio";
  return null;
}


function seededRand(seed, idx) {
  const x = Math.sin(seed * 9301 + idx * 49297 + 233720) * 1e9;
  return x - Math.floor(x);
}

// Probability value for a given point — defined outside component so waveBars useMemo can call it
function generateProb(sc, idx, total) {
  const base  = seededRand(sc, idx + 100);
  const trend = (sc / 100) * 60;
  const wave  = Math.sin((idx / total) * Math.PI * 3) * 15;
  const spike = idx === Math.floor(total * 0.38) ? 25 : 0;
  return Math.min(99, Math.max(8, trend + base * 25 + wave + spike));
}


export { sniffUrlMediaType, seededRand, generateProb };
