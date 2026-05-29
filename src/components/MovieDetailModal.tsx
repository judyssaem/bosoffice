/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  X, 
  Film, 
  Clock, 
  User, 
  Users, 
  Globe, 
  Building2, 
  Calendar, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Feather,
  Copy,
  Check,
  Star,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovieInfo, MovieInfoResponse } from "../types";
import { formatKstDate } from "../utils";

const QUICK_TEMPLATES = [
  "배우들의 폭발적인 열연과 눈을 뗄 수 없는 영상미가 압도적인 몰입감을 조율하는 수작이네요.",
  "초반 빌드업은 잔잔했으나 중후반부터 휘몰아치는 전개와 충격적인 피날레가 기막힌 전율을 주네요.",
  "현실적이고 밀도 높은 메시지와 수려한 연출력이 인상적인, 생각할 거리를 가득 남겨준 인생작입니다.",
  "온 세대가 유쾌하고 가슴 깊이 공감할 수 있는 따뜻한 웰메이드 극이어서 여운이 참 기네요."
];

interface MovieDetailModalProps {
  movieCd: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieDetailModal({ movieCd, isOpen, onClose }: MovieDetailModalProps) {
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [simpleComment, setSimpleComment] = useState<string>("");
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);
  const [generatedReview, setGeneratedReview] = useState<{
    headline: string;
    rating: number;
    detailedReview: string;
    keywords: string[];
  } | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Reset review states on movie change/modal open
  useEffect(() => {
    setSimpleComment("");
    setGeneratedReview(null);
    setReviewError(null);
    setCopied(false);
  }, [movieCd, isOpen]);

  const handleGenerateReview = async () => {
    if (!simpleComment.trim() || !movieInfo) return;
    setIsLoadingReview(true);
    setReviewError(null);
    setGeneratedReview(null);
    setCopied(false);

    // format actors list
    const actorsStr = movieInfo.actors ? movieInfo.actors.slice(0, 5).map(a => a.peopleNm).join(", ") : "";
    // format directors list
    const directorsStr = movieInfo.directors ? movieInfo.directors.map(d => d.peopleNm).join(", ") : "";
    // format genres
    const genresStr = movieInfo.genres ? movieInfo.genres.map(g => g.genreNm).join(", ") : "";

    try {
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: movieInfo.movieNm,
          prdtYear: movieInfo.prdtYear,
          genres: genresStr,
          directors: directorsStr,
          actors: actorsStr,
          comment: simpleComment
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "리뷰 생성 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      setGeneratedReview(data);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || "리뷰를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleCopy = () => {
    if (!generatedReview) return;
    const textToCopy = `[AI 평론가 리뷰 - ${movieInfo?.movieNm}]\n\n"${generatedReview.headline}"\n\n★ 평점: ${generatedReview.rating}/10\n\n${generatedReview.detailedReview}\n\n태그: ${generatedReview.keywords.map(k => `#${k}`).join(" ")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!movieCd || !isOpen) return;

    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/movie-info?movieCd=${movieCd}`);
        if (!res.ok) {
          throw new Error("영화 상세 정보를 가져오는 데 실패했습니다.");
        }
        const data: MovieInfoResponse = await res.json();
        if (data.movieInfoResult?.movieInfo) {
          setMovieInfo(data.movieInfoResult.movieInfo);
        } else {
          throw new Error("영화 정보 결과가 비어있습니다.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieCd, isOpen]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getWatchGradeBadgeClass = (grade: string) => {
    if (grade.includes("19") || grade.includes("청소년관람불가")) {
      return "bg-red-500/10 text-red-500 border-red-500/20";
    }
    if (grade.includes("15")) {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    if (grade.includes("12")) {
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
    if (grade.includes("전체")) {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#121215] shadow-2xl text-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#0a0a0d]">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-[#c9a227]" />
                <span className="font-serif text-sm tracking-wide text-white font-bold">
                  상세 영화 정보
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 outline-none transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {loading ? (
                // Skeleton Loader
                <div className="space-y-6 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-8 w-3/4 rounded-md bg-white/5" />
                    <div className="h-4 w-1/2 rounded-md bg-white/5" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 rounded-lg bg-white/5" />
                    <div className="h-16 rounded-lg bg-white/5" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full rounded-md bg-white/5" />
                    <div className="h-4 w-5/6 rounded-md bg-white/5" />
                  </div>
                </div>
              ) : error ? (
                // Error Alert
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-3" />
                  <h3 className="text-sm font-semibold text-red-200">
                    정보를 불러올 수 없습니다
                  </h3>
                  <p className="mt-1 text-xs text-red-400">{error}</p>
                </div>
              ) : movieInfo ? (
                // Movie Details
                <div className="space-y-6">
                  {/* Title & English Title */}
                  <div className="space-y-1">
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                      {movieInfo.movieNm}
                    </h2>
                    {movieInfo.movieNmEn && (
                      <p className="font-sans text-xs text-gray-400 font-medium">
                        {movieInfo.movieNmEn} {movieInfo.prdtYear ? `(${movieInfo.prdtYear})` : ""}
                      </p>
                    )}
                  </div>

                  {/* Badges / Quick stats */}
                  <div className="flex flex-wrap gap-2">
                    {/* Watch Grade */}
                    {movieInfo.audits && movieInfo.audits.length > 0 && (
                      <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getWatchGradeBadgeClass(movieInfo.audits[0].watchGradeNm)}`}>
                        {movieInfo.audits[0].watchGradeNm}
                      </span>
                    )}

