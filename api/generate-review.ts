import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";

// High-quality fallback generator when the Gemini API key is missing or is the placeholder
function generateFallbackReview(
  title: string,
  prdtYear: string,
  genres: string,
  directors: string,
  actors: string,
  comment: string
) {
  let rating = 8.8;
  let sentimentTag = "감동과 전율";
  const commentLower = comment.toLowerCase();
  
  if (commentLower.includes("아쉽") || commentLower.includes("지루") || commentLower.includes("별로") || commentLower.includes("실망")) {
    rating = 6.5;
    sentimentTag = "차가운 비평의 시선";
  } else if (commentLower.includes("최고") || commentLower.includes("인생작") || commentLower.includes("명작") || commentLower.includes("대박") || commentLower.includes("강추")) {
    rating = 9.8;
    sentimentTag = "필연적 찬사";
  } else if (commentLower.includes("재미") || commentLower.includes("꿀잼") || commentLower.includes("유쾌")) {
    rating = 8.5;
    sentimentTag = "유쾌한 오락성";
  }

  const headlines = [
    `영화 본연의 미학적 도발, "${comment.length > 20 ? comment.substring(0, 18) + '...' : comment}"이 증명한 시네마의 깊이`,
    `어둠을 뚫고 솟아오른 은유의 목소리: 관객의 마음을 움직인 "${comment.length > 20 ? comment.substring(0, 18) + '...' : comment}"`,
    `스크린을 압도하는 강렬한 시선, 장르적 한계를 뛰어넘은 기념비적 성치`,
    `시간의 흐름 마저 잊게 만드는 연출, 가슴 깊이 남는 묵직한 잔상`
  ];
  const headline = headlines[title.length % headlines.length];

  const firstGenre = genres ? genres.split(',')[0].trim() : "시네마";
  const mainDirector = directors ? directors.split(',')[0].trim() : "감독";
  const mainActor = actors ? actors.slice(0, 30) : "배우들";

  const p1 = `영화 《${title}》은 ${mainDirector ? `${mainDirector} 감독의 노련하고 섬세한 시선 아래` : "수려하고 정교한 연출의 미학 아래"} 장르적 긴장감을 탁월하게 포착해 낸 수작입니다. ${prdtYear ? `${prdtYear}년 제작되어 ` : ""}${genres ? `장르적 카테고리가 보여줄 수 있는 ${genres} 특유의 매력` : "시네마가 전하는 본연의 순수 예술적 성격"}을 아주 균형 있고 우아하게 표현하며, 러닝타임 내내 밀도 고매한 호흡을 유지합니다.`;
  
  const p2 = `특히 관객이 남긴 직관적 평 평가, 즉 "${comment}"라는 성찰은 본 작이 성취한 궁극적인 감정선과 정확히 흐름을 함께 하고 있습니다. 은유의 밀도를 세련되게 담아내거나 날카로운 메시지를 건네는 일련의 과정에서, 관객이 직접 포착한 이 핵심적인 잔향은 작품이 추구하고자 했던 본질적 정체성을 완벽하게 확인시켜 줍니다.`;

  const p3 = `${mainActor ? `${mainActor}를 비롯한 출연진의 혼신을 다한 몰입감 높은 퍼포먼스` : "인물들 간의 밀도 높은 호흡과 명징하게 도려낸 연기 앙상블"}는 단순한 내러티브를 한 단계 격상시켜 가슴 벅찬 감정의 굴곡을 형성해 냅니다. 카메라 앵글의 정적이고 수려한 구성, 청각을 아득하게 파고드는 매혹적인 미장센은 관객으로 하여금 스크린을 벗어나서도 깊이 사고할 수밖에 없는 철학적 여운을 강렬하게 주입합니다.`;

  const p4 = `결론적으로 본작은 상업적인 전개와 고고한 작품성이라는 두 상반된 요소를 절묘한 균형감으로 결합하는 데 도달했습니다. "${comment}"라는 깊은 인상이 보여주듯, 스크린을 메운 찰나의 전율과 울림은 오랫동안 관람객들의 품속에서 숨쉬며 가치 있는 씨앗이자 또 하나의 웰메이드 필름으로 선명히 보존될 것입니다.`;

  const detailedReview = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;

  const keywords = [
    firstGenre,
    mainDirector || "영화추천",
    sentimentTag
  ].filter(Boolean).slice(0, 3);

  return {
    headline,
    rating,
    detailedReview,
    keywords
  };
}

export default async function handler(req: Request, res: Response) {
  try {
    const { title, prdtYear, genres, directors, actors, comment } = req.body;

    if (!title || !comment) {
      return res.status(400).json({ error: "영화 제목과 감상평은 필수 입력 항목입니다." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMockOrPlaceholderKey = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "";

    if (isMockOrPlaceholderKey) {
      console.log("Using high-quality fallback generator (No active Gemini API key or placeholder detected).");
      const review = generateFallbackReview(title, prdtYear || "", genres || "", directors || "", actors || "", comment);
      return res.status(200).json(review);
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
