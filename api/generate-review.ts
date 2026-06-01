import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: Request, res: Response) {
  try {
    const { title, prdtYear, genres, directors, actors, comment } = req.body;

    if (!title || !comment) {
      return res.status(400).json({ error: "영화 제목과 감상평은 필수 입력 항목입니다." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key가 구성되지 않았습니다. 관리자 호스트에게 문의하세요." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `영화 제목: ${title} ${prdtYear ? `(${prdtYear}년 제작)` : ""}
장르: ${genres || "알 수 없음"}
감독: ${directors || "알 수 없음"}
배우: ${actors || "알 수 없음"}
관객이 작성한 한 줄 감상평: "${comment}"

위 정보를 바탕으로, 해당 영화 정보와 관객의 직관적인 감상평을 아주 고급스럽고 구조화된 영화 평론가의 평론 겸 리뷰 글로 변환해 주세요. 
절대로 관객의 의견을 임의로 왜곡하지 말고, 그 감정선(재미있었다면 어떤 예술적 장점 때문인지, 비판적이었다면 어떤 구체적 아쉬움 때문인지 등)을 영화적인 어휘를 사용해서 프로페셔널하게 명예롭게 펼쳐보여 주세요.
반드시 아래의 정해진 형식에 맞춰 JSON 형태로 응답해 주세요.`;

    let response;
    try {
      console.log("Attempting to generate review using gemini-3.5-flash...");
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { 
                type: Type.STRING, 
                description: "영화에 대한 핵심적이고 시적인 은유가 빛나는 한 줄 헤드라인 카피" 
              },
              rating: { 
                type: Type.NUMBER, 
                description: "관객의 감상평 톤을 기반으로 추측한 평점 (10점 만점, 소수점 첫째 자리까지 예: 8.5)" 
              },
              detailedReview: { 
                type: Type.STRING, 
                description: "3~4개 단락으로 상세하고 격식 있게 쓰인 풍부한 감평 텍스트 (한국어)" 
              },
              keywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "영화와 리뷰를 대변하는 멋진 한글 키워드/태그 3개" 
              }
            },
            required: ["headline", "rating", "detailedReview", "keywords"],
          },
        },
      });
    } catch (geminiError: any) {
      console.warn("gemini-3.5-flash failed (possibly high demand/503). Retrying with gemini-3.1-flash-lite. Error details:", geminiError.message || geminiError);
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { 
                  type: Type.STRING, 
                  description: "영화에 대한 핵심적이고 시적인 은유가 빛나는 한 줄 헤드라인 카피" 
                },
                rating: { 
                  type: Type.NUMBER, 
                  description: "관객의 감상평 톤을 기반으로 추측한 평점 (10점 만점, 소수점 첫째 자리까지 예: 8.5)" 
                },
                detailedReview: { 
                  type: Type.STRING, 
                  description: "3~4개 단락으로 상세하고 격식 있게 쓰인 풍부한 감평 텍스트 (한국어)" 
                },
                keywords: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "영화와 리뷰를 대변하는 멋진 한글 키워드/태그 3개" 
                }
              },
              required: ["headline", "rating", "detailedReview", "keywords"],
            },
          },
        });
      } catch (liteError: any) {
        console.error("Both gemini-3.5-flash and gemini-3.1-flash-lite failed:", liteError);
        const is503 = (liteError.message && liteError.message.includes("503")) || 
                      (liteError.message && liteError.message.includes("high demand")) ||
                      (geminiError.message && geminiError.message.includes("503")) ||
                      (geminiError.message && geminiError.message.includes("high demand"));
        
        if (is503) {
          return res.status(503).json({ 
            error: "현재 Gemini 서버 사용량이 일시적으로 폭주하고 있습니다. 잠시 후 감상평 작성 버튼을 다시 한번 눌러주시면 안정적으로 변환이 완료됩니다." 
          });
        }
        throw liteError;
      }
    }

    const rText = response.text;
    if (!rText) {
      throw new Error("Gemini 응답 생성 중 빈 텍스트가 반환되었습니다.");
    }

    return res.status(200).json(JSON.parse(rText.trim()));
  } catch (error: any) {
    console.error("Error generating review via Gemini in serverless handler:", error);
    return res.status(500).json({ error: error.message || "감상평 확장 변환에 실패했습니다." });
  }
}
