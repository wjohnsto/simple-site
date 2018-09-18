declare namespace Express {
    export interface Request {
        context: {
            [key: string]: any;
            head?: {
                [key: string]: any;
                title?: string;
                meta?: {
                    [key: string]: any;
                    description?: string;
                    baseUrl?: string;
                    breadcrumbs?: Array<{
                        url: string;
                        index: number;
                        name: string;
                    }>;
                    canonical?: string;
                    images?: Array<models.IMediaType>;
                    videos?: Array<models.IMediaType>;
                };
            };
            main?: any;
        };
    }
}

declare namespace models {
    export interface IMediaType {
        url: string;
        type?: string;
        width?: number;
        height?: number;
    }
}

declare module 'front-matter';
