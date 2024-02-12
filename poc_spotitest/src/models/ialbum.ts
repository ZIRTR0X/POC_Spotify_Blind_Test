import { type IImage } from "./iimage";

export interface IAlbum {
    id: string;
    name: string;
    type: string;
    uri: string;
    images: IImage[];
}