import type { Identifier, ISODateString } from './common'

export interface RagCitation {
  id: Identifier
  label: string
  resourceUri: string
  score: number
}

export interface RagMessage {
  id: Identifier
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: ISODateString
  citations?: RagCitation[]
}

export interface RagSession {
  id: Identifier
  repositoryId: Identifier
  title: string
  createdAt: ISODateString
  updatedAt: ISODateString
  participants: Identifier[]
  messages: RagMessage[]
}
