import { type IAlbum } from "./ialbum";
import { type IArtist } from "./iartist";

export interface ITrack {
    id: string;
    href: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url?: string;
    track_number: number;
    type: string;
    uri: string;
    album: IAlbum[];
    artists: IArtist[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
        isrc: string;
    };
    external_urls: {
        spotify: string;
    };
}