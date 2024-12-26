import { Request, Response } from 'express';
import axios from 'axios';

class LocationController {
    async getRegions(req: Request, res: Response): Promise<void> {
        try {
            const result = await axios.get('https://gateway.chotot.com/v2/public/chapy-pro/regions');

            res.status(200).json(result.data);
        } catch {
            res.status(500);
        }
    }
    async getWards(req: Request, res: Response): Promise<void> {
        try{
            const wardId = req.query.area;
            const result = await axios.get(`https://gateway.chotot.com/v2/public/chapy-pro/wards?area=${wardId}`)

            res.status(200).json(result.data);
        } catch {
            res.status(500);
        }
    }
}

export default new LocationController();
