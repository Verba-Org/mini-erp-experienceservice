import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import * as https from 'https';
import { BrainClientSchema } from "./schema/brain.client.schema";

@Injectable()
export class BrainClientFacade {
    constructor(private httpService: HttpService
        , private configService: ConfigService
    ) {}

    async fetchBrainData(content: string) : Promise<BrainClientSchema> {
        try {

            const rejectUnauthorized = this.configService.get<boolean>(
                'REJECT_UNAUTHORIZED',
                true // Default to true (secure) in production
            );

            console.log('Reject Unauthorized SSL:', rejectUnauthorized);
            console.log('Content sent to Brain Client:', content);

            const httpsAgent = new https.Agent({
                rejectUnauthorized,
            });

            const response = await firstValueFrom(
                this.httpService.post(`http://localhost:8000/command/interpret`, 
                    { command: content , timestamp: Date.now().toString() }
                    , { httpsAgent }),
            );
            return response.data;
        } catch (error) {
            console.error('Failed to fetch brain data:', error);
            throw error;
        }
    }
}