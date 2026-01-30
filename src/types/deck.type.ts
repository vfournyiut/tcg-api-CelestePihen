import { Request } from 'express'

export type DeckRequestBody = {
    name: string;
    cards: number[];
};

export interface DeckRequest extends Request<{}, any, DeckRequestBody> {
}

export type DeckRequestParam = {
    id: string;
}

export type DeckPatchRequestBody = {
    name: string;
    cards: number[];
}

export interface DeckPatchRequest extends Request<DeckRequestParam, any, DeckPatchRequestBody> {
}