declare module 'pdf-parse' {
    function pdf(dataBuffer: Buffer, options?: {
        max?: number;
        pagerender?: any;
        version?: string;
    }): Promise<{
        text: string;
        numpages: number;
        info: any;
    }>;
    
    export default pdf;
} 