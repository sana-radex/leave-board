/** 模擬網路延遲 */
export function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
