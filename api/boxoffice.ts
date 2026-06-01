import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  try {
    const { date } = req.query;
    if (!date || typeof date !== "string" || !/^\d{8}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Expected YYYYMMDD." });
    }

    const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "f78fb3d817c3b7bcc6016d220ecf3af6";
    const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`KOBIS API responded with status: ${response.status}`);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching box office data in serverless handler:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch box office data" });
  }
}
