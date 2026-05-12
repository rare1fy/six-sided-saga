/**
 * React shim — 为小游戏构建提供空壳
 * logic/ 层某些文件 import 了 React (用于浮字渲染)
 * 小游戏环境不需要这些，提供空实现
 */
export const createElement = () => null;
export const memo = (fn: any) => fn;
export const useState = (init: any) => [init, () => {}];
export const useEffect = () => {};
export const useCallback = (fn: any) => fn;
export const useMemo = (fn: any) => fn();
export const useRef = (init: any) => ({ current: init });
export const Fragment = 'Fragment';
export default { createElement, memo, useState, useEffect, useCallback, useMemo, useRef, Fragment };
