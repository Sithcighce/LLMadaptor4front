/**
 * 配置验证工具函数
 * 
 * 提供 JSON 解析、验证和标准化功能
 * 从 useConnectorController 中提取的通用工具
 */

/**
 * 解析 JSON 字符串并返回对象，带错误处理
 * @param value - 要解析的 JSON 字符串
 * @param label - 用于错误消息的标签
 * @returns 解析结果和可能的错误信息
 */
export const parseJsonObject = (
  value: string, 
  label: string
): { value: Record<string, unknown>; error?: string } => {
  if (!value?.trim()) {
    return { value: {} };
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { value: parsed as Record<string, unknown> };
    }
    return { value: {}, error: `${label} must be a JSON object.` };
  } catch (error) {
    return { value: {}, error: `${label} JSON parse error: ${(error as Error).message}` };
  }
};

/**
 * 标准化请求头对象，确保所有值都是字符串
 * @param input - 原始请求头对象
 * @returns 标准化后的请求头对象
 */
export const normalizeHeaders = (input: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(Object.entries(input).map(([key, val]) => [key, String(val)]));

/**
 * 验证必填字段
 * @param value - 要验证的值
 * @param fieldName - 字段名称
 * @throws Error 如果字段为空
 */
export const validateRequired = (value: string | undefined, fieldName: string): void => {
  if (!value?.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
};

/**
 * 验证 URL 格式
 * @param url - 要验证的 URL
 * @param fieldName - 字段名称
 * @throws Error 如果 URL 格式无效
 */
export const validateUrl = (url: string, fieldName: string): void => {
  try {
    new URL(url);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }
};