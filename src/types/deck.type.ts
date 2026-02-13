import { Request } from 'express'

export type DeckRequestBody = {
  name: string
  cards: number[]
}

export interface DeckRequest extends Request<
  unknown,
  unknown,
  DeckRequestBody
> {}

export type DeckRequestParam = {
  id: string
}

export type DeckPatchRequestBody = {
  name: string
  cards: number[]
}

export interface DeckPatchRequest extends Request<
  DeckRequestParam,
  unknown,
  DeckPatchRequestBody
> {}
