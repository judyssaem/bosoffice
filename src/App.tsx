/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  Navigation, 
  RotateCcw,
  Sparkles,
  Ticket,
  Tv2,
  TrendingDown,
  TrendingUp,
  Minus,
  Film,
  Flame,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DailyBoxOfficeItem, BoxOfficeResponse } from "./types";
import { 
  formatNumber, 
  formatKoreanAudience, 
  formatKstDate, 
  getYesterdayKstString, 
  dateToApiString 
} from "./utils";
import MovieDetailModal from "./components/MovieDetailModal";
import AudienceChart from "./components/AudienceChart";

export default function App() {
  const yesterdayStr = getYesterdayKstString();
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Modal target movie code
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch block
  const fetchBoxOffice = async (targetDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiDate = dateToApiString(targetDate);
      const res = await fetch(`/api/boxoffice?date=${apiDate}`);
      if (!res.ok) {
        throw new Error("소켓 통신 혹은 서버 통신 중 오류가 발생했습니다.");
      }
      const data: BoxOfficeResponse = await res.json();
      
      if (data.boxOfficeResult?.dailyBoxOfficeList) {
        setBoxOfficeList(data.boxOfficeResult.dailyBoxOfficeList);
      } else {
        throw new Error("결과 목록을 해석하지 못했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "일일 박스오피스를 조회하는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxOffice(selectedDate);
  }, [selectedDate]);

  // Click handler to open details
  const handleMovieClick = (movieCd: string) => {
    setSelectedMovieCd(movieCd);
    setIsModalOpen(true);
  };

  // Convert date format "2012-01-01" to "20120101" for reload
  const handleReload = () => {
    fetchBoxOffice(selectedDate);
  };

  // Filters the 10 box office items on search input
  const filteredList = boxOfficeList.filter((movie) =>
    movie.movieNm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Derive gorgeous summary stats from top 10 movies
  const totalAudience = boxOfficeList.reduce((acc, curr) => acc + parseInt(curr.audiCnt, 10), 0);
  const totalScreens = boxOfficeList.reduce((acc, curr) => acc + parseInt(curr.scrnCnt, 10), 0);
  
  // Find highest accumulated audience movie
  const highestAccMovie = boxOfficeList.length > 0 
    ? [...boxOfficeList].sort((a, b) => parseInt(b.audiAcc, 10) - parseInt(a.audiAcc, 10))[0] 
    : null;

  // Find biggest rank gainer
  const highestGainer = boxOfficeList.length > 0
    ? [...boxOfficeList]
        .filter(m => m.rankOldAndNew === "NEW" || parseInt(m.rankInten, 10) > 0)
        .sort((a, b) => {
          if (a.rankOldAndNew === "NEW") return -1;
          if (b.rankOldAndNew === "NEW") return 1;
          return parseInt(b.rankInten, 10) - parseInt(a.rankInten, 10);
        })[0]
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-gray-250 transition-colors duration-300">
      
      {/* Cinematic Top Accent Bar */}
      <div className="w-full bg-gradient-to-r from-[#c9a227] to-[#e4be42] h-1" />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Header Panel */}
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-[#16161a] p-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-[#c9a227] text-black font-extrabold text-xl font-serif">
                K
              </span>
              <div>
                <h1 className="font-serif text-2xl tracking-tight font-bold text-white uppercase">
                  DAILY <span className="text-[#c9a227]">BOXOFFICE</span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-semibold mt-0.5">
                  KOBIS OpenAI Real-time Cinematic Insights
                </p>
              </div>
            </div>
          </div>

          {/* Date Selector and Action controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-[#16161a] px-1 text-[9px] uppercase tracking-wider font-bold text-[#c9a227]">
                Selected Date
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3.5 py-2">
                <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  max={yesterdayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold outline-none text-white w-full sm:w-auto font-mono cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReload}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:border-[#c9a227] transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 text-[#c9a227]" />
                새로고침
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Stat Summary Cards */}
        {boxOfficeList.length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stat Card 1 - Total Daily admissions */}
            <div className="rounded-xl border border-white/5 bg-[#16161a] p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">당일 전체 관람량</p>
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-[#c9a227]">
                  {formatNumber(totalAudience)}명
                </h3>
                <p className="text-[10px] text-gray-400 font-serif italic">
                  {formatKstDate(selectedDate)} 상위 점유 기준
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-[#c9a227]">
                <Ticket className="h-5 w-5" />
              </span>
            </div>

            {/* Stat Card 2 - Highest Total admissions Movie */}
            <div className="rounded-xl border border-white/5 bg-[#16161a] p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 pr-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">누적 최장 주역</p>
                <h3 className="text-sm sm:text-base font-bold text-white truncate font-serif">
                  {highestAccMovie?.movieNm || "-"}
                </h3>
                <p className="text-xs font-bold text-[#c9a227] font-mono">
                  누적 {highestAccMovie ? formatKoreanAudience(highestAccMovie.audiAcc) : "-"}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-emerald-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            {/* Stat Card 3 - Highest Gainer */}
            <div className="rounded-xl border border-white/5 bg-[#16161a] p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 pr-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">가장 빠른 기세 상승</p>
                <h3 className="text-sm sm:text-base font-bold text-white truncate font-serif">
                  {highestGainer?.movieNm || "-"}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {highestGainer?.rankOldAndNew === "NEW" ? (
                    <span className="rounded-sm bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      신규 진입 (NEW)
                    </span>
                  ) : highestGainer ? (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-rose-400 font-mono">
                      <TrendingUp className="h-3.5 w-3.5 mr-1" />
                      {highestGainer.rankInten}계단 상승
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-rose-400 shrink-0">
                <Flame className="h-5 w-5" />
              </span>
            </div>
          </div>
        )}

        {/* Content Section: Table & Analytics visualization */}
        {loading ? (
          // Giant Loader layout
          <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#16161a] p-10">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#c9a227]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#c9a227] border-r-[#c9a227] animate-spin" />
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-400 animate-pulse">
              영화진흥위원회 실시간 데이터를 로딩하는 중...
            </p>
          </div>
        ) : error ? (
          // Giant Error State
          <div className="rounded-2xl border border-red-950/40 bg-red-950/20 p-10 text-center">
            <TrendingDown className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-lg font-bold text-red-200">
              영화 리스트를 가져오지 못했습니다
            </h2>
            <p className="mt-2 text-sm text-red-400 max-w-md mx-auto">
              OpenAPI 보안 키 검증에 지연이 발생했거나 일시적인 통신 상태 오류입니다. 어제 일자를 재선택하여 다시 조회해보실 수도 있습니다.
            </p>
            <button
              onClick={() => fetchBoxOffice(selectedDate)}
              className="mt-6 rounded-lg bg-red-650 hover:bg-red-750 border border-red-500/30 px-5 py-2 text-xs font-bold uppercase text-white tracking-widest transition"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left boxoffice Table & List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#16161a] p-6 shadow-xl">
                
                {/* Search / Filter Subheader */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#c9a227]" />
                      {formatKstDate(selectedDate)} 박스오피스 순위
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      전국 상영관 통합 실시간 매출점유 탑 10 차트
                    </p>
                  </div>

                  {/* Client Filter Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="영화 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-44 rounded-lg border border-white/10 bg-[#0a0a0a] py-2 pl-9 pr-4 text-xs outline-none text-white focus:border-[#c9a227] placeholder-gray-500 transition"
                    />
                  </div>
                </div>

                {/* Rank Grid & table */}
                {filteredList.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 font-medium text-xs uppercase tracking-wider">
                    🔍 &apos;{searchTerm}&apos; 결과에 대응하는 영화가 검색되지 않았습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse mt-2">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                          <th className="py-3 px-2 w-12 text-center">RANK</th>
                          <th className="py-3 px-4">MOVIE</th>
                          <th className="py-3 px-3 text-right">AUDIENCE</th>
                          <th className="py-3 px-3 text-right">SHARE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {filteredList.map((movie) => {
                          const isSelected = selectedMovieCd === movie.movieCd;
                          const rankNum = parseInt(movie.rank, 10);
                          const rankInten = parseInt(movie.rankInten, 10);

                          return (
                            <tr
                              key={movie.movieCd}
                              onClick={() => handleMovieClick(movie.movieCd)}
                              className={`group cursor-pointer transition-colors ${
                                isSelected 
                                  ? "bg-[#c9a227]/10 border-l border-[#c9a227]" 
                                  : "hover:bg-white/5"
                              }`}
                            >
                              {/* Rank and delta */}
                              <td className="py-4 px-2 text-center select-none">
                                <div className="flex flex-col items-center">
                                  <span className={`text-lg font-extrabold font-serif ${
                                    rankNum === 1 ? "text-[#c9a227]" :
                                    rankNum === 2 ? "text-gray-200" :
                                    rankNum === 3 ? "text-gray-300" :
                                    "text-gray-500"
                                  }`}>
                                    {movie.rank}
                                  </span>
                                  
                                  {/* Rank Intensity icon / text */}
                                  <div className="flex items-center text-[9px] font-bold mt-0.5 font-mono">
                                    {movie.rankOldAndNew === "NEW" ? (
                                      <span className="text-blue-400 bg-blue-500/10 px-1 rounded-xs tracking-tight">NEW</span>
                                    ) : rankInten > 0 ? (
                                      <span className="flex items-center text-rose-400">
                                        ▲{rankInten}
                                      </span>
                                    ) : rankInten < 0 ? (
                                      <span className="flex items-center text-blue-450">
                                        ▼{Math.abs(rankInten)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600">
                                        <Minus className="h-2.5 w-2.5 opacity-30" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Title, Open Date, Total Screens */}
                              <td className="py-4 px-4 min-w-[200px]">
                                <div className="space-y-0.5">
                                  <h4 className="font-bold text-white group-hover:text-[#c9a227] transition-colors leading-snug">
                                    {movie.movieNm}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 font-medium">
                                    <span>{movie.openDt ? `${movie.openDt.slice(0, 4)} 개봉` : ""}</span>
                                    {movie.openDt && <span className="inline-block h-1 w-1 rounded-full bg-white/10" />}
                                    <span>{movie.scrnCnt}개 스크린</span>
                                  </div>
                                </div>
                              </td>

                              {/* Daily Ticket Admissions & increment */}
                              <td className="py-4 px-3 text-right">
                                <div className="font-bold font-mono text-gray-200 text-xs sm:text-sm">
                                  {formatNumber(movie.audiCnt)}명
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">
                                  총 {formatNumber(movie.audiAcc)}명
                                </div>
                              </td>

                              {/* Sales Share percentages */}
                              <td className="py-4 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <span className="font-bold font-mono text-[#c9a227] text-xs sm:text-sm">
                                    {movie.salesShare}%
                                  </span>
                                  <div className="relative h-1.5 w-6 rounded-full bg-white/5 overflow-hidden shrink-0">
                                    <div 
                                      style={{ width: `${movie.salesShare}%` }} 
                                      className="absolute inset-x-0 inset-y-0 bg-[#c9a227] rounded-full" 
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">
                                  {movie.showCnt}회 상영
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Informative footer card (Developer Note style) */}
              <div className="rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/5 p-5 flex items-start gap-3">
                <Info className="h-5 w-5 text-[#c9a227] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed text-gray-400">
                  <h2 className="text-xs uppercase tracking-widest font-bold text-[#c9a227]">
                    순위 상호작용 및 오버레이 탑재 안내
                  </h2>
                  <p>
                    영화 항목의 행(Row)을 터치 또는 클릭하거나, 우측 관객 점유 시각화의 막대를 선택해 보세요. 한국영화진흥위원회 API로부터 상세 정보를 획득하여 해당 영화의 제작년도, 공식 영문 타이틀, 전체 연령 등급, 감독 및 메인 배우 리스트를 담은 우아한 우측 서랍이 활성화됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Comparison Chart Panels */}
            <div className="lg:col-span-15 lg:col-start-8 lg:col-end-13">
              <AudienceChart 
                list={boxOfficeList}
                selectedMovieCd={selectedMovieCd}
                onSelectMovie={handleMovieClick}
              />
            </div>

          </div>
        )}
      </div>

      {/* Slide Loader & Drawer Modal */}
      <MovieDetailModal
        movieCd={selectedMovieCd}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMovieCd(null);
        }}
      />
    </div>
  );
}
