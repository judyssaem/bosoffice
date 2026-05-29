/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import { DailyBoxOfficeItem } from "../types";
import { formatNumber, formatKoreanAudience } from "../utils";

interface AudienceChartProps {
  list: DailyBoxOfficeItem[];
  selectedMovieCd: string | null;
  onSelectMovie: (movieCd: string) => void;
}

type ChartMetric = "daily" | "accumulated";

export default function AudienceChart({ list, selectedMovieCd, onSelectMovie }: AudienceChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("daily");

  if (!list || list.length === 0) return null;

  // Find max value depending on the chosen metric
  const getMetricValue = (item: DailyBoxOfficeItem) => {
    return parseInt(metric === "daily" ? item.audiCnt : item.audiAcc, 10);
  };

  const values = list.map(getMetricValue);
  const maxValue = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#16161a] p-6 shadow-xl text-gray-200">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#c9a227]" />
          <h3 className="font-serif text-base font-bold text-white tracking-tight">
            관객 점유 시각화
          </h3>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex rounded-lg bg-white/5 p-1 text-[11px] font-bold border border-white/5">
          <button
            onClick={() => setMetric("daily")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all cursor-pointer ${
              metric === "daily"
                ? "bg-[#c9a227] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            당일 관객수
          </button>
          <button
            onClick={() => setMetric("accumulated")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all cursor-pointer ${
              metric === "accumulated"
                ? "bg-[#c9a227] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            누적 관객수
          </button>
        </div>
      </div>

      {/* Bar Chart list */}
      <div className="mt-5 space-y-3.5">
        {list.slice(0, 10).map((item) => {
          const rawValue = getMetricValue(item);
          const percentage = (rawValue / maxValue) * 100;
          const isSelected = selectedMovieCd === item.movieCd;

          // Rank coloring (Cinematic gold theme)
          const rankNum = parseInt(item.rank, 10);
          const rankBadgeBg = 
            rankNum === 1 ? "bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/30" :
            rankNum === 2 ? "bg-white/10 text-gray-200 border border-white/20" :
            rankNum === 3 ? "bg-white/5 text-gray-300 border border-white/10" :
            "bg-white/5 text-gray-400 border border-white/5";

          return (
            <div 
              key={item.movieCd} 
              className={`group flex items-start gap-3.5 rounded-xl p-3 transition-all cursor-pointer ${
                isSelected 
                  ? "bg-[#c9a227]/10 ring-1 ring-[#c9a227]/30" 
                  : "hover:bg-white/5 border border-transparent hover:border-white/5"
              }`}
              onClick={() => onSelectMovie(item.movieCd)}
            >
              {/* Rank Marker */}
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-serif ${rankBadgeBg}`}>
                {item.rank}
              </div>

              {/* Bar stats and label */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-150 truncate group-hover:text-[#c9a227] transition-colors">
                    {item.movieNm}
                  </h4>
                  <span className="text-xs font-semibold font-mono text-gray-400 shrink-0">
                    {metric === "daily" ? `${formatNumber(rawValue)}명` : formatKoreanAudience(rawValue)}
                  </span>
                </div>

                {/* Progress bar tracks */}
                <div className="relative h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`absolute bottom-0 left-0 top-0 rounded-full transition-all duration-700 ease-out ${
                      isSelected 
                        ? "bg-gradient-to-r from-[#c9a227] to-[#e4be42]" 
                        : rankNum === 1 
                        ? "bg-gradient-to-r from-[#c9a227]/80 to-[#e4be42]/80"
                        : "bg-zinc-600/70"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share stats footer indicator */}
      <div className="mt-5 border-t border-white/5 pt-4 text-center">
        <p className="text-[11px] text-gray-500 font-medium">
          💡 개별 영화 막대를 선택하시면 영화진흥위원회의 풍부한 공식 세부정보가 슬라이드로 나타납니다.
        </p>
      </div>
    </div>
  );
}