                    {/* Movie Type */}
                    {movieInfo.typeNm && (
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
                        {movieInfo.typeNm}
                      </span>
                    )}

                    {/* Genre */}
                    {movieInfo.genres && movieInfo.genres.map((g, idx) => (
                      <span key={idx} className="rounded-md border border-[#c9a227]/20 bg-[#c9a227]/10 px-2.5 py-0.5 text-xs font-semibold text-[#c9a227]">
                        {g.genreNm}
                      </span>
                    ))}
                  </div>

                  {/* Specs list (Showtime, Opening Date, Nations) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#16161a] p-3.5">
                      <Clock className="h-5 w-5 text-[#c9a227] shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">상영시간</p>
                        <p className="text-sm font-semibold text-white font-mono">{movieInfo.showTm || "-"} 분</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#16161a] p-3.5">
                      <Calendar className="h-5 w-5 text-[#c9a227] shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">개봉일자</p>
                        <p className="text-sm font-semibold text-white font-mono">{formatKstDate(movieInfo.openDt) || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nations and Status */}
                  <div className="divide-y divide-white/5 border-t border-b border-white/5 py-2">
                    <div className="flex justify-between py-2 text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-gray-400">
                        <Globe className="h-4 w-4" /> 제작국가
                      </span>
                      <span className="font-semibold text-white">
                        {movieInfo.nations && movieInfo.nations.length > 0 
                          ? movieInfo.nations.map(n => (n as any).nationNm).join(", ") 
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-gray-400">
                        <ShieldCheck className="h-4 w-4" /> 개봉 상태
                      </span>
                      <span className="font-semibold text-white">
                        {movieInfo.statusNm || "-"}
                      </span>
                    </div>
                  </div>

                  {/* AI Review Generator Section */}
                  <div className="rounded-xl border border-white/5 bg-[#16161a] p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Feather className="h-4.5 w-4.5 text-[#c9a227]" />
                        <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                          AI 시네마 감상평 메이커
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                        AI Critic Box
                      </span>
                    </div>

                    {!generatedReview ? (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                          영화 관람 중 기억에 남았던 감정이나 대사를 간단하게 적어주세요. KOBIS 데이터와 연동하여 깊이 있고 우아한 맞춤형 영화 평평(리뷰)을 실시간으로 작성해 드립니다.
                        </p>

                        {/* Quick Templates */}
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            💡 원터치 감상 표현 자동 선택
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {QUICK_TEMPLATES.map((tpl, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSimpleComment(tpl)}
                                className="text-left text-[11px] bg-white/5 border border-white/5 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5 text-gray-300 p-2.5 rounded-lg transition-all cursor-pointer truncate"
                              >
                                {tpl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <textarea
                            value={simpleComment}
                            onChange={(e) => setSimpleComment(e.target.value)}
                            placeholder="이곳에 간단한 감상평(예: 엔딩 크레딧 노래가 뭉클하고 배우의 눈빛 연기가 기억에 남음)을 적어보세요..."
                            className="w-full h-24 rounded-lg bg-[#0a0a0a] border border-white/10 p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#c9a227] transition-all resize-none font-sans leading-relaxed"
                            disabled={isLoadingReview}
                          />
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span>최소 5자 이상 적어주세요.</span>
                            <span>{simpleComment.length}자</span>
                          </div>
                        </div>

                        {reviewError && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg leading-relaxed">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{reviewError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleGenerateReview}
                          disabled={isLoadingReview || simpleComment.trim().length < 5}
                          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest text-black bg-[#c9a227] hover:bg-[#e4be42] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isLoadingReview ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              AI 시네마 렌더 툴 가동 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              격조 높은 고품격 감상평 작성
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      // Review Result Output Card
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-[#c9a227]/25 bg-[#c9a227]/5 rounded-xl p-4.5 space-y-4 relative overflow-hidden"
                      >
                        {/* Rating & Action Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-1 text-[#c9a227] font-bold text-xs">
                            <Star className="h-3.5 w-3.5 fill-[#c9a227] stroke-[#c9a227]" />
                            <span>감상 분석 평점: {generatedReview.rating} / 10</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedReview(null);
                              setSimpleComment("");
                            }}
                            className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider font-mono bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/5 transition-all cursor-pointer"
                          >
                            새로 쓰기
                          </button>
                        </div>

                        {/* Headline Quote */}
                        <div className="py-2.5 text-center">
                          <p className="font-serif italic text-white font-extrabold text-sm sm:text-base leading-snug">
                            “ {generatedReview.headline} ”
                          </p>
                        </div>

                        {/* Review text paragraphs */}
                        <div className="space-y-3.5 border-t border-b border-white/5 py-4">
                          {generatedReview.detailedReview.split("\n\n").map((para, pIdx) => (
                            <p key={pIdx} className="text-xs sm:text-[12.5px] text-gray-300 font-sans leading-relaxed text-justify">
                              {para}
                            </p>
                          ))}
                        </div>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {generatedReview.keywords.map((kw, kwIdx) => (
                            <span 
                              key={kwIdx}
                              className="text-[10px] font-semibold text-[#c9a227] bg-[#c9a227]/10 border border-[#c9a227]/20 px-2 py-0.5 rounded-md font-mono"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>

                        {/* Copy Clipboard button */}
                        <button
                          type="button"
                          onClick={handleCopy}
                          className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                            copied 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-[#c9a227]"
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400 animate-pulse" />
                              클립보드에 평론 복사 완료!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              평론 글 전문 복사하기
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Directors */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gray-400">
                      <User className="h-4 w-4 text-[#c9a227]" /> 감독 (Directors)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {movieInfo.directors && movieInfo.directors.length > 0 ? (
                        movieInfo.directors.map((d, idx) => (
                          <div 
                            key={idx} 
                            className="rounded-lg border border-white/5 bg-[#16161a] px-3 py-2 text-sm shadow-sm"
                          >
                            <p className="font-semibold text-white">{d.peopleNm}</p>
                            {d.peopleNmEn && <p className="text-[10px] text-gray-500 font-medium font-mono">{d.peopleNmEn}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">등록된 감독 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Actors (Cast) */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gray-400">
                      <Users className="h-4 w-4 text-[#c9a227]" /> 출연 배우 (Cast List)
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {movieInfo.actors && movieInfo.actors.length > 0 ? (
                        movieInfo.actors.slice(0, 10).map((actor, idx) => (
                          <div 
                            key={idx} 
                            className="rounded-xl border border-white/5 bg-[#16161a]/65 p-2.5 text-sm"
                          >
                            <p className="font-bold text-white text-xs sm:text-sm">
                              {actor.peopleNm}
                            </p>
                            {actor.cast ? (
                              <p className="text-[11px] font-semibold text-[#c9a227] mt-0.5 truncate">
                                역 {actor.cast}
                              </p>
                            ) : (
                              actor.peopleNmEn && (
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate font-mono">
                                  {actor.peopleNmEn}
                                </p>
                              )
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="col-span-2 text-sm text-gray-500 italic">등록된 배우 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Companies */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gray-400">
                      <Building2 className="h-4 w-4 text-[#c9a227]" /> 참여 영화사 (Companies)
                    </h3>
                    <div className="space-y-1.5">
                      {movieInfo.companys && movieInfo.companys.length > 0 ? (
                        movieInfo.companys.slice(0, 3).map((comp, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-between rounded-lg border border-white/5 bg-[#16161a] p-2.5 shadow-xs text-xs"
                          >
                            <span className="font-semibold text-gray-300">
                              {comp.companyNm}
                            </span>
                            <span className="rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 font-medium text-[#c9a227] text-[10px]">
                              {comp.companyPartNm}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">영화사 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-5 text-center bg-[#0a0a0d]">
              <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1 font-mono uppercase tracking-widest">
                <Sparkles className="h-3 w-3 text-[#c9a227]" />
                KOFIC Open API Web Service
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
