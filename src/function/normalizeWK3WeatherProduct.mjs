/**
 * 把 WK2 风格的注入结果归一化为 WK3 编码器要求的形状。
 *
 * 供应商注入器沿用 WK2 的标量写法，而 WK3 有更严格的类型：
 * - `conditionCode`：WK3 是枚举向量，需把标量包成单元素数组；
 * - `windDirection`：彩云返回浮点角度（如 245.9），WK3 是 ushort，需取整并夹到 0~360；
 * - `precipitationAmount`：彩云返回数值，WK3 是 PrecipitationRange 结构体 `{expected,minimum,maximum}`。
 *
 * 不做归一化会触发 `Invalid WK3 vector` / `Invalid WK3 ushort` /
 * `WK3 PrecipitationRange object expected`，导致整个产品被丢弃、保留 Apple 原始数据。
 *
 * @param {any} product - 单个 WK3 天气产品（currentWeather/forecastDaily/forecastHourly）
 * @returns {any} 原地归一化后的同一对象
 */
const DAYPART_KEYS = ["daytimeForecast", "overnightForecast", "restOfDayForecast"];

function wrapConditionCode(target) {
    if (!target || typeof target !== "object") return;
    if (typeof target.conditionCode === "string") target.conditionCode = [target.conditionCode];
    for (const key of DAYPART_KEYS) wrapConditionCode(target[key]);
}

function roundWindDirection(target) {
    if (!target || typeof target !== "object") return;
    if (typeof target.windDirection === "number" && Number.isFinite(target.windDirection)) target.windDirection = Math.min(360, Math.max(0, Math.round(target.windDirection)));
    for (const key of DAYPART_KEYS) roundWindDirection(target[key]);
}

function wrapPrecipitationRange(target) {
    if (!target || typeof target !== "object") return;
    for (const key of ["precipitationAmount", "snowfallAmount"]) {
        const value = target[key];
        if (typeof value === "number" && Number.isFinite(value)) target[key] = { expected: value, minimum: value, maximum: value };
    }
    for (const key of DAYPART_KEYS) wrapPrecipitationRange(target[key]);
}

function normalizeEntry(entry) {
    wrapConditionCode(entry);
    roundWindDirection(entry);
    wrapPrecipitationRange(entry);
}

export default function normalizeWK3WeatherProduct(product) {
    if (!product || typeof product !== "object") return product;
    if (Array.isArray(product.days)) product.days.forEach(normalizeEntry);
    else if (Array.isArray(product.hours)) product.hours.forEach(normalizeEntry);
    else normalizeEntry(product);
    return product;
}
