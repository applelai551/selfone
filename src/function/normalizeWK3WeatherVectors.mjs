/**
 * 把 WK2 风格的标量 `conditionCode` 归一化为 WK3 需要的枚举向量。
 *
 * 供应商注入器（彩云/和风）沿用 WK2 的标量写法（如 `"RAIN"`），而 WK3 的
 * `conditionCode` 是枚举向量（如 `["RAIN"]`）。直接把标量交给 WK3 编码器会触发
 * `Invalid WK3 vector`，导致整个产品被丢弃、保留 Apple 原始数据。
 *
 * Normalize WK2-style scalar `conditionCode` values into the enum vectors WK3 expects.
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

export default function normalizeWK3WeatherVectors(product) {
    if (!product || typeof product !== "object") return product;
    if (Array.isArray(product.days)) product.days.forEach(wrapConditionCode);
    else if (Array.isArray(product.hours)) product.hours.forEach(wrapConditionCode);
    else wrapConditionCode(product);
    return product;
}
