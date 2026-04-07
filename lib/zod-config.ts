import { z } from "zod/v4"

z.config({
  customError: (issue) => {
    // 타입 불일치 에러
    if (issue.code === "invalid_type") {
      if (issue.input === undefined || issue.input === null) {
        return "필수 항목입니다"
      }
      const typeNames: Record<string, string> = {
        string: "문자",
        number: "숫자",
        boolean: "참/거짓",
        date: "날짜",
        object: "객체",
        array: "배열",
      }
      const expected = typeNames[issue.expected] ?? issue.expected
      return `${expected} 형식이어야 합니다`
    }

    // 문자열 길이 에러
    if (issue.code === "too_small" && issue.origin === "string") {
      if (issue.minimum === 1) return "필수 항목입니다"
      return `최소 ${issue.minimum}자 이상 입력해주세요`
    }
    if (issue.code === "too_big" && issue.origin === "string") {
      return `${issue.maximum}자 이내로 입력해주세요`
    }

    // 숫자 범위 에러
    if (issue.code === "too_small" && issue.origin === "number") {
      return `${issue.minimum} 이상이어야 합니다`
    }
    if (issue.code === "too_big" && issue.origin === "number") {
      return `${issue.maximum} 이하여야 합니다`
    }

    // 배열 길이 에러
    if (issue.code === "too_small" && issue.origin === "array") {
      return `최소 ${issue.minimum}개 이상이어야 합니다`
    }
    if (issue.code === "too_big" && issue.origin === "array") {
      return `최대 ${issue.maximum}개 이하여야 합니다`
    }

    // 포맷 에러
    if (issue.code === "invalid_format") {
      const formatNames: Record<string, string> = {
        email: "유효한 이메일 주소가 아닙니다",
        url: "유효한 URL이 아닙니다",
        uuid: "유효한 UUID가 아닙니다",
      }
      return formatNames[issue.format] ?? undefined
    }

    // 기타 — undefined 반환 시 Zod 기본 메시지 사용
    return undefined
  },
})

export { z }
export type { z as ZodType } from "zod/v4"
