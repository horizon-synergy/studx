import GoogleAdSense from './GoogleAdSense'
import AdBanner from './AdBanner'

export default function FeedAdSlot({ item }) {
  if (item?.type === 'adsense') return <GoogleAdSense />
  if (item?.type === 'ad') return <AdBanner ad={item.data} />
  return null
}
