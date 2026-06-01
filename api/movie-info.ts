import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  try {
    const { movieCd } = req.query;
    if (!movieCd || typeof movieCd !== "string") {
      return res.status(400).json({ error: "movieCd is required." });
    }

    const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "f78fb3d817c3b7bcc6016d220ecf3af6";
    const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`KOBIS API responded with status: ${response.status}`);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching movie info in serverless handler:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch movie info" });
  }
}
