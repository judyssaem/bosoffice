/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number with commas (e.g. "1234567" -> "1,234,567")
 */
export const formatNumber = (num: string | number): string => {
  const value = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(value)) return "0";
  return value.toLocaleString("ko-KR");
};

/**
 * Formats a number in Korean descriptive unit "만" (e.g. "1234567" -> "123.4만")
 */
export const formatKoreanAudience = (num: string | number): string => {
  const value = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(value)) return "0명";
  
  if (value >= 10000) {
    const manValue = value / 10000;
    if (value >= 10000000) {
      // For > 10M, show integer "만"
      return `${Math.round(manValue).toLocaleString("ko-KR")}만 명`;
    }
    // Show 1 decimal place for smaller millions
    return `${manValue.toFixed(1)}만 명`;
  }
  return `${value.toLocaleString("ko-KR")}명`;
};

/**
 * Formats standard currency amount in Korean Won
 */
export const formatCurrency = (num: string | number): string => {
  const value = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(value)) return "0원";
  return `${formatNumber(value)}원`;
};

/**
 * Parses YYYY-MM-DD string into YYYYMMDD
 */
export const dateToApiString = (dateStr: string): string => {
  return dateStr.replace(/-/g, "");
};

/**
 * Formats YYYY-MM-DD or YYYYMMDD to YYYY년 MM월 DD일
 */
export const formatKstDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const cleaned = dateStr.replace(/-/g, "");
  if (cleaned.length !== 8) return dateStr;
  
  const year = cleaned.slice(0, 4);
  const month = cleaned.slice(4, 6);
  const day = cleaned.slice(6, 8);
  
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * Gets KST yesterday's date in YYYY-MM-DD format
 * Suitable as default value and max value for HTML calendar picker
 */
export const getYesterdayKstString = (): string => {
  const now = new Date();
  
  // Align timezone with UTC+9 (Korean Standard Time)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (3600000 * 9));
  
  // Subtract one day for daily box office stats
  kst.setDate(kst.getDate() - 1);
  
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, "0");
  const day = String(kst.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};
