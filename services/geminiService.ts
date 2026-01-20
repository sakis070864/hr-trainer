
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { InterviewQuestion, MasterclassData, CareerPathData, SalaryData, NetworkingData, SimulationReport } from "../types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
};

export const searchInterviewQuestions = async (
  jobTitle: string, 
  location: string, 
  limit: number = 20, 
  offset: number = 0,
  excludeList: string[] = []
): Promise<InterviewQuestion[]> => {
  const ai = getGeminiClient();
  
  // Create a string of existing questions to tell the AI what to avoid
  const exclusionString = excludeList.length > 0 
    ? `CRITICAL: DO NOT REPEAT OR REPHRASE THE FOLLOWING TOPICS/QUESTIONS ALREADY IN THE LIBRARY: \n- ${excludeList.join('\n- ')}`
    : '';

  const prompt = `ACT AS AN ELITE CAREER ARCHITECT 2026. 
  YOUR MISSION: SYNTHESIZE A COMPREHENSIVE LIBRARY OF ${limit} HIGH-IMPACT, UNIQUE REAL-WORLD INTERVIEW QUESTIONS FOR A ${jobTitle} IN ${location}.
  
  SEARCH GROUNDING PROTOCOL:
  1. Deep-scrape Reddit, Wall Street Oasis, Glassdoor, and LinkedIn for 2025-2026 leaks.
  2. Focus on "AI-Era" technical logic, localized economy quirks, and high-stakes decision making.
  
  ${exclusionString}
  
  UNIVERSE CONSTRAINT: Every question must be distinct in subject matter. If the existing list covers "AI Hallucinations", provide a question about "Synthetic Data Privacy" or "Model Drift in Finance" instead.
  
  OUTPUT SPECIFICATION: Return exactly one JSON array of ${limit} question objects. Format: JSON array of {id, question, category}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Technical', 'Behavioral', 'Case Study', 'Cultural'] }
            },
            required: ['id', 'question', 'category']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    if (error.status === 429 || (error.message && error.message.includes('RESOURCE_EXHAUSTED'))) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    throw error;
  }
};

export const getCareerPathIntelligence = async (jobTitle: string, location: string): Promise<CareerPathData> => {
  const ai = getGeminiClient();
  const prompt = `GENERATE A 5-YEAR STRATEGIC ROADMAP for a ${jobTitle} in ${location} for 2026-2031. Identify local industrial DNA, high-demand skills, and state-specific certifications.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.STRING },
                milestones: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['year', 'milestones']
            }
          },
          highDemandSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          localCerts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['roadmap', 'highDemandSkills', 'localCerts']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getSalaryIntelligence = async (jobTitle: string, location: string): Promise<SalaryData> => {
  const ai = getGeminiClient();
  const prompt = `EXTRACT 2026 SALARY BANDS for ${jobTitle} in ${location}. Use local job boards and cost-of-living data. Include Bonus, COL adjustments, and Equity/RSUs.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bands: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.STRING },
              median: { type: Type.STRING },
              max: { type: Type.STRING }
            },
            required: ['min', 'median', 'max']
          },
          bonusStructure: { type: Type.STRING },
          colAdjustment: { type: Type.STRING },
          equityInsights: { type: Type.STRING }
        },
        required: ['bands', 'bonusStructure', 'colAdjustment', 'equityInsights']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getNetworkingIntelligence = async (jobTitle: string, location: string): Promise<NetworkingData> => {
  const ai = getGeminiClient();
  const prompt = `MAP ELITE NETWORKING for ${jobTitle} in ${location} for 2026. Local hubs, meetup groups, invite-only conferences, and LinkedIn scripts.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hubs: { type: Type.ARRAY, items: { type: Type.STRING } },
          meetups: { type: Type.ARRAY, items: { type: Type.STRING } },
          conferences: { type: Type.ARRAY, items: { type: Type.STRING } },
          scripts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['platform', 'content']
            }
          }
        },
        required: ['hubs', 'meetups', 'conferences', 'scripts']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getMasterclassContent = async (question: string, jobTitle: string, location: string): Promise<MasterclassData> => {
  const ai = getGeminiClient();
  const prompt = `ACT AS AN ELITE EXECUTIVE COACH. 
  Provide a high-authority, multi-layered Masterclass breakdown for the interview question: "${question}" (Role: ${jobTitle}, Location: ${location}).
  
  GUIDELINES:
  1. 'coreConcept': This must be a sophisticated, multi-sentence strategic framework (2-3 sentences). Do not provide a short phrase. Explain the high-level philosophy of the "Winning Answer".
  2. 'why': Detail the specific psychological and business rationale the hiring committee is testing.
  3. 'technicalPoints': Provide deep-tier, localized implementation details or high-impact keywords.
  4. 'insiderTip': Provide an "Executive Leak" or a tactic used by top 1% candidates.
  5. 'redFlags': List 3-4 subtle failures that get candidates rejected instantly.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          coreConcept: { type: Type.STRING, description: "A detailed, 2-3 sentence strategic philosophy summary." },
          why: { type: Type.STRING },
          technicalPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          insiderTip: { type: Type.STRING },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['coreConcept', 'why', 'technicalPoints', 'insiderTip', 'redFlags']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const fetchAllIntelligence = async (jobTitle: string, location: string): Promise<{
  careerPath: CareerPathData;
  salary: SalaryData;
  networking: NetworkingData;
}> => {
  const [careerPath, salary, networking] = await Promise.all([
    getCareerPathIntelligence(jobTitle, location),
    getSalaryIntelligence(jobTitle, location),
    getNetworkingIntelligence(jobTitle, location)
  ]);

  return { careerPath, salary, networking };
};

export const batchFetchMasterclasses = async (
  questions: InterviewQuestion[], 
  jobTitle: string, 
  location: string
): Promise<Record<string, MasterclassData>> => {
  // Use Promise.all to fetch all masterclasses in parallel
  // Note: We might want to limit concurrency if the list is huge, but for 20 questions it should be fine with Gemini 3 Flash.
  const promises = questions.map(async (q) => {
    try {
      const content = await getMasterclassContent(q.question, jobTitle, location);
      return { id: q.id, content };
    } catch (e) {
      console.error(`Failed to fetch masterclass for ${q.id}`, e);
      return null;
    }
  });

  const results = await Promise.all(promises);
  
  const cache: Record<string, MasterclassData> = {};
  results.forEach(result => {
    if (result) {
      cache[result.id] = result.content;
    }
  });
  
  return cache;
};

export const generateSimulationReport = async (transcript: string[], jobTitle: string): Promise<SimulationReport> => {
  const ai = getGeminiClient();
  const prompt = `ACT AS A SENIOR HR DIRECTOR.
  
  EVALUATE THE FOLLOWING INTERVIEW TRANSCRIPT FOR A ${jobTitle} ROLE.
  TRANSCRIPT:
  ${transcript.join('\n')}
  
  OUTPUT IN JSON:
  - score: 0-100 (Be strict. <60 is fail).
  - feedback: 2-3 sentences summary of performance.
  - strengths: 3 bullet points.
  - improvements: 3 specific tactical improvements.
  - redFlags: Any warning signs (or empty array).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['score', 'feedback', 'strengths', 'improvements', 'redFlags']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
