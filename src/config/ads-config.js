export const AD_FREQUENCY = 8

/**
 * Inject marketplace ads into a listing feed.
 * Prefer Google AdSense when configured; otherwise use Firestore promo ads.
 * Call isAdSenseEnabled() from the GoogleAdSense module at render time if needed.
 */
export function injectAds(listings, ads = [], { useAdSense = false } = {}) {
  if (!useAdSense && !ads.length) {
    return listings.map((l) => ({ type: 'listing', data: l }))
  }
  const result = []
  let adIndex = 0
  listings.forEach((listing, i) => {
    result.push({ type: 'listing', data: listing })
    if ((i + 1) % AD_FREQUENCY === 0) {
      if (useAdSense) {
        result.push({ type: 'adsense', adIndex })
      } else {
        result.push({ type: 'ad', data: ads[adIndex % ads.length], adIndex })
      }
      adIndex++
    }
  })
  return result
}
