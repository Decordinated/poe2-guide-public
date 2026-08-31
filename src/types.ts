export interface GuideVideo {
  id: string
  channel: string
  title: string
  uploadDate: string
  durationSeconds: number | null
  url: string
  pobUrl: string | null
  patch: string | null
  series: string | null
  summary: string
  tips: string
  craft: string
  contentType: string
}

export interface GuideData {
  generatedAt: string
  channelCount: number
  videoCount: number
  videos: GuideVideo[]
}
